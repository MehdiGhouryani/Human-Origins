import {CalendarRange,History,Info} from 'lucide-react'
import type {EvidenceKind} from '../../domain/contracts'
import type {TemporalMode} from '../../domain/time'
import type {ProjectionKind} from '../../presentation/globe/view'
import {Panel} from './AtlasCard'
import {KIND_META,KIND_ORDER,KindGlyph} from './kinds'

type LayersProps={
  kindsOn:ReadonlySet<EvidenceKind>
  onToggleKind:(kind:EvidenceKind)=>void
  routesOn:boolean
  routesAvailable:boolean
  onToggleRoutes:()=>void
  temporalMode:TemporalMode
  onTemporalMode:(mode:TemporalMode)=>void
  windowLabel:string
  excludedCount:number
  projection:ProjectionKind
  onProjection:(kind:ProjectionKind)=>void
  species?:{value:string;options:{id:string;label:string}[];onChange:(id:string)=>void}
  onClose:()=>void
}

export function LayersPanel(props:LayersProps){
  const {kindsOn,routesOn,routesAvailable,temporalMode,windowLabel,excludedCount,projection}=props
  return <Panel title="Layers" onClose={props.onClose}>
    {props.species&&<fieldset className="atlas-field"><legend>Highlight species</legend>
      <select className="atlas-select" value={props.species.value} onChange={event=>props.species?.onChange(event.target.value)} aria-label="Highlight species">{props.species.options.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select>
    </fieldset>}
    <fieldset className="atlas-field"><legend>Evidence</legend>
      {KIND_ORDER.map(kind=><label key={kind} className="atlas-check"><input type="checkbox" checked={kindsOn.has(kind)} onChange={()=>props.onToggleKind(kind)}/><KindGlyph kind={kind}/> <span>{KIND_META[kind].label}</span></label>)}
    </fieldset>
    <fieldset className="atlas-field"><legend>Dispersal corridors</legend>
      <label className="atlas-check"><input type="checkbox" checked={routesOn&&routesAvailable} disabled={!routesAvailable} onChange={props.onToggleRoutes}/> <span>Homo sapiens corridors (schematic)</span></label>
      {!routesAvailable&&<p className="atlas-hint">Select Homo sapiens to see corridors. They describe that species only.</p>}
    </fieldset>
    <fieldset className="atlas-field"><legend>Which sites to show</legend>
      <div className="atlas-seg" role="radiogroup" aria-label="Temporal interpretation mode">
        <button type="button" role="radio" aria-checked={temporalMode==='trail'} onClick={()=>props.onTemporalMode('trail')} className={temporalMode==='trail'?'on':''}><History size={13} aria-hidden="true"/> Cumulative</button>
        <button type="button" role="radio" aria-checked={temporalMode==='window'} onClick={()=>props.onTemporalMode('window')} className={temporalMode==='window'?'on':''}><CalendarRange size={13} aria-hidden="true"/> Around this time</button>
      </div>
      <p className="atlas-hint">{temporalMode==='trail'
        ?'Every documented site from deep time down to this moment. Earlier evidence stays visible, so this is a trail, not a snapshot of where a species lived.'
        :`Sites whose documented dating interval or uncertainty overlaps the window ${windowLabel}. Sites with qualitative or open-ended dating are left out to avoid false precision${excludedCount>0?` (${excludedCount} excluded)`:''}.`}</p>
    </fieldset>
    <fieldset className="atlas-field"><legend>Map</legend>
      <div className="atlas-seg" role="radiogroup" aria-label="Map projection">
        <button type="button" role="radio" aria-checked={projection==='globe'} onClick={()=>props.onProjection('globe')} className={projection==='globe'?'on':''}>Globe</button>
        <button type="button" role="radio" aria-checked={projection==='flat'} onClick={()=>props.onProjection('flat')} className={projection==='flat'?'on':''}>Flat map</button>
      </div>
    </fieldset>
  </Panel>
}

export type SiteListItem={id:string;name:string;ageLabel:string;kind:EvidenceKind;selected:boolean}
export function SitesPanel({items,onPick,onClose}:{items:SiteListItem[];onPick:(id:string)=>void;onClose:()=>void}){
  return <Panel title={`Sites on the map (${items.length})`} onClose={onClose}>
    {items.length===0?<p className="atlas-hint">No sites match the current time and layers.</p>:<ul className="atlas-list">
      {items.map(item=><li key={item.id}><button type="button" onClick={()=>onPick(item.id)} aria-current={item.selected?'true':undefined} className={item.selected?'on':''}><KindGlyph kind={item.kind}/><span className="name">{item.name}</span><span className="age">{item.ageLabel}</span></button></li>)}
    </ul>}
  </Panel>
}

export function AboutPanel({onClose}:{onClose:()=>void}){
  return <Panel title="About this map" onClose={onClose}>
    <div className="atlas-about">
      <p><Info size={13} aria-hidden="true"/> <b>Coastlines are present-day.</b> Sea level and ice cover changed through this period, so past shorelines, land bridges and shelves were different. This map does not reconstruct them.</p>
      <p><b>Corridors are generalized.</b> They show broad regions of movement for Homo sapiens, not one route or a dated journey. How far a corridor is drawn shows progress through the scene.</p>
      <p><b>Evidence markers are documented sites.</b> Shape and colour show the kind of evidence. Regional context entries are placed at an approximate location.</p>
      <p><b>The story timeline is its own scale.</b> Each scene has the same width, so the dispersal can be followed. The global timeline in other views is non-linear.</p>
      <p><b>Controls.</b> Drag to rotate, pinch or Ctrl/⌘ + scroll to zoom, arrow keys to rotate, + and − to zoom, 0 to reset.</p>
      <p className="atlas-hint">Each species sits at its first appearance in the fossil record; branches elsewhere are contextual or possible relationships, not guaranteed direct ancestry. Land data: Natural Earth (public domain).</p>
    </div>
  </Panel>
}
