import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import type {ContentCatalog} from '../domain/contracts'
import {validateCatalog} from '../infrastructure/validation/audit'

describe('site and taxon chronology audit',()=>{
  it('accepts the curated site intervals with their dating uncertainty',()=>{
    const report=validateCatalog(contentCatalog)
    expect(report.issues.filter(issue=>issue.code==='SITE_TAXON_CHRONOLOGY_MISMATCH')).toEqual([])
    expect(report.issues.filter(issue=>issue.code==='SITE_PERIOD_LABEL_MISMATCH')).toEqual([])
  })

  it('flags a site linked to a taxon outside the dated interval',()=>{
    const invalid={
      ...contentCatalog,
      siteContexts:contentCatalog.siteContexts.map(context=>String(context.siteId)==='eurasia'
        ? {...context,ageLabel:'Late Pleistocene context (~400 ka)',timeInterval:{...context.timeInterval!,olderMa:.4,youngerMa:.4,uncertaintyMa:0}}
        : context),
    } as unknown as ContentCatalog
    const issues=validateCatalog(invalid).issues
    expect(issues.some(issue=>issue.code==='SITE_PERIOD_LABEL_MISMATCH')).toBe(true)
    expect(issues.some(issue=>issue.code==='SITE_TAXON_CHRONOLOGY_MISMATCH')).toBe(true)
  })
})
