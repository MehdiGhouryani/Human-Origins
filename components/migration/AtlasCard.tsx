import {ExternalLink,Focus,X} from 'lucide-react'
import type {ReactNode} from 'react'
import {KindGlyph} from './kinds'
import type {EvidenceKind} from '../../domain/contracts'

type Common={onClose?:()=>void}

export function SceneCard({index,count,title,subtitle,note,onFocus,following,shelfNote}:{index:number;count:number;title:string;subtitle:string;note:string;onFocus:()=>void;following:boolean;shelfNote:boolean}){
  return <section className="atlas-card" aria-label={`Scene ${index+1} of ${count}`}>
    <div className="atlas-card-top"><span className="atlas-kicker">SCENE {index+1} / {count}</span>
      <button type="button" onClick={onFocus} className="atlas-chip" aria-pressed={following}><Focus size={13} aria-hidden="true"/> {following?'Following':'Focus scene'}</button></div>
    <h2>{title}</h2>
    <p className="atlas-sub">{subtitle}</p>
    <p>{note}</p>
    {shelfNote&&<p className="atlas-legend"><span className="atlas-swatch" aria-hidden="true"/> Pale sea: continental shelf (seabed under 200 m today). Lower sea levels exposed much of it; this is not a past shoreline.</p>}
  </section>
}

export function SiteCard({kind,kindLabel,name,meta,note,dating,sourceTitle,sourceUrl,onClose}:Common&{kind:EvidenceKind;kindLabel:string;name:string;meta:string;note:string;dating:string;sourceTitle?:string;sourceUrl?:string}){
  return <section className="atlas-card" aria-label={`Site details: ${name}`}>
    <div className="atlas-card-top"><span className="atlas-kicker atlas-kind"><KindGlyph kind={kind}/> {kindLabel.toUpperCase()}</span>
      <button type="button" onClick={onClose} className="atlas-icon-btn small" aria-label="Close site details"><X size={15} aria-hidden="true"/></button></div>
    <h2>{name}</h2>
    <p className="atlas-sub">{meta}</p>
    <p>{note}</p>
    <p className="atlas-badge">{dating}</p>
    {sourceUrl&&sourceTitle?<a className="atlas-source" href={sourceUrl} target="_blank" rel="noreferrer"><span>{sourceTitle}</span> <ExternalLink size={11} aria-hidden="true"/></a>:<span className="atlas-source missing">Source registry record unavailable.</span>}
  </section>
}

export function RouteCard({label,color,percent,window,sourceTitle,sourceUrl,onClose}:Common&{label:string;color:string;percent:number;window:string;sourceTitle?:string;sourceUrl?:string}){
  return <section className="atlas-card" aria-label={`Corridor details: ${label}`}>
    <div className="atlas-card-top"><span className="atlas-kicker"><span style={{color}} aria-hidden="true">●</span> SCHEMATIC CORRIDOR · {percent}%</span>
      <button type="button" onClick={onClose} className="atlas-icon-btn small" aria-label="Close corridor details"><X size={15} aria-hidden="true"/></button></div>
    <h2>{label}</h2>
    <p className="atlas-sub">Chapter window {window}</p>
    <p>A generalized band, not a single path. How far it is drawn shows progress through this chapter, not dated positions of a group.</p>
    {sourceUrl&&sourceTitle?<a className="atlas-source" href={sourceUrl} target="_blank" rel="noreferrer"><span>{sourceTitle}</span> <ExternalLink size={11} aria-hidden="true"/></a>:<span className="atlas-source missing">Source registry record unavailable.</span>}
  </section>
}

export function Panel({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}){
  return <div className="atlas-panel" role="dialog" aria-label={title} data-no-drag>
    <div className="atlas-panel-top"><strong>{title}</strong><button type="button" onClick={onClose} className="atlas-icon-btn small" aria-label={`Close ${title}`}><X size={15} aria-hidden="true"/></button></div>
    {children}
  </div>
}
