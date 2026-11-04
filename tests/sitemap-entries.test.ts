import {describe,expect,it} from 'vitest'
import {buildSitemapEntries} from '../infrastructure/site/sitemapEntries'

const url=(path:string)=>`https://example.com${path}`
const build=(reviewed:Record<string,string>)=>buildSitemapEntries({taxonIds:['a','b','c'],reviewedOn:id=>reviewed[id],url})

describe('sitemap entries',()=>{
  it('lists home, species index, about and every species once',()=>{
    const urls=build({}).map(entry=>entry.url)
    expect(urls).toEqual(['https://example.com/','https://example.com/species','https://example.com/about','https://example.com/species/a','https://example.com/species/b','https://example.com/species/c'])
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('uses review dates, not the current time',()=>{
    const entries=build({a:'2026-01-05',b:'2026-03-09'})
    const byUrl=Object.fromEntries(entries.map(entry=>[entry.url,entry.lastModified]))
    expect(byUrl['https://example.com/species/a']).toEqual(new Date('2026-01-05T00:00:00Z'))
    expect(byUrl['https://example.com/species/b']).toEqual(new Date('2026-03-09T00:00:00Z'))
    // species without an authored page inherit the latest review date of the site
    expect(byUrl['https://example.com/species/c']).toEqual(new Date('2026-03-09T00:00:00Z'))
    expect(byUrl['https://example.com/']).toEqual(new Date('2026-03-09T00:00:00Z'))
  })

  it('is deterministic between calls',()=>{
    expect(build({a:'2026-01-05'})).toEqual(build({a:'2026-01-05'}))
  })

  it('omits lastModified instead of inventing one',()=>{
    for(const entry of build({})) expect('lastModified' in entry).toBe(false)
  })

  it('ignores malformed dates',()=>{
    const entries=build({a:'not-a-date'})
    for(const entry of entries) expect('lastModified' in entry).toBe(false)
  })
})
