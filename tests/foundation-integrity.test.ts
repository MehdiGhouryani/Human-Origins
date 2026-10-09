import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {foundationalSourceIds} from '../content/foundation'
import {validateCatalog} from '../infrastructure/validation/audit'

describe('Human Origins foundation',()=>{
  it('passes the canonical data audit with no warnings or errors',()=>{
    const report=validateCatalog()
    expect(report.errors).toBe(0)
    expect(report.warnings).toBe(0)
    expect(report.ok).toBe(true)
  })
  it('keeps every taxon connected to canonical media and sources',()=>{
    expect(contentCatalog.metadata.schemaVersion).toBe('4.2.0')
    expect(contentCatalog.metadata.release).toBe('0.32.5')
    expect(contentCatalog.taxa).toHaveLength(18)
    for(const taxon of contentCatalog.taxa){
      expect(taxon.mediaIds.length).toBeGreaterThan(0)
      expect(String(taxon.defaultMediaId)).toMatch(/^media:/)
      expect(taxon.sourceIds.length).toBeGreaterThan(0)
    }
    for(const media of contentCatalog.media){
      expect(media.alt.trim().length).toBeGreaterThan(0)
      expect(media.note.trim().length).toBeGreaterThan(0)
      expect(media.roles.length).toBeGreaterThan(0)
      expect(media.variants).toBeInstanceOf(Array)
    }
  })
  it('keeps all evidence site references resolvable',()=>{
    const sites=new Set(contentCatalog.sites.map(site=>String(site.id)))
    for(const evidence of contentCatalog.evidence) expect(sites.has(String(evidence.siteId))).toBe(true)
  })
  it('freezes canonical content at runtime',()=>{
    expect(Object.isFrozen(contentCatalog)).toBe(true)
    expect(Object.isFrozen(contentCatalog.taxa)).toBe(true)
    expect(Object.isFrozen(contentCatalog.sources)).toBe(true)
  })
  it('treats framework sources as explicit foundational dependencies',()=>{
    const sources=new Set(contentCatalog.sources.map(source=>String(source.id)))
    for(const sourceId of foundationalSourceIds) expect(sources.has(String(sourceId))).toBe(true)
  })
})
