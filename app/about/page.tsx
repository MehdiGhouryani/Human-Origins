import type {Metadata} from 'next'
import Link from 'next/link'
import SiteHeader from '../../components/SiteHeader'

// The header reads search params, so the page is rendered per request rather than prerendered.
export const dynamic='force-dynamic'

export const metadata:Metadata={
  title:'About · Human Origins',
  description:'How the Human Origins atlas works: its evidence rule, what the tree and the maps show, and what they do not claim.',
}

export default function AboutPage(){
  return <div className="site">
    <SiteHeader/>
    <main className="about-page">
      <div className="view-kicker">ABOUT THE ATLAS</div>
      <h1>About Human Origins</h1>
      <p>Human Origins is a source-aware atlas of human evolution. It brings together fossil species, the evidence for them, their dates, and the population movements the record supports.</p>
      <h2>How to read the tree</h2>
      <p>Each species sits at its first appearance in the fossil record. Branches are contextual or possible relationships, not guaranteed direct ancestry. The home tree shows the main path of 11 taxa; every species keeps its own page.</p>
      <h2>How to read the maps</h2>
      <p>Migration lines are generalized population corridors, not individual journeys. Temporal overlap never implies ancestry or contact.</p>
      <h2>Evidence rule</h2>
      <p>No source, no factual claim. Interpretive synthesis is labelled as such, and missing specimen imagery stays missing instead of being replaced by a generic reconstruction.</p>
      <h2>Reconstructions</h2>
      <p>Images labelled as reconstructions are scientific reconstructions, not fossil photographs. Every source is linked from the Evidence view.</p>
      <p className="about-links"><Link href="/?mode=evidence">Open the evidence view</Link> · <Link href="/species">Browse the species</Link></p>
    </main>
  </div>
}
