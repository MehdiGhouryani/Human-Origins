import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {MediaInputError,parseRequiredText} from '../infrastructure/cms/mediaInput'

describe('Media delivery contract',()=>{
  it('rejects empty required upload metadata',()=>{
    expect(()=>parseRequiredText('   ','Credit')).toThrow(MediaInputError)
    expect(parseRequiredText('  verified credit  ','Credit')).toBe('verified credit')
  })
  it('keeps every local canonical asset inside public/assets',()=>{
    for(const media of contentCatalog.media){
      if(media.src.startsWith('/assets/')) expect(existsSync(join(process.cwd(),'public',media.src.slice(1)))).toBe(true)
    }
  })
  it('keeps reconstruction disclosure, roles and review status explicit',()=>{
    for(const media of contentCatalog.media){
      expect(media.roles.length).toBeGreaterThan(0)
      if(media.kind==='reconstruction') expect(`${media.alt} ${media.note}`.toLowerCase()).toContain('reconstruct')
      if(media.publicationStatus==='review-required') expect(media.kind).toBe('reconstruction')
      if(media.rightsStatus==='review-required') expect(media.sourceUrl).toMatch(/^https:\/\//)
      for(const link of media.sourceLinks) expect(link.sourceId).toBeTruthy()
    }
  })
  it('keeps remote media and provenance on HTTP(S)',()=>{
    for(const media of contentCatalog.media){
      if(/^https?:\/\//.test(media.src)) expect(/^https?:\/\//.test(media.sourceUrl)).toBe(true)
    }
  })
})
