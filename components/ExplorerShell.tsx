'use client'

import {useCallback,useEffect,useMemo,useRef,useState,type KeyboardEvent as ReactKeyboardEvent} from 'react'
import dynamic from 'next/dynamic'
import {MotionConfig} from 'motion/react'
import {ChevronRight,Clock3,Globe2,GitBranch,GitCompare,Pause,Play} from 'lucide-react'
import {getExplorerSourceById,getExplorerClaimsForTaxon} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {claimStatusLabel,claimStatusTone} from '../domain/labels'
import {TIME_AXIS_ANCHORS_MA,ageMaToFraction,ageMaToSlider,formatAgeMa,formatAxisAnchor} from '../domain/time'
import {groupTaxaByClade,isInferredNode,orderTaxa,taxaAliveAt} from '../domain/taxon-model'
import {useBookmarks} from '../features/bookmarks/useBookmarks'
import {getCopy} from '../content/copy-registry'
import {useExplorerController} from '../features/explorer/useExplorerController'
import type {ExplorerState} from '../features/explorer/state'

const EvolutionGraph=dynamic(()=>import('./EvolutionGraph'),{loading:()=><div className="atlas-graph-loading" aria-hidden="true"/>})
import TaxonNavigator from './TaxonNavigator'
import TimeMilestones from './TimeMilestones'
import SearchResultsPanel from './SearchResultsPanel'
import FamilyView from './FamilyView'
import RelationshipLegend from './RelationshipLegend'
import RelationshipTable from './RelationshipTable'
import Inspector from './Inspector'
import CompareMatrix from './CompareMatrix'
const MigrationGlobe=dynamic(()=>import('./MigrationGlobe'))
import SpeciesJourney from './SpeciesJourney'

export default function ExplorerShell({bootstrap,initialState}:{bootstrap:ExplorerBootstrap;initialState?:Partial<ExplorerState>}){
  const {bootstrap:immutableBootstrap,state,setState,current,age,explorerSpecies,setMode,setSelected,setCompare}=useExplorerController(bootstrap,initialState)
  // On narrow screens the profile is a bottom sheet; on wide screens it is always shown and this flag is unused.
  const [sheetOpen,setSheetOpen]=useState(false)
  const openerRef=useRef<HTMLElement|null>(null)
  const [pinnedRelationId,setPinnedRelationId]=useState<string|null>(null)
  const validIds=useMemo(()=>new Set(explorerSpecies.map(t=>t.id)),[explorerSpecies])
  const bookmarks=useBookmarks(validIds)
  const savedIds=useMemo(()=>new Set(bookmarks.items.map(i=>i.id)),[bookmarks.items])
  // The taxa drawn on the main graph; the navigator labels the others.
  const graphIds=useMemo(()=>new Set(immutableBootstrap.graph.taxonIds),[immutableBootstrap])
  const timelineSpecies=useMemo(()=>orderTaxa(explorerSpecies.filter(t=>!isInferredNode(t))),[explorerSpecies])
  const clades=useMemo(()=>groupTaxaByClade(explorerSpecies),[explorerSpecies])
  const presentRelations=useMemo(()=>new Set<string>(immutableBootstrap.relationships.map(r=>r.relation)),[immutableBootstrap])

  // Choosing a species opens the profile; the profile moves focus to its heading on narrow screens. Closing it returns
  // focus to the element that opened it, so keyboard users are not left at the top of the page.
  const handleSelectSpecies=useCallback((id:string)=>{
    if(!sheetOpen && document.activeElement instanceof HTMLElement) openerRef.current=document.activeElement
    setSelected(id)
    setSheetOpen(true)
  },[setSelected,sheetOpen])
  // A taxon found by search is selected in place: the reader stays on this page and the query is cleared.
  const selectFromSearch=useCallback((id:string)=>{handleSelectSpecies(id);setState(previous=>({...previous,query:''}))},[handleSelectSpecies,setState])
  const closeSheet=useCallback(()=>{setSheetOpen(false);openerRef.current?.focus()},[])
  useEffect(()=>{
    if(!sheetOpen) return
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'&&window.matchMedia('(max-width: 1023px)').matches) closeSheet()}
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[sheetOpen,closeSheet])

  const jumpToAge=useCallback((ageMa:number)=>setState(prev=>({...prev,time:ageMaToSlider(ageMa),playing:false})),[setState])
  const coexisting=taxaAliveAt(explorerSpecies,age)
  // Explorer views as tabs. Journey and Evidence live in the header; Compare is a view of the explorer (phase 5).
  const modeTabs=[
    {id:'tree',label:'Tree',icon:GitBranch,selected:!state.journey&&state.mode==='tree',select:()=>setMode('tree')},
    {id:'timeline',label:'Timeline',icon:Clock3,selected:!state.journey&&state.mode==='timeline',select:()=>setMode('timeline')},
    {id:'migration',label:'Migration',icon:Globe2,selected:!state.journey&&state.mode==='migration',select:()=>setMode('migration')},
    {id:'compare',label:'Compare',icon:GitCompare,selected:!state.journey&&state.mode==='compare',select:()=>setMode('compare')},
  ]
  const anyTabSelected=modeTabs.some(tab=>tab.selected)
  const tabRefs=useRef<(HTMLButtonElement|null)[]>([])
  // Roving focus: arrows move focus between tabs, Home and End jump to the ends. Enter or Space selects (manual activation).
  const onTabKey=(event:ReactKeyboardEvent<HTMLButtonElement>,index:number)=>{
    const count=modeTabs.length
    let target:number|undefined
    if(event.key==='ArrowRight') target=(index+1)%count
    else if(event.key==='ArrowLeft') target=(index-1+count)%count
    else if(event.key==='Home') target=0
    else if(event.key==='End') target=count-1
    if(target===undefined) return
    event.preventDefault()
    tabRefs.current[target]?.focus()
  }
  // Factories keep arrow functions out of the JSX attributes; the UI contract audit reads button tags with a simple pattern.
  const registerTab=(index:number)=>(element:HTMLButtonElement|null)=>{tabRefs.current[index]=element}
  const tabKey=(index:number)=>(event:ReactKeyboardEvent<HTMLButtonElement>)=>onTabKey(event,index)

  return <MotionConfig reducedMotion="user"><>


    {!state.journey&&state.mode==='compare'?<div id="explorer-stage" className="compare-stage"><CompareMatrix bootstrap={immutableBootstrap} selectedIds={state.compare} onChange={setCompare}/></div>:<main className={`workspace with-inspector${sheetOpen?' sheet-open':''}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">Viewing {current?.name ?? 'species'} in {state.mode} mode at {formatAgeMa(age)}.</div>
      <section className="tree-panel" aria-label="Human Origins explorer">
        {state.query&&<SearchResultsPanel bootstrap={immutableBootstrap} query={state.query} onClear={()=>setState(previous=>({...previous,query:''}))} onSelectTaxon={selectFromSearch}/>}
        <div className="mode-tabs" role="tablist" aria-label="Explorer views">
          {modeTabs.map((tab,index)=><button key={tab.id} ref={registerTab(index)} type="button" role="tab" id={`mode-tab-${tab.id}`} aria-selected={tab.selected} aria-controls="explorer-stage" tabIndex={tab.selected||(!anyTabSelected&&index===0)?0:-1} className={tab.selected?'selected':''} onClick={tab.select} onKeyDown={tabKey(index)}><tab.icon size={14}/> {tab.label}</button>)}
        </div>

        <TaxonNavigator species={explorerSpecies} selectedId={state.selectedId} onSelect={handleSelectSpecies} savedIds={savedIds} graphIds={graphIds}/>

        <div id="explorer-stage" className={`tree-shell ${!state.journey&&state.mode==='tree'?'is-tree':'is-panel'}`}>
          {!state.journey&&state.mode==='tree'&&<><div className="graph-region"><EvolutionGraph bootstrap={immutableBootstrap} selected={state.selectedId} setSelected={handleSelectSpecies} time={state.time} pinnedRelationId={pinnedRelationId} onPinRelation={setPinnedRelationId}/></div><FamilyView bootstrap={immutableBootstrap} taxonId={state.selectedId} onSelect={handleSelectSpecies}/></>}
          {!state.journey&&state.mode==='timeline'&&<div className="timeline-view"><div className="view-kicker">TEMPORAL LAYER</div><h3>Who was alive at <em>{formatAgeMa(age)}</em>?</h3><p>Each bar spans a taxon’s documented time range on the same deep-time scale as the tree. Highlighted rows were alive at the selected moment.</p><div className="timeline-scale" aria-hidden="true"><span/><div>{TIME_AXIS_ANCHORS_MA.map(anchor=><small key={anchor} style={{left:`${ageMaToFraction(anchor)*100}%`}}>{formatAxisAnchor(anchor)}</small>)}<i style={{left:`${ageMaToFraction(age)*100}%`}}/></div></div><div className="timeline-rows">{timelineSpecies.map(s=>{const active=age<=s.start&&age>=s.end;const left=ageMaToFraction(s.start)*100;const right=ageMaToFraction(s.end)*100;return <button type="button" key={s.id} className={active?'active':''} onClick={()=>handleSelectSpecies(s.id)} aria-label={`${s.name}, ${s.date}${active?', alive at the selected time':''}`}><span>{s.short}</span><i><b style={{left:`${left}%`,width:`${Math.max(.8,right-left)}%`}}/><em style={{left:`${ageMaToFraction(age)*100}%`}}/></i></button>})}</div></div>}
          {state.journey&&<SpeciesJourney species={current}/>} 
          {!state.journey&&state.mode==='evidence'&&<div className="evidence-library-view"><div className="view-kicker">CLAIM LEDGER · {current.short}</div><h3>{getCopy(immutableBootstrap.copy,'evidence.heading')}</h3><p>{getCopy(immutableBootstrap.copy,'evidence.intro')}</p><div className="evidence-library-cards">{getExplorerClaimsForTaxon(immutableBootstrap,current.id).map(claim=><article className="evidence-claim-card" key={claim.id}><div className="evidence-claim-top"><span className={`claim-status ${claimStatusTone[claim.status]}`}>{claimStatusLabel[claim.status]}</span><small>{claim.scope}</small></div><strong>{claim.statement}</strong><div className="evidence-claim-sources">{claim.sourceIds.map(id=>{const source=getExplorerSourceById(immutableBootstrap,id); return source?<a key={source.id} href={source.url} target="_blank" rel="noreferrer"><span>{source.title}</span><ChevronRight size={13}/></a>:null})}</div></article>)}</div><div className="evidence-integrity"><b>Evidence rule</b><span>No source → no factual claim. Interpretive synthesis remains labeled, and missing specimen imagery stays missing instead of being replaced by a generic reconstruction.</span></div></div>}
          {!state.journey&&state.mode==='migration'&&<div className="migration-view"><div className="view-kicker">SPATIAL LAYER · {formatAgeMa(age)}</div><h3>{getCopy(immutableBootstrap.copy,'migration.heading')}</h3><p>Rotate the Earth, inspect broad migration corridors, and move through time. The map separates generalized population movement from individual travel and flags uncertainty instead of drawing a false single route.</p><MigrationGlobe bootstrap={immutableBootstrap} time={age} selected={state.selectedId} focusSite={state.focusSite} onFocused={()=>setState(prev=>({...prev,focusSite:null}))}/></div>}
        </div>
        <div className="model-note">Scientific framing: each species sits at its first appearance in the fossil record; branches are contextual or possible relationships, not guaranteed direct ancestry. Migration lines are generalized population corridors.</div>
        <RelationshipLegend present={presentRelations} clades={clades}/>
        {!state.journey&&state.mode==='tree'&&<details className="rel-details"><summary>Relationship table: text version of the graph</summary><RelationshipTable bootstrap={immutableBootstrap} onShow={id=>{setPinnedRelationId(id);document.querySelector('.graph-region')?.scrollIntoView({block:'nearest'})}}/></details>}
        <div className="timebar">
          <button type="button" className="play" onClick={()=>setState(prev=>({...prev,playing:!prev.playing}))} aria-label={state.playing?'Pause time':'Play time'}>{state.playing?<Pause size={18}/>:<Play size={18}/>}</button>
          <div className="time-readout"><strong>{formatAgeMa(age)}</strong><small>{coexisting.length?`Coexisting: ${coexisting.map(s=>s.short).join(' · ')}`:'Deep-time control · nonlinear scale'}</small></div>
          <div className="scrubber"><div className="ticks" aria-hidden="true">{TIME_AXIS_ANCHORS_MA.map(anchor=><span key={anchor} style={{left:`${ageMaToSlider(anchor)}%`}}>{formatAxisAnchor(anchor)}</span>)}</div><input aria-label="Time travel" aria-valuetext={formatAgeMa(age)} type="range" min="0" max="100" step="0.1" value={state.time} onChange={e=>setState(prev=>({...prev,time:+e.target.value}))}/></div>
          <button type="button" className="world" onClick={()=>setMode('migration')}><Globe2 size={15}/> View World at This Time</button>
        </div>
        <TimeMilestones species={explorerSpecies} selected={current} onJump={jumpToAge}/>
      </section>

      <Inspector bootstrap={immutableBootstrap} species={current} bookmarked={bookmarks.has(current.id)} onToggleBookmark={()=>bookmarks.toggle(current.id)} open={sheetOpen} onClose={closeSheet} onRevealSite={(id)=>setState(prev=>({...prev,focusSite:id,mode:'migration',journey:false}))}/>
    </main>}

    <footer id="about" className="evidence-strip"><div><b>◉</b><strong>Fossil Record</strong><small>Physical evidence of our past.</small></div><div><b>〽</b><strong>Genetic Evidence</strong><small>Ancient DNA and population history.</small></div><div><b>◈</b><strong>Archaeology</strong><small>Tools, sites and behavior.</small></div><div><b>▤</b><strong>Geology & Dating</strong><small>Stratigraphy and age estimates.</small></div><em>Evidence · interpretation · provenance<small>Human Origins research interface</small></em></footer>

  </></MotionConfig>
}
