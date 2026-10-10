'use client'
import {useEffect,useMemo,useState} from 'react'
import Link from 'next/link'
import {Bookmark,ChevronRight,ExternalLink,Image as ImageIcon,X,ArrowRight,MapPin,GitBranch} from 'lucide-react'
import {motion} from 'motion/react'
import MediaImage from './MediaImage'
import type {ExplorerSpecies as Species} from '../features/explorer/types'
import EvidenceGraph from './EvidenceGraph'
import SourceIntelligence from './SourceIntelligence'
import RelationshipHypotheses from './RelationshipHypotheses'
import {getExplorerEvidenceForTaxon,getExplorerSourceById,getExplorerSourcesForTaxon,getExplorerSpeciesList} from '../features/explorer/selectors'
import {LIFESTYLE_TOPICS,factTopic,factsByTopic} from '../domain/facts'
import {rangesOverlap} from '../domain/time'
import {isInferredNode,taxonStatusLabel} from '../domain/taxon-model'
import {relationsOf} from '../presentation/treeSelectors'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import {taxonInitials} from './TaxonNavigator'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {EvidenceRecord} from '../domain/contracts'

const mediaLabels={'specimen-photo':'Specimen photograph','cast-photo':'Cast / museum photograph',reconstruction:'Scientific reconstruction','context-schematic':'Context schematic'} as const
// Phase 3: three views. Specimens live on the species page; genetics and gene flow are part of Evidence; the
// relationship list is on the species page and in the tree's family view.
export const INSPECTOR_TABS=['Overview','Evidence','Lifestyle'] as const
const TABS=INSPECTOR_TABS
type Tab=typeof TABS[number]
const kaOrMa=(ageMa:number)=>ageMa>=1?`${ageMa} Ma`:`${Math.round(ageMa*1000)} ka`

/** Distinguishes "the atlas holds no data" from "no evidence exists": the two are scientifically different statements. */
const NoData=({what,short,hint}:{what:string;short:string;hint?:string})=><div className="empty-tab" role="note"><strong>No {what} data is represented for {short}.</strong><p>This describes what the atlas currently holds, not a finding that none exists.{hint?` ${hint}`:''}</p></div>

function EvidenceList({bootstrap,records}:{bootstrap:ExplorerBootstrap;records:readonly EvidenceRecord[]}){
  return <ul className="evidence-list">{records.map(record=><li key={String(record.id)}>
    <strong>{record.title}</strong><small>{record.ageLabel}{record.datingMethod?` · ${record.datingMethod}`:''}</small>
    <p>{record.claim}</p>
    <span className="evidence-list-sources">{record.sourceIds.map(id=>{const source=getExplorerSourceById(bootstrap,String(id));return source?<a key={String(id)} href={source.url} target="_blank" rel="noreferrer">{source.title}<span className="sr-only"> (opens in a new tab)</span><ExternalLink size={11} aria-hidden="true"/></a>:null})}</span>
  </li>)}</ul>
}

type Props={bootstrap:ExplorerBootstrap;species:Species;bookmarked:boolean;onToggleBookmark:()=>boolean;onRevealSite:(id:string)=>void;onClose?:()=>void;open?:boolean;initialTab?:InspectorTab}
export type InspectorTab=Tab

/**
 * The profile of the selected species. It stays mounted while the species changes: only its content fades, so the
 * panel never blanks. On wide screens it is a column; below 1024px it is a bottom sheet that `open` shows.
 */
export default function Inspector({bootstrap,species,bookmarked,onToggleBookmark,onRevealSite,onClose,open=false,initialTab='Overview'}:Props){
  const [tab,setTab]=useState<Tab>(initialTab)
  const [saveMessage,setSaveMessage]=useState('')
  const m=species.media.find(item=>item.roles.includes('profile-portrait')&&!item.placeholder) ??
    species.media.find(item=>item.roles.includes('profile-portrait')) ??
    findMedia(species.media,species.defaultMediaId)
  const inferred=isInferredNode(species)
  const linkedSources=useMemo(()=>getExplorerSourcesForTaxon(bootstrap,species.id),[bootstrap,species.id])
  const coexisting=useMemo(()=>inferred?[]:getExplorerSpeciesList(bootstrap).filter(o=>o.id!==species.id&&!isInferredNode(o)&&rangesOverlap({olderMa:species.start,youngerMa:species.end},{olderMa:o.start,youngerMa:o.end})),[bootstrap,species,inferred])
  const evidence=useMemo(()=>getExplorerEvidenceForTaxon(bootstrap,species.id),[bootstrap,species.id])
  const geneticRecords=useMemo(()=>evidence.filter(r=>r.kind==='genetics'),[evidence])
  const archaeologyRecords=useMemo(()=>evidence.filter(r=>r.kind==='archaeology'),[evidence])
  const geneFlow=useMemo(()=>relationsOf(species.id,bootstrap.relationships).geneFlow,[bootstrap,species.id])
  const lifestyleFacts=factsByTopic(species.facts,...LIFESTYLE_TOPICS)
  const otherFacts=species.facts.filter(([label])=>factTopic(label)==='other')
  const toggle=()=>{const wasSaved=bookmarked;const ok=onToggleBookmark();setSaveMessage(ok?(wasSaved?`Removed ${species.short} from your bookmarks`:`Saved ${species.short} to your bookmarks`):'Could not save: this browser is blocking local storage')}
  // On narrow screens an opened sheet takes focus on its heading. This runs after the chosen species has rendered,
  // so the heading that receives focus is the current one.
  useEffect(()=>{
    if(open&&window.matchMedia('(max-width: 1023px)').matches) document.getElementById('inspector-heading')?.focus()
  },[species.id,open])
  const sheet=open?'is-open':''
  const profileHref=`/species/${species.id}`

  const focusTab=(next:Tab)=>{setTab(next);requestAnimationFrame(()=>{const el=document.getElementById(`species-tab-${next.toLowerCase()}`);el?.focus();el?.scrollIntoView({block:'nearest',inline:'nearest'})})}
  const moveTab=(direction:1|-1)=>focusTab(TABS[(TABS.indexOf(tab)+direction+TABS.length)%TABS.length])
  const panelId=`species-panel-${tab.toLowerCase()}`
  const closeButton=onClose?<button type="button" className="inspector-close-btn" onClick={onClose} aria-label="Close details panel" title="Close"><X size={16}/></button>:null

  // The record has no portrait: the profile still offers the way to the species page.
  if(!m) return <aside className={`inspector ${sheet}`} aria-label={`${species.name} details`} id="inspector">
    <div className="inspector-body">
      {closeButton}
      <h2 id="inspector-heading" tabIndex={-1}>{species.name}</h2>
      <p>{species.description}</p>
      <Link className="cta primary-cta" href={profileHref}><span><ArrowRight size={14}/> Explore full species profile</span><ChevronRight size={15}/></Link>
    </div>
  </aside>

  return <aside className={`inspector ${sheet}`} aria-label={`${species.name} details`} id="inspector">
    <div className="inspector-top-actions">
      {closeButton}
      <button type="button" className="bookmark" aria-label={bookmarked?`Remove bookmark for ${species.name}`:`Bookmark ${species.name}`} aria-pressed={bookmarked} onClick={toggle}><Bookmark size={15} fill={bookmarked?'currentColor':'none'}/></button>
      <span className="sr-only" role="status">{saveMessage}</span>
    </div>
    {saveMessage.startsWith('Could not')&&<p className="inspector-warning" role="alert">{saveMessage}</p>}
    <motion.div key={species.id} className="inspector-content" initial={{opacity:0}} animate={{opacity:1}} transition={{duration:.18}}>
      <figure className="species-visual">
        <MediaImage src={resolveMediaSrc(m,'detail',1024)} alt={m.alt} loading="eager" priority sizes="(max-width: 820px) 100vw, 455px" className="species-media-image" fallbackText={taxonInitials(species.short)}/>
        <div className="species-visual-scrim"/>
        <figcaption><span className="media-kind"><ImageIcon size={12}/>{mediaLabels[m.kind]}</span><span>{m.rightsStatus==='clear'?(m.license??'Rights clear'):m.rightsStatus==='institutional-terms'?'Institutional terms':m.rightsStatus==='review-required'?'Rights review required':'Rights metadata not stated'}</span></figcaption>
      </figure>
      <div className="inspector-body">
        <div className="pill-row"><span className={`pill ${inferred?'pill-inferred':''}`}>{taxonStatusLabel(species)}</span><span className="pill">{species.group}</span></div>
        <h2 id="inspector-heading" tabIndex={-1}>{species.name}</h2>
        <div className="species-date">{inferred?`Model construct · ${species.date}`:`${species.taxonomy.scientificName} · ${species.taxonomy.rank} · ${species.date}`}</div>
        {inferred&&<p className="inferred-note" role="note">This is an inferred ancestral node used to anchor the graph. It is not a named fossil species and has no specimens of its own.</p>}
        <div className="media-provenance"><div><b>Image provenance</b><span>{m.credit}</span></div>{m.sourceUrl&&<a href={m.sourceUrl} target="_blank" rel="noreferrer">View source <ExternalLink size={12}/><span className="sr-only"> (opens in a new tab)</span></a>}</div>
        {m.publicationStatus==='review-required'&&<div className="media-review-banner" role="note"><b>Media review status</b><span>This reconstruction is marked for provenance review before final publication. It is not presented as a fossil photograph.</span></div>}
        {m.publicationStatus==='schematic'&&<div className="media-review-banner" role="note"><b>Context-only media</b><span>This graphic is schematic and does not represent a recovered fossil appearance.</span></div>}
        {m.note&&<div className="media-note">{m.note}</div>}
        <div className="evidence-chips" aria-label="Kinds of evidence recorded">{species.evidence.map(e=><span key={e}>{e}</span>)}</div>
        <div className="tabs" role="tablist" aria-label={`${species.name} sections`}>{TABS.map(t=><button type="button" role="tab" id={`species-tab-${t.toLowerCase()}`} aria-selected={tab===t} aria-controls={`species-panel-${t.toLowerCase()}`} tabIndex={tab===t?0:-1} key={t} className={tab===t?'active':''} onClick={()=>setTab(t)} onKeyDown={e=>{if(e.key==='ArrowRight'){e.preventDefault();moveTab(1)}if(e.key==='ArrowLeft'){e.preventDefault();moveTab(-1)}if(e.key==='Home'){e.preventDefault();focusTab(TABS[0])}if(e.key==='End'){e.preventDefault();focusTab(TABS[TABS.length-1])}}}>{t}</button>)}</div>
        <div id={panelId} role="tabpanel" tabIndex={0} aria-labelledby={`species-tab-${tab.toLowerCase()}`} className="tab-panel">
          {tab==='Overview'&&<><p>{species.description}</p>
            {species.facts.length>0?<dl className="facts">{species.facts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>:<NoData what="key-fact" short={species.short}/>}
            {otherFacts.length>0&&<p className="fine-print">Unclassified facts are shown as authored.</p>}
          </>}
          {tab==='Evidence'&&<>
            {(geneticRecords.length>0||geneFlow.length>0)?<>
              {geneticRecords.length>0&&<><h4 className="tab-subhead">Genetic evidence records</h4><EvidenceList bootstrap={bootstrap} records={geneticRecords}/></>}
              {geneFlow.length>0&&<><h4 className="tab-subhead">Documented gene flow</h4><ul className="evidence-list">{geneFlow.map(l=>{const other=getExplorerSpeciesList(bootstrap).find(t=>t.id===(String(l.from)===species.id?String(l.to):String(l.from)));return <li key={String(l.id)}><strong>With {other?.short??'another population'}</strong>{l.eventAgeMa!==undefined&&<small>Dated signal ≈ {kaOrMa(l.eventAgeMa)} ago</small>}<p>{l.note??'Genetic evidence shows DNA moved between these populations.'}</p><span className="evidence-list-sources">{l.sourceIds.map(id=>{const s=getExplorerSourceById(bootstrap,String(id));return s?<a key={String(id)} href={s.url} target="_blank" rel="noreferrer">{s.title}<span className="sr-only"> (opens in a new tab)</span><ExternalLink size={11} aria-hidden="true"/></a>:null})}</span></li>})}</ul></>}
            </>:<NoData what="genetic" short={species.short} hint={species.evidence.includes('Genetics')?'The taxon is tagged with genetic evidence, but no itemised record is attached yet.':undefined}/>}
            <EvidenceGraph bootstrap={bootstrap} species={species} onRevealSite={onRevealSite}/>
            <RelationshipHypotheses bootstrap={bootstrap} species={species}/>
            <div className="evidence-panel"><div className="evidence-head"><strong>Source-backed record</strong><span>{linkedSources.length} {linkedSources.length===1?'source':'sources'}</span></div>{linkedSources.map(s=><a className="source-card" key={s.id} href={s.url} target="_blank" rel="noreferrer"><span><b>{s.title}</b><small>{s.note}</small></span><ExternalLink size={14} aria-hidden="true"/><span className="sr-only">(opens in a new tab)</span></a>)}</div>
            <SourceIntelligence bootstrap={bootstrap} species={species}/>
          </>}
          {tab==='Lifestyle'&&<>
            {lifestyleFacts.length>0&&<dl className="facts">{lifestyleFacts.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>}
            {archaeologyRecords.length>0&&<><h4 className="tab-subhead">Archaeological records</h4><EvidenceList bootstrap={bootstrap} records={archaeologyRecords}/></>}
            {lifestyleFacts.length===0&&archaeologyRecords.length===0&&<NoData what="lifestyle or archaeology" short={species.short} hint={species.evidence.includes('Archaeology')?'The taxon is tagged with archaeological evidence; see the Evidence tab for the sources.':undefined}/>}
          </>}
        </div>
        <div className="inspector-actions">
          <Link className="cta primary-cta" href={profileHref}><span><ArrowRight size={14}/> Explore full species profile</span><ChevronRight size={15}/></Link>
          <Link className="inspector-action-secondary" href={`/?species=${species.id}&mode=migration`}><MapPin size={14}/> Map range</Link>
          <Link className="inspector-action-secondary" href={`/?species=${species.id}&mode=tree`}><GitBranch size={14}/> Return to tree</Link>
        </div>
        {coexisting.length>0&&<div className="inspector-context"><div><b>Overlaps in time with</b><span>{coexisting.map(item=>item.short).join(' · ')}</span></div></div>}
      </div>
    </motion.div>
  </aside>
}
