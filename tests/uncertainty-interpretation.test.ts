import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'

describe('qualitative uncertainty and interpretations',()=>{
  it('never stores numeric confidence scores',()=>{
    for(const claim of contentCatalog.claims){
      for(const item of claim.uncertaintyProfile){
        expect(['bounded','open','contested','source-limited','unknown']).toContain(item.state)
      }
    }
  })
  it('links every interpretation set to a claim and at least two positions',()=>{
    for(const set of contentCatalog.interpretationSets){
      expect(contentCatalog.claims.some(claim=>String(claim.id)===String(set.claimId))).toBe(true)
      expect(set.positionIds.length).toBeGreaterThanOrEqual(2)
      expect(set.positionIds.length).toBe(new Set(set.positionIds.map(String)).size)
    }
  })
  it('keeps interpretation positions source-backed',()=>{
    for(const position of contentCatalog.interpretationPositions){
      expect(position.sourceIds.length).toBeGreaterThan(0)
      for(const sourceId of position.sourceIds){
        expect(contentCatalog.sources.some(source=>String(source.id)===String(sourceId))).toBe(true)
      }
    }
  })
})
