'use client'

import {useState,useMemo} from 'react'
import Link from 'next/link'
import {Check, ChevronRight, GitCompare, Scale, X} from 'lucide-react'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {ExplorerSpecies} from '../features/explorer/types'
import MediaImage from './MediaImage'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import {groupColors} from '../presentation/palette'
import {rangesOverlap} from '../domain/time'

function extractCranialCc(facts:readonly (readonly [string,string])[]):{label:string;minCc:number;maxCc:number;avgCc:number}|null{
  const fact=facts.find(([k])=>/brain|cranial|capacity|endocranial/i.test(k))
  if(!fact) return null
  const str=fact[1]
  const nums=str.match(/\d[\d,\.]*/g)?.map(n=>parseFloat(n.replace(/,/g,''))).filter(n=>n>=250&&n<=2000) ?? []
  if(!nums.length) return {label:str,minCc:400,maxCc:500,avgCc:450}
  const minCc=Math.min(...nums)
  const maxCc=Math.max(...nums)
  return {label:str,minCc,maxCc,avgCc:(minCc+maxCc)/2}
}

function extractFact(facts:readonly (readonly [string,string])[],regex:RegExp,fallback='Not documented in current record'):string{
  const fact=facts.find(([k])=>regex.test(k))
  return fact?fact[1]:fallback
}

export default function CompareMatrix({bootstrap,defaultSpeciesIds=['sapiens','neanderthal','erectus']}:{bootstrap:ExplorerBootstrap;defaultSpeciesIds?:string[]}){
  const speciesList=useMemo(()=>bootstrap.species.filter(s=>s.id!=='common'),[bootstrap])
  const [selectedIds,setSelectedIds]=useState<string[]>(defaultSpeciesIds)

  const selectedSpecies=useMemo(()=>selectedIds.map(id=>speciesList.find(s=>s.id===id)).filter(Boolean) as ExplorerSpecies[],[selectedIds,speciesList])

  const toggleSpecies=(id:string)=>{
    if(selectedIds.includes(id)){
      if(selectedIds.length>1) setSelectedIds(selectedIds.filter(i=>i!==id))
    }else{
      if(selectedIds.length<3) setSelectedIds([...selectedIds,id])
      else setSelectedIds([selectedIds[1],selectedIds[2],id])
    }
  }

  const overlapStatus=useMemo(()=>{
    if(selectedSpecies.length<2) return null
    const a=selectedSpecies[0], b=selectedSpecies[1]
    const direct=rangesOverlap({olderMa:a.start,youngerMa:a.end},{olderMa:b.start,youngerMa:b.end})
    return {direct,a:a.short,b:b.short}
  },[selectedSpecies])

  return <div className="compare-container">
    <div className="compare-header">
      <div className="compare-kicker"><GitCompare size={14}/> COMPARATIVE PALEOANTHROPOLOGY</div>
      <h1>Comparative Anatomy &amp; Chronology Matrix</h1>
      <p>Select up to 3 hominin taxa to compare cranial capacity, tool culture, locomotion, temporal overlap, and physical evidence side-by-side.</p>
    </div>

    {/* Species selector pills */}
    <div className="compare-selector-bar">
      <span className="selector-title">Select taxa to compare (max 3):</span>
      <div className="compare-picker-chips">
        {speciesList.map(s=>{
          const isSelected=selectedIds.includes(s.id)
          const color=groupColors[s.group as keyof typeof groupColors]??'#28a9ff'
          return <button
            key={s.id}
            type="button"
            className={`compare-chip ${isSelected?'active':''}`}
            onClick={()=>toggleSpecies(s.id)}
            style={{borderColor:isSelected?color:undefined}}
          >
            <span className="compare-chip-dot" style={{backgroundColor:color}}/>
            <span className="compare-chip-name">{s.short}</span>
            {isSelected&&<Check size={12} className="compare-chip-check"/>}
          </button>
        })}
      </div>
    </div>

    {/* Comparison Matrix Grid */}
    <div className="compare-grid" style={{gridTemplateColumns:`240px repeat(${selectedSpecies.length}, minmax(0, 1fr))`}}>
      
      {/* Header Row */}
      <div className="compare-cell compare-row-header-cell">
        <strong>Taxon &amp; Portrait</strong>
        <small>Scientific classification &amp; appearance</small>
      </div>
      {selectedSpecies.map(s=>{
        const m=findMedia(s.media,s.defaultMediaId)
        const color=groupColors[s.group as keyof typeof groupColors]??'#28a9ff'
        return <div key={s.id} className="compare-cell compare-card-header" style={{borderTopColor:color}}>
          {selectedSpecies.length>1&&<button type="button" className="compare-remove-btn" onClick={()=>toggleSpecies(s.id)} title="Remove from comparison"><X size={14}/></button>}
          {m&&<div className="compare-avatar"><MediaImage src={resolveMediaSrc(m,'icon',256)} alt={m.alt} loading="lazy" sizes="96px" className="compare-avatar-img"/></div>}
          <h3>{s.name}</h3>
          <span className="compare-tag" style={{color}}>{s.group}</span>
          <div className="compare-date-badge">{s.date}</div>
        </div>
      })}

      {/* Row: Cranial Capacity & Brain Volume */}
      <div className="compare-cell compare-row-header-cell">
        <strong>Cranial Capacity</strong>
        <small>Endocranial volume range (cm³)</small>
      </div>
      {selectedSpecies.map(s=>{
        const brain=extractCranialCc(s.facts)
        const maxScale=1600
        return <div key={s.id} className="compare-cell">
          {brain?(
            <div className="compare-cc-block">
              <strong className="compare-cc-val">{brain.label}</strong>
              <div className="compare-cc-bar-wrap">
                <div className="compare-cc-bar" style={{left:`${(brain.minCc/maxScale)*100}%`,width:`${Math.max(6,((brain.maxCc-brain.minCc)/maxScale)*100)}%`}}/>
              </div>
              <div className="compare-cc-scale"><span>300 cm³</span><span>1000 cm³</span><span>1600 cm³</span></div>
            </div>
          ):(
            <span className="compare-muted">No endocranial measurement recorded</span>
          )}
        </div>
      })}

      {/* Row: Locomotion & Postcranial Anatomy */}
      <div className="compare-cell compare-row-header-cell">
        <strong>Locomotion &amp; Posture</strong>
        <small>Bipedalism &amp; climbing adaptations</small>
      </div>
      {selectedSpecies.map(s=>{
        const loco=extractFact(s.facts,/locomotion|posture|biped|climb/i)
        const anatomy=extractFact(s.facts,/anatomy|stature|height|weight|pelvis/i)
        return <div key={s.id} className="compare-cell">
          <p><strong>Locomotion:</strong> {loco}</p>
          {anatomy!=='Not documented in current record'&&<p><small>{anatomy}</small></p>}
        </div>
      })}

      {/* Row: Tool Culture & Technology */}
      <div className="compare-cell compare-row-header-cell">
        <strong>Tool Culture &amp; Tech</strong>
        <small>Lithic industries (Modes 1–5)</small>
      </div>
      {selectedSpecies.map(s=>{
        const tool=extractFact(s.facts,/tool|lithic|industry|technology|culture/i)
        return <div key={s.id} className="compare-cell">
          <p>{tool}</p>
        </div>
      })}

      {/* Row: Habitat & Key Sites */}
      <div className="compare-cell compare-row-header-cell">
        <strong>Geographic Range &amp; Sites</strong>
        <small>Key archaeological discoveries</small>
      </div>
      {selectedSpecies.map(s=>{
        const sites=extractFact(s.facts,/site|discovery|region|habitat|range/i)
        return <div key={s.id} className="compare-cell">
          <p>{sites}</p>
        </div>
      })}

      {/* Row: Evidence Footprint & Ancient DNA */}
      <div className="compare-cell compare-row-header-cell">
        <strong>Evidence Base</strong>
        <small>Preservation, fossils &amp; genetics</small>
      </div>
      {selectedSpecies.map(s=>{
        const hasDna=s.evidence.includes('Genetics')
        return <div key={s.id} className="compare-cell">
          <div className="compare-evidence-chips">
            {s.evidence.map(e=><span key={e} className={`compare-ev-tag ${e==='Genetics'?'dna':''}`}>{e}</span>)}
          </div>
          <p><small>{hasDna?'Direct ancient genome sequences recovered.':'Morphological and fossil record evidence.'}</small></p>
          <Link href={`/species/${s.id}`} className="compare-dossier-link">
            Open full {s.short} dossier <ChevronRight size={13}/>
          </Link>
        </div>
      })}
    </div>

    {/* Temporal Overlap Callout */}
    {overlapStatus&&(
      <div className="compare-temporal-callout">
        <Scale size={18}/>
        <div>
          <strong>Chronological relationship: {overlapStatus.a} and {overlapStatus.b}</strong>
          <span>{overlapStatus.direct?'Direct chronological overlap documented in fossil records. Contemporaneous populations existed on Earth during overlapping intervals.':'No direct temporal overlap documented in current fossil boundaries.'}</span>
        </div>
      </div>
    )}
  </div>
}
