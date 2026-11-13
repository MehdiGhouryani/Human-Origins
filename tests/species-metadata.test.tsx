import {beforeAll,describe,expect,it,vi} from 'vitest'
import {absoluteUrl} from '../infrastructure/site/url'
import {taxaById} from '../content/catalog'
import {getSpeciesPage} from '../content/species-pages'

vi.mock('../infrastructure/cms/requireSession',()=>({hasValidSession:async()=>false,requireAdminSession:async()=>undefined}))

// The production metadata logic, exercised directly for every catalog species (not a re-implementation).
const {generateMetadata}=await import('../app/species/[id]/page')
const {default: buildSitemap}=await import('../app/sitemap')
const {generateMetadata: homeMetadata}=await import('../app/page')

const ids=Object.keys(taxaById)
// The seven taxa outside the main graph are parked content (plan, phase 6). Where a catalog record is
// shorter than 120 characters, the honest description stays short: padding it would add a claim the
// sources do not make. Any change to this list must come from richer source-backed descriptions.
const EXPECTED_SHORT_DESCRIPTIONS=['boisei','ergaster','robustus']

type SpeciesMetadata=Awaited<ReturnType<typeof generateMetadata>>

describe('species metadata across the catalog (production generateMetadata)',()=>{
  const metadata=new Map<string,SpeciesMetadata>()
  beforeAll(async()=>{
    for(const id of ids) metadata.set(id,await generateMetadata({params:Promise.resolve({id})}))
  })

  it('gives every species a unique title of at most 60 characters',()=>{
    const titles=[...metadata.values()].map(m=>String(m.title))
    expect(new Set(titles).size,titles.join(' | ')).toBe(ids.length)
    for(const title of titles) expect(title.length,title).toBeLessThanOrEqual(60)
  })

  it('emits an absolute canonical URL per species and stays indexable',()=>{
    for(const id of ids){
      const m=metadata.get(id)!
      expect(m.alternates?.canonical,id).toBe(absoluteUrl(`/species/${id}`))
      expect(String(m.alternates?.canonical).startsWith('http'),id).toBe(true)
      const robots=m.robots as {noindex?:boolean}|undefined
      expect(robots?.noindex??false,id).toBe(false)
    }
  })

  it('keeps authored species descriptions in the 120 to 160 range',()=>{
    for(const id of ids){
      if(!getSpeciesPage(id)) continue
      const description=String(metadata.get(id)!.description)
      expect(description.length,`${id}: ${description}`).toBeGreaterThanOrEqual(120)
      expect(description.length,id).toBeLessThanOrEqual(160)
    }
  })

  it('takes non-authored species descriptions only from the catalog record, and reports the short ones',()=>{
    const short:string[]=[]
    for(const id of ids){
      if(getSpeciesPage(id)) continue
      const description=String(metadata.get(id)!.description)
      const catalog=taxaById[id].description
      // No fabrication: the description is cut from the catalog text (a cut ends with an ellipsis).
      expect(catalog.startsWith(description.replace(/…$/,'').trimEnd().slice(0,60)),`${id}: ${description}`).toBe(true)
      if(description.length<120||description.length>160) short.push(id)
    }
    expect(short.sort(),
      'source text shorter than 120 characters — fix by writing richer source-backed descriptions, not by padding')
      .toEqual([...EXPECTED_SHORT_DESCRIPTIONS].sort())
  })

  it('lists every species and the three canonical static pages in the sitemap, with lastmod only where reviewed',()=>{
    const entries=buildSitemap() as {url:string,lastModified?:string|Date}[]
    const urls=entries.map(entry=>entry.url)
    for(const id of ids) expect(urls,id).toContain(absoluteUrl(`/species/${id}`))
    for(const path of ['/','/about','/species']) expect(urls).toContain(absoluteUrl(path))
    expect(urls.length).toBe(ids.length+3)
    for(const entry of entries){
      const id=entry.url.split('/species/')[1]
      if(!id) continue
      expect(Boolean(entry.lastModified),id).toBe(Boolean(getSpeciesPage(id)?.reviewedOn))
    }
  })
})

describe('explorer canonical and noindex rules (production generateMetadata)',()=>{
  it('?species=X without a mode canonicalises to /species/X',async()=>{
    const m=await homeMetadata({searchParams:Promise.resolve({species:'sapiens'})})
    expect(m.alternates?.canonical).toBe(absoluteUrl('/species/sapiens'))
    expect((m.robots as {index?:boolean;noindex?:boolean}|undefined)?.noindex??false).toBe(false)
  })

  it('a mode canonicalises to /',async()=>{
    const m=await homeMetadata({searchParams:Promise.resolve({species:'sapiens',mode:'timeline'})})
    expect(m.alternates?.canonical).toBe(absoluteUrl('/'))
    expect((m.robots as {index?:boolean;noindex?:boolean}|undefined)?.noindex??false).toBe(false)
  })

  it('the comparison view is noindex',async()=>{
    const m=await homeMetadata({searchParams:Promise.resolve({mode:'compare',cmp:'sapiens,neanderthal'})})
    expect(m.alternates?.canonical).toBe(absoluteUrl('/'))
    expect((m.robots as {index?:boolean}|undefined)?.index).toBe(false)
  })
})
