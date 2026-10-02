'use client'
import {ExternalLink,GitBranch,MapPin,Dna,Landmark,Clock3} from 'lucide-react'
import type {ExplorerSpecies as Species} from '../features/explorer/types'
import {getExplorerEvidenceForTaxon,getExplorerSourceById,getExplorerSiteContextsForSite} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {datingClassLabel} from '../domain/labels'
const icon={fossil:Landmark,archaeology:MapPin,genetics:Dna,dating:Clock3}
export default function EvidenceGraph({bootstrap,species,onRevealSite}:{bootstrap:ExplorerBootstrap;species:Species;onRevealSite?:(siteId:string)=>void}){
 const records=getExplorerEvidenceForTaxon(bootstrap,species.id)
 return <section className="evidence-graph" aria-label={`Evidence graph for ${species.name}`}>
  <div className="graph-head"><div><span>TRACEABLE EVIDENCE</span><h3>Evidence graph</h3></div><b>{records.length} linked record{records.length===1?'':'s'}</b></div>
  <div className="graph-core"><div className="graph-species"><GitBranch size={15}/><strong>{species.short}</strong><small>taxon</small></div><div className="graph-lines"/>
   <div className="graph-records">{records.map(r=>{const I=icon[r.kind];const source=getExplorerSourceById(bootstrap,String(r.sourceIds[0]));const datingClass=getExplorerSiteContextsForSite(bootstrap,r.siteId)[0]?.timeInterval?.datingClass;const footer=<em>{r.status==='documented'?'Documented record':'Interpretive synthesis'} · {r.sourceIds.length} source{r.sourceIds.length===1?'':'s'}{datingClass?` · ${datingClassLabel[datingClass]}`:''}</em>;return <div key={r.id} className="graph-record">{onRevealSite?<button type="button" onClick={()=>onRevealSite(r.siteId)} className="graph-record-main"><div className="record-icon"><I size={13}/></div><div><small>{r.kind} · {r.ageLabel}</small><strong>{r.title}</strong><p>{r.claim}</p>{footer}</div></button>:<div className="graph-record-main"><div className="record-icon"><I size={13}/></div><div><small>{r.kind} · {r.ageLabel}</small><strong>{r.title}</strong><p>{r.claim}</p>{footer}</div></div>}{source?<a href={source.url} target="_blank" rel="noreferrer" aria-label={`Open source for ${r.title}`}><ExternalLink size={13}/></a>:<span className="graph-source-missing" aria-label="Source record unavailable"><ExternalLink size={13}/></span>}</div>})}</div>
  </div>
  <p className="graph-note">The graph distinguishes a documented observation from an interpretive synthesis. The external-link action opens the first linked source; the Source Intelligence panel lists the full source set.</p>
 </section>
}
