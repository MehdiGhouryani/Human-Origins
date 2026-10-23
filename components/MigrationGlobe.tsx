'use client'
import {useEffect,useMemo,useRef,useState} from 'react'
import {geoDistance,geoGraticule,geoOrthographic,geoPath, type GeoProjection, type GeoPermissibleObjects} from 'd3-geo'
import {ExternalLink,Info,MapPin,Minus,Plus,RotateCcw,Layers3,Play,Pause,Focus,X,CalendarRange,History} from 'lucide-react'
import {getExplorerEvidenceSites,getExplorerSourceById,getExplorerSpeciesById} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {EvidenceKind} from '../domain/contracts'
import {maToKa,formatAgeMa,getExploratoryTemporalWindow,evaluateSiteWindowOverlap,type TemporalMode} from '../domain/time'
import {continents,routes,stories,type Route} from '../presentation/migrationScene'

function interp(a:number,b:number,t:number){let d=b-a;if(d>180)d-=360;if(d<-180)d+=360;return a+d*t}
/** True when [lon,lat] lies on the visible hemisphere of an orthographic projection rotated by `rot`. */
function isOnFrontHemisphere(rot:readonly [number,number],lonLat:readonly [number,number]):boolean{
  return geoDistance([-rot[0],-rot[1]],[lonLat[0],lonLat[1]])<=Math.PI/2
}
/**
 * Projects a corridor into an SVG path. A bare orthographic projection also returns coordinates for points behind
 * the globe, so hidden samples are dropped and the line is broken there instead of being drawn through the Earth.
 */
function projectRoute(route:Route,projection:GeoProjection,rot:readonly [number,number]):string{
  const samples:[number,number][]=[]
  for(let i=0;i<route.points.length-1;i++){const [aLon,aLat]=route.points[i],[bLon,bLat]=route.points[i+1];for(let s=0;s<30;s++){const t=s/30;samples.push([interp(aLon,bLon,t),aLat+(bLat-aLat)*t])}}
  samples.push(route.points[route.points.length-1] as [number,number])
  let d='',penDown=false
  for(const sample of samples){
    const p=isOnFrontHemisphere(rot,sample)?projection(sample):null
    if(!p){penDown=false;continue}
    d+=(penDown?'L':'M')+p[0].toFixed(1)+','+p[1].toFixed(1)
    penDown=true
  }
  return d
}
const kindLabel:Record<EvidenceKind,string>={fossil:'Fossil',archaeology:'Archaeology',genetics:'Genetics',dating:'Dating'}
const storyFor=(time:number)=>stories.find(s=>time<=s.fromKa&&time>=s.toKa)||stories[stories.length-1]

type Props={bootstrap:ExplorerBootstrap;time:number;selected:string;focusSite?:string|null;onFocused?:()=>void;temporalMode?:TemporalMode;onTemporalModeChange?:(mode:TemporalMode)=>void}
export default function MigrationGlobe({bootstrap,time,selected,focusSite,onFocused,temporalMode:propTemporalMode,onTemporalModeChange}:Props){
 const [rot,setRot]=useState<[number,number]>([-20,-8]); const [scale,setScale]=useState(205); const [drag,setDrag]=useState<{x:number;y:number;rot:[number,number]}|null>(null); const [active,setActive]=useState('out-of-africa'); const [filter,setFilter]=useState<'all'|EvidenceKind>('all'); const [site,setSite]=useState<string|null>(null); const [selectionType,setSelectionType]=useState<'site'|'route'|'none'>('route'); const [cinematic,setCinematic]=useState(false); const [appliedCinematicKey,setAppliedCinematicKey]=useState<string|null>(null)
 const [internalTemporalMode,setInternalTemporalMode]=useState<TemporalMode>(propTemporalMode??'trail')
 const activeTemporalMode=propTemporalMode??internalTemporalMode
 const handleSetTemporalMode=(mode:TemporalMode)=>{setInternalTemporalMode(mode);onTemporalModeChange?.(mode)}

 const evidenceSites=getExplorerEvidenceSites(bootstrap); const timeKa=maToKa(time)
 const story=storyFor(timeKa)
 const temporalWindow=useMemo(()=>getExploratoryTemporalWindow(time),[time])
 const siteContextMap=useMemo(()=>new Map(bootstrap.siteContexts.map(sc=>[String(sc.siteId),sc])),[bootstrap.siteContexts])

 const siteEvaluations=useMemo(()=>{
  const map=new Map<string,ReturnType<typeof evaluateSiteWindowOverlap>>()
  for(const s of evidenceSites){
   const context=siteContextMap.get(String(s.id))
   map.set(String(s.id),evaluateSiteWindowOverlap(s.ageKa,context?.timeInterval,temporalWindow,s.id===focusSite))
  }
  return map
 },[evidenceSites,siteContextMap,temporalWindow,focusSite])

 const visibleEvidence=useMemo(()=>{
  return evidenceSites
   .filter(s=>filter==='all'||s.kind===filter)
   .filter(s=>{
    if(activeTemporalMode==='trail'){
     return s.ageKa>=timeKa||s.id===focusSite
    }
    return siteEvaluations.get(String(s.id))?.matches??false
   })
 },[evidenceSites,filter,activeTemporalMode,timeKa,focusSite,siteEvaluations])

 const qualitativeExcludedCount=useMemo(()=>{
  if(activeTemporalMode!=='window') return 0
  let count=0
  for(const s of evidenceSites){
   if(filter!=='all'&&s.kind!==filter) continue
   const evaluation=siteEvaluations.get(String(s.id))
   if(evaluation?.isQualitativeOrUnbounded&&s.id!==focusSite){
    count++
   }
  }
  return count
 },[activeTemporalMode,evidenceSites,filter,siteEvaluations,focusSite])

 const projection=useMemo(()=>geoOrthographic().translate([420,270]).scale(scale).rotate(rot),[rot,scale]); const path=useMemo(()=>geoPath(projection),[projection]); const graticule=useMemo(()=>geoGraticule().step([20,20])(),[])
 const continentPaths=useMemo(()=>continents.map(([name,coords])=>({name,d:path({type:'Feature',properties:null,geometry:{type:'Polygon',coordinates:[[...coords,coords[0]]]}} as GeoPermissibleObjects)??''})),[path])
 const graticulePath=useMemo(()=>path(graticule)??'',[path,graticule])
 // Corridors are Homo sapiens dispersals: they are drawn only when H. sapiens is the selected taxon (BUG-74).
 const visibleRoutes=useMemo(()=>selected==='sapiens'?routes.filter(r=>timeKa<=r.startKa&&timeKa>=r.endKa):[],[timeKa,selected])
 const routePaths=useMemo(()=>new Map(visibleRoutes.map(r=>[r.id,projectRoute(r,projection,rot)])),[visibleRoutes,projection,rot]); const activeRoute=visibleRoutes.find(r=>r.id===active)??visibleRoutes[0]
 const routeProgress=(r:Route)=>Math.max(0,Math.min(1,(r.startKa-timeKa)/Math.max(1,r.startKa-r.endKa)))
 // Corridors are Homo sapiens dispersals; other taxa get an explicit note instead of a misleading highlight.
 const selectedIsSapiens=selected==='sapiens'
 const pointAlong=(r:Route,t:number):[number,number]=>{const lens=r.points.map((p,i)=>i?Math.hypot(p[0]-r.points[i-1][0],p[1]-r.points[i-1][1]):0);const total=lens.reduce((a,b)=>a+b,0);let target=t*total;for(let i=1;i<r.points.length;i++){if(target<=lens[i]){const u=target/lens[i];return [interp(r.points[i-1][0],r.points[i][0],u),r.points[i-1][1]+(r.points[i][1]-r.points[i-1][1])*u]}target-=lens[i]}return r.points[r.points.length-1]}
 const cinematicKey=cinematic?story.id:null
 if(cinematicKey!==appliedCinematicKey){
  setAppliedCinematicKey(cinematicKey)
  if(cinematicKey!==null){
   setActive(story.route)
   const [lon,lat]=story.focus
   setRot([Math.max(-180,Math.min(180,-lon)),Math.max(-80,Math.min(80,-lat))])
  }
 }
 const [appliedFocusSite,setAppliedFocusSite]=useState<string|null>(null)
 if(focusSite!==appliedFocusSite){
  setAppliedFocusSite(focusSite??null)
  if(focusSite){
   const target=evidenceSites.find(s=>s.id===focusSite)
   if(target){
    setSite(target.id)
    setSelectionType('site')
    setRot([Math.max(-180,Math.min(180,-target.lon)),Math.max(-80,Math.min(80,-target.lat))])
    setScale(240)
   }
  }
 }
 useEffect(()=>{
  if(focusSite){
   onFocused?.()
  }
 },[focusSite,onFocused])
 // React registers wheel listeners as passive, so preventDefault() there cannot stop the page from scrolling while zooming.
 const wrapRef=useRef<HTMLDivElement>(null)
 useEffect(()=>{
  const node=wrapRef.current
  if(!node)return
  const onWheel=(e:globalThis.WheelEvent)=>{if(!(e.ctrlKey||e.metaKey))return;e.preventDefault();setScale(s=>Math.max(155,Math.min(275,s+(e.deltaY<0?12:-12))))}
  node.addEventListener('wheel',onWheel,{passive:false})
  return ()=>node.removeEventListener('wheel',onWheel)
 },[])
 // Drag rotation: pointermove can fire 120+ times/s on phones; apply at most one rotation per frame.
 const dragFrame=useRef<number|null>(null)
 const pendingRot=useRef<[number,number]|null>(null)
 useEffect(()=>()=>{if(dragFrame.current!==null) cancelAnimationFrame(dragFrame.current)},[])
 const queueRotation=(next:[number,number])=>{
  pendingRot.current=next
  if(dragFrame.current!==null) return
  dragFrame.current=requestAnimationFrame(()=>{dragFrame.current=null;if(pendingRot.current) setRot(pendingRot.current)})
 }
 // Evidence markers are drawn in viewBox units; on a 350px-wide phone globe they shrink to ~2px.
 // Keep them (and their tap area) at a constant on-screen size.
 const [markerScale,setMarkerScale]=useState(1)
 // Phones: crop the 840×540 canvas to the globe itself so the Earth fills the width instead of ~40% of it.
 const [compact,setCompact]=useState(false)
 useEffect(()=>{
  const svg=wrapRef.current?.querySelector('svg.globe-map')
  if(!svg||typeof ResizeObserver==='undefined') return
  const observer=new ResizeObserver(([entry])=>{const width=entry.contentRect.width;if(width<=0) return;const isCompact=width<640;setCompact(isCompact);setMarkerScale(isCompact?Math.max(1,Math.min(2.4,500/width*1.25)):1)})
  observer.observe(svg)
  return ()=>observer.disconnect()
 },[])
 const reset=()=>{setRot([-20,-8]);setScale(205)}
 const focusStory=()=>{setRot([-story.focus[0],Math.max(-80,Math.min(80,-story.focus[1]))]);setActive(story.route)}

 return <div ref={wrapRef} className={`globe-wrap ${cinematic?'cinematic':''}`}>
  <div className="migration-context-bar">
   <div className="temporal-mode-header">
    <div className="temporal-mode-switcher" role="radiogroup" aria-label="Temporal interpretation mode">
     <button type="button" role="radio" aria-checked={activeTemporalMode==='trail'} className={`mode-toggle-btn ${activeTemporalMode==='trail'?'active':''}`} onClick={()=>handleSetTemporalMode('trail')}><History size={13} aria-hidden="true"/> <span>Historical evidence trail</span></button>
     <button type="button" role="radio" aria-checked={activeTemporalMode==='window'} className={`mode-toggle-btn ${activeTemporalMode==='window'?'active':''}`} onClick={()=>handleSetTemporalMode('window')}><CalendarRange size={13} aria-hidden="true"/> <span>Evidence near this time</span></button>
    </div>
    <div className="timelapse-badge"><span className="live-dot" aria-hidden="true"/> {activeTemporalMode==='trail'?(<>Cumulative trail · <b>{formatAgeMa(time)}</b> ({visibleEvidence.length} sites)</>):(<>Window [<b>{temporalWindow.label}</b>] ({visibleEvidence.length} sites)</>)}</div>
   </div>
   {activeTemporalMode==='trail'?(
    <p className="trail-explanation" role="note"><strong>Mode A (Historical evidence trail):</strong> Cumulative view showing all documented sites from deep time down to {formatAgeMa(time)}. Earlier evidence remains visible as the timeline advances toward the present. This is not an instantaneous species-distribution map.</p>
   ):(
    <div className="window-explanation" role="note">
     <p className="trail-explanation"><strong>Mode B (Evidence near this time):</strong> Shows sites whose documented dating interval or measurement uncertainty intersects the exploratory window of {temporalWindow.clippedAtPresent || temporalWindow.clippedAtOldestLimit ? `[${formatAgeMa(temporalWindow.olderMa)} – ${formatAgeMa(temporalWindow.youngerMa)}] (${temporalWindow.clippedAtPresent ? 'clipped at present / 0 Ma timeline boundary' : 'clipped at 8 Ma timeline limit'}, nominal ±${temporalWindow.halfWidthKa} ka)` : `±${temporalWindow.halfWidthKa} ka (${temporalWindow.label})`}. Point estimates without published error margins are matched by central date.</p>
     {qualitativeExcludedCount>0&&<div className="unbounded-exclusion-note"><Info size={12} aria-hidden="true"/> <span>{qualitativeExcludedCount} site{qualitativeExcludedCount>1?'s':''} with qualitative or open-ended dating (e.g. Levant &lsquo;~100 ka+&rsquo;, Eurasia regional context, Global synthesis) are excluded from the window query to prevent false precision.</span></div>}
    </div>
   )}
  </div>

  <div className="cinematic-bar">
   <button type="button" className={cinematic?'on':''} aria-pressed={cinematic} onClick={()=>setCinematic(v=>!v)}>{cinematic?<Pause size={13} aria-hidden="true"/>:<Play size={13} aria-hidden="true"/>} {cinematic?'Cinematic mode on':'Cinematic story'}</button>
   <button type="button" onClick={focusStory}><Focus size={13} aria-hidden="true"/> Focus chapter</button>
   <div className="story-copy"><b>{story.title}</b><span>{story.subtitle} · {story.note}</span></div>
   <div className="story-progress" aria-hidden="true"><i style={{width:`${Math.max(4,Math.min(100,((stories.findIndex(s=>s.id===story.id)+1)/stories.length)*100))}%`}}/></div>
   <div className="story-counter">CH {stories.findIndex(s=>s.id===story.id)+1}/{stories.length}</div>
  </div>

  <div className="map-toolbar" role="toolbar" aria-label="Evidence layers">
   <div className="map-filter-label"><Layers3 size={13} aria-hidden="true"/> Evidence layers</div>
   {(['all','fossil','archaeology','genetics','dating'] as const).map(k=><button type="button" key={k} aria-pressed={filter===k} className={filter===k?'on':''} onClick={()=>setFilter(k)}>{k==='all'?'All':kindLabel[k]}</button>)}
  </div>

  <div className="globe-stage">
   <svg className={`globe-map ${compact?'compact':''}`} viewBox={compact?'170 20 500 500':'0 0 840 540'} role="group" aria-labelledby="migration-globe-title migration-globe-desc" onPointerMove={e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;queueRotation([drag.rot[0]+dx*.35,Math.max(-80,Math.min(80,drag.rot[1]-dy*.22))])}} onPointerDown={e=>{if(e.button!==0)return;if((e.target as Element).closest('.evidence-marker,.migration-route'))return;e.currentTarget.setPointerCapture(e.pointerId);setDrag({x:e.clientX,y:e.clientY,rot})}} onPointerUp={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);setDrag(null)}} onPointerCancel={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);setDrag(null)}}>
    <title id="migration-globe-title">Interactive evidence globe</title><desc id="migration-globe-desc">Drag to rotate the globe, use the controls to zoom, and select evidence sites or migration corridors. Corridors are generalized population-level context, not individual travel paths.</desc>
    <defs><radialGradient id="ocean-v9"><stop offset="0" stopColor="#173e40"/><stop offset="1" stopColor="#061214"/></radialGradient><filter id="glow-v9"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter><radialGradient id="pulse-v9"><stop offset="0" stopColor="#fff4bd" stopOpacity=".9"/><stop offset="1" stopColor="#e8bd70" stopOpacity="0"/></radialGradient></defs>
    <circle cx="420" cy="270" r={scale} fill="url(#ocean-v9)" stroke="#466365" strokeWidth="1.2"/> <path d={graticulePath} fill="none" stroke="#285052" strokeWidth=".45" opacity=".5"/>
    {continentPaths.map(({name,d})=><path key={name} d={d} fill="#183d3b" stroke="#4d706c" strokeWidth=".8" opacity=".92"/>)}
    {visibleRoutes.map(r=>{const progress=routeProgress(r);const d=routePaths.get(r.id)??'';const frontLonLat=pointAlong(r,progress);const isActive=r.id===active;const isSelected=selected==='sapiens'&&r.id===activeRoute?.id;const front=isOnFrontHemisphere(rot,frontLonLat)?projection(frontLonLat):null;return <g key={r.id} tabIndex={0} role="button" aria-pressed={isActive} aria-label={`Select corridor ${r.label}`} onClick={e=>{e.stopPropagation();setActive(r.id);setSelectionType('route')}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setActive(r.id);setSelectionType('route')}}} opacity={isActive||isSelected?1:.18} className="migration-route"><path d={d} fill="none" stroke={r.color} strokeWidth={isActive||isSelected?3.5:1.6} strokeDasharray={r.certainty==='possible'?'3 7':'6 5'} filter={isActive||isSelected?'url(#glow-v9)':undefined}/>{front&&<><circle cx={front[0]} cy={front[1]} r="15" fill="url(#pulse-v9)" opacity=".5"/><circle cx={front[0]} cy={front[1]} r="4.5" fill={r.color} stroke="#fff1bd" strokeWidth="1.4" filter="url(#glow-v9)"/></>}</g>})}
    {visibleEvidence.map(s=>{const q=isOnFrontHemisphere(rot,[s.lon,s.lat])?projection([s.lon,s.lat]):null;if(!q)return null;const activeSite=site===s.id&&selectionType==='site';const glyph=s.kind==='fossil'?'F':s.kind==='archaeology'?'A':s.kind==='genetics'?'G':'D';return <g key={s.id} transform={`translate(${q[0]},${q[1]}) scale(${markerScale})`} opacity={activeSite?1:.9} onClick={e=>{e.stopPropagation();setSite(s.id);setSelectionType('site')}} tabIndex={0} role="button" aria-label={`Open ${s.name} evidence`} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSite(s.id);setSelectionType('site')}}} className="evidence-marker"><circle className="marker-hit" r={11} fill="transparent"/><circle r={activeSite?8:5} fill={activeSite?'#f2cf8b':'#0b1b1d'} stroke={activeSite?'#fff2c7':'#d5b36f'} strokeWidth="1.2"/><text textAnchor="middle" dominantBaseline="central" fontSize="6" fontWeight="800" fill={activeSite?'#071315':'#d9e4df'}>{glyph}</text><title>{s.name} · {s.ageLabel}</title></g>})}
   </svg>
   {visibleEvidence.length===0&&<div className="globe-empty-state" role="status"><strong>No evidence sites intersect this window ({temporalWindow.label})</strong><p>The research catalog has no documented sites overlapping this temporal window. Switch to <em>Historical evidence trail</em> to view cumulative earlier evidence, or move the time scrubber below.</p></div>}
   <div className="globe-controls" role="group" aria-label="Globe navigation controls"><button type="button" onClick={()=>setScale(s=>Math.min(275,s+18))} aria-label="Zoom in"><Plus size={14} aria-hidden="true"/></button><button type="button" onClick={()=>setScale(s=>Math.max(155,s-18))} aria-label="Zoom out"><Minus size={14} aria-hidden="true"/></button><button type="button" onClick={reset} aria-label="Reset globe view"><RotateCcw size={14} aria-hidden="true"/></button></div>
   <div className="globe-caption"><div><span className="live-dot" aria-hidden="true"/> RESEARCH MAP · {visibleEvidence.filter(s=>isOnFrontHemisphere(rot,[s.lon,s.lat])).length} SITES IN FRAME</div><strong>Drag to rotate · Ctrl + wheel to zoom</strong></div>
  </div>

  {visibleRoutes.length>0&&<div className="route-cards-section">
   <div className="route-cards-label">Documented Homo sapiens corridors ({visibleRoutes.length})</div>
   <div className="route-cards" role="region" aria-label="Dispersal corridors">{visibleRoutes.map(r=><button type="button" key={r.id} aria-pressed={r.id===active&&(selectionType==='route'||!site)} onClick={()=>{setActive(r.id);setCinematic(false);setSelectionType('route')}} className={`route-card ${r.id===active?'active':''}`}><i style={{background:r.color}} aria-hidden="true"/><div><b>{r.label}</b><small>{r.from} → {r.to} · {r.certainty} · {r.startKa}–{r.endKa} ka</small></div><MapPin size={13} aria-hidden="true"/></button>)}</div>
  </div>}

  <div className="migration-details-area">
   {site&&selectionType==='site'&&(()=>{const s=evidenceSites.find(x=>String(x.id)===site);if(!s)return null;const source=getExplorerSourceById(bootstrap,String(s.sourceIds[0]??''));const taxa=s.relatedTaxonIds.map(id=>getExplorerSpeciesById(bootstrap,String(id))?.short).filter(Boolean).join(' · ')||'Multi-taxon context';const siteCtx=siteContextMap.get(String(s.id));const siteEval=siteEvaluations.get(String(s.id));return <div className="site-detail" role="region" aria-label={`Site details: ${s.name}`}><div className="site-detail-top"><span className="detail-kind-pill">{kindLabel[s.kind]}</span><button type="button" className="detail-close-btn" onClick={()=>{setSite(null);setSelectionType(activeRoute&&selectedIsSapiens?'route':'none')}} aria-label="Close site details"><X size={15} aria-hidden="true"/></button></div><strong>{s.name}</strong><small>{s.ageLabel} · {taxa} · {s.locationPrecision==='regional'?'regional context':'site context'}</small><p>{s.note}</p><div className="site-temporal-badge">{siteCtx?.timeInterval?.estimateKind==='interval'?`Documented age interval: ${siteCtx.timeInterval.label}`:siteCtx?.timeInterval?.uncertaintyMa?`Measured age with uncertainty: ${s.ageLabel} (±${Math.round(siteCtx.timeInterval.uncertaintyMa*1000)} ka)`:siteEval?.isQualitativeOrUnbounded?`Qualitative / open-ended dating: ${s.ageLabel}`:`Point estimate: ${s.ageLabel}`}{s.id===focusSite&&activeTemporalMode==='window'&&!siteEval?.matches&&' · Retained via focused-site exception'}</div>{source?<a href={source.url} target="_blank" rel="noreferrer"><span>{source.title}</span> <ExternalLink size={11} aria-hidden="true"/></a>:<span className="site-source-missing">Source registry record unavailable.</span>}</div>})()}
   {(!site||selectionType==='route')&&selectionType!=='none'&&activeRoute&&selectedIsSapiens&&<div className="route-detail" role="region" aria-label={`Corridor details: ${activeRoute.label}`}><div className="route-detail-top"><div className="route-progress-tag"><span style={{color:activeRoute.color}} aria-hidden="true">●</span> ACTIVE CORRIDOR · {Math.round(routeProgress(activeRoute)*100)}%</div><button type="button" className="detail-close-btn" onClick={()=>setSelectionType('none')} aria-label="Close corridor details"><X size={15} aria-hidden="true"/></button></div><strong>{activeRoute.label}</strong><p>Time window: <b>{activeRoute.startKa}–{activeRoute.endKa} ka</b>. The moving point is a narrative frontier marker, not a reconstructed individual journey.</p>{activeRoute.sourceId&&getExplorerSourceById(bootstrap,activeRoute.sourceId)?(()=>{const source=getExplorerSourceById(bootstrap,activeRoute.sourceId);return <a href={source?.url} target="_blank" rel="noreferrer"><span>Open migration evidence</span> <ExternalLink size={11} aria-hidden="true"/></a>})():<span className="site-source-missing">Source registry record unavailable.</span>}</div>}
  </div>

  <div className="map-info" role="note"><Info size={14} className="map-info-icon" aria-hidden="true"/><span>{selectedIsSapiens?'':'Corridors show Homo sapiens dispersals only. '}Play the global timeline to reveal evidence chronologically. Corridors are generalized; the moving point is a narrative frontier, not an individual journey.</span></div>

  <div className="story-note"><strong>Chapter {stories.findIndex(s=>s.id===story.id)+1} · {story.title}</strong> — {story.note}</div>
 </div>
}
