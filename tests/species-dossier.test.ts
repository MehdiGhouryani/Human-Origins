import {describe,expect,it} from 'vitest'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {buildSpeciesDossier,computeCompleteness,hasExplorerSpecies,speciesJsonLd} from '../features/explorer/dossier'

const bootstrap=buildExplorerBootstrap()

describe('Species dossier read model (/species/[id])',()=>{
  it('builds a dossier for every taxon and refuses unknown ids',()=>{
    for(const species of bootstrap.species){
      const dossier=buildSpeciesDossier(bootstrap,species.id)
      expect(dossier?.species.id).toBe(species.id)
      expect(dossier?.portrait).toBeDefined()
    }
    expect(hasExplorerSpecies(bootstrap,'not-a-real-taxon')).toBe(false)
    expect(buildSpeciesDossier(bootstrap,'not-a-real-taxon')).toBeUndefined()
  })

  it('derives lineage from registered relationships only',()=>{
    const neanderthal=buildSpeciesDossier(bootstrap,'neanderthal')!
    const sapiens=buildSpeciesDossier(bootstrap,'sapiens')!
    const linkedIds=(links:readonly {id:string}[])=>links.map(link=>link.id)
    const registered=bootstrap.relationships.filter(rel=>rel.type!=='gene-flow'&&String(rel.to)==='neanderthal').map(rel=>String(rel.from))
    expect(linkedIds(neanderthal.ancestors).sort()).toEqual([...registered].sort())
    // The single gene-flow edge in the catalog is visible from both ends.
    const geneFlow=bootstrap.relationships.find(rel=>rel.type==='gene-flow')
    if(geneFlow){
      const from=buildSpeciesDossier(bootstrap,String(geneFlow.from))!
      const to=buildSpeciesDossier(bootstrap,String(geneFlow.to))!
      expect(linkedIds(from.geneFlow)).toContain(String(geneFlow.to))
      expect(linkedIds(to.geneFlow)).toContain(String(geneFlow.from))
    }
    expect(linkedIds(sapiens.ancestors)).not.toContain('sapiens')
  })

  it('lists coexisting taxa by time overlap without ever including the common ancestor or itself',()=>{
    const erectus=buildSpeciesDossier(bootstrap,'erectus')!
    expect(erectus.coexisting.map(item=>item.id)).not.toContain('erectus')
    expect(erectus.coexisting.map(item=>item.id)).not.toContain('common')
    for(const other of erectus.coexisting){
      expect(other.start>=erectus.species.end && other.end<=erectus.species.start).toBe(true)
    }
    expect(buildSpeciesDossier(bootstrap,'common')!.coexisting).toEqual([])
  })

  it('keeps previous/next navigation inside the catalog order',()=>{
    const first=buildSpeciesDossier(bootstrap,bootstrap.species[0].id)!
    const last=buildSpeciesDossier(bootstrap,bootstrap.species[bootstrap.species.length-1].id)!
    expect(first.previous).toBeUndefined()
    expect(first.next?.id).toBe(bootstrap.species[1].id)
    expect(last.next).toBeUndefined()
  })

  it('computes the completeness tier from data, not by hand',()=>{
    for(const species of bootstrap.species){
      const {completeness}=buildSpeciesDossier(bootstrap,species.id)!
      expect([0,1,2]).toContain(completeness.tier)
      expect(completeness.missing.length).toBe(completeness.checks.filter(check=>!check.met).length)
    }
    const sapiens=buildSpeciesDossier(bootstrap,'sapiens')!
    const empty=computeCompleteness({species:{...sapiens.species,sourceIds:[]},claims:[],specimens:[],sites:[],gallery:[],hasRelationship:false})
    expect(empty.tier).toBe(0)
    const claimWithEvidence={...sapiens.claims[0],evidenceIds:['evidence:x'] as never}
    const full=computeCompleteness({
      species:{...sapiens.species,treeIconId:'media:distinct-avatar',facts:[['a','1'],['b','2'],['c','3']]},
      claims:[claimWithEvidence,claimWithEvidence,claimWithEvidence],
      specimens:[{} as never],
      sites:[{...sapiens.sites[0],datingClass:'radiometric'}],
      gallery:[sapiens.portrait!],
      hasRelationship:true,
    })
    expect(full.tier).toBe(2)
    expect(full.missing).toEqual([])
  })

  it('emits schema.org Taxon JSON-LD with only canonical fields',()=>{
    const dossier=buildSpeciesDossier(bootstrap,'neanderthal')!
    const ld=speciesJsonLd(dossier,'https://example.org/species/neanderthal')
    expect(ld['@type']).toBe('Taxon')
    expect(ld.name).toBe(dossier.species.taxonomy.scientificName)
    expect(Array.isArray(ld.citation)).toBe(true)
    expect(JSON.stringify(ld)).not.toMatch(/score|confidence/i)
  })
})
