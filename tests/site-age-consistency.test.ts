import {describe,expect,it} from 'vitest'
import {evidenceSites,taxa} from '../content'

/**
 * Regression guard (old review item B5): a site dated to X ka may only be linked to a taxon whose time range
 * contains X (2 ka tolerance for rounding). Prevents e.g. a 400 ka site tagged "Late Pleistocene" on H. sapiens.
 */
describe('site ages vs taxon ranges',()=>{
  const byId=new Map(taxa.map(taxon=>[String(taxon.id),taxon]))
  it('every dated site lies inside the range of each taxon it is linked to',()=>{
    const violations:string[]=[]
    for(const site of evidenceSites){
      const ageMa=site.ageKa/1000
      if(!(ageMa>0)) continue
      for(const id of site.relatedTaxonIds??[]){
        const taxon=byId.get(String(id))
        if(!taxon) continue
        if(ageMa>taxon.start+0.002||ageMa<taxon.end-0.002) violations.push(`${site.id}: ${site.ageKa} ka outside ${id} (${taxon.start}–${taxon.end} Ma)`)
      }
    }
    expect(violations).toEqual([])
  })
})
