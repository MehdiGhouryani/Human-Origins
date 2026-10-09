import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {searchCatalog,getMaterialEntityRecord,getSiteContextRecord,getTaxonNameRecord} from '../infrastructure/repository'
import {researchIndexes} from '../content/catalog'

describe('Research-grade data model',()=>{
  it('separates physical specimens from occurrences',()=>{
    expect(contentCatalog.specimens).toHaveLength(contentCatalog.occurrences.length)
    for(const specimen of contentCatalog.specimens){
      expect(specimen.sourceIds.length).toBeGreaterThan(0)
      expect(specimen.occurrenceId).toBeTruthy()
      const occurrence=contentCatalog.occurrences.find(item=>String(item.id)===String(specimen.occurrenceId))
      expect(occurrence?.specimenId && String(occurrence.specimenId)).toBe(String(specimen.id))
    }
  })

  it('keeps scholarly metadata normalized away from source records',()=>{
    for(const source of contentCatalog.sources){
      expect('publication' in source).toBe(false)
      if(source.publicationId) expect(contentCatalog.publications.some(item=>String(item.id)===String(source.publicationId))).toBe(true)
    }
  })

  it('provides explicit taxonomy identity and chronology for every taxon',()=>{
    for(const taxon of contentCatalog.taxa){
      expect(taxon.taxonomy.scientificName.length).toBeGreaterThan(0)
      expect(taxon.chronology.olderMa).toBe(taxon.start)
      expect(taxon.chronology.youngerMa).toBe(taxon.end)
    }
    expect(contentCatalog.taxa.find(taxon=>String(taxon.id)==='common')?.taxonomy.rank).toBe('informal-node')
  })

  it('can search normalized publication and institution entities',()=>{
    expect(searchCatalog('nature22336').some(item=>item.kind==='publication')).toBe(true)
    expect(searchCatalog('Smithsonian Institution').some(item=>item.kind==='institution')).toBe(true)
  })

  it('exposes first-class material, site-context and taxon-name records',()=>{
    expect(getMaterialEntityRecord('material-neanderthal-1')?.basisOfRecord).toBe('FossilSpecimen')
    expect(getTaxonNameRecord('taxon-name-neanderthal')?.usage).toBe('accepted')
    expect(getSiteContextRecord('site-context-feldhofer')?.siteId).toBe('feldhofer')
    expect(getSiteContextRecord('site-context-global')?.timeInterval).toBeUndefined()
  })

  it('keeps inverse research indexes reproducible',()=>{
    expect(researchIndexes.specimensByMaterialEntityId['material-neanderthal-1']).toEqual([0])
    expect(researchIndexes.occurrencesBySpecimenId['neanderthal-1']).toEqual([0])
    expect(researchIndexes.claimsByEvidenceId['neanderthal-1']).toEqual([0])
  })

  it('keeps relationship IDs and source hooks explicit',()=>{
    expect(new Set(contentCatalog.relationships.map(item=>String(item.id))).size).toBe(contentCatalog.relationships.length)
    const geneFlow=contentCatalog.relationships.find(item=>item.type==='gene-flow')
    expect(geneFlow?.sourceIds.length).toBeGreaterThan(0)
    expect(geneFlow?.sourceLinks?.[0].role).toBe('supports')
  })
})
