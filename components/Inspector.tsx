'use client'
import {useMemo,useState} from 'react'
import Link from 'next/link'
import {Bookmark, ChevronRight, Database, ExternalLink, FlaskConical, Image as ImageIcon, MapPin} from 'lucide-react'
import {motion} from 'motion/react'
import MediaImage from './MediaImage'
import type {ExplorerSpecies as Species} from '../features/explorer/types'
import EvidenceGraph from './EvidenceGraph'
import SourceIntelligence from './SourceIntelligence'
import RelationshipHypotheses from './RelationshipHypotheses'
import SpecimenGallery from './SpecimenGallery'
import {getExplorerRelationships,getExplorerSourcesForTaxon,getExplorerSpeciesList} from '../features/explorer/selectors'
import {rangesOverlap} from '../domain/time'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'

const mediaLabels={
  'specimen-photo':'Specimen photograph',
  'cast-photo':'Cast / museum photograph',
  reconstruction:'Scientific reconstruction',
  'context-schematic':'Context schematic',
} as const

export default function Inspector({bootstrap,species,onRevealSite}:{bootstrap:ExplorerBootstrap;species:Species;onRevealSite:(id:string)=>void}){
 const tabs=['Overview','Evidence','Specimens','Lifestyle','Genetics'] as const
 const [tab,setTab]=useState<typeof tabs[number]>('Overview'); const [bookmarked,setBookmarked]=useState(false)
 const m=findMedia(species.media,species.defaultMediaId)
 const linkedSources=useMemo(()=>getExplorerSourcesForTaxon(bootstrap,species.id),[bootstrap,species.id])
 const coexisting=useMemo(()=>getExplorerSpeciesList(bootstrap).filter(other=>other.id!==species.id&&other.id!=='common'&&species.id!=='common'&&rangesOverlap({olderMa:species.start,youngerMa:species.end},{olderMa:other.start,youngerMa:other.end})),[bootstrap,species])
 const lineage=useMemo(()=>{const links=getExplorerRelationships(bootstrap);const name=(id:string)=>getExplorerSpeciesList(bootstrap).find(item=>item.id===id)?.short??id;return {parents:links.filter(l=>l.type!=='gene-flow'&&String(l.to)===species.id).map(l=>name(String(l.from))),children:links.filter(l=>l.type!=='gene-flow'&&String(l.from)===species.id).map(l=>name(String(l.to)))}},[bootstrap,species.id])
 const lifestyleFacts=species.facts.filter(([label])=>/tool|locomotion|anatomy|brain|diet|habitat|range|region/i.test(label))
 if(!m) return <aside className="inspector"><div className="inspector-body"><h2>{species.name}</h2><p>{species.description}</p></div></aside>
 const focusTab=(next:typeof tabs[number])=>{setTab(next);requestAnimationFrame(()=>{const el=document.getElementById(`species-tab-${next.toLowerCase()}`);el?.focus();el?.scrollIntoView({block:'nearest',inline:'nearest'})})}
 const moveTab=(direction:1|-1)=>{const index=tabs.indexOf(tab);focusTab(tabs[(index+direction+tabs.length)%tabs.length])}
 const panelId=`species-panel-${tab.toLowerCase()}`
 return <motion.aside className="inspector" initial={{opacity:0,x:24}} animate={{opacity:1,x:0}} transition={{duration:.28,ease:[.22,1,.36,1]}}>
  <button type="button" className="bookmark" aria-label={bookmarked?`Remove bookmark for ${species.name}`:`Bookmark ${species.name}`} aria-pressed={bookmarked} onClick={()=>setBookmarked(v=>!v)}><Bookmark size={16} fill={bookmarked?'currentColor':'none'}/></button>
  <figure className="species-visual">
    <MediaImage src={resolveMediaSrc(m,'detail',1024)} alt={m.alt} loading="eager" priority sizes="(max-width: 820px) 100vw, 455px" className="species-media-image"/>

    <div className="species-visual-scrim"/>
    <figcaption><span className="media-kind"><ImageIcon size={11}/>{mediaLabels[m.kind]}</span><span>{m.rightsStatus==='clear'?(m.license??'Rights clear'):m.rightsStatus==='institutional-terms'?'Institutional terms':m.rightsStatus==='review-required'?'Rights review required':'Rights metadata not stated'}</span></figcaption>
  </figure>
  <div className="inspector-body">
    <div className="pill-row"><span className="pill">{species.status==='living'?'Living':'Extinct'}</span><span className="pill">{species.group}</span></div>
    <h2>{species.name}</h2><div className="species-date">{species.taxonomy.scientificName} · {species.taxonomy.rank} · {species.date}</div>
    <div className="media-provenance"><div><b>Image provenance</b><span>{m.credit}</span></div>{m.sourceUrl&&<a href={m.sourceUrl} target="_blank" rel="noreferrer">View source <ExternalLink size={11}/></a>}</div>
    {m.publicationStatus==='review-required'&&<div className="media-review-banner" role="note"><b>Media review status</b><span>This reconstruction is marked for provenance review before final publication. It is not presented as a fossil photograph.</span></div>}
    {m.publicationStatus==='schematic'&&<div className="media-review-banner" role="note"><b>Context-only media</b><span>This graphic is schematic and does not represent a recovered fossil appearance.</span></div>}
    {m.note&&<div className="media-note">{m.note}</div>}
    <div className="evidence-chips">{species.evidence.map(e=><span key={e}>{e}</span>)}</div>
    <div className="tabs" role="tablist" aria-label={`${species.name} sections`}>{tabs.map(t=><button type="button" role="tab" id={`species-tab-${t.toLowerCase()}`} aria-selected={tab===t} aria-controls={`species-panel-${t.toLowerCase()}`} tabIndex={tab===t?0:-1} key={t} className={tab===t?'active':''} onClick={()=>setTab(t)} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();moveTab(1)}if(e.key==='ArrowLeft'){e.preventDefault();moveTab(-1)}if(e.key==='Home'){e.preventDefault();focusTab(tabs[0])}if(e.key==='End'){e.preventDefault();focusTab(tabs[tabs.length-1])}}}>{t}</button>)}</div>
    <div id={panelId} role="tabpanel" tabIndex={0} aria-labelledby={`species-tab-${tab.toLowerCase()}`} className="tab-panel">
    {tab==='Overview'&&<><p>{species.description}</p><dl className="facts">{species.facts.map(([a,b],i)=><div key={a}><dt>{['map','db','flask','dot'][i%4]==='map'?<MapPin size={13}/>:['map','db','flask','dot'][i%4]==='db'?<Database size={13}/>:['map','db','flask','dot'][i%4]==='flask'?<FlaskConical size={13}/>:<span aria-hidden="true">◉</span>}<span>{a}</span></dt><dd>{b}</dd></div>)}</dl></>}
    {tab==='Evidence'&&<><EvidenceGraph bootstrap={bootstrap} species={species} onRevealSite={onRevealSite}/><RelationshipHypotheses bootstrap={bootstrap} species={species}/><div className="evidence-panel"><div className="evidence-head"><strong>Source-backed record</strong><span>{linkedSources.length} sources</span></div>{linkedSources.map(s=><a className="source-card" key={s.id} href={s.url} target="_blank" rel="noreferrer"><span><b>{s.title}</b><small>{s.note}</small></span><ExternalLink size={13}/></a>)}</div><SourceIntelligence bootstrap={bootstrap} species={species}/></>}
    {tab==='Specimens'&&<SpecimenGallery bootstrap={bootstrap} species={species} onRevealSite={onRevealSite}/>} 
    {tab==='Lifestyle'&&<div className="empty-tab"><span>Archaeology & ecology</span>{lifestyleFacts.length?<dl className="facts">{lifestyleFacts.map(([a,b])=><div key={a}><dt><span>{a}</span></dt><dd>{b}</dd></div>)}</dl>:null}<p>{species.evidence.includes('Archaeology')?'Archaeological evidence (tools, sites, behaviour) is linked to this taxon; see the Evidence tab for the source-backed records.':'No archaeological record is securely associated with this taxon, so behaviour is inferred only from anatomy and context.'}</p></div>}
    {tab==='Genetics'&&<div className="empty-tab"><span>Ancient DNA</span><p>{species.evidence.includes('Genetics')?'Genetic evidence is available for this taxon. Source cards identify the current evidence base.':'Ancient DNA is not generally available for this taxon; this limits direct genetic reconstruction.'}</p></div>}
    </div>
    <Link className="cta" href={`/species/${species.id}`}>Open the full {species.short} page <ChevronRight size={15}/></Link>
    <div className="inspector-context">
      {(lineage.parents.length>0||lineage.children.length>0)&&<div><b>Lineage context</b><span>{lineage.parents.length?`From: ${lineage.parents.join(', ')}`:'Root of the tree'}{lineage.children.length?` · Leads to: ${lineage.children.join(', ')}`:''}</span></div>}
      {coexisting.length>0&&<div><b>Lived at the same time as</b><span>{coexisting.map(item=>item.short).join(' · ')}</span></div>}
    </div>
  </div>
 </motion.aside>
}
