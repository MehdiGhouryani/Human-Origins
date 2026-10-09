'use client'
import {ExternalLink,MapPin,CalendarDays,Database,Box,Building2,FileText,MapPinned} from 'lucide-react'
import {useMemo,useState} from 'react'
import type {ExplorerSpecies as Species} from '../features/explorer/types'
import {getExplorerSpecimensForTaxon} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'

type Props={bootstrap:ExplorerBootstrap;species:Species;onRevealSite?:(siteId:string)=>void}

export default function SpecimenGallery({bootstrap,species,onRevealSite}:Props){
 const records=useMemo(()=>getExplorerSpecimensForTaxon(bootstrap,species.id),[bootstrap,species.id])
 const [selected,setSelected]=useState(records[0]?.id ?? '')
 const active=records.find(r=>r.id===selected) ?? records[0]
 if(!records.length) return <div className="specimen-empty"><Database size={16}/><strong>No specimen-level records linked yet.</strong><p>The species record is intentionally kept separate from unverified specimen claims. Add a source-backed specimen when an institutional record is available.</p></div>
 return <section className="specimen-gallery" aria-label={`Specimen records for ${species.name}`}>
   <div className="specimen-head"><div><span>SPECIMEN-LEVEL RECORDS</span><h3>Fossils & source records</h3></div><b>{records.length} records</b></div>
   <div className="specimen-feature">
    <div className="specimen-image specimen-archive-panel">
      <div className="archive-grid"/>
      <div className="archive-icon"><Box size={27}/></div>
      <strong>{active.viewerUrl?'3D scan available':'Institutional viewer not linked'}</strong>
      <span>{active.viewerUrl?'Open the original institutional viewer rather than a repackaged copy.':'This record remains text-only until a source-backed visual or viewer is available.'}</span>
      {active.objectIdentifier&&<small>OBJECT · {active.objectIdentifier}</small>}
      <div className="archive-actions">
        {active.viewerUrl&&<a className="viewer-btn" href={active.viewerUrl} target="_blank" rel="noreferrer"><Box size={13}/>{active.viewerLabel||'Open 3D viewer'}<ExternalLink size={11}/></a>}
        {active.sourceUrl?<a className="record-btn" href={active.sourceUrl} target="_blank" rel="noreferrer"><FileText size={13}/> Institutional record <ExternalLink size={11}/></a>:<span className="site-source-missing">Institutional record unavailable.</span>}
      </div>
    </div>
    <div className="specimen-detail">
      <span className="specimen-kind">{active.evidence}</span>
      <h4>{active.name}</h4>
      <p className="specimen-site"><MapPin size={12}/>{active.siteLabel} · {active.country}</p>
      <p>{active.significance}</p>
      <div className="specimen-meta">
        <span><CalendarDays size={12}/>{active.ageLabel}</span>
        {active.discoveryYear&&<span><Database size={12}/>Discovered {active.discoveryYear}</span>}
        {active.originalInstitution&&<span><Building2 size={12}/>{active.originalInstitution}</span>}
        {active.recordId&&<span><FileText size={12}/>3D record {active.recordId}</span>}
      </div>
      {active.metadataUsage&&<div className="metadata-badge">Metadata · {active.metadataUsage}</div>}
      <div className="specimen-source-row">
        {active.sourceUrl?<a href={active.sourceUrl} target="_blank" rel="noreferrer">Open institutional record <ExternalLink size={12}/></a>:<span className="site-source-missing">Source registry record unavailable.</span>}
        {onRevealSite&&active.siteId&&<button type="button" onClick={()=>onRevealSite(String(active.siteId))}><MapPinned size={12}/> Show site context</button>}
      </div>
    </div>
   </div>
   <div className="specimen-list">{records.map(r=><button type="button" key={r.id} aria-pressed={r.id===active.id} className={r.id===active.id?'active':''} onClick={()=>setSelected(r.id)}><span>{r.name}</span><small>{r.siteLabel} · {r.ageLabel}</small><i>{r.viewerUrl?'3D':'record'}</i></button>)}</div>
   <p className="specimen-note">3D links open the source institution’s viewer. The app does not download, mirror or relicense third-party fossil meshes. Smithsonian notes that its hominin 3D models are scanned casts or replicas and may have reuse restrictions even when metadata is open.</p>
 </section>
}
