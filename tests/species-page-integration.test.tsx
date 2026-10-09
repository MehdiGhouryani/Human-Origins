import {describe,expect,it,vi} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type * as PublicationsModule from '../content/publications'
import {makeValidPage,SYNTHETIC_REFS} from './fixtures/species-page'

const session=vi.hoisted(()=>({valid:false}))
vi.mock('../infrastructure/cms/requireSession',()=>({hasValidSession:async()=>session.valid,requireAdminSession:async()=>undefined}))

// Give one taxon a content file and the references it cites, without touching the real registry.
vi.mock('../content/species-pages',async()=>{
  const page=makeValidPage()
  return {speciesPages:{afarensis:page},getSpeciesPage:(id:string)=>id==='afarensis'?page:undefined}
})
vi.mock('../content/publications',async()=>{
  const actual=await vi.importActual<typeof PublicationsModule>('../content/publications')
  return {...actual,publicationsById:{...actual.publicationsById,...Object.fromEntries(SYNTHETIC_REFS.map(pub=>[String(pub.id),pub]))}}
})

const {default:SpeciesPage,generateMetadata}=await import('../app/species/[id]/page')

describe('species page integration',()=>{
  it('shows the hero frame to the public but no upload links, and upload frames to an admin',async()=>{
    session.valid=false
    const publicMarkup=renderToStaticMarkup(await SpeciesPage({params:Promise.resolve({id:'sapiens'})}))
    expect(publicMarkup).toContain('id="hero-image"')
    expect(publicMarkup).toContain('Image in preparation')
    expect(publicMarkup).not.toContain('/admin/media/slots?slot=')
    session.valid=true
    const adminMarkup=renderToStaticMarkup(await SpeciesPage({params:Promise.resolve({id:'sapiens'})}))
    session.valid=false
    expect(adminMarkup).toContain('href="/admin/media/slots?slot=sapiens.S03"')
    expect(adminMarkup).toContain('href="/admin/media/slots?slot=sapiens.L1"')
    expect(adminMarkup).not.toContain('href="/admin/media/slots?slot=orrin')
  })


  it('renders the narrative, citations and reference list for a taxon with a content file',async()=>{
    const markup=renderToStaticMarkup(await SpeciesPage({params:Promise.resolve({id:'afarensis'})}))
    expect(markup).toContain('class="dossier species-page"')
    expect(markup).toContain('class="sp-layout"')
    expect(markup).toContain('aria-label="On this page"')
    expect(markup).toContain('id="at-a-glance"')
    expect(markup).toContain('id="debated"')
    expect(markup).toContain('id="sources"')
    expect(markup).toContain('href="#ref-1"')
    // The generic key-facts card and the legacy mid-page source panel are replaced.
    expect(markup).not.toContain('aria-labelledby="facts-h"')
    expect(markup).not.toContain('aria-label="Sources"')
    // The lead replaces the one-sentence description.
    expect(markup).toContain('class="dossier-lead"')
  })

  it('keeps the existing layout for a taxon without a content file',async()=>{
    const markup=renderToStaticMarkup(await SpeciesPage({params:Promise.resolve({id:'sapiens'})}))
    expect(markup).toContain('sp-layout sp-layout-plain')
    expect(markup).not.toContain('aria-label="On this page"')
    expect(markup).toContain('aria-labelledby="facts-h"')
    expect(markup).not.toContain('id="sources"')
  })

  it('uses the lead as the page description when a content file exists',async()=>{
    const withContent=await generateMetadata({params:Promise.resolve({id:'afarensis'})})
    const without=await generateMetadata({params:Promise.resolve({id:'sapiens'})})
    expect(withContent.description).toBe(makeValidPage().lead.text)
    expect(without.description).not.toBe(withContent.description)
    expect(String(withContent.description).length).toBeGreaterThan(100)
  })
})
