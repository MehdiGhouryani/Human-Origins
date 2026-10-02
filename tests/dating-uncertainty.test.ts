import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {datingClassLabel} from '../domain/labels'

describe('dating method / uncertainty (V25.1)',()=>{
  it('gives every resolved site-context time interval a declared dating method',()=>{
    const withInterval=contentCatalog.siteContexts.filter(context=>context.timeInterval)
    expect(withInterval.length).toBeGreaterThan(0)
    for(const context of withInterval){
      const datingClass=context.timeInterval?.datingClass
      expect(datingClass).toBeDefined()
      if(datingClass) expect(datingClassLabel[datingClass]).toBeTruthy()
    }
  })

  it('parses a real published uncertainty figure for Jebel Irhoud (Richter et al. 2017: 315 \u00b1 34 ka)',()=>{
    const jebelIrhoud=contentCatalog.siteContexts.find(context=>String(context.siteId)==='jebel-irhoud')
    expect(jebelIrhoud).toBeDefined()
    const interval=jebelIrhoud?.timeInterval
    expect(interval).toBeDefined()
    expect(interval?.olderMa).toBeCloseTo(0.315,5)
    expect(interval?.uncertaintyMa).toBeCloseTo(0.034,5)
    expect(interval?.datingClass).toBe('trapped-electron')
  })

  it('marks a site with no confidently-established dating method as unspecified rather than guessing',()=>{
    const context=contentCatalog.siteContexts.find(c=>String(c.siteId)==='singa')
    expect(context?.timeInterval?.datingClass).toBe('unspecified')
  })

  it('does not manufacture a dating method for sites whose age label is qualitative rather than numeric (parseAgeLabel returns no TimeInterval for these by design)',()=>{
    for(const siteId of ['global','eurasia','levant']){
      const context=contentCatalog.siteContexts.find(c=>String(c.siteId)===siteId)
      expect(context?.timeInterval).toBeUndefined()
    }
  })

  it('keeps datingClassLabel exhaustive over every DatingClass value actually used in the catalog',()=>{
    const used=new Set(contentCatalog.siteContexts.map(c=>c.timeInterval?.datingClass).filter((v):v is NonNullable<typeof v>=>v!==undefined))
    for(const value of used) expect(datingClassLabel[value]).toBeTruthy()
  })
})
