import type {Metadata} from 'next'
import {preload} from 'react-dom'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {readExplorerState} from '../features/explorer/state'
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

export const metadata: Metadata = {
  title: 'Human Origins — Interactive Human Evolution Atlas',
  description: 'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({searchParams}: PageProps) {
  preloadHero()
  const live = getLiveContent()
  const bootstrap = buildExplorerBootstrap(live.catalog, live.copy, live.graphConfig)
  const resolvedParams = searchParams ? await searchParams : {}
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(resolvedParams)) {
    if (typeof value === 'string') query.set(key, value)
    else if (Array.isArray(value)) value.forEach(v => query.append(key, v))
  }
  const initialState = readExplorerState(query.toString())

  return (
    <div className="site">
      <SiteHeader />
      <Hero copy={live.copy} />
      <ExplorerErrorBoundary>
        <ExplorerShell bootstrap={bootstrap} initialState={initialState} />
      </ExplorerErrorBoundary>
    </div>
  )
}
