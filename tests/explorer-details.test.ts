import {describe,expect,it} from 'vitest'
import {buildExplorerBootstrap,projectExplorerBootstrapForClient} from '../features/explorer/bootstrap'
import {buildExplorerEvidenceSources,buildExplorerMigrationDetails,buildExplorerTaxonDetails} from '../features/explorer/details'
import {buildSearchResponse} from '../features/search/response'

describe('phase 7.3 on-demand explorer data',()=>{
  const full=buildExplorerBootstrap()

  it('keeps the initial browser payload compact without changing graph or evidence semantics',()=>{
    const client=projectExplorerBootstrapForClient(full)

    expect(client.species).toEqual(full.species)
    expect(client.graph).toEqual(full.graph)
    expect(client.relationships).toEqual(full.relationships)
    expect(client.evidence).toEqual(full.evidence)
    expect(client.claims).toEqual(full.claims)
    expect(client.provenanceChains).toEqual(full.provenanceChains)
    expect(client.media).toEqual(full.media)
    expect(client.graphSources.length).toBeGreaterThan(0)
    expect(client.siteIds).toEqual(full.sites.map(site=>String(site.id)))
    expect(client.taxaWithSiteRange).toEqual([...new Set(full.sites.flatMap(site=>site.relatedTaxonIds.map(String)))])

    expect(client.sites).toEqual([])
    expect(client.siteContexts).toEqual([])
    expect(client.specimens).toEqual([])
    expect(client.occurrences).toEqual([])
    expect(client.sources).toEqual([])
    expect(client.publications).toEqual([])
    expect(client.institutions).toEqual([])
    expect(client.collections).toEqual([])
    expect(client.materialEntities).toEqual([])

    expect(Object.keys(client.indexes.sitesById)).toHaveLength(0)
    expect(Object.keys(client.indexes.sourcesById)).toHaveLength(0)
    expect(Object.keys(client.indexes.specimensByTaxonId)).toHaveLength(0)
    expect(Object.keys(client.researchIndexes.siteContextsBySiteId)).toHaveLength(0)
    expect(Object.keys(client.researchIndexes.materialEntitiesByTaxonId)).toHaveLength(0)
    expect(client.researchIndexes.taxonNamesByTaxonId).toEqual(full.researchIndexes.taxonNamesByTaxonId)
    expect(Object.isFrozen(client)).toBe(true)
    expect(Object.isFrozen(client.researchIndexes)).toBe(true)
  })

  it('returns only a taxon-linked detail bundle while preserving all of its source links',()=>{
    const details=buildExplorerTaxonDetails(full,'neanderthal')
    expect(details).toBeDefined()
    expect(details?.kind).toBe('taxon')
    expect(details?.specimens).toEqual(full.specimens.filter(record=>String(record.taxonId)==='neanderthal'))
    expect(details?.occurrences).toEqual(full.occurrences.filter(record=>String(record.taxonId)==='neanderthal'))
    expect(details?.sites.length).toBeGreaterThan(0)
    expect(details?.siteContexts.length).toBeGreaterThan(0)
    expect(details?.sources.length).toBeGreaterThan(0)

    const sourceIds=new Set(details?.sources.map(source=>String(source.id)))
    for(const sourceId of full.species[full.indexes.speciesById.neanderthal].sourceIds){
      expect(sourceIds.has(String(sourceId))).toBe(true)
    }
    for(const specimen of details?.specimens??[]){
      for(const sourceId of specimen.sourceIds) expect(sourceIds.has(String(sourceId))).toBe(true)
    }
    for(const source of details?.sources??[]){
      if(source.publicationId){
        expect(details?.publications.some(publication=>String(publication.id)===String(source.publicationId))).toBe(true)
      }
    }

    const geneticEvidence=full.evidence.filter(record=>String(record.taxonId)==='neanderthal'&&record.kind==='genetics')
    expect(geneticEvidence.length).toBeGreaterThan(0)
    for(const record of geneticEvidence){
      for(const sourceId of record.sourceIds) expect(sourceIds.has(String(sourceId))).toBe(true)
    }
    const geneFlow=full.relationships.filter(record=>
      record.type==='gene-flow'&&(String(record.from)==='neanderthal'||String(record.to)==='neanderthal'),
    )
    expect(geneFlow.length).toBeGreaterThan(0)
    for(const relation of geneFlow){
      for(const sourceId of relation.sourceIds) expect(sourceIds.has(String(sourceId))).toBe(true)
    }

    expect(buildExplorerTaxonDetails(full,'not-a-real-taxon')).toBeUndefined()
  })

  it('keeps Evidence overview source links minimal and below the 10 KB follow-up threshold',()=>{
    const details=buildExplorerEvidenceSources(full,'neanderthal')
    expect(details).toBeDefined()
    expect(details?.kind).toBe('evidence-sources')
    expect(details?.taxonId).toBe('neanderthal')

    const claims=full.claims.filter(record=>String(record.taxonId)==='neanderthal')
    const expectedIds=new Set(claims.flatMap(claim=>[
      ...claim.sourceIds.map(String),
      ...(claim.sourceLinks??[]).map(link=>String(link.sourceId)),
    ]))
    expect(new Set(details?.sources.map(source=>String(source.id)))).toEqual(expectedIds)
    for(const source of details?.sources??[]){
      expect(Object.keys(source).sort()).toEqual(['id','title','url'])
      expect(source.title.length).toBeGreaterThan(0)
      expect(source.url).toMatch(/^https?:\\/\\//)
    }
    expect(Buffer.byteLength(JSON.stringify(details),'utf8')).toBeLessThan(10*1024)
    expect(buildExplorerEvidenceSources(full,'not-a-real-taxon')).toBeUndefined()
  })

  it('returns complete map evidence and source context only for the migration view',()=>{
    const details=buildExplorerMigrationDetails(full)
    expect(details.kind).toBe('migration')
    expect(details.sites).toEqual(full.sites)
    expect(details.siteContexts).toEqual(full.siteContexts)
    expect(details.sites.length).toBeGreaterThan(0)

    const sourceIds=new Set(details.sources.map(source=>String(source.id)))
    for(const site of details.sites){
      for(const sourceId of site.sourceIds) expect(sourceIds.has(String(sourceId))).toBe(true)
    }
    for(const context of details.siteContexts){
      for(const sourceId of context.sourceIds) expect(sourceIds.has(String(sourceId))).toBe(true)
      for(const link of context.sourceLinks??[]) expect(sourceIds.has(String(link.sourceId))).toBe(true)
    }
    for(const corridor of full.migrationCorridors){
      for(const sourceId of corridor.sourceIds) expect(sourceIds.has(String(sourceId))).toBe(true)
      for(const link of corridor.sourceLinks) expect(sourceIds.has(String(link.sourceId))).toBe(true)
    }
  })

  it('retains site-context-only provenance links in both taxon and migration detail bundles',()=>{
    const context=full.siteContexts.find(item=>item.relatedTaxonIds.length>0)
    expect(context).toBeDefined()
    const extraSource=full.sources.find(source=>!context!.sourceIds.some(id=>String(id)===String(source.id)))
    expect(extraSource).toBeDefined()

    const augmentedContext={
      ...context!,
      sourceLinks:[...(context!.sourceLinks??[]),{sourceId:extraSource!.id,role:'contextualizes' as const}],
    }
    const augmented={
      ...full,
      siteContexts:full.siteContexts.map(item=>String(item.id)===String(context!.id)?augmentedContext:item),
    }
    const taxonId=String(context!.relatedTaxonIds[0])
    const taxonDetails=buildExplorerTaxonDetails(augmented,taxonId)
    const migrationDetails=buildExplorerMigrationDetails(augmented)

    expect(taxonDetails?.sources.some(source=>String(source.id)===String(extraSource!.id))).toBe(true)
    expect(migrationDetails.sources.some(source=>String(source.id)===String(extraSource!.id))).toBe(true)
  })

  it('returns a compact server-renderable search result without exposing the full catalogue',()=>{
    const result=buildSearchResponse(full,'neanderthal')
    expect(result.query).toBe('neanderthal')
    expect(result.total).toBeGreaterThan(0)
    expect(result.groups.some(group=>group.kind==='taxon'&&group.items.some(item=>item.id==='neanderthal'))).toBe(true)
    expect(result.groups.flatMap(group=>group.items).every(item=>typeof item.href==='string'&&typeof item.external==='boolean')).toBe(true)
    expect(buildSearchResponse(full,'x')).toEqual({query:'x',total:0,groups:[]})
  })

})
