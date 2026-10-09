import type {Metadata} from 'next'
import {RELATION_SEMANTICS} from '../../../domain/relationship-semantics'
import type {CSSProperties} from 'react'
import Link from 'next/link'
import {notFound} from 'next/navigation'
import {ArrowLeft,ArrowRight,CalendarDays,CheckCircle2,CircleDashed,Dna,ExternalLink,GitBranch,GitCompare,Image as ImageIcon,MapPin,Network,Users} from 'lucide-react'
import MediaImage from '../../../components/MediaImage'
import EvidenceGraph from '../../../components/EvidenceGraph'
import SpecimenGallery from '../../../components/SpecimenGallery'
import SourceIntelligence from '../../../components/SourceIntelligence'
import RelationshipHypotheses from '../../../components/RelationshipHypotheses'
import {buildExplorerBootstrap} from '../../../features/explorer/bootstrap'
import {buildSpeciesDossier,completenessTierLabel,speciesJsonLd} from '../../../features/explorer/dossier'
import type {DossierLink} from '../../../features/explorer/dossier'
import {getLiveContent} from '../../../infrastructure/cms/live'
import {absoluteUrl} from '../../../infrastructure/site/url'
import {resolveMediaSrc} from '../../../presentation/mediaDelivery'
import {groupColors} from '../../../presentation/palette'
import {ageMaToFraction,TIME_AXIS_ANCHORS_MA,formatAxisAnchor} from '../../../domain/time'
import {datingClassLabel} from '../../../domain/labels'
import {cache} from 'react'
import {evidenceClassLabel} from '../../../domain/media-slots'
import type {MediaEvidenceClass} from '../../../domain/contracts'
import {getSpeciesPage} from '../../../content/species-pages'
import {publicationsById} from '../../../content/publications'
import {numberReferences,type NavItem} from '../../../domain/species-page-render'
import {SECTION_TITLES} from '../../../domain/species-page'
import {citationKey} from '../../../domain/species-page-render'
import {Cite,RichText} from '../../../components/species/Rich'
import SpeciesNarrative from '../../../components/species/SpeciesNarrative'
import ReferenceList from '../../../components/species/ReferenceList'
import SectionNav from '../../../components/species/SectionNav'
import {MEDIA_SLOTS} from '../../../content/media-slots.generated'
import {resolveSlots} from '../../../features/explorer/slots'
import {getExplorerMediaForTaxon} from '../../../features/explorer/selectors'
import {hasValidSession} from '../../../infrastructure/cms/requireSession'
import SlotGallery,{SlotHero} from '../../../components/species/SlotGallery'

// Same contract as the atlas: CMS content can change at any time, so render per request.
export const dynamic='force-dynamic'

type Params={params:Promise<{id:string}>}

const mediaKindLabel={
  'specimen-photo':'Specimen photograph',
  'cast-photo':'Cast / museum photograph',
  reconstruction:'Scientific reconstruction',
  'context-schematic':'Context schematic',
} as const


const loadDossier=cache(function loadDossier(id:string){
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy,live.graphConfig)
  // Next already decodes the segment; a second decode of e.g. "%E0%A4%A" would throw URIError (500 instead of 404).
  let taxonId=id
  try{ taxonId=decodeURIComponent(id) }catch{ return {bootstrap,dossier:undefined} }
  const dossier=buildSpeciesDossier(bootstrap,taxonId)
  return {bootstrap,dossier}
})

export async function generateMetadata({params}:Params):Promise<Metadata>{
  const {id}=await params
  const {dossier}=loadDossier(id)
  if(!dossier) return {title:'Species not found · Human Origins'}
  const {species,portrait}=dossier
  const page=getSpeciesPage(String(species.id))
  const description=page?page.lead.text.replace(/\*/g,''):species.description
  const url=absoluteUrl(`/species/${species.id}`)
  const image=portrait?resolveMediaSrc(portrait,'card',1200):undefined
  return {
    title:`${species.name} (${species.date}) · Human Origins`,
    description,
    alternates:{canonical:url},
    openGraph:{type:'article',title:species.name,description,url,images:image?[{url:image,alt:portrait?.alt}]:undefined},
    twitter:{card:image?'summary_large_image':'summary',title:species.name,description,images:image?[image]:undefined},
  }
}
const mediaLabel=(media:{kind:keyof typeof mediaKindLabel;evidenceClass?:MediaEvidenceClass})=>media.evidenceClass?evidenceClassLabel(media.evidenceClass):mediaKindLabel[media.kind]

function LinkList({items,empty}:{items:readonly DossierLink[];empty:string}){
  if(!items.length) return <p className="dossier-muted">{empty}</p>
  return <ul className="dossier-links">{items.map(item=><li key={`${item.type}:${item.id}`}>
    <Link href={`/species/${item.id}`}><strong>{item.short}</strong><small>{item.name}</small></Link>
    <span className={`dossier-rel ${item.type}`}>{RELATION_SEMANTICS[item.relation].label}{item.certainty&&item.certainty!=='debated'?` · ${item.certainty==='high'?'well supported':item.certainty}`:''}</span>
    {item.note&&<p>{item.note}</p>}
    <p className="dossier-muted">{RELATION_SEMANTICS[item.relation].doesNotClaim}</p>
  </li>)}</ul>
}

export default async function SpeciesPage({params}:Params){
  const {id}=await params
  const {bootstrap,dossier}=loadDossier(id)
  if(!dossier) notFound()
  const {species,portrait,gallery,ancestors,descendants,geneFlow,coexisting,sites,specimens,claims,evidence,sources,previous,next,completeness}=dossier
  const color=groupColors[species.group as keyof typeof groupColors]??'#e8bd70'
  const left=ageMaToFraction(species.start)*100
  const right=ageMaToFraction(species.end)*100
  const jsonLd=JSON.stringify(speciesJsonLd(dossier,absoluteUrl(`/species/${species.id}`))).replace(/</g,'\\u003c')
  // The honest "thin record" banner is for taxa with no source-backed claims at all, not for every tier-0 record.
  const isThinRecord=completeness.tier===0&&claims.length===0
  const content=getSpeciesPage(String(species.id))
  const adminPreview=await hasValidSession()
  const slotStates=resolveSlots({slots:MEDIA_SLOTS,media:getExplorerMediaForTaxon(bootstrap,String(species.id)),taxonId:String(species.id),adminPreview,builtIns:{avatar:dossier.treeIcon,portrait}})
  const looseImages=gallery.filter(media=>!media.slotId)
  const numbering=content?numberReferences(content):undefined
  const navItems:NavItem[]=content?[
    {id:'at-a-glance',label:'At a glance'},
    ...content.sections.map(section=>({id:section.id,label:SECTION_TITLES[section.id]})),
    {id:'debated',label:'Debated'},{id:'unknown',label:'Unknown'},{id:'images',label:'Images'},{id:'sources',label:'Sources'},
  ]:[]

  return <main className="dossier species-page" style={{'--dossier-accent':color} as CSSProperties}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd}}/>
    <nav className="dossier-crumbs" aria-label="Breadcrumb">
      <Link href="/">Atlas</Link><span aria-hidden="true">/</span><Link href="/species">Species</Link><span aria-hidden="true">/</span><span aria-current="page">{species.short}</span>
    </nav>

    <header className="dossier-hero">
      <figure className="dossier-portrait">
        {portrait?<MediaImage src={resolveMediaSrc(portrait,'detail',1200)} alt={portrait.alt} priority sizes="(max-width: 900px) 100vw, 420px" className="dossier-portrait-image"/>:<div className="media-image-fallback" aria-hidden="true"><span>✦</span></div>}
        {portrait&&<figcaption><span><ImageIcon size={11}/> {mediaLabel(portrait)}</span><span>{portrait.credit}</span>{portrait.sourceUrl&&<a href={portrait.sourceUrl} target="_blank" rel="noreferrer">Source <ExternalLink size={10}/></a>}</figcaption>}
      </figure>
      <div className="dossier-hero-copy">
        <div className="pill-row"><span className="pill">{species.status==='living'?'Living':'Extinct'}</span><span className="pill">{species.group}</span><span className={`pill tier-pill tier-${completeness.tier}`}>{completenessTierLabel[completeness.tier]}</span></div>
        <h1>{species.name}</h1>
        <p className="dossier-sub"><i>{species.taxonomy.scientificName}</i> · {species.taxonomy.rank} · {species.taxonomy.taxonomicStatus} · <CalendarDays size={13}/> {species.date}</p>
        <p className="dossier-lead">{content&&numbering?<><RichText text={content.lead.text}/><Cite refs={content.lead.refs} numbering={numbering} where={citationKey.lead}/></>:species.description}</p>
        {portrait?.publicationStatus==='review-required'&&<p className="dossier-note" role="note">This image is a reconstruction marked for provenance review. It is not a fossil photograph.</p>}
        {portrait?.publicationStatus==='schematic'&&<p className="dossier-note" role="note">This graphic is schematic and does not show a recovered fossil appearance.</p>}
        <div className="dossier-actions">
          <Link className="cta" href={`/?species=${species.id}&mode=tree`}><span><GitBranch size={14}/> Show in the tree</span><ArrowRight size={14}/></Link>
          <Link className="cta ghost" href={`/?species=${species.id}&mode=migration`}><span><MapPin size={14}/> Show on globe</span><ArrowRight size={14}/></Link>
          <Link className="cta ghost" href="/compare"><span><GitCompare size={14}/> Compare matrix</span><ArrowRight size={14}/></Link>
        </div>
      </div>
    </header>

    <section className="dossier-timeline" aria-label={`Time range of ${species.name}`}>
      <div className="dossier-axis" aria-hidden="true">{TIME_AXIS_ANCHORS_MA.map(anchor=><small key={anchor} style={{left:`${ageMaToFraction(anchor)*100}%`}}>{formatAxisAnchor(anchor)}</small>)}</div>
      <div className="dossier-track"><b style={{left:`${left}%`,width:`${Math.max(.8,right-left)}%`}}/></div>
      <p className="dossier-muted">Documented range: {species.date}. Bars show the fossil-record range on the atlas&apos;s non-linear deep-time scale, not a precise lifespan of the lineage.</p>
    </section>

    {isThinRecord&&!content&&<aside className="dossier-incomplete" role="note"><CircleDashed size={16}/><div><strong>This is an incomplete record.</strong><p>We publish only what registered sources support. Sections below stay empty instead of being filled with unsourced text.</p></div></aside>}

    <section className="dossier-signal-card" aria-labelledby="record-signal-h">
      <div className="dossier-signal-intro">
        <span className="view-kicker">RECORD SIGNAL</span>
        <h2 id="record-signal-h">What this page actually represents</h2>
        <p>These are catalogued records connected to <strong>{species.short}</strong>, not estimates of how much science exists about it. An empty count means this atlas has not represented that record yet.</p>
      </div>
      <dl className="dossier-signal-grid">
        <div><dt>Registered sources</dt><dd>{sources.length}</dd></div>
        <div><dt>Evidence records</dt><dd>{evidence.length}</dd></div>
        <div><dt>Specimens</dt><dd>{specimens.length}</dd></div>
        <div><dt>Sites</dt><dd>{sites.length}</dd></div>
      </dl>
    </section>

    <div className={content?'sp-layout':'sp-layout sp-layout-plain'}>
    {content&&<SectionNav items={navItems}/>}
    <div className="sp-main">
    <SlotHero states={slotStates} adminPreview={adminPreview}/>
    {content&&numbering&&<SpeciesNarrative page={content} numbering={numbering}/>}
    <div className="dossier-grid">
      {!content&&<section className="dossier-card" aria-labelledby="facts-h">
        <h2 id="facts-h">Key facts</h2>
        <dl className="facts">{species.facts.map(([label,value])=><div key={label}><dt><span>{label}</span></dt><dd>{value}</dd></div>)}</dl>
        <div className="evidence-chips">{species.evidence.map(item=><span key={item}>{item}</span>)}</div>
      </section>}

      <section className="dossier-card" aria-labelledby="lineage-h">
        <h2 id="lineage-h"><Network size={16}/> Place in the tree</h2>
        <h3>Proposed origin</h3>
        <LinkList items={ancestors} empty="Root of this tree: no earlier lineage is registered."/>
        <h3>Leads to</h3>
        <LinkList items={descendants} empty="No later lineage is registered from this taxon."/>
        {geneFlow.length>0&&<><h3><Dna size={13}/> Gene flow</h3><LinkList items={geneFlow} empty=""/></>}
        <p className="dossier-muted">Branches are contextual or possible relationships, not guaranteed direct ancestry.</p>
      </section>

      <section className="dossier-card" aria-labelledby="coexist-h">
        <h2 id="coexist-h"><Users size={16}/> Lived at the same time as</h2>
        {coexisting.length?<ul className="dossier-chips">{coexisting.map(other=><li key={other.id}><Link href={`/species/${other.id}`}>{other.short}<small>{other.date}</small></Link></li>)}</ul>:<p className="dossier-muted">No other taxon in the atlas overlaps this time range.</p>}
        <p className="dossier-muted">Overlap in time says who coexisted. It never implies ancestry.</p>
      </section>

      <section className="dossier-card" aria-labelledby="sites-h">
        <h2 id="sites-h"><MapPin size={16}/> Where and when</h2>
        {sites.length?<ul className="dossier-sites">{sites.map(site=><li key={String(site.id)}>
          <div><strong>{site.name}</strong><small>{[site.country,site.region].filter(Boolean).join(' · ')}</small></div>
          <span>{site.ageLabel}{site.datingClass&&site.datingClass!=='unspecified'?` · ${datingClassLabel[site.datingClass]}`:''}</span>
          <Link href={`/?species=${species.id}&mode=migration&site=${String(site.id)}`} aria-label={`Show ${site.name} on the globe`}><MapPin size={12}/></Link>
        </li>)}</ul>:<p className="dossier-muted">No site is registered for this taxon yet.</p>}
      </section>
    </div>

    <SlotGallery states={slotStates} extras={looseImages} adminPreview={adminPreview}/>

    <section className="dossier-section dossier-panel" aria-label="Evidence">
      <EvidenceGraph bootstrap={bootstrap} species={species}/>
      <RelationshipHypotheses bootstrap={bootstrap} species={species}/>
    </section>

    <section className="dossier-section dossier-panel" aria-label="Specimens">
      <SpecimenGallery bootstrap={bootstrap} species={species}/>
    </section>

    {content&&numbering?<ReferenceList numbering={numbering} publications={publicationsById}/>:<section className="dossier-section dossier-panel" aria-label="Sources">
      <SourceIntelligence bootstrap={bootstrap} species={species}/>
    </section>}

    <section className="dossier-section dossier-completeness" aria-labelledby="complete-h">
      <h2 id="complete-h">Record completeness</h2>
      <p className="dossier-muted">Computed from the catalog: {claims.length} claims · {evidence.length} evidence records · {specimens.length} specimens · {sites.length} sites · {sources.length} sources. Scientific review (the &quot;reviewed&quot; tier) has not been recorded for a taxon yet.</p>
      <ul>{completeness.checks.map(check=><li key={check.key} className={check.met?'met':'unmet'}>{check.met?<CheckCircle2 size={13}/>:<CircleDashed size={13}/>}<span>{check.label}</span></li>)}</ul>
    </section>

    </div>
    </div>

    <nav className="dossier-pager" aria-label="Neighbouring species">
      {previous?<Link href={`/species/${previous.id}`}><ArrowLeft size={14}/><span><small>Earlier in the atlas</small>{previous.short}</span></Link>:<span/>}
      <Link href="/species" className="dossier-pager-index">All species</Link>
      {next?<Link href={`/species/${next.id}`} className="next"><span><small>Later in the atlas</small>{next.short}</span><ArrowRight size={14}/></Link>:<span/>}
    </nav>
  </main>
}
