import Link from 'next/link'

export default function NotFound(){
  return <main className="route-error"><div className="route-error-card"><span className="eyebrow">404 · NOT FOUND</span><h1>This research surface does not exist.</h1><p>Return to the atlas and continue from the current species, evidence, time and source layers.</p><Link href="/">Return to Human Origins</Link></div></main>
}
