import {describe,expect,it} from 'vitest'
import {validateCatalog} from '../infrastructure/validation/audit'

describe('Human Origins data contract',()=>{
  it('has no broken cross-domain references',()=>{
    const report=validateCatalog()
    expect(report.errors).toBe(0)
  })
  it('allows a multi-media-per-taxon catalog while requiring one default reference',()=>{
    const report=validateCatalog()
    expect(report.summary.taxa).toBe(18)
    expect(report.summary.media).toBeGreaterThanOrEqual(report.summary.taxa)
  })
})
