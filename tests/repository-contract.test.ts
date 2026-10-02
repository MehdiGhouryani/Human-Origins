import {describe,expect,it} from 'vitest'
import {getTaxonRecord,getSourcesForTaxon,getMaterialEntityRecord,getSiteContextRecord} from '../infrastructure/repository'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerSpeciesById,getExplorerSpeciesList} from '../features/explorer/selectors'
import {asTaxonId} from '../domain/ids'

describe('Repository identity contract',()=>{
  const bootstrap=buildExplorerBootstrap()
  it('fails closed for an unknown taxon instead of silently selecting another record',()=>{
    expect(getTaxonRecord(asTaxonId('not-a-real-taxon'))).toBeUndefined()
    expect(()=>getExplorerSpeciesById(bootstrap,'not-a-real-taxon')).toThrow('Unknown taxon id')
  })
  it('keeps canonical and presentation records aligned',()=>{
    const canonical=getTaxonRecord(asTaxonId('neanderthal'))
    const view=getExplorerSpeciesById(bootstrap,'neanderthal')
    expect(canonical?.name).toBe(view.name)
    expect(view.sourceIds.length).toBeGreaterThan(0)
    expect(getSourcesForTaxon('neanderthal').length).toBe(view.sourceIds.length)
    expect(getExplorerSpeciesList(bootstrap)).toHaveLength(18)
    expect(getMaterialEntityRecord('material-neanderthal-1')?.taxonId).toBe('neanderthal')
    expect(getSiteContextRecord('site-context-feldhofer')?.siteId).toBe('feldhofer')
  })
})
