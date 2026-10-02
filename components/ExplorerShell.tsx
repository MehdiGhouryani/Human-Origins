'use client'

import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {AnimatePresence,MotionConfig} from 'motion/react'
import {ChevronRight,Clock3,Database,Globe2,GitBranch,GitCompare,Pause,Play,Route} from 'lucide-react'
import Link from 'next/link'
import {getExplorerSourceById,getExplorerClaimsForTaxon,getExplorerSpeciesById} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {ExplorerSpecies} from '../features/explorer/types'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import MediaImage from './MediaImage'
import {claimStatusLabel,claimStatusTone} from '../domain/labels'
import {TIME_AXIS_ANCHORS_MA,ageMaToFraction,ageMaToSlider,formatAgeMa,formatAxisAnchor,taxaAtAge} from '../domain/time'
import {getCopy} from '../content/copy-registry'
import {useExplorerController} from '../features/explorer/useExplorerController'
import type {ExplorerState} from '../features/explorer/state'

import EvolutionTree from './EvolutionTree'
import Inspector from './Inspector'
import MigrationGlobe from './MigrationGlobe'
import SpeciesJourney from './SpeciesJourney'

const CANONICAL_MAIN_IDS = new Set(['common', 'sahelanthropus', 'ardipithecus', 'afarensis', 'africanus', 'boisei', 'habilis', 'erectus', 'heidelbergensis', 'neanderthal', 'denisovan', 'sapiens'])

export default function ExplorerShell({bootstrap,initialState}:{bootstrap:ExplorerBootstrap;initialState?:Partial<ExplorerState>}){
  const {bootstrap:immutableBootstrap,state,setState,current,age,results,visibleSearchResults,explorerSpecies,setMode,setSelected}=useExplorerController(bootstrap,initialState)
  const [inspectorOpen,setInspectorOpen]=useState(false)
  const deckRef=useRef<HTMLDivElement>(null)

  const curatedSpecies:ExplorerSpecies[]=useMemo(()=>explorerSpecies.filter((s:ExplorerSpecies)=>CANONICAL_MAIN_IDS.has(s.id)),[explorerSpecies])

  const handleSelectSpecies=useCallback((id:string)=>{
    setSelected(id)
    setInspectorOpen(true)
  },[setSelected])

  useEffect(()=>{
    if(!deckRef.current) return
    const card=deckRef.current.querySelector<HTMLElement>('.species-card.selected')
    if(card){
      card.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'})
    }
  },[state.selectedId])

  const handleDeckKeyDown=useCallback((e:React.KeyboardEvent)=>{
    const currentIndex=explorerSpecies.findIndex(s=>s.id===state.selectedId)
    if(e.key==='ArrowRight'&&currentIndex<explorerSpecies.length-1){
      e.preventDefault()
      handleSelectSpecies(explorerSpecies[currentIndex+1].id)
    }else if(e.key==='ArrowLeft'&&currentIndex>0){
      e.preventDefault()
      handleSelectSpecies(explorerSpecies[currentIndex-1].id)
    }
  },[explorerSpecies,state.selectedId,handleSelectSpecies])

  const coexisting=taxaAtAge(explorerSpecies,age)
  const hrefForResult=(result:typeof results[number])=>{
    if(result.kind==='specimen'){
      const specimen=immutableBootstrap.specimens.find(item=>item.id===result.id)
      return specimen?`/species/${specimen.taxonId}#specimens`:`/species/${state.selectedId}`
    }
    if(result.kind==='site') return `/?species=${encodeURIComponent(state.selectedId)}&mode=migration&site=${encodeURIComponent(result.id)}`
    if(result.kind==='evidence'){
      const item=immutableBootstrap.evidence.find(record=>String(record.id)===result.id)
      return `/?species=${encodeURIComponent(String(item?.taxonId??state.selectedId))}&mode=evidence`
    }
    if(result.kind==='claim'){
      const item=immutableBootstrap.claims.find(record=>String(record.id)===result.id)
      return `/?species=${encodeURIComponent(String(item?.taxonId??state.selectedId))}&mode=evidence`
    }
    if(result.kind==='source'){
      const item=immutableBootstrap.sources.find(record=>String(record.id)===result.id)
      return item?.url??`/?species=${encodeURIComponent(state.selectedId)}&mode=evidence`
    }
    if(result.kind==='publication'){
      const item=immutableBootstrap.publications.find(record=>String(record.id)===result.id)
      return item?.url??`/?species=${encodeURIComponent(state.selectedId)}&mode=evidence`
    }
    if(result.kind==='institution'){
      const item=immutableBootstrap.institutions.find(record=>String(record.id)===result.id)
      return item?.website??`/?species=${encodeURIComponent(state.selectedId)}&mode=evidence`
    }
    return `/?species=${encodeURIComponent(state.selectedId)}&mode=evidence`
  }

  return <MotionConfig reducedMotion="user"><>


    <main className={`workspace ${inspectorOpen?'with-inspector':'full-tree'}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">Viewing {current?.name ?? 'species'} in {state.mode} mode at {formatAgeMa(age)}.</div>
      <section className="tree-panel" aria-label="Human Origins explorer">
        <div className="mode-tabs">
          <button type="button" className={!state.journey&&state.mode==='tree'?'selected':''} aria-pressed={!state.journey&&state.mode==='tree'} onClick={()=>setMode('tree')}><GitBranch size={14}/> Tree</button>
          <button type="button" className={!state.journey&&state.mode==='timeline'?'selected':''} aria-pressed={!state.journey&&state.mode==='timeline'} onClick={()=>setMode('timeline')}><Clock3 size={14}/> Timeline</button>
          <button type="button" className={!state.journey&&state.mode==='migration'?'selected':''} aria-pressed={!state.journey&&state.mode==='migration'} onClick={()=>setMode('migration')}><Globe2 size={14}/> Migration</button>
          <button type="button" className={state.journey?'selected':''} aria-pressed={state.journey} onClick={()=>setState(prev=>({...prev,journey:!prev.journey}))}><Route size={14}/> Journey</button>
          <button type="button" className={!state.journey&&state.mode==='evidence'?'selected':''} aria-pressed={!state.journey&&state.mode==='evidence'} onClick={()=>setMode('evidence')}><Database size={14}/> Evidence</button>
          <Link href="/compare" className="mode-tab-link" title="Open Comparative Anatomy Matrix"><GitCompare size={14}/> Compare</Link>
        </div>

        <div id="species-atlas" ref={deckRef} onKeyDown={handleDeckKeyDown} tabIndex={0} className="species-deck" aria-label="Species atlas (Use left/right arrows to navigate)">
          {curatedSpecies.map(s=>{const thumbMedia=findMedia(s.media,s.treeIconId); if(!thumbMedia) return null; return <button type="button" key={s.id} className={`species-card ${state.selectedId===s.id?'selected':''}`} onClick={()=>handleSelectSpecies(s.id)} title={`Open ${s.name}`} aria-pressed={state.selectedId===s.id}>
            <span className="species-thumb"><MediaImage src={resolveMediaSrc(thumbMedia,'icon',256)} alt={thumbMedia.alt} loading="lazy" sizes="132px" className="species-thumb-image"/></span>
            <span><strong>{s.short}</strong><small>{s.date}</small></span>
          </button>})}
        </div>

        <div className={`tree-shell ${!state.journey&&state.mode==='tree'?'is-tree':'is-panel'}`}>
          {!state.journey&&state.mode==='tree'&&<EvolutionTree bootstrap={immutableBootstrap} selected={state.selectedId} setSelected={handleSelectSpecies} time={state.time}/>} 
          {!state.journey&&state.mode==='timeline'&&<div className="timeline-view"><div className="view-kicker">TEMPORAL LAYER</div><h3>Who was alive at <em>{formatAgeMa(age)}</em>?</h3><p>Each bar spans a taxon’s documented time range on the same deep-time scale as the tree. Highlighted rows were alive at the selected moment.</p><div className="timeline-scale" aria-hidden="true"><span/><div>{TIME_AXIS_ANCHORS_MA.map(anchor=><small key={anchor} style={{left:`${ageMaToFraction(anchor)*100}%`}}>{formatAxisAnchor(anchor)}</small>)}<i style={{left:`${ageMaToFraction(age)*100}%`}}/></div></div><div className="timeline-rows">{curatedSpecies.filter(s=>s.id!=='common').map(s=>{const active=age<=s.start&&age>=s.end;const left=ageMaToFraction(s.start)*100;const right=ageMaToFraction(s.end)*100;return <button type="button" key={s.id} className={active?'active':''} onClick={()=>{handleSelectSpecies(s.id);setMode('tree')}} aria-label={`${s.name}, ${s.date}${active?', alive at the selected time':''}`}><span>{s.short}</span><i><b style={{left:`${left}%`,width:`${Math.max(.8,right-left)}%`}}/><em style={{left:`${ageMaToFraction(age)*100}%`}}/></i></button>})}</div></div>}
          {state.journey&&<SpeciesJourney species={current}/>} 
          {!state.journey&&state.mode==='evidence'&&<div className="evidence-library-view"><div className="view-kicker">CLAIM LEDGER · {current.short}</div><h3>{getCopy(immutableBootstrap.copy,'evidence.heading')}</h3><p>{getCopy(immutableBootstrap.copy,'evidence.intro')}</p><div className="evidence-library-cards">{getExplorerClaimsForTaxon(immutableBootstrap,current.id).map(claim=><article className="evidence-claim-card" key={claim.id}><div className="evidence-claim-top"><span className={`claim-status ${claimStatusTone[claim.status]}`}>{claimStatusLabel[claim.status]}</span><small>{claim.scope}</small></div><strong>{claim.statement}</strong><div className="evidence-claim-sources">{claim.sourceIds.map(id=>{const source=getExplorerSourceById(immutableBootstrap,id); return source?<a key={source.id} href={source.url} target="_blank" rel="noreferrer"><span>{source.title}</span><ChevronRight size={13}/></a>:null})}</div></article>)}</div><div className="evidence-integrity"><b>Evidence rule</b><span>No source → no factual claim. Interpretive synthesis remains labeled, and missing specimen imagery stays missing instead of being replaced by a generic reconstruction.</span></div></div>}
          {!state.journey&&state.mode==='migration'&&<div className="migration-view"><div className="view-kicker">SPATIAL LAYER · {formatAgeMa(age)}</div><h3>{getCopy(immutableBootstrap.copy,'migration.heading')}</h3><p>Rotate the Earth, inspect broad migration corridors, and move through time. The map separates generalized population movement from individual travel and flags uncertainty instead of drawing a false single route.</p><MigrationGlobe bootstrap={immutableBootstrap} time={age} selected={state.selectedId} focusSite={state.focusSite} onFocused={()=>setState(prev=>({...prev,focusSite:null}))}/></div>}
        </div>
        <div className="model-note">Scientific framing: each species sits at its first appearance in the fossil record; branches are contextual or possible relationships, not guaranteed direct ancestry. Migration lines are generalized population corridors.</div>
        <div className="legend"><span><i style={{background:'#e7a64b'}}/> Early hominins</span><span><i style={{background:'#f0b85d'}}/> Australopithecines</span><span><i style={{background:'#a76cf0'}}/> Paranthropus</span><span><i style={{background:'#28a9ff'}}/> Homo</span><span><i style={{background:'#e0875a'}}/> Neanderthals</span><span><i style={{background:'#ec4d8d'}}/> Gene flow</span><span><i style={{background:'#5fd2c1'}}/> Modern humans</span><span className="relationship">━ lineage context</span><span className="relationship dashed">┄ possible / debated</span><span className="relationship">▬ documented time range</span></div>
        <div className="timebar">
          <button type="button" className="play" onClick={()=>setState(prev=>({...prev,playing:!prev.playing}))} aria-label={state.playing?'Pause time':'Play time'}>{state.playing?<Pause size={18}/>:<Play size={18}/>}</button>
          <div className="time-readout"><strong>{formatAgeMa(age)}</strong><small>{coexisting.length?`Coexisting: ${coexisting.map(s=>s.short).join(' · ')}`:'Deep-time control · nonlinear scale'}</small></div>
          <div className="scrubber"><div className="ticks" aria-hidden="true">{TIME_AXIS_ANCHORS_MA.map(anchor=><span key={anchor} style={{left:`${ageMaToSlider(anchor)}%`}}>{formatAxisAnchor(anchor)}</span>)}</div><input aria-label="Time travel" aria-valuetext={formatAgeMa(age)} type="range" min="0" max="100" step="0.1" value={state.time} onChange={e=>setState(prev=>({...prev,time:+e.target.value}))}/></div>
          <button type="button" className="world" onClick={()=>setMode('migration')}><Globe2 size={15}/> View World at This Time</button>
        </div>
      </section>

      <AnimatePresence mode="wait">
        {inspectorOpen&&<Inspector key={current.id} bootstrap={immutableBootstrap} species={current} onClose={()=>setInspectorOpen(false)} onRevealSite={(id)=>setState(prev=>({...prev,focusSite:id,mode:'migration',journey:false}))}/>}
      </AnimatePresence>
    </main>

    <footer id="about" className="evidence-strip"><div><b>◉</b><strong>Fossil Record</strong><small>Physical evidence of our past.</small></div><div><b>〽</b><strong>Genetic Evidence</strong><small>Ancient DNA and population history.</small></div><div><b>◈</b><strong>Archaeology</strong><small>Tools, sites and behavior.</small></div><div><b>▤</b><strong>Geology & Dating</strong><small>Stratigraphy and age estimates.</small></div><em>Evidence · interpretation · provenance<small>Human Origins research interface</small></em></footer>

    {state.query && <div className="search-results" aria-label="Search results">{visibleSearchResults.slice(0,7).map(result=>{const s=getExplorerSpeciesById(immutableBootstrap,result.id);return <button type="button" key={result.id} onClick={()=>setState(prev=>({...prev,selectedId:result.id,query:''}))}><span>{s.short}</span><small>{s.name} · {s.date}</small><ChevronRight size={14}/></button>})}{results.filter(r=>r.kind!=='taxon').slice(0,3).map(result=>{const href=hrefForResult(result);const external=href.startsWith('http:')||href.startsWith('https:');return <a className="search-result-info" href={href} key={`${result.kind}:${result.id}`} {...(external?{target:'_blank',rel:'noreferrer'}:{})}><span>{result.title}</span><small>{result.kind} · {result.subtitle}</small><ChevronRight size={14}/></a>})}</div>}
  </></MotionConfig>
}
