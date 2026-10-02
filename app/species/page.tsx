import type {Metadata} from 'next'
import Link from 'next/link'
import MediaImage from '../../components/MediaImage'
import {buildExplorerBootstrap} from '../../features/explorer/bootstrap'
import {buildSpeciesDossier,completenessTierLabel} from '../../features/explorer/dossier'
import {getLiveContent} from '../../infrastructure/cms/live'
import {absoluteUrl} from '../../infrastructure/site/url'
import {resolveMediaSrc} from '../../presentation/mediaDelivery'
import {groupColors} from '../../presentation/palette'

export const dynamic='force-dynamic'

export const metadata:Metadata={
  title:'All species · Human Origins',
  description:'Every taxon in the Human Origins atlas, with its time range, group and record completeness.',
  alternates:{canonical:absoluteUrl('/species')},
}

export default function SpeciesIndexPage(){
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy)
  const groups=[...new Set(bootstrap.species.map(item=>item.group))]
  return <main className="dossier species-index">
    <nav className="dossier-crumbs" aria-label="Breadcrumb"><Link href="/">Atlas</Link><span aria-hidden="true">/</span><span aria-current="page">Species</span></nav>
    <header className="species-index-head">
      <h1>Species of the atlas</h1>
      <p className="dossier-lead">{bootstrap.species.length} taxa, oldest first. Each page shows only what registered sources support, and says so when a record is still incomplete.</p>
    </header>
    {groups.map(group=><section key={group} className="species-index-group" aria-labelledby={`group-${group.replace(/\W+/g,'-')}`}>
      <h2 id={`group-${group.replace(/\W+/g,'-')}`}><i style={{background:groupColors[group as keyof typeof groupColors]??'#e8bd70'}}/>{group}</h2>
      <ul>{bootstrap.species.filter(item=>item.group===group).map(item=>{
        const dossier=buildSpeciesDossier(bootstrap,item.id)
        const icon=dossier?.treeIcon??dossier?.portrait
        const tier=dossier?.completeness.tier??0
        return <li key={item.id}><Link href={`/species/${item.id}`}>
          <span className="species-index-thumb">{icon&&<MediaImage src={resolveMediaSrc(icon,'icon',256)} alt="" sizes="72px" className="species-thumb-image"/>}</span>
          <span className="species-index-text"><strong>{item.short}</strong><small><i>{item.taxonomy.scientificName}</i> · {item.date}</small></span>
          <span className={`pill tier-pill tier-${tier}`}>{completenessTierLabel[tier]}</span>
        </Link></li>
      })}</ul>
    </section>)}
  </main>
}
