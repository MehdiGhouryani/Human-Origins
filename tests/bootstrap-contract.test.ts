import {describe,expect,it} from 'vitest'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerSpeciesById,getExplorerClaimsForTaxon,getExplorerSpecimensForTaxon,getExplorerSourceById,getExplorerProvenanceChainForClaim} from '../features/explorer/selectors'

describe('Explorer read model',()=>{
  it('exposes deterministic release metadata and frozen indexes',()=>{
    const bootstrap=buildExplorerBootstrap()
    expect(bootstrap.release).toBe('0.32.5')
    expect(bootstrap.schemaVersion).toBe('4.2.0')
    expect(bootstrap.fingerprint).toMatch(/^[a-f0-9]{32}$/)
    expect(Object.isFrozen(bootstrap)).toBe(true)
    expect(Object.isFrozen(bootstrap.indexes)).toBe(true)
    expect(Object.isFrozen(bootstrap.researchIndexes)).toBe(true)
    expect(bootstrap.indexes.mediaById['media:neanderthal']).toBeDefined()
    expect(bootstrap.researchIndexes.taxonNamesByTaxonId.neanderthal).toEqual([12])
    expect(bootstrap.materialEntities.length).toBe(22)
    expect(bootstrap.siteContexts.length).toBe(bootstrap.sites.length)
  })
  it('resolves indexed lookups without falling back to another record',()=>{
    const bootstrap=buildExplorerBootstrap()
    expect(getExplorerSpeciesById(bootstrap,'neanderthal').name).toContain('neanderthal')
    expect(()=>getExplorerSpeciesById(bootstrap,'not-a-real-taxon')).toThrow('Unknown taxon id')
  })
  it('keeps indexed relationship subsets aligned with canonical arrays',()=>{
    const bootstrap=buildExplorerBootstrap()
    expect(getExplorerClaimsForTaxon(bootstrap,'neanderthal').length).toBeGreaterThan(0)
    expect(getExplorerSpecimensForTaxon(bootstrap,'neanderthal').length).toBeGreaterThan(0)
    expect(getExplorerSourceById(bootstrap,'si-neanderthal-species')).toBeTruthy()
  })
  it('precomputes a traversal-backed provenance chain for every claim',()=>{
    const bootstrap=buildExplorerBootstrap()
    expect(Object.isFrozen(bootstrap.provenanceChains)).toBe(true)
    for(const claim of bootstrap.claims){
      const chain=getExplorerProvenanceChainForClaim(bootstrap,String(claim.id))
      expect(chain).toBeDefined()
      expect(chain?.reachedSource).toBe(true)
      expect(chain?.sourceIds.length).toBeGreaterThan(0)
    }
    expect(getExplorerProvenanceChainForClaim(bootstrap,'not-a-real-claim')).toBeUndefined()
  })
})
