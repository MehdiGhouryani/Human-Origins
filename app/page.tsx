import type {Metadata} from 'next'
import {taxaById} from '../content/catalog'
import {graphDocument, jsonLdHtml, websiteNode} from '../features/seo/metadata'
import {absoluteUrl} from '../infrastructure/site/url'
import {preload} from 'react-dom'
import {buildExplorerBootstrap,projectExplorerBootstrapForClient} from '../features/explorer/bootstrap'
import {readExplorerState} from '../features/explorer/state'
import {buildSearchResponse} from '../features/search/targets'
import {getLiveContent} from '../infrastructure/cms/live'
import SiteHeader from '../components/SiteHeader'
import Hero from '../components/Hero'
import ExplorerShell from '../components/ExplorerShell'
import ExplorerErrorBoundary from '../components/ExplorerErrorBoundary'

export const dynamic = 'force-dynamic'

// The hero image is a CSS background, which the browser finds only after the stylesheet is parsed and laid out. These hints
// start each viewport's image at once (media matches the stylesheet breakpoints: 620px and 820px). Nothing visual changes.
function preloadHero(){
  preload('/assets/hero-mobile.webp',{as:'image',fetchPriority:'high',media:'(max-width: 620px)'})
  preload('/assets/hero-tablet.webp',{as:'image',fetchPriority:'high',media:'(min-width: 621px) and (max-width: 820px)'})
  preload('/assets/hero-desktop.webp',{as:'image',fetchPriority:'high',media:'(min-width: 821px)'})
}

const baseMetadata: Metadata = {
  title: 'Human Origins — Interactive Human Evolution Atlas',
  description: 'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
}

// Canonical rules (plan phase 9.2): ?species=X without a mode points to /species/X; every mode points to /; the comparison view is noindex.
export async function generateMetadata({searchParams}: PageProps): Promise<Metadata> {
  const query = searchParams ? await searchParams : {}
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)
  const species = first(query.species)
  const mode = first(query.mode)
  const comparing = first(query.cmp)
  const canonical = species && taxaById[species] && !mode ? absoluteUrl(`/species/${species}`) : absoluteUrl('/')
  return {...baseMetadata, alternates: {canonical}, ...(comparing ? {robots: {index: false, follow: true}} : {})}
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({searchParams}: PageProps) {
  preloadHero()
  const live = getLiveContent()
  const serverBootstrap = buildExplorerBootstrap(live.catalog, live.copy, live.graphConfig)
  const resolvedParams = searchParams ? await searchParams : {}
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value)) value.forEach(v => query.append(key, v))
  }
  const initialState = readExplorerState(query.toString())
  const initialSearch = query.has('q') ? buildSearchResponse(serverBootstrap, query.get('q')) : undefined
  const bootstrap = projectExplorerBootstrapForClient(serverBootstrap)

  return (
    <div className="site">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: jsonLdHtml(graphDocument([websiteNode(absoluteUrl('/'), 'Human Origins')]))}} />
      <SiteHeader />
      <Hero copy={live.copy} />
      <ExplorerErrorBoundary>
        <ExplorerShell bootstrap={bootstrap} initialState={initialState} initialSearch={initialSearch} />
      </ExplorerErrorBoundary>
    </div>
  )
}
