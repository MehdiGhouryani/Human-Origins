import type {Metadata} from 'next'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {readExplorerState} from '../features/explorer/state'
import {getLiveContent} from '../infrastructure/cms/live'
import SiteHeader from '../components/SiteHeader'
import Hero from '../components/Hero'
import ExplorerShell from '../components/ExplorerShell'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Human Origins — Interactive Human Evolution Atlas',
  description: 'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({searchParams}: PageProps) {
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
      <Hero release={live.catalog.metadata.release} copy={live.copy} />
      <ExplorerShell bootstrap={bootstrap} initialState={initialState} />
    </div>
  )
}
