'use client'
import {useMemo,useState} from 'react'
import {BookOpen,ExternalLink,FileText,Landmark,Link2,ShieldCheck,GitBranch,Database,ChevronDown,AlertTriangle,GitCompare,Waypoints} from 'lucide-react'
import type {ExplorerSpecies} from '../features/explorer/types'
import {getExplorerClaimEvidence,getExplorerClaimSources,getExplorerSourceById,getExplorerSourcesForTaxon,getExplorerSpecimensForTaxon,getExplorerClaimsForTaxon,getExplorerInstitutionById,getExplorerPublicationForSource,getExplorerInterpretationPositionsForSet,getExplorerInterpretationSetsForClaim,getExplorerProvenanceChainForClaim} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {claimStatusLabel,claimStatusTone,sourceTypeLabel,uncertaintyDimensionLabel,uncertaintyStateLabel,interpretationKindLabel} from '../domain/labels'
import type {ProvenanceClaim,SourceRecord,SourceType} from '../domain/contracts'

const sourceIcon=(type:SourceType)=>type==='primary-study'||type==='peer-reviewed-paper'?<FileText size={14}/>:type==='museum-3d'?<Landmark size={14}/>:<BookOpen size={14}/>

function SourceCard({source,bootstrap}:{source:SourceRecord;bootstrap:ExplorerBootstrap}){
  const institution=source.institutionId?getExplorerInstitutionById(bootstrap,String(source.institutionId)):undefined
  const publication=getExplorerPublicationForSource(bootstrap,source)
  return <article className="source-intel-card">
    <div className="source-intel-icon">{sourceIcon(source.type)}</div>
    <div className="source-intel-main">
      <div className="source-meta"><span>{sourceTypeLabel[source.type]}</span>{publication?.year&&<em>{publication.year}</em>}{publication?.doi&&<em>DOI</em>}</div>
      <h4>{source.title}</h4>
      <p><b>{source.publisher}</b>{publication?.authors?.length?` · ${publication.authors.join(', ')}`:''}</p>
      {(source.publicationId||source.institutionId)&&<div className="source-normalized">{source.publicationId&&<span>Publication linked</span>}{source.institutionId&&<span>{'Institution linked'}</span>}</div>}
      {publication?.journal&&<small className="source-journal">{publication.journal}</small>}
      <small>{source.note}</small>
      <div className="source-scope"><span>{source.role}</span><span>{source.scope}</span>{institution&&<span>{institution.name}</span>}</div>
      {publication?.doi&&<div className="source-doi">DOI · {publication.doi}</div>}
    </div>
    <a href={source.url} target="_blank" rel="noreferrer" className="source-open"><ExternalLink size={13}/><span>Open</span></a>
  </article>
}

function ClaimChain({bootstrap,claim,open}:{bootstrap:ExplorerBootstrap;claim:ProvenanceClaim; open:boolean}){
  const evidence=getExplorerClaimEvidence(bootstrap,claim)
  const sources=getExplorerClaimSources(bootstrap,claim)
  const interpretationSets=getExplorerInterpretationSetsForClaim(bootstrap,String(claim.id))
  const provenance=getExplorerProvenanceChainForClaim(bootstrap,String(claim.id))
  return <details className="provenance-claim" open={open}>
    <summary>
      <span className={`claim-status ${claimStatusTone[claim.status]}`}>{claimStatusLabel[claim.status]}</span>
      <span className="claim-summary">{claim.statement}</span>
      <ChevronDown size={13}/>
    </summary>
    <div className="claim-chain">
      <div className="claim-chain-node"><span className="chain-icon"><GitBranch size={12}/></span><div><b>Claim</b><small>{claim.scope}</small></div></div>
      <div className="chain-connector"/>
      <div className="claim-chain-node"><span className="chain-icon"><Database size={12}/></span><div><b>Evidence</b><small>{evidence.length?evidence.map(item=>item!.title).join(' · '):'No specimen/evidence record linked; interpretation only'}</small></div></div>
      <div className="chain-connector"/>
      <div className="claim-chain-node"><span className="chain-icon"><Link2 size={12}/></span><div><b>Source</b><small>{sources.map(source=>source.publisher).join(' · ')||'Source not registered'}</small></div></div>
    </div>
    <div className="claim-detail-row"><span>{claim.statusNote}</span><span>{sources.length} source{sources.length===1?'':'s'} · {evidence.length} evidence record{evidence.length===1?'':'s'}</span></div>
    {claim.uncertaintyProfile.length>0&&<div className="claim-uncertainty"><div className="claim-subhead"><span><AlertTriangle size={11}/> UNCERTAINTY PROFILE</span><small>Qualitative · no confidence score</small></div><div className="uncertainty-list">{claim.uncertaintyProfile.map(item=><div className="uncertainty-item" key={item.dimension}><span className={`uncertainty-state ${item.state}`}>{uncertaintyStateLabel[item.state]}</span><div><b>{uncertaintyDimensionLabel[item.dimension]}</b><p>{item.note}</p></div></div>)}</div></div>}
    {provenance&&(provenance.specimenIds.length>0||provenance.siteIds.length>0)&&<div className="claim-subhead"><span><Waypoints size={11}/> FULL PROVENANCE TRAIL</span><small>{provenance.specimenIds.length} specimen{provenance.specimenIds.length===1?'':'s'} · {provenance.siteIds.length} site{provenance.siteIds.length===1?'':'s'}{provenance.reachedSource?'':' · no source reachable'}</small></div>}
    {interpretationSets.length>0&&<div className="interpretation-block"><div className="claim-subhead"><span><GitCompare size={11}/> OPEN INTERPRETATIONS</span><small>{interpretationSets.length} set{interpretationSets.length===1?'':'s'}</small></div>{interpretationSets.map(set=><div className="interpretation-set" key={set.id}><div className="interpretation-question"><strong>{set.question}</strong><small>{set.status==='multiple-positions'?'Multiple documented positions':'Open question'}</small></div><div className="interpretation-positions">{getExplorerInterpretationPositionsForSet(bootstrap,String(set.id)).map(position=><article className="interpretation-position" key={position.id}><span>{interpretationKindLabel[position.kind]}</span><h5>{position.label}</h5><p>{position.summary}</p></article>)}</div></div>)}</div>}
    <div className="claim-sources">{sources.map(source=><div className="claim-source-line" key={source.id}><span className={`claim-source-kind ${claimStatusTone[claim.status]}`}>{sourceTypeLabel[source.type]}</span><strong>{source.title}</strong>{getExplorerPublicationForSource(bootstrap,source)?.doi&&<code>{getExplorerPublicationForSource(bootstrap,source)?.doi}</code>}<a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title}`}><ExternalLink size={11}/></a></div>)}</div>
  </details>
}

export default function SourceIntelligence({bootstrap,species}:{bootstrap:ExplorerBootstrap;species:ExplorerSpecies}){
  const [filter,setFilter]=useState<'all'|SourceType>('all')
  const [showAllClaims,setShowAllClaims]=useState(false)
  const claims=getExplorerClaimsForTaxon(bootstrap,species.id)
  const records=useMemo(()=>{
    const fromClaims=claims.flatMap(claim=>claim.sourceIds).map(id=>getExplorerSourceById(bootstrap,String(id))).filter((source):source is SourceRecord=>Boolean(source))
    const fromSpecies=getExplorerSourcesForTaxon(bootstrap,species.id)
    const specimenSources=getExplorerSpecimensForTaxon(bootstrap,species.id).flatMap(record=>record.sourceIds).map(id=>getExplorerSourceById(bootstrap,String(id))).filter((source):source is SourceRecord=>Boolean(source))
    const merged=[...fromClaims,...fromSpecies,...specimenSources]
    const byId=new Map<string,SourceRecord>()
    merged.forEach(record=>byId.set(record.id,record))
    return Array.from(byId.values())
  },[claims,species.id,bootstrap])
  const filtered=filter==='all'?records:records.filter(r=>r.type===filter)
  const peer=records.filter(r=>r.type==='primary-study'||r.type==='peer-reviewed-paper').length
  const institutional=records.filter(r=>r.type!=='primary-study'&&r.type!=='peer-reviewed-paper').length
  const visibleClaims=showAllClaims?claims:claims.slice(0,3)
  const evidenceCount=new Set(claims.flatMap(c=>c.evidenceIds)).size

  return <section className="source-intelligence" aria-label={`Source intelligence for ${species.name}`}>
    <div className="source-intel-head"><div><span>SOURCE INTELLIGENCE 2.0</span><h3>Trace the claim.</h3></div><b>{claims.length} claims · {records.length} linked sources</b></div>
    <p className="source-intel-intro">Every highlighted statement can point through a claim → evidence → source chain. Publication metadata is shown only when it is registered, and interpretation is labeled separately from a documented record.</p>

    {claims.length>0&&<div className="claim-ledger">
      <div className="claim-ledger-head"><div><span>CLAIM LEDGER</span><h4>Why this statement?</h4></div><span className="claim-ledger-count"><ShieldCheck size={12}/> {evidenceCount} linked evidence records</span></div>
      <div className="claim-list">{visibleClaims.map((claim,index)=><ClaimChain key={claim.id} bootstrap={bootstrap} claim={claim} open={index===0}/>)}</div>
      {claims.length>3&&<button type="button" className="claims-toggle" onClick={()=>setShowAllClaims(v=>!v)}>{showAllClaims?'Show fewer claims':`Show all ${claims.length} claims`}</button>}
    </div>}

    <div className="source-intel-head source-registry-head"><div><span>SOURCE REGISTRY</span><h4>Publication & institution trail</h4></div><b>{records.length} records</b></div>
    <div className="source-filter-row"><button type="button" aria-pressed={filter==='all'} className={filter==='all'?'on':''} onClick={()=>setFilter('all')}>All</button>{(['primary-study','peer-reviewed-paper','institutional-record','institutional-synthesis','museum-3d','educational-synthesis'] as SourceType[]).map(type=><button type="button" key={type} aria-pressed={filter===type} className={filter===type?'on':''} onClick={()=>setFilter(type)}>{sourceTypeLabel[type]}</button>)}</div>
    <div className="source-stats"><span><strong>{peer}</strong> primary / peer-reviewed</span><span><strong>{institutional}</strong> institutional / synthesis</span><span><ShieldCheck size={12}/> registered provenance</span></div>
    <div className="source-intel-list">{filtered.map(source=><SourceCard key={source.id} source={source} bootstrap={bootstrap}/>)}</div>
    <div className="citation-note"><Link2 size={13}/><span><b>How to read this:</b> a source record documents or contextualizes a claim; it does not automatically make every interpretation on the page a settled fact. Dating values retain uncertainty, and relationship models can remain debated.</span></div>
  </section>
}
