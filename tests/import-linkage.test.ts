import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import {contentCatalog} from '../content/catalog'

// Guards the rule the importer depends on: every taxon that receives imported images must have at least one catalogued
// source with a URL. Without one the audit rejects the row (REVIEW_MEDIA_WITHOUT_SOURCE), so the import would fail silently.
const source=readFileSync('tools/images/import-handoff.ts','utf8')

describe('image import provenance',()=>{
  it('reads the source URL from the catalog, never from a hard-coded string',()=>{
    expect(source).toMatch(/contentCatalog\.sources\.find/)
    expect(source).toMatch(/sourceUrl:linked\.url!/)
    expect(source).not.toMatch(/sourceUrl:'https?:/)
  })
  it('sends a row that is not yet reviewed to review-required, never to approved',()=>{
    expect(source).toMatch(/publicationStatus:'review-required'/)
    expect(source).not.toMatch(/publicationStatus:'approved'/)
  })
  it('gives every taxon that has a species page at least one catalogued source with a URL',()=>{
    const missing=contentCatalog.taxa.filter(taxon=>!taxon.sourceIds.some(id=>{
      const found=contentCatalog.sources.find(item=>String(item.id)===String(id))
      return Boolean(found&&found.url)
    })).map(taxon=>String(taxon.id))
    expect(missing).toEqual([])
  })
})
