'use client'

import {useMemo} from 'react'
import Link from 'next/link'
import {Check, ChevronRight, GitCompare, Scale, X} from 'lucide-react'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {ExplorerSpecies} from '../features/explorer/types'
import {COMPARE_LIMIT} from '../features/explorer/state'
import {getExplorerEvidenceForTaxon} from '../features/explorer/selectors'
import MediaImage from './MediaImage'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import {groupColors} from '../presentation/palette'
import {rangesOverlap} from '../domain/time'
import {factsByTopic,firstFact,type FactPair,type FactTopic} from '../domain/facts'

// Endocranial volume scale in cm³. Values outside it are clamped to its ends, so a bar never leaves its track (BUG-50).
export const CC_SCALE={min:300,max:1800} as const
export const CC_TICKS=[300,600,900,1200,1500,1800] as const

/** Position of a volume on the scale, between 0 and 100 percent. */
export function cranialPercent(cc:number):number{
  const span=CC_SCALE.max-CC_SCALE.min
  return Math.min(100,Math.max(0,((cc-CC_SCALE.min)/span)*100))
}

/** Parses a typed `brain` fact. Returns null (never an invented range) when the value holds no usable number. */
export function extractCranialCc(facts:readonly FactPair[]):{label:string;minCc:number;maxCc:number}|null{
  const fact=firstFact(facts,'brain')
  if(!fact) return null
  const nums=fact[1].match(/\d[\d,.]*/g)?.map(n=>parseFloat(n.replace(/,/g,''))).filter(n=>Number.isFinite(n)&&n>=250&&n<=2000)??[]
  return nums.length?{label:fact[1],minCc:Math.min(...nums),maxCc:Math.max(...nums)}:null
}

export type PairOverlap={a:string;b:string;fromMa:number;toMa:number}
/**
 * Every pair of the selected taxa whose recorded date ranges overlap, with the shared interval (older bound first).
 * Overlap is a statement about dating only; it does not say that two taxa met or were related.
 */
export function pairOverlaps(species:readonly {short:string;start:number;end:number}[]):PairOverlap[]{
  const out:PairOverlap[]=[]
  for(let i=0;i<species.length;i++) for(let j=i+1;j<species.length;j++){
    const a=species[i],b=species[j]
    if(!rangesOverlap({olderMa:a.start,youngerMa:a.end},{olderMa:b.start,youngerMa:b.end})) continue
    out.push({a:a.short,b:b.short,fromMa:Math.min(a.start,b.start),toMa:Math.max(a.end,b.end)})
  }
  return out
}

const NOT_DOCUMENTED='Not documented in current record'
const joinFacts=(facts:readonly FactPair[],...topics:FactTopic[]):string=>{const found=factsByTopic(facts,...topics);return found.length?found.map(([,value])=>value).join(' · '):NOT_DOCUMENTED}
const ma=(value:number)=>value>=1?`${Math.round(value*10)/10} Ma`:`${Math.round(value*1000)} ka`

/**
 * The comparison of up to three taxa. Its selection is owned by the explorer (the URL carries it), so this component
 * only shows the selection and reports changes.
 */
export default function CompareMatrix({bootstrap,selectedIds,onChange}:{bootstrap:ExplorerBootstrap;selectedIds:readonly string[];onChange:(ids:string[])=>void}){
  const speciesList=useMemo(()=>bootstrap.species.filter(s=>!s.inferred),[bootstrap])
  const selectedSpecies=useMemo(()=>selectedIds.map(id=>speciesList.find(s=>s.id===id)).filter((s):s is ExplorerSpecies=>Boolean(s)),[selectedIds,speciesList])
  const atLimit=selectedSpecies.length>=COMPARE_LIMIT
  const overlaps=useMemo(()=>pairOverlaps(selectedSpecies),[selectedSpecies])

  const toggleSpecies=(id:string)=>{
    if(selectedIds.includes(id)){
      if(selectedIds.length>1) onChange(selectedIds.filter(i=>i!==id))
      return
    }
    // At the limit nothing is removed on the reader's behalf: the status line says what to do.
    if(atLimit) return
    onChange([...selectedIds,id])
  }

  return <div className="compare-container">
    <div className="compare-header">
      <div className="compare-kicker"><GitCompare size={14}/> COMPARATIVE PALEOANTHROPOLOGY</div>
      <h1>Comparative Anatomy &amp; Chronology Matrix</h1>
      <p>Select up to {COMPARE_LIMIT} hominin taxa to compare cranial capacity, tool culture, locomotion, temporal overlap, and physical evidence side-by-side.</p>
    </div>

    <div className="compare-selector-bar">
      <span className="selector-title">Select taxa to compare (max {COMPARE_LIMIT}):</span>
      <div className="compare-picker-chips">
        {speciesList.map(s=>{
          const isSelected=selectedIds.includes(s.id)
          const blocked=!isSelected&&atLimit
          const color=groupColors[s.group as keyof typeof groupColors]??'#28a9ff'
          return <button
            key={s.id}
            type="button"
            className={`compare-chip ${isSelected?'active':''} ${blocked?'is-limit':''}`}
            aria-pressed={isSelected}
            aria-disabled={blocked||undefined}
            onClick={()=>toggleSpecies(s.id)}
            style={{borderColor:isSelected?color:undefined}}
          >
            <span className="compare-chip-dot" style={{backgroundColor:color}}/>
            <span className="compare-chip-name">{s.short}</span>
            {isSelected&&<Check size={12} className="compare-chip-check"/>}
          </button>
        })}
      </div>
      <p className="compare-limit" role="status">{atLimit?`${COMPARE_LIMIT} taxa are selected. Remove one to add another.`:''}</p>
    </div>

    <div className="compare-scroll" role="region" tabIndex={0} aria-label="Comparison matrix. Scroll sideways to see every selected taxon.">
      <div className="compare-grid" style={{gridTemplateColumns:`240px repeat(${selectedSpecies.length}, minmax(200px, 1fr))`}}>
        <div className="compare-cell compare-row-header-cell">
          <strong>Taxon &amp; Portrait</strong>
          <small>Scientific classification &amp; appearance</small>
        </div>
        {selectedSpecies.map(s=>{
          const m=findMedia(s.media,s.defaultMediaId)
          const color=groupColors[s.group as keyof typeof groupColors]??'#28a9ff'
          return <div key={s.id} className="compare-cell compare-card-header" style={{borderTopColor:color}}>
            {selectedSpecies.length>1&&<button type="button" className="compare-remove-btn" onClick={()=>toggleSpecies(s.id)} aria-label={`Remove ${s.short} from the comparison`} title="Remove from comparison"><X size={14} aria-hidden="true"/></button>}
            {m&&<div className="compare-avatar"><MediaImage src={resolveMediaSrc(m,'icon',256)} alt={m.alt} loading="lazy" sizes="96px" className="compare-avatar-img"/></div>}
            <h3>{s.name}</h3>
            <span className="compare-tag" style={{color}}>{s.group}</span>
            <div className="compare-date-badge">{s.date}</div>
          </div>
        })}

        <div className="compare-cell compare-row-header-cell">
          <strong>Cranial Capacity</strong>
          <small>Endocranial volume range (cm³)</small>
        </div>
        {selectedSpecies.map(s=>{
          const brain=extractCranialCc(s.facts)
          return <div key={s.id} className="compare-cell">
            {brain?(
              <div className="compare-cc-block">
                <strong className="compare-cc-val">{brain.label}</strong>
                <div className="compare-cc-bar-wrap">
                  <div className="compare-cc-bar" style={{left:`${cranialPercent(brain.minCc)}%`,width:`${Math.max(1.5,cranialPercent(brain.maxCc)-cranialPercent(brain.minCc))}%`}}/>
                </div>
                <div className="compare-cc-scale" aria-hidden="true">{CC_TICKS.map(tick=><span key={tick} style={{left:`${cranialPercent(tick)}%`}}>{tick}</span>)}</div>
              </div>
            ):(
              <span className="compare-muted">No endocranial measurement recorded</span>
            )}
          </div>
        })}

        <div className="compare-cell compare-row-header-cell">
          <strong>Locomotion &amp; Posture</strong>
          <small>Bipedalism &amp; climbing adaptations</small>
        </div>
        {selectedSpecies.map(s=>{
          const loco=joinFacts(s.facts,'locomotion')
          const anatomy=joinFacts(s.facts,'anatomy')
          return <div key={s.id} className="compare-cell">
            <p><strong>Locomotion:</strong> {loco}</p>
            {anatomy!==NOT_DOCUMENTED&&<p><small>{anatomy}</small></p>}
          </div>
        })}

        <div className="compare-cell compare-row-header-cell">
          <strong>Tool Culture &amp; Tech</strong>
          <small>Lithic industries (Modes 1–5)</small>
        </div>
        {selectedSpecies.map(s=><div key={s.id} className="compare-cell"><p>{joinFacts(s.facts,'tools')}</p></div>)}

        <div className="compare-cell compare-row-header-cell">
          <strong>Geographic Range &amp; Sites</strong>
          <small>Key archaeological discoveries</small>
        </div>
        {selectedSpecies.map(s=><div key={s.id} className="compare-cell"><p>{joinFacts(s.facts,'geography')}</p></div>)}

        <div className="compare-cell compare-row-header-cell">
          <strong>Evidence Base</strong>
          <small>Preservation, fossils &amp; genetics</small>
        </div>
        {selectedSpecies.map(s=>{
          // Only itemised genetic records that carry a source are named here; nothing is claimed beyond them (BUG-51).
          const genetic=getExplorerEvidenceForTaxon(bootstrap,s.id).filter(record=>record.kind==='genetics'&&record.sourceIds.length>0)
          return <div key={s.id} className="compare-cell">
            <div className="compare-evidence-chips">
              {s.evidence.map(e=><span key={e} className={`compare-ev-tag ${e==='Genetics'?'dna':''}`}>{e}</span>)}
            </div>
            {genetic.length>0
              ?<p><small>Genetic record: {genetic.map(record=>record.title).join(' · ')}</small></p>
              :<p><small className="compare-muted">No itemised genetic record with a source is attached.</small></p>}
            <Link href={`/species/${s.id}`} className="compare-dossier-link">
              Open full {s.short} dossier <ChevronRight size={13}/>
            </Link>
          </div>
        })}
      </div>
    </div>

    {selectedSpecies.length>=2&&(
      <div className="compare-temporal-callout" aria-live="polite">
        <Scale size={18}/>
        <div>
          <strong>Chronological relationship</strong>
          {overlaps.length
            ?<ul>{overlaps.map(o=><li key={`${o.a}-${o.b}`}>{o.a} and {o.b}: recorded date ranges overlap (shared interval {ma(o.fromMa)} to {ma(o.toMa)}).</li>)}</ul>
            :<span>No pair of the selected taxa has overlapping recorded date ranges.</span>}
          <span className="compare-caveat">Overlapping date ranges describe dating only. They do not imply contact, descent or interbreeding.</span>
        </div>
      </div>
    )}
  </div>
}
