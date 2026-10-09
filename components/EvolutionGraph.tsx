'use client'

/**
 * EvolutionGraph: the atlas's main lineage graph (it replaced the earlier tree components, which have been removed).
 *
 * One layout engine (presentation/graphLayout.ts), two projections:
 *  - "rails": the horizontal, time-warped map. Real zoom (the SVG is re-sized, so the scroll area follows the zoom),
 *    fit-to-width, drag-to-pan with a mouse, Ctrl/⌘ + wheel zoom anchored at the pointer, native one-finger scrolling
 *    on touch screens, and automatic centring of the selected taxon.
 *  - "list": a vertical "git graph" for narrow screens. One row per taxon with avatar, dates, the line that places
 *    it in the tree, a time bar on the shared deep-time scale and gene-flow badges.
 *
 * The projection is chosen from the width of the graph's own container (not the window), so it is correct inside the
 * split layout with the Inspector open, on tablets and on phones. A manual choice is remembered per browser.
 *
 * Performance (0.32): the time slider and "play" re-render this component up to 12×/s. Static layers (grid, clades,
 * edges, gene flow) are memoised and nodes/edges are React.memo components that receive booleans, not the age or the
 * whole lineage set, so a time tick only re-renders the cursor and the nodes whose "alive" state actually flips.
 *
 * Touch (0.32): hover is mouse-only (a tap no longer leaves a "stuck" hover caption), two-finger pinch zooms the
 * map around the pinch centre, and zooming no longer snaps the view back to the selected taxon.
 */

import {memo,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState,useSyncExternalStore,type CSSProperties,type KeyboardEvent as ReactKeyboardEvent,type PointerEvent as ReactPointerEvent} from 'react'

const useIsomorphicLayoutEffect=typeof window!=='undefined'?useLayoutEffect:useEffect
import {Crosshair,GitBranch,List,Maximize2,Minus,Plus,Route} from 'lucide-react'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {ExplorerSpecies} from '../features/explorer/types'
import {getExplorerSourceById} from '../features/explorer/selectors'
import {groupColors,relationshipColors} from '../presentation/palette'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import {RELATION_SEMANTICS} from '../domain/relationship-semantics'
import {certaintyLabel} from '../domain/labels'
import {isInferredNode} from '../domain/taxon-model'
import {ageMaToFraction,sliderToAgeMa} from '../domain/time'
import {taxonInitials} from './TaxonNavigator'
import {computeGraphLayout,computeVerticalGraphLayout,warpX,type GraphEdge,type GraphLayout} from '../presentation/graphLayout'

type Props={
  bootstrap:ExplorerBootstrap
  selected:string
  setSelected:(id:string)=>void
  time:number
  pinnedRelationId?:string|null
  onPinRelation?:(id:string|null)=>void
}
type Link=ExplorerBootstrap['graph']['relationships'][number]
type View='rails'|'list'
type ViewPreference=View|'auto'

const MIN_ZOOM=.45,MAX_ZOOM=2
/** Below this container width the vertical list reads better than a horizontally scrolling map. */
export const GRAPH_COMPACT_WIDTH=820
const VIEW_STORAGE_KEY='human-origins:graph-view'
// View preference store: localStorage when available, in-memory otherwise (private mode / blocked storage).
const viewPreferenceListeners=new Set<()=>void>()
let memoryViewPreference:ViewPreference='auto'
function readViewPreference():ViewPreference{
  try{const stored=window.localStorage.getItem(VIEW_STORAGE_KEY);return stored==='rails'||stored==='list'?stored:'auto'}
  catch{return memoryViewPreference}
}
const serverViewPreference=():ViewPreference=>'auto'
function subscribeViewPreference(listener:()=>void){
  viewPreferenceListeners.add(listener)
  window.addEventListener('storage',listener)
  return()=>{viewPreferenceListeners.delete(listener);window.removeEventListener('storage',listener)}
}
function writeViewPreference(value:ViewPreference){
  memoryViewPreference=value
  try{if(value==='auto') window.localStorage.removeItem(VIEW_STORAGE_KEY);else window.localStorage.setItem(VIEW_STORAGE_KEY,value)}catch{/* in-memory fallback above */}
  viewPreferenceListeners.forEach(listener=>listener())
}
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))
const colorFor=(species:ExplorerSpecies)=>groupColors[species.group as keyof typeof groupColors]??'#28a9ff'
const formatEventAge=(ageMa?:number)=>ageMa===undefined?'':ageMa<1?`${Math.round(ageMa*1000)} ka`:`${ageMa} Ma`

/** Pure helper (exported for tests): which projection fits a container of this width. */
export function pickGraphView(preference:ViewPreference,containerWidth:number):View{
  if(preference!=='auto') return preference
  return containerWidth>0&&containerWidth<GRAPH_COMPACT_WIDTH?'list':'rails'
}

/** Pure helper (exported for tests): the zoom at which the whole map fits the container, bounded to a legible range. */
export function fitZoom(containerWidth:number,layoutWidth:number):number{
  if(containerWidth<=0||layoutWidth<=0) return 1
  return clamp(Math.floor(((containerWidth-2)/layoutWidth)*100)/100,MIN_ZOOM,1)
}

/** Below this zoom node names (12px) render under ~9px and become unreadable on a phone. */
export const LEGIBLE_ZOOM=.8
/**
 * Pure helper (exported for tests): the zoom the map opens at. Wide containers fit the whole map. Narrow ones (a phone
 * that chose "Map") open at a legible zoom and pan, instead of shrinking 11 taxa to an unreadable 45%.
 */
export function initialZoom(containerWidth:number,layoutWidth:number):number{
  const fit=fitZoom(containerWidth,layoutWidth)
  return containerWidth>0&&containerWidth<GRAPH_COMPACT_WIDTH?Math.max(fit,LEGIBLE_ZOOM):fit
}

function useElementWidth<T extends HTMLElement>(){
  const ref=useRef<T>(null)
  const [width,setWidth]=useState(0)
  useIsomorphicLayoutEffect(()=>{
    const element=ref.current
    if(!element) return
    setWidth(element.clientWidth)
    if(typeof ResizeObserver==='undefined') return
    const observer=new ResizeObserver(entries=>{
      const next=Math.round(entries[0]?.contentRect.width??element.clientWidth)
      setWidth(previous=>previous===next?previous:next)
    })
    observer.observe(element)
    return ()=>observer.disconnect()
  },[])
  return [ref,width] as const
}

const prefersReducedMotion=()=>typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Hover is a mouse affordance. On touch, `pointerenter` fires on tap and never gets a matching leave. */
const isMouse=(event:ReactPointerEvent)=>event.pointerType==='mouse'

type EdgeProps={edge:GraphEdge;link:Link;stroke:string;active:boolean;related:boolean;onHover:(id:string|null)=>void;onPin:(id:string)=>void}
const Edge=memo(function Edge({edge,link,stroke:cladeStroke,active,related,onHover,onPin}:EdgeProps){
  const semantics=RELATION_SEMANTICS[link.relation]
  const stroke=link.relation==='gene-flow'?relationshipColors['gene-flow']:cladeStroke
  const width=active?4:related?3:edge.kind==='secondary'?1.5:2.5
  const end=edge.end
  return <g className={`atlas-graph-edge ${active?'is-active':''} ${related?'is-related':''}`} onPointerEnter={event=>{if(isMouse(event)) onHover(edge.id)}} onPointerLeave={event=>{if(isMouse(event)) onHover(null)}} onClick={()=>onPin(edge.id)}>
    <path d={edge.d} fill="none" stroke="#061214" strokeWidth={width+7} strokeLinecap="round" strokeLinejoin="round"/>
    <path d={edge.d} fill="none" stroke={active?'#f1d29a':stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={semantics.stroke.dash} opacity={active||related?1:edge.kind==='secondary'?.55:.85}/>
    {semantics.stroke.marker==='arrow'&&<path d={`M${end.x-10} ${end.y-5}L${end.x} ${end.y}L${end.x-10} ${end.y+5}Z`} fill={stroke}/>}
    {semantics.stroke.marker==='open-arrow'&&<path d={`M${end.x-10} ${end.y-5}L${end.x} ${end.y}L${end.x-10} ${end.y+5}`} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round"/>}
    {semantics.stroke.marker==='question'&&<g transform={`translate(${end.x-10} ${end.y})`}><circle r="8" fill="#061214" stroke={stroke} strokeWidth="1.5"/><text className="atlas-graph-qmark" y="4" textAnchor="middle" fill={stroke}>?</text></g>}
    {/* Wide transparent stroke: a finger-sized hit area for the thin visible line. */}
    <path d={edge.d} fill="none" stroke="transparent" strokeWidth="24" className="atlas-graph-hit"/>
  </g>
})

type GeneFlowProps={flow:GraphLayout['geneFlow'][number];label:string;active:boolean;onHover:(id:string|null)=>void;onPin:(id:string)=>void}
const GeneFlowArc=memo(function GeneFlowArc({flow,label,active,onHover,onPin}:GeneFlowProps){
  const c=relationshipColors['gene-flow']
  return <g className={`atlas-graph-edge ${active?'is-active':''}`} onPointerEnter={event=>{if(isMouse(event)) onHover(flow.id)}} onPointerLeave={event=>{if(isMouse(event)) onHover(null)}} onClick={()=>onPin(flow.id)}>
    <path d={flow.d} fill="none" stroke="#061214" strokeWidth={active?7:5} strokeLinecap="round"/>
    <path d={flow.d} fill="none" stroke={c} strokeWidth={active?3:2} strokeDasharray="3 5" strokeLinecap="round"/>
    <path d={flow.d} fill="none" stroke="transparent" strokeWidth="22" className="atlas-graph-hit"/>
    <circle cx={flow.a.x} cy={flow.a.y} r="4" fill={c}/><circle cx={flow.b.x} cy={flow.b.y} r="4" fill={c}/>
    <g transform={`translate(${flow.pill.x} ${flow.pill.y})`}><rect width={flow.pill.width} height={flow.pill.height} rx="12" fill="#071113" stroke={c}/><text x={flow.pill.width/2} y="16" textAnchor="middle" fill="#f9a8d0">⇄ {label}</text></g>
  </g>
})

type NodeProps={species:ExplorerSpecies;node:GraphLayout['nodes'][string];r:number;isSelected:boolean;alive:boolean;onLineage:boolean;partner:boolean;iconFailed:boolean;onFailed:(id:string)=>void;onSelect:(id:string)=>void;onKeyNav:(event:ReactKeyboardEvent,id:string)=>void;registerRef:(id:string,el:SVGGElement|null)=>void}
const GraphNode=memo(function GraphNode({species,node,r,isSelected,alive,onLineage,partner,iconFailed,onFailed,onSelect,onKeyNav,registerRef}:NodeProps){
  const inferred=isInferredNode(species)
  const media=findMedia(species.media,species.treeIconId)
  const showIcon=Boolean(media&&!iconFailed)
  const color=colorFor(species)
  const nameY=node.labelSide==='above'?-r-21:r+14
  const dateY=node.labelSide==='above'?-r-7:r+28
  const clipId=`atlas-graph-clip-${species.id}`
  const ref=useCallback((el:SVGGElement|null)=>registerRef(species.id,el),[registerRef,species.id])
  return <g ref={ref} className={`atlas-graph-node ${isSelected?'selected':''} ${alive?'in-time':'out-time'} ${onLineage?'on-lineage':''} ${partner?'gene-partner':''}`} transform={`translate(${node.x} ${node.y})`} tabIndex={isSelected?0:-1} role="button" aria-pressed={isSelected} aria-label={`${species.name}, ${species.date}${inferred?', inferred node':''}`} data-taxon={species.id} onClick={()=>onSelect(species.id)} onKeyDown={event=>onKeyNav(event,species.id)}>
    <circle className="atlas-graph-halo" r={isSelected?r+9:0}/>
    {/* Finger-sized hit target (r+12 ≈ 44px at 100%), drawn transparent. */}
    <circle r={r+12} fill="transparent"/>
    <circle className="atlas-graph-ring" r={r} fill="#09181a" stroke={isSelected?'#f1d29a':color} strokeWidth={isSelected?3:1.8} strokeDasharray={inferred?'4 3':undefined}/>
    <clipPath id={clipId}><circle r={r-3}/></clipPath>
    {showIcon
      ?<image href={resolveMediaSrc(media!,'icon',128)} x={-(r-3)} y={-(r-3)} width={(r-3)*2} height={(r-3)*2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} onError={()=>onFailed(species.id)}/>
      :<text className="atlas-graph-initials" textAnchor="middle" dominantBaseline="central">{inferred?'?':taxonInitials(species.short)}</text>}
    <text className="atlas-graph-name" y={nameY} textAnchor="middle">{species.short}</text>
    <text className="atlas-graph-date" y={dateY} textAnchor="middle">{inferred?'Inferred node':species.date}</text>
  </g>
})

function RelationCaption({bootstrap,link,byId}:{bootstrap:ExplorerBootstrap;link:Link;byId:ReadonlyMap<string,ExplorerSpecies>}){
  const semantics=RELATION_SEMANTICS[link.relation]
  const sources=link.sourceIds.map(id=>getExplorerSourceById(bootstrap,String(id))?.title??String(id))
  return <>
    <strong>{byId.get(String(link.from))?.short} {link.relation==='gene-flow'?'⇄':'→'} {byId.get(String(link.to))?.short}: {semantics.label}{link.relation==='gene-flow'&&link.eventAgeMa!==undefined?` · about ${formatEventAge(link.eventAgeMa)} ago`:''}</strong>
    <span>{semantics.meaning}</span>
    <em>{semantics.doesNotClaim}</em>
    {link.note&&<span>{link.note}</span>}
    <small>Certainty: {link.certainty?certaintyLabel[link.certainty]:'not stated'}{sources.length?` · ${sources.join('; ')}`:''}</small>
  </>
}

/** Lineage of a taxon: every taxon reachable through descent links (gene flow is not ancestry), up and down. */
export function lineageOf(links:readonly {readonly from:string;readonly to:string;readonly type:string}[],selected:string):Set<string>{
  const up=new Map<string,string[]>(),down=new Map<string,string[]>()
  for(const link of links){
    if(link.type==='gene-flow') continue
    const from=String(link.from),to=String(link.to)
    ;(up.get(to)??up.set(to,[]).get(to)!).push(from)
    ;(down.get(from)??down.set(from,[]).get(from)!).push(to)
  }
  const out=new Set<string>([selected])
  for(const index of [up,down]){
    const stack=[selected]
    while(stack.length){const at=stack.pop()!;for(const next of index.get(at)??[]) if(!out.has(next)){out.add(next);stack.push(next)}}
  }
  return out
}

export default function EvolutionGraph({bootstrap,selected,setSelected,time,pinnedRelationId=null,onPinRelation}:Props){
  const byIdAll=useMemo(()=>new Map(bootstrap.species.map(item=>[item.id,item])),[bootstrap])
  const species=useMemo(()=>bootstrap.graph.taxonIds.map(id=>byIdAll.get(id)).filter((item):item is ExplorerSpecies=>Boolean(item)),[bootstrap,byIdAll])
  const links=bootstrap.graph.relationships
  const graphLinks=useMemo(()=>links.map(link=>({id:String(link.id),from:String(link.from),to:String(link.to),type:link.type,relation:link.relation,eventAgeMa:link.eventAgeMa})),[links])
  const layout=useMemo(()=>computeGraphLayout(species,graphLinks),[species,graphLinks])
  const vertical=useMemo(()=>computeVerticalGraphLayout(species,graphLinks,{rowHeight:84,laneWidth:22,dotRadius:9}),[species,graphLinks])
  const byId=useMemo(()=>new Map(species.map(item=>[item.id,item])),[species])
  const linkById=useMemo(()=>new Map(links.map(link=>[String(link.id),link])),[links])
  const currentAge=useMemo(()=>sliderToAgeMa(time),[time])

  const [wrapRef,containerWidth]=useElementWidth<HTMLDivElement>()
  const canvasRef=useRef<HTMLDivElement>(null)
  const nodeRefs=useRef(new Map<string,SVGGElement>())
  const registerRef=useCallback((id:string,el:SVGGElement|null)=>{if(el) nodeRefs.current.set(id,el);else nodeRefs.current.delete(id)},[])

  // The stored view is an external system (localStorage), read through useSyncExternalStore: the server and the first
  // client render both use 'auto', then the stored choice applies without a setState-in-effect cascade.
  const preference=useSyncExternalStore(subscribeViewPreference,readViewPreference,serverViewPreference)
  const choose=(next:View)=>{
    writeViewPreference(next===pickGraphView('auto',containerWidth)?'auto':next)
  }
  const view=pickGraphView(preference,containerWidth)

  // Zoom: null = the initial zoom (fit on wide screens, legible on phones). The SVG itself is resized, so scroll
  // extents always match what is drawn.
  const [zoom,setZoom]=useState<number|null>(null)
  const fit=fitZoom(containerWidth,layout.width)
  const k=zoom??initialZoom(containerWidth,layout.width)
  // Handlers read the zoom through a ref so they stay stable (memoised children) and never act on a stale value.
  const kRef=useRef(k)
  useIsomorphicLayoutEffect(()=>{kRef.current=k},[k])
  const anchorRef=useRef<{cx:number;cy:number;px:number;py:number}|null>(null)
  const zoomTo=useCallback((next:number|null,anchor?:{clientX:number;clientY:number})=>{
    const canvas=canvasRef.current,current=kRef.current
    if(canvas){
      const rect=canvas.getBoundingClientRect()
      const px=anchor?anchor.clientX-rect.left:canvas.clientWidth/2
      const py=anchor?anchor.clientY-rect.top:canvas.clientHeight/2
      anchorRef.current={cx:(canvas.scrollLeft+px)/current,cy:(canvas.scrollTop+py)/current,px,py}
    }
    setZoom(next===null?null:clamp(next,MIN_ZOOM,MAX_ZOOM))
  },[])
  useIsomorphicLayoutEffect(()=>{
    const canvas=canvasRef.current,anchor=anchorRef.current
    if(!canvas||!anchor) return
    anchorRef.current=null
    canvas.scrollLeft=anchor.cx*k-anchor.px
    canvas.scrollTop=anchor.cy*k-anchor.py
  },[k])

  const centerOn=useCallback((id:string,smooth=true)=>{
    const canvas=canvasRef.current,node=layout.nodes[id],scale=kRef.current
    if(!canvas||!node) return
    canvas.scrollTo({left:Math.max(0,node.x*scale-canvas.clientWidth/2),top:Math.max(0,node.y*scale-canvas.clientHeight/2),behavior:smooth&&!prefersReducedMotion()?'smooth':'auto'})
  },[layout])
  // Keep the selected taxon in view when it or the projection changes. Zooming deliberately does NOT re-centre:
  // the zoom keeps its own anchor (pointer, pinch centre or viewport centre) instead of jumping back.
  const hasWidth=containerWidth>0
  const firstCenter=useRef(true)
  useEffect(()=>{
    if(view!=='rails'||!hasWidth) return
    centerOn(selected,!firstCenter.current)
    firstCenter.current=false
  },[selected,view,hasWidth,centerOn])

  // Ctrl/⌘ + wheel (and trackpad pinch, which browsers report as ctrl+wheel) zooms at the pointer.
  useEffect(()=>{
    const canvas=canvasRef.current
    if(!canvas||view!=='rails') return
    const onWheel=(event:WheelEvent)=>{
      if(!event.ctrlKey&&!event.metaKey) return
      event.preventDefault()
      zoomTo(kRef.current*Math.exp(-event.deltaY*0.0025),{clientX:event.clientX,clientY:event.clientY})
    }
    canvas.addEventListener('wheel',onWheel,{passive:false})
    return ()=>canvas.removeEventListener('wheel',onWheel)
  },[view,zoomTo])

  // Two-finger pinch on touch screens. One finger keeps native scrolling, so the page never gets trapped.
  useEffect(()=>{
    const canvas=canvasRef.current
    if(!canvas||view!=='rails') return
    let pinch:{distance:number;k:number}|null=null
    let frame=0
    const distance=(t:TouchList)=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)
    const onStart=(event:TouchEvent)=>{if(event.touches.length===2) pinch={distance:distance(event.touches)||1,k:kRef.current}}
    const onMove=(event:TouchEvent)=>{
      if(!pinch||event.touches.length!==2) return
      event.preventDefault()
      const t=event.touches,next=pinch.k*(distance(t)/pinch.distance)
      const centre={clientX:(t[0].clientX+t[1].clientX)/2,clientY:(t[0].clientY+t[1].clientY)/2}
      cancelAnimationFrame(frame)
      frame=requestAnimationFrame(()=>{if(Math.abs(next-kRef.current)>.01) zoomTo(next,centre)})
    }
    const onEnd=(event:TouchEvent)=>{if(event.touches.length<2) pinch=null}
    canvas.addEventListener('touchstart',onStart,{passive:true})
    canvas.addEventListener('touchmove',onMove,{passive:false})
    canvas.addEventListener('touchend',onEnd,{passive:true})
    canvas.addEventListener('touchcancel',onEnd,{passive:true})
    return ()=>{cancelAnimationFrame(frame);canvas.removeEventListener('touchstart',onStart);canvas.removeEventListener('touchmove',onMove);canvas.removeEventListener('touchend',onEnd);canvas.removeEventListener('touchcancel',onEnd)}
  },[view,zoomTo])

  // Drag-to-pan for mouse and pen. Touch keeps native scrolling.
  const drag=useRef<{x:number;y:number;left:number;top:number;moved:boolean;id:number}|null>(null)
  const suppressClick=useRef(false)
  const onPointerDown=(event:ReactPointerEvent<HTMLDivElement>)=>{
    if(event.pointerType==='touch'||event.button!==0) return
    const canvas=canvasRef.current
    if(!canvas) return
    drag.current={x:event.clientX,y:event.clientY,left:canvas.scrollLeft,top:canvas.scrollTop,moved:false,id:event.pointerId}
  }
  const onPointerMove=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const state=drag.current,canvas=canvasRef.current
    if(!state||!canvas||state.id!==event.pointerId) return
    const dx=event.clientX-state.x,dy=event.clientY-state.y
    if(!state.moved&&Math.hypot(dx,dy)<5) return
    if(!state.moved){state.moved=true;canvas.setPointerCapture?.(event.pointerId);canvas.classList.add('is-dragging')}
    canvas.scrollLeft=state.left-dx
    canvas.scrollTop=state.top-dy
  }
  const endDrag=(event:ReactPointerEvent<HTMLDivElement>)=>{
    const state=drag.current,canvas=canvasRef.current
    if(!state||state.id!==event.pointerId) return
    if(state.moved){suppressClick.current=true;window.setTimeout(()=>{suppressClick.current=false},0)}
    canvas?.classList.remove('is-dragging')
    drag.current=null
  }

  const [failed,setFailedState]=useState<ReadonlySet<string>>(()=>new Set())
  const onFailed=useCallback((id:string)=>setFailedState(prev=>prev.has(id)?prev:new Set(prev).add(id)),[])
  const [hover,setHover]=useState<string|null>(null)

  const lineage=useMemo(()=>lineageOf(links,selected),[links,selected])
  const partners=useMemo(()=>new Set(links.filter(link=>link.type==='gene-flow'&&(String(link.from)===selected||String(link.to)===selected)).map(link=>String(link.from)===selected?String(link.to):String(link.from))),[links,selected])
  const parentLinkById=useMemo(()=>{
    const out=new Map<string,Link>()
    for(const link of links) if(link.type!=='gene-flow'&&byId.has(String(link.from))&&!out.has(String(link.to))) out.set(String(link.to),link)
    return out
  },[links,byId])
  const geneFlowById=useMemo(()=>{
    const out=new Map<string,Link[]>()
    for(const link of links) if(link.type==='gene-flow') for(const end of [String(link.from),String(link.to)]) (out.get(end)??out.set(end,[]).get(end)!).push(link)
    return out
  },[links])

  const activeId=hover??pinnedRelationId
  const activeLink=activeId?linkById.get(activeId):undefined
  // Stable handlers: memoised nodes and edges must not re-render because a closure was re-created.
  const pinnedRef=useRef(pinnedRelationId),onPinRef=useRef(onPinRelation),setSelectedRef=useRef(setSelected)
  useIsomorphicLayoutEffect(()=>{pinnedRef.current=pinnedRelationId;onPinRef.current=onPinRelation;setSelectedRef.current=setSelected})
  const pin=useCallback((id:string)=>{if(suppressClick.current) return;setHover(null);onPinRef.current?.(pinnedRef.current===id?null:id)},[])
  const select=useCallback((id:string)=>{if(suppressClick.current) return;setSelectedRef.current(id)},[])

  // Roving focus across nodes in chronological order: ←/→ step, Home/End jump, Enter/Space select.
  const order=layout.order
  const onKeyNav=useCallback((event:ReactKeyboardEvent,id:string)=>{
    const index=order.indexOf(id)
    let target:string|undefined
    if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedRef.current(id);return}
    if(event.key==='ArrowRight'||event.key==='ArrowDown') target=order[Math.min(order.length-1,index+1)]
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp') target=order[Math.max(0,index-1)]
    else if(event.key==='Home') target=order[0]
    else if(event.key==='End') target=order[order.length-1]
    if(!target) return
    event.preventDefault()
    setSelectedRef.current(target)
    requestAnimationFrame(()=>nodeRefs.current.get(target!)?.focus({preventScroll:true}))
  },[order])

  const selectedSpecies=byId.get(selected)
  const selectedParent=parentLinkById.get(selected)
  const cursorX=warpX(layout.warp,currentAge)

  // Static layers: independent of time, selection and hover.
  const gridLayer=useMemo(()=><>
    <g className="atlas-graph-grid">{layout.ticks.map(tick=><g key={tick.ageMa}><line x1={tick.x} x2={tick.x} y1={layout.plot.top} y2={layout.plot.bottom}/><text x={tick.x} y={layout.plot.bottom+24} textAnchor="middle">{tick.label}</text></g>)}</g>
    <g className="atlas-graph-clades">{layout.clades.map(clade=><g key={clade.group}><path d={`M${clade.fromX} ${clade.y+8}V${clade.y}H${clade.toX}V${clade.y+8}`}/><text x={(clade.fromX+clade.toX)/2} y={clade.y-5} textAnchor="middle" fill={groupColors[clade.group as keyof typeof groupColors]??'#aebbb8'}>{clade.group}</text></g>)}</g>
  </>,[layout])
  // Lifespan band: only for the selected taxon. Drawn for every taxon, the bands ran along the shared lane through
  // later nodes (H. erectus' band crossed H. heidelbergensis and H. sapiens) and read as extra, thicker rails.
  const selectedNode=layout.nodes[selected]
  const lifespan=selectedSpecies&&selectedNode&&!isInferredNode(selectedSpecies)
    ?<line className="atlas-graph-lifespan" x1={selectedNode.x} x2={Math.max(selectedNode.x,warpX(layout.warp,selectedSpecies.end))} y1={selectedNode.y} y2={selectedNode.y} stroke={colorFor(selectedSpecies)} strokeWidth="10" strokeLinecap="round"/>
    :null

  return <div ref={wrapRef} className={`atlas-graph view-${view}`} data-view={view}>
    <div className="atlas-graph-toolbar">
      <div className="atlas-graph-title"><GitBranch size={15} aria-hidden="true"/><strong>Lineage graph</strong><span>{species.length} taxa{bootstrap.graph.off.length?` · ${bootstrap.graph.off.length} hidden`:''}</span></div>
      <div className="atlas-graph-views" role="group" aria-label="Graph layout">
        <button type="button" onClick={()=>choose('rails')} className={view==='rails'?'active':''} aria-pressed={view==='rails'}><Route size={14} aria-hidden="true"/> Map</button>
        <button type="button" onClick={()=>choose('list')} className={view==='list'?'active':''} aria-pressed={view==='list'}><List size={14} aria-hidden="true"/> List</button>
      </div>
      {view==='rails'&&<div className="atlas-graph-zoom" role="group" aria-label="Zoom">
        <button type="button" onClick={()=>zoomTo(k/1.25)} aria-label="Zoom out" disabled={k<=MIN_ZOOM+.001}><Minus size={15} aria-hidden="true"/></button>
        <output aria-label="Current zoom">{Math.round(k*100)}%</output>
        <button type="button" onClick={()=>zoomTo(k*1.25)} aria-label="Zoom in" disabled={k>=MAX_ZOOM-.001}><Plus size={15} aria-hidden="true"/></button>
        <button type="button" onClick={()=>zoomTo(fit)} aria-label="Fit to width" className={Math.abs(k-fit)<.005?'active':''}><Maximize2 size={14} aria-hidden="true"/></button>
        <button type="button" onClick={()=>centerOn(selected)} aria-label="Centre the selected taxon"><Crosshair size={15} aria-hidden="true"/></button>
      </div>}
    </div>

    {view==='rails'
      ?<div ref={canvasRef} className="atlas-graph-canvas" tabIndex={0} aria-label="Evolutionary graph, older taxa on the left. Scroll or drag to pan; pinch, or Ctrl and the mouse wheel, to zoom." onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <svg className="atlas-graph-svg" width={Math.round(layout.width*k)} height={Math.round(layout.height*k)} viewBox={`0 0 ${layout.width} ${layout.height}`} role="group" aria-labelledby="atlas-graph-title atlas-graph-desc">
          <title id="atlas-graph-title">Evolutionary graph, older taxa on the left and younger taxa on the right</title>
          <desc id="atlas-graph-desc">Each taxon has its own column on a warped time axis. Solid rails show the curated path, elbows show side branches and pink arcs show gene flow. The band behind the selected taxon is its documented time range. Lines are relationships with stated certainty, not guaranteed direct ancestry.</desc>
          {gridLayer}
          <g className="atlas-graph-bars">{lifespan}</g>
          <g className="atlas-graph-edges">{layout.edges.map(edge=>{const link=linkById.get(edge.id),child=link?byId.get(String(link.to)):undefined;return link&&child?<Edge key={edge.id} edge={edge} link={link} stroke={colorFor(child)} active={edge.id===activeId} related={lineage.has(String(link.from))&&lineage.has(String(link.to))} onHover={setHover} onPin={pin}/>:null})}</g>
          <g className="atlas-graph-gene-flow">{layout.geneFlow.map(flow=><GeneFlowArc key={flow.id} flow={flow} label={formatEventAge(linkById.get(flow.id)?.eventAgeMa)} active={flow.id===activeId} onHover={setHover} onPin={pin}/>)}</g>
          <line className="atlas-graph-cursor" x1={cursorX} x2={cursorX} y1={layout.plot.top} y2={layout.plot.bottom}/>
          <g className="atlas-graph-nodes">{species.map(item=>{const node=layout.nodes[item.id];return node?<GraphNode key={item.id} species={item} node={node} r={layout.nodeRadius} isSelected={item.id===selected} alive={!isInferredNode(item)&&currentAge<=item.start&&currentAge>=item.end} onLineage={lineage.has(item.id)} partner={partners.has(item.id)} iconFailed={failed.has(item.id)} onFailed={onFailed} onSelect={select} onKeyNav={onKeyNav} registerRef={registerRef}/>:null})}</g>
        </svg>
      </div>
      :<div className="atlas-graph-list" style={{height:vertical.height}}>
        <svg className="atlas-graph-list-lines" width={vertical.gutter} height={vertical.height} aria-hidden="true">
          {vertical.paths.map(path=>{const link=linkById.get(path.id),child=link?byId.get(String(link.to)):undefined;const on=link?lineage.has(String(link.from))&&lineage.has(String(link.to)):false;return <path key={path.id} d={path.d} fill="none" className={`list-edge ${path.kind} ${on?'on-lineage':''}`} stroke={child?colorFor(child):'#7b89bb'} strokeDasharray={link?RELATION_SEMANTICS[link.relation].stroke.dash:undefined}/>})}
          {vertical.rows.map(row=>{const item=byId.get(row.id)!;const on=row.id===selected;return <circle key={row.id} cx={row.x} cy={row.y} r={on?vertical.dotRadius+2:vertical.dotRadius} fill={on?'#f1d29a':'#09181a'} stroke={colorFor(item)} strokeWidth={on?3:2} strokeDasharray={isInferredNode(item)?'3 2':undefined}/>})}
        </svg>
        <ol aria-label="Evolutionary graph as a list, oldest first">{vertical.rows.map(row=>{
          const item=byId.get(row.id)!,isSelected=item.id===selected,inferred=isInferredNode(item)
          const parent=parentLinkById.get(item.id),parentTaxon=parent?byId.get(String(parent.from)):undefined
          const flowPartners=(geneFlowById.get(item.id)??[]).map(link=>byId.get(String(link.from)===item.id?String(link.to):String(link.from))?.short).filter(Boolean)
          const media=findMedia(item.media,item.treeIconId)
          const alive=!inferred&&currentAge<=item.start&&currentAge>=item.end
          const left=ageMaToFraction(item.start)*100,right=ageMaToFraction(item.end)*100
          return <li key={row.id} className="atlas-graph-list-item" style={{top:row.y-vertical.rowHeight/2,height:vertical.rowHeight,left:vertical.gutter}}>
            <button type="button" onClick={()=>setSelected(item.id)} className={`atlas-graph-row ${isSelected?'selected':''} ${alive?'in-time':''} ${lineage.has(item.id)?'on-lineage':''}`} aria-pressed={isSelected} aria-label={`${item.name}, ${inferred?'inferred node':item.date}${alive?', alive at the selected time':''}`} style={{'--clade':colorFor(item)} as CSSProperties}>
              <span className="atlas-graph-row-avatar" aria-hidden="true">{media&&!failed.has(item.id)
                ?(
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveMediaSrc(media,'icon',128)} alt="" width={36} height={36} loading="lazy" decoding="async" onError={()=>onFailed(item.id)}/>
              )
                :<b>{inferred?'?':taxonInitials(item.short)}</b>}</span>
              <span className="atlas-graph-row-text">
                <strong>{item.short}</strong>
                <small>{inferred?'Inferred node':item.date}{alive?' · alive at selected time':''}</small>
                <span className="atlas-graph-row-rel">{parent&&parentTaxon?<>{RELATION_SEMANTICS[parent.relation].label} · from {parentTaxon.short}</>:'Root of the drawn graph'}{flowPartners.length>0&&<em> · ⇄ {flowPartners.join(', ')}</em>}</span>
              </span>
              <span className="atlas-graph-row-time" aria-hidden="true"><i style={{left:`${left}%`,width:`${Math.max(2,right-left)}%`}}/><u style={{left:`${ageMaToFraction(currentAge)*100}%`}}/></span>
            </button>
          </li>})}</ol>
      </div>}

    <div className="atlas-graph-caption" aria-live="polite">
      {view==='rails'&&activeLink
        ?<RelationCaption bootstrap={bootstrap} link={activeLink} byId={byId}/>
        :view==='list'&&selectedSpecies&&selectedParent
          ?<RelationCaption bootstrap={bootstrap} link={selectedParent} byId={byId}/>
          :<span><strong>Clean rails, honest uncertainty.</strong> {view==='rails'?'Tap a taxon to inspect it, or a line to read exactly what it claims. Pinch or use the buttons to zoom.':'Tap a taxon to inspect it; the line that places it in the tree is explained here.'} Hidden taxa remain in the atlas but do not break the curated path.</span>}
    </div>
  </div>
}
