'use client'

import {useCallback,useMemo,useState} from 'react'
import dynamic from 'next/dynamic'
import {AnimatePresence,MotionConfig} from 'motion/react'
import {ChevronRight,Clock3,Database,Globe2,GitBranch,GitCompare,Pause,Play,Route} from 'lucide-react'
import Link from 'next/link'
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
import {groupColors} from '../presentation/palette'
const Inspector=dynamic(()=>import('./Inspector'))
const MigrationGlobe=dynamic(()=>import('./MigrationGlobe'))
import SpeciesJourney from './SpeciesJourney'

export default function ExplorerShell({bootstrap,initialState}:{bootstrap:ExplorerBootstrap;initialState?:Partial<ExplorerState>}){
  const {bootstrap:immutableBootstrap,state,setState,current,age,explorerSpecies,setMode,setSelected}=useExplorerController(bootstrap,initialState)
  const [inspectorOpen,setInspectorOpen]=useState(false)
  const [pinnedRelationId,setPinnedRelationId]=useState<string|null>(null)
  const validIds=useMemo(()=>new Set(explorerSpecies.map(t=>t.id)),[explorerSpecies])
  const bookmarks=useBookmarks(validIds)
  const savedIds=useMemo(()=>new Set(bookmarks.items.map(i=>i.id)),[bookmarks.items])
  const timelineSpecies=useMemo(()=>orderTaxa(explorerSpecies.filter(t=>!isInferredNode(t))),[explorerSpecies])
  const clades=useMemo(()=>groupTaxaByClade(explorerSpecies),[explorerSpecies])
  const presentRelations=useMemo(()=>new Set<string>(immutableBootstrap.relationships.map(r=>r.relation)),[immutableBootstrap])

  const handleSelectSpecies=useCallback((id:string)=>{
    setSelected(id)
    setInspectorOpen(true)
  },[setSelected])

  const jumpToAge=useCallback((ageMa:number)=>setState(prev=>({...prev,time:ageMaToSlider(ageMa),playing:false})),[setState])
  const coexisting=taxaAliveAt(explorerSpecies,age)

  return <MotionConfig reducedMotion="user"><>


    <main className={`workspace ${inspectorOpen?'with-inspector':'full-tree'}`}>
      <div className="sr-only" aria-live="polite" aria-atomic="true">Viewing {current?.name ?? 'species'} in {state.mode} mode at {formatAgeMa(age)}.</div>
      <section className="tree-panel" aria-label="Human Origins explorer">
        {state.query&&<SearchResultsPanel bootstrap={immutableBootstrap} query={state.query} onClear={()=>setState(previous=>({...previous,query:''}))}/>}
        <div className="mode-tabs">
          <button type="button" className={!state.journey&&state.mode==='tree'?'selected':''} aria-pressed={!state.journey&&state.mode==='tree'} onClick={()=>setMode('tree')}><GitBranch size={14}/> Tree</button>
          <button type="button" className={!state.journey&&state.mode==='timeline'?'selected':''} aria-pressed={!state.journey&&state.mode==='timeline'} onClick={()=>setMode('timeline')}><Clock3 size={14}/> Timeline</button>
          <button type="button" className={!state.journey&&state.mode==='migration'?'selected':''} aria-pressed={!state.journey&&state.mode==='migration'} onClick={()=>setMode('migration')}><Globe2 size={14}/> Migration</button>
          <button type="button" className={state.journey?'selected':''} aria-pressed={state.journey} onClick={()=>setState(prev=>({...prev,journey:!prev.journey}))}><Route size={14}/> Journey</button>
          <button type="button" className={!state.journey&&state.mode==='evidence'?'selected':''} aria-pressed={!state.journey&&state.mode==='evidence'} onClick={()=>setMode('evidence')}><Database size={14}/> Evidence</button>
          <Link href="/compare" className="mode-tab-link" title="Open Comparative Anatomy Matrix"><GitCompare size={14}/> Compare</Link>
        </div>

        <TaxonNavigator species={explorerSpecies} selectedId={state.selectedId} onSelect={handleSelectSpecies} savedIds={savedIds}/>

        <div className={`tree-shell ${!state.journey&&state.mode==='tree'?'is-tree':'is-panel'}`}>
          {!state.journey&&state.mode==='tree'&&<><div className="graph-region"><EvolutionGraph bootstrap={immutableBootstrap} selected={state.selectedId} setSelected={handleSelectSpecies} time={state.time} pinnedRelationId={pinnedRelationId} onPinRelation={setPinnedRelationId}/></div><FamilyView bootstrap={immutableBootstrap} taxonId={state.selectedId} onSelect={handleSelectSpecies}/></>}
          {!state.journey&&state.mode==='timeline'&&<div className="timeline-view"><div className="view-kicker">TEMPORAL LAYER</div><h3>Who was alive at <em>{formatAgeMa(age)}</em>?</h3><p>Each bar spans a taxon’s documented time range on the same deep-time scale as the tree. Highlighted rows were alive at the selected moment.</p><div className="timeline-scale" aria-hidden="true"><span/><div>{TIME_AXIS_ANCHORS_MA.map(anchor=><small key={anchor} style={{left:`${ageMaToFraction(anchor)*100}%`}}>{formatAxisAnchor(anchor)}</small>)}<i style={{left:`${ageMaToFraction(age)*100}%`}}/></div></div><div className="timeline-rows">{timelineSpecies.map(s=>{const active=age<=s.start&&age>=s.end;const left=ageMaToFraction(s.start)*100;const right=ageMaToFraction(s.end)*100;return <button type="button" key={s.id} className={active?'active':''} onClick={()=>{handleSelectSpecies(s.id);setMode('tree')}} aria-label={`${s.name}, ${s.date}${active?', alive at the selected time':''}`}><span>{s.short}</span><i><b style={{left:`${left}%`,width:`${Math.max(.8,right-left)}%`}}/><em style={{left:`${ageMaToFraction(age)*100}%`}}/></i></button>})}</div></div>}
          {state.journey&&<SpeciesJourney species={current}/>} 
          {!state.journey&&state.mode==='evidence'&&<div className="evidence-library-view"><div className="view-kicker">CLAIM LEDGER · {current.short}</div><h3>{getCopy(immutableBootstrap.copy,'evidence.heading')}</h3><p>{getCopy(immutableBootstrap.copy,'evidence.intro')}</p><div className="evidence-library-cards">{getExplorerClaimsForTaxon(immutableBootstrap,current.id).map(claim=><article className="evidence-claim-card" key={claim.id}><div className="evidence-claim-top"><span className={`claim-status ${claimStatusTone[claim.status]}`}>{claimStatusLabel[claim.status]}</span><small>{claim.scope}</small></div><strong>{claim.statement}</strong><div className="evidence-claim-sources">{claim.sourceIds.map(id=>{const source=getExplorerSourceById(immutableBootstrap,id); return source?<a key={source.id} href={source.url} target="_blank" rel="noreferrer"><span>{source.title}</span><ChevronRight size={13}/></a>:null})}</div></article>)}</div><div className="evidence-integrity"><b>Evidence rule</b><span>No source → no factual claim. Interpretive synthesis remains labeled, and missing specimen imagery stays missing instead of being replaced by a generic reconstruction.</span></div></div>}
          {!state.journey&&state.mode==='migration'&&<div className="migration-view"><div className="view-kicker">SPATIAL LAYER · {formatAgeMa(age)}</div><h3>{getCopy(immutableBootstrap.copy,'migration.heading')}</h3><p>Rotate the Earth, inspect broad migration corridors, and move through time. The map separates generalized population movement from individual travel and flags uncertainty instead of drawing a false single route.</p><MigrationGlobe bootstrap={immutableBootstrap} time={age} selected={state.selectedId} focusSite={state.focusSite} onFocused={()=>setState(prev=>({...prev,focusSite:null}))}/></div>}
        </div>
        <div className="model-note">Scientific framing: each species sits at its first appearance in the fossil record; branches are contextual or possible relationships, not guaranteed direct ancestry. Migration lines are generalized population corridors.</div>
        <div className="clade-legend" aria-label="Clade colours">{clades.map(group=><span key={group.name}><i style={{background:groupColors[group.name as keyof typeof groupColors]??'#28a9ff'}}/> {group.name}</span>)}</div>
        <RelationshipLegend present={presentRelations}/>
        {!state.journey&&state.mode==='tree'&&<details className="rel-details"><summary>Relationship table: text version of the graph</summary><RelationshipTable bootstrap={immutableBootstrap} onShow={id=>{setPinnedRelationId(id);document.querySelector('.graph-region')?.scrollIntoView({block:'nearest'})}}/></details>}
        <div className="timebar">
          <button type="button" className="play" onClick={()=>setState(prev=>({...prev,playing:!prev.playing}))} aria-label={state.playing?'Pause time':'Play time'}>{state.playing?<Pause size={18}/>:<Play size={18}/>}</button>
          <div className="time-readout"><strong>{formatAgeMa(age)}</strong><small>{coexisting.length?`Coexisting: ${coexisting.map(s=>s.short).join(' · ')}`:'Deep-time control · nonlinear scale'}</small></div>
          <div className="scrubber"><div className="ticks" aria-hidden="true">{TIME_AXIS_ANCHORS_MA.map(anchor=><span key={anchor} style={{left:`${ageMaToSlider(anchor)}%`}}>{formatAxisAnchor(anchor)}</span>)}</div><input aria-label="Time travel" aria-valuetext={formatAgeMa(age)} type="range" min="0" max="100" step="0.1" value={state.time} onChange={e=>setState(prev=>({...prev,time:+e.target.value}))}/></div>
          <button type="button" className="world" onClick={()=>setMode('migration')}><Globe2 size={15}/> View World at This Time</button>
        </div>
        <TimeMilestones species={explorerSpecies} selected={current} onJump={jumpToAge}/>
      </section>

      <AnimatePresence mode="wait">
        {inspectorOpen&&<Inspector key={current.id} bootstrap={immutableBootstrap} species={current} bookmarked={bookmarks.has(current.id)} onToggleBookmark={()=>bookmarks.toggle(current.id)} onSelectTaxon={handleSelectSpecies} onClose={()=>setInspectorOpen(false)} onRevealSite={(id)=>setState(prev=>({...prev,focusSite:id,mode:'migration',journey:false}))}/>}
      </AnimatePresence>
    </main>

    <footer id="about" className="evidence-strip"><div><b>◉</b><strong>Fossil Record</strong><small>Physical evidence of our past.</small></div><div><b>〽</b><strong>Genetic Evidence</strong><small>Ancient DNA and population history.</small></div><div><b>◈</b><strong>Archaeology</strong><small>Tools, sites and behavior.</small></div><div><b>▤</b><strong>Geology & Dating</strong><small>Stratigraphy and age estimates.</small></div><em>Evidence · interpretation · provenance<small>Human Origins research interface</small></em></footer>

  </></MotionConfig>
}
