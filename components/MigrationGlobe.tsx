'use client'
import {useCallback,useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react'
import {geoPath,type GeoPermissibleObjects} from 'd3-geo'
import {Info,Layers3,List,Map as FlatMapIcon,Globe2,Minus,Plus,RotateCcw,ChevronUp} from 'lucide-react'
import {getExplorerEvidenceSites,getExplorerSourceById,getExplorerSpeciesById} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {EvidenceKind} from '../domain/contracts'
import {maToKa,formatAgeMa,getExploratoryTemporalWindow,evaluateSiteWindowOverlap,type TemporalMode} from '../domain/time'
import {routes,globePalette} from '../presentation/migrationScene'
import {SCENE_COUNT,advanceFraction,fractionToKa,kaToFraction,sceneIndexAtKa,sceneStartFraction,scenes} from '../presentation/migrationTimeline'
import {loadLand} from '../presentation/globe/land'
import {clusterPins,type Pin} from '../presentation/globe/cluster'
import {sliceRoute,smoothRoute,type LonLat} from '../presentation/globe/routes'
import {ZOOM_MAX,cameraFor,landDetailFor,makeProjection,onVisibleHemisphere,type Insets,type ProjectionKind,type Size} from '../presentation/globe/view'
import GlobeCanvas from './migration/GlobeCanvas'
import AtlasDock from './migration/AtlasDock'
import {RouteCard,SceneCard,SiteCard} from './migration/AtlasCard'
import {AboutPanel,LayersPanel,SitesPanel,type SiteListItem} from './migration/AtlasPanels'
import {KIND_META,KIND_ORDER,shapePath} from './migration/kinds'
import {useCamera} from './migration/useCamera'

type PanelId='layers'|'sites'|'about'
type Selection={type:'site'|'route';id:string}
export type SpeciesOption={id:string;label:string}
type Props={
  bootstrap:ExplorerBootstrap
  /** Age of the map's moment, in Ma. */
  time:number
  selected:string
  speciesOptions:SpeciesOption[]
  onSelectSpecies:(id:string)=>void
  onTimeChange:(ageMa:number)=>void
  focusSite?:string|null
  onFocused?:()=>void
  temporalMode?:TemporalMode
  onTemporalModeChange?:(mode:TemporalMode)=>void
}

const SPEEDS=[1,1.5,2,.5]
const COMPACT_BELOW=640
/** Zoom 1 shows the whole world on the flat map, so scenes need a larger factor than on the globe. */
const FLAT_ZOOM_FACTOR=1.7
const smoothedRoutes=new Map(routes.map(route=>[route.id,smoothRoute(route.points as LonLat[])]))
const lineString=(coordinates:LonLat[]):GeoPermissibleObjects=>({type:'LineString',coordinates})

const REDUCED_MOTION='(prefers-reduced-motion: reduce)'
function usePrefersReducedMotion(){
  return useSyncExternalStore(
    notify=>{const query=window.matchMedia(REDUCED_MOTION);query.addEventListener('change',notify);return ()=>query.removeEventListener('change',notify)},
    ()=>window.matchMedia(REDUCED_MOTION).matches,
    ()=>false,
  )
}

export default function MigrationGlobe({bootstrap,time,selected,speciesOptions,onSelectSpecies,onTimeChange,focusSite,onFocused,temporalMode:propTemporalMode,onTemporalModeChange}:Props){
  const stageRef=useRef<HTMLDivElement>(null)
  const [size,setSize]=useState<Size>({width:0,height:0})
  const [projectionKind,setProjectionKind]=useState<ProjectionKind>('globe')
  const [ka,setKa]=useState(()=>maToKa(time))
  const [playing,setPlaying]=useState(false)
  const [speedIndex,setSpeedIndex]=useState(0)
  const [follow,setFollow]=useState(true)
  const [focusToken,setFocusToken]=useState(0)
  const [panel,setPanel]=useState<PanelId|null>(null)
  const [kindsOn,setKindsOn]=useState<Set<EvidenceKind>>(()=>new Set(KIND_ORDER))
  const [routesOn,setRoutesOn]=useState(true)
  const [selection,setSelection]=useState<Selection|null>(null)
  const [cardPreference,setCardPreference]=useState<boolean|null>(null)
  const [land110,setLand110]=useState<GeoPermissibleObjects|null>(null)
  const [land50,setLand50]=useState<GeoPermissibleObjects|null>(null)
  const [internalTemporalMode,setInternalTemporalMode]=useState<TemporalMode>(propTemporalMode??'trail')
  const reducedMotion=usePrefersReducedMotion()
  const temporalMode=propTemporalMode??internalTemporalMode
  const setTemporalMode=(mode:TemporalMode)=>{setInternalTemporalMode(mode);onTemporalModeChange?.(mode)}

  // ---- size and layout
  useEffect(()=>{
    const node=stageRef.current
    if(!node||typeof ResizeObserver==='undefined') return
    const observer=new ResizeObserver(([entry])=>{
      const {width,height}=entry.contentRect
      setSize(previous=>Math.abs(previous.width-width)<.5&&Math.abs(previous.height-height)<.5?previous:{width,height})
    })
    observer.observe(node)
    return ()=>observer.disconnect()
  },[])
  const compact=size.width>0&&size.width<COMPACT_BELOW
  // Phones start with the details folded away; whatever the person chooses afterwards wins.
  const cardOpen=cardPreference??!compact
  const insets=useMemo<Insets>(()=>compact?{top:62,bottom:150}:{top:68,bottom:96},[compact])

  // ---- camera
  const resetRef=useRef<()=>void>(()=>undefined)
  const {camera,flyTo,zoomBy,handlers,dragging,wasDrag}=useCamera({stageRef,kind:projectionKind,size,insets,reducedMotion,onUserMove:()=>setFollow(false),onReset:()=>resetRef.current()})
  const projection=useMemo(()=>makeProjection(projectionKind,camera,size,insets),[projectionKind,camera,size,insets])
  const [settledCamera,setSettledCamera]=useState<typeof camera|null>(null)

  // ---- coastline data (110m immediately, 50m when idle and affordable)
  useEffect(()=>{
    let cancelled=false
    loadLand('110m').then(land=>{if(!cancelled) setLand110(land)}).catch(()=>undefined)
    const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection
    const lean=Boolean(connection?.saveData)||/(^|-)2g$/.test(connection?.effectiveType??'')
    const idleWindow=window as Window&{requestIdleCallback?:(callback:()=>void)=>number}
    const idle=(callback:()=>void)=>(idleWindow.requestIdleCallback?idleWindow.requestIdleCallback(callback):window.setTimeout(callback,1200))
    if(!lean) idle(()=>{loadLand('50m').then(land=>{if(!cancelled) setLand50(land)}).catch(()=>undefined)})
    return ()=>{cancelled=true}
  },[])
  // "Settled" = the camera has not changed for a moment. While it moves, the light coastline keeps frames cheap.
  useEffect(()=>{
    const timer=window.setTimeout(()=>setSettledCamera(camera),160)
    return ()=>window.clearTimeout(timer)
  },[camera])
  const settled=settledCamera===camera
  const land=landDetailFor(camera.zoom,settled,Boolean(land50))==='50m'?land50:land110

  // ---- time: local to the story, mirrored to the shared URL state
  const lastEmitted=useRef<number|null>(null)
  const emitTimer=useRef<number|null>(null)
  const emit=useCallback((nextKa:number)=>{
    const ageMa=nextKa/1000
    lastEmitted.current=ageMa
    onTimeChange(ageMa)
  },[onTimeChange])
  const emitSoon=useCallback((nextKa:number)=>{
    if(emitTimer.current!==null) window.clearTimeout(emitTimer.current)
    emitTimer.current=window.setTimeout(()=>{emitTimer.current=null;emit(nextKa)},180)
  },[emit])
  useEffect(()=>()=>{if(emitTimer.current!==null) window.clearTimeout(emitTimer.current)},[])
  // The `time` prop comes back to us after every emit. That echo is ignored once; any other value (browser Back/Forward,
  // a typed URL, another view) is an outside change and moves the story. Clearing the marker is what lets a later
  // Forward to the very same moment still be recognised as outside.
  useEffect(()=>{
    const echo=lastEmitted.current!==null&&Math.abs(time-lastEmitted.current)<1e-7
    lastEmitted.current=null
    if(echo) return
    setKa(maToKa(time))
  },[time])

  const fraction=kaToFraction(ka)
  const fractionRef=useRef(fraction)
  useEffect(()=>{fractionRef.current=fraction},[fraction])
  const sceneIndex=sceneIndexAtKa(ka)
  const scene=scenes[sceneIndex]
  const speed=SPEEDS[speedIndex]

  useEffect(()=>{
    if(!playing) return
    let raf=0
    let last=performance.now()
    let lastEmit=last
    const tick=(now:number)=>{
      const step=advanceFraction(fractionRef.current,Math.min(100,now-last),speed)
      last=now
      fractionRef.current=step.fraction
      const nextKa=fractionToKa(step.fraction)
      setKa(nextKa)
      if(step.ended){setPlaying(false);emit(nextKa);return}
      if(now-lastEmit>250){lastEmit=now;emit(nextKa)}
      raf=requestAnimationFrame(tick)
    }
    raf=requestAnimationFrame(tick)
    return ()=>cancelAnimationFrame(raf)
  },[playing,speed,emit])

  const seek=useCallback((nextFraction:number)=>{
    const nextKa=fractionToKa(nextFraction)
    fractionRef.current=nextFraction
    setKa(nextKa)
    emitSoon(nextKa)
  },[emitSoon])
  const jumpToScene=useCallback((index:number)=>{
    // A scene boundary belongs to the older scene, so land just inside the requested one.
    const target=Math.min(.999999,sceneStartFraction(index)+(index>0?.002/SCENE_COUNT:0))
    const nextKa=fractionToKa(target)
    fractionRef.current=target
    setKa(nextKa);emit(nextKa)
    setFollow(true);setFocusToken(token=>token+1)
  },[emit])
  const togglePlay=()=>{
    if(playing){setPlaying(false);emit(fractionToKa(fractionRef.current));return}
    if(fractionRef.current>=.9999){fractionRef.current=0;setKa(fractionToKa(0))}
    setFollow(true);setFocusToken(token=>token+1)
    setPlaying(true)
  }

  // ---- scene camera
  const lastKey=useRef<string|null>(null)
  useEffect(()=>{
    if(size.width<=0) return
    const key=`${sceneIndex}:${focusToken}:${projectionKind}`
    const first=lastKey.current===null
    if(lastKey.current===key) return
    lastKey.current=key
    if(!first&&!follow) return
    const target=scenes[sceneIndex]
    flyTo(cameraFor(target.focus[0],target.focus[1],target.zoom*(projectionKind==='flat'?FLAT_ZOOM_FACTOR:1)),first?0:1200)
  },[sceneIndex,focusToken,projectionKind,follow,size.width,flyTo])
  const resetView=useCallback(()=>{
    setFollow(true);setFocusToken(token=>token+1)
    const target=scenes[sceneIndexAtKa(fractionToKa(fractionRef.current))]
    flyTo(cameraFor(target.focus[0],target.focus[1],target.zoom*(projectionKind==='flat'?FLAT_ZOOM_FACTOR:1)),700)
  },[flyTo,projectionKind])
  useEffect(()=>{resetRef.current=resetView},[resetView])

  // ---- evidence
  const evidenceSites=getExplorerEvidenceSites(bootstrap)
  const timeMa=ka/1000
  const temporalWindow=useMemo(()=>getExploratoryTemporalWindow(timeMa),[timeMa])
  const siteContextMap=useMemo(()=>new Map(bootstrap.siteContexts.map(context=>[String(context.siteId),context])),[bootstrap.siteContexts])
  const selectedSiteId=selection?.type==='site'?selection.id:null
  const siteEvaluations=useMemo(()=>{
    const map=new Map<string,ReturnType<typeof evaluateSiteWindowOverlap>>()
    for(const site of evidenceSites) map.set(String(site.id),evaluateSiteWindowOverlap(site.ageKa,siteContextMap.get(String(site.id))?.timeInterval,temporalWindow,String(site.id)===selectedSiteId))
    return map
  },[evidenceSites,siteContextMap,temporalWindow,selectedSiteId])
  const visibleEvidence=useMemo(()=>evidenceSites
    .filter(site=>kindsOn.has(site.kind))
    .filter(site=>String(site.id)===selectedSiteId||(temporalMode==='trail'?site.ageKa>=ka:siteEvaluations.get(String(site.id))?.matches??false)),
  [evidenceSites,kindsOn,selectedSiteId,temporalMode,ka,siteEvaluations])
  const excludedCount=useMemo(()=>temporalMode!=='window'?0:evidenceSites.filter(site=>kindsOn.has(site.kind)&&siteEvaluations.get(String(site.id))?.isQualitativeOrUnbounded&&String(site.id)!==selectedSiteId).length,[temporalMode,evidenceSites,kindsOn,siteEvaluations,selectedSiteId])
  const highlightExists=useMemo(()=>evidenceSites.some(site=>site.relatedTaxonIds.some(id=>String(id)===selected)),[evidenceSites,selected])

  // ---- corridors (Homo sapiens only, BUG-74)
  const routesAvailable=selected==='sapiens'
  const visibleRoutes=useMemo(()=>routesAvailable&&routesOn?routes.filter(route=>ka<=route.startKa&&ka>=route.endKa):[],[routesAvailable,routesOn,ka])
  const activeRoute=visibleRoutes.find(route=>route.id===scene.route)??visibleRoutes[0]
  const routeProgress=(startKa:number,endKa:number)=>Math.max(0,Math.min(1,(startKa-ka)/Math.max(1,startKa-endKa)))
  const routeShapes=useMemo(()=>{
    const generator=geoPath(projection)
    return visibleRoutes.map(route=>{
      const full=smoothedRoutes.get(route.id)??[]
      const progress=routeProgress(route.startKa,route.endKa)
      const head=sliceRoute(full,progress)
      return {route,progress,ghost:generator(lineString(full))??'',drawn:head.length>1?generator(lineString(head))??'':''}
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[projection,visibleRoutes,ka])

  // ---- markers, clustered in screen space
  const pins=useMemo(()=>{
    const out:(Pin&{lon:number;lat:number})[]=[]
    for(const site of visibleEvidence){
      if(projectionKind==='globe'&&!onVisibleHemisphere(camera,site.lon,site.lat)) continue
      const point=projection([site.lon,site.lat])
      if(!point) continue
      out.push({id:String(site.id),x:point[0],y:point[1],lon:site.lon,lat:site.lat,sticky:String(site.id)===selectedSiteId})
    }
    return out
  },[visibleEvidence,projection,projectionKind,camera,selectedSiteId])
  const clusters=useMemo(()=>clusterPins(pins,compact?26:22),[pins,compact])
  const siteById=useMemo(()=>new Map(evidenceSites.map(site=>[String(site.id),site])),[evidenceSites])
  const pulseKa=Math.max(2,(scene.fromKa-scene.toKa)*.04)

  // ---- selection helpers
  const selectSite=useCallback((id:string)=>{setSelection({type:'site',id});setCardPreference(true);setPanel(null)},[])
  const flyToSite=useCallback((id:string,zoom=3.2)=>{
    const site=evidenceSites.find(item=>String(item.id)===id)
    if(!site) return
    setFollow(false)
    flyTo(cameraFor(site.lon,site.lat,Math.min(ZOOM_MAX,zoom)),900)
  },[evidenceSites,flyTo])
  // A focus request from outside (e.g. "Map range" in the profile). Applied on the next frame, once the stage has a size.
  const stageReady=size.width>0
  useEffect(()=>{
    if(!focusSite||!stageReady) return
    const frame=requestAnimationFrame(()=>{
      const site=evidenceSites.find(item=>String(item.id)===focusSite)
      if(site){selectSite(String(site.id));flyToSite(String(site.id))}
      onFocused?.()
    })
    return ()=>cancelAnimationFrame(frame)
  },[focusSite,stageReady,evidenceSites,selectSite,flyToSite,onFocused])
  const onStageClick=(event:React.MouseEvent<HTMLDivElement>)=>{
    if(wasDrag()) return
    if((event.target as Element).closest('[data-no-drag],.evidence-marker,.migration-route')) return
    setSelection(null);setPanel(null)
  }
  const onClusterClick=(cluster:{x:number;y:number}|undefined)=>{
    if(!cluster||wasDrag()) return
    const lonLat=projection.invert?.([cluster.x,cluster.y])
    if(!lonLat) return
    setFollow(false)
    flyTo(cameraFor(lonLat[0],lonLat[1],Math.min(ZOOM_MAX,camera.zoom*2.4)),700)
  }

  // ---- panels
  const togglePanel=(id:PanelId)=>setPanel(current=>current===id?null:id)
  useEffect(()=>{
    if(!panel) return
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape') setPanel(null)}
    window.addEventListener('keydown',onKey)
    return ()=>window.removeEventListener('keydown',onKey)
  },[panel])
  const toggleKind=(kind:EvidenceKind)=>setKindsOn(previous=>{const next=new Set(previous);if(next.has(kind)) next.delete(kind);else next.add(kind);return next})
  const siteItems:SiteListItem[]=useMemo(()=>[...visibleEvidence].sort((a,b)=>b.ageKa-a.ageKa).map(site=>({id:String(site.id),name:site.name,ageLabel:site.ageLabel,kind:site.kind,selected:String(site.id)===selectedSiteId})),[visibleEvidence,selectedSiteId])

  // ---- detail card
  const card=(()=>{
    if(selection?.type==='site'){
      const site=siteById.get(selection.id)
      if(site){
        const source=getExplorerSourceById(bootstrap,String(site.sourceIds[0]??''))
        const taxa=site.relatedTaxonIds.map(id=>getExplorerSpeciesById(bootstrap,String(id))?.short).filter(Boolean).join(' · ')||'Multi-taxon context'
        const context=siteContextMap.get(String(site.id))
        const evaluation=siteEvaluations.get(String(site.id))
        const dating=context?.timeInterval?.estimateKind==='interval'?`Documented age interval: ${context.timeInterval.label}`
          :context?.timeInterval?.uncertaintyMa?`Measured age with uncertainty: ${site.ageLabel} (±${Math.round(context.timeInterval.uncertaintyMa*1000)} ka)`
          :evaluation?.isQualitativeOrUnbounded?`Qualitative / open-ended dating: ${site.ageLabel}`:`Point estimate: ${site.ageLabel}`
        return <SiteCard kind={site.kind} kindLabel={KIND_META[site.kind].label} name={site.name} meta={`${site.ageLabel} · ${taxa} · ${site.locationPrecision==='regional'?'regional context':'site context'}`} note={site.note} dating={dating} sourceTitle={source?.title} sourceUrl={source?.url} onClose={()=>setSelection(null)}/>
      }
    }
    if(selection?.type==='route'&&activeRoute){
      const source=activeRoute.sourceId?getExplorerSourceById(bootstrap,activeRoute.sourceId):undefined
      return <RouteCard label={activeRoute.label} color={activeRoute.color} percent={Math.round(routeProgress(activeRoute.startKa,activeRoute.endKa)*100)} window={`${activeRoute.startKa}–${activeRoute.endKa} ka`} sourceTitle={source?.title} sourceUrl={source?.url} onClose={()=>setSelection(null)}/>
    }
    return <SceneCard index={sceneIndex} count={SCENE_COUNT} title={scene.title} subtitle={scene.subtitle} note={scene.note} following={follow} onFocus={()=>{setFollow(true);setFocusToken(token=>token+1)}}/>
  })()
  const cardTitle=selection?.type==='site'?siteById.get(selection.id)?.name:selection?.type==='route'?activeRoute?.label:scene.title

  const ready=size.width>0&&size.height>0
  const stageClass=`atlas-stage${compact?' compact':''}${dragging?' dragging':''}${camera.zoom>1.3?' exploring':''}${playing?' playing':''}`
  const readout=formatAgeMa(timeMa)

  return <div className="migration-view atlas" data-projection={projectionKind}>
    {/* The page hero (and its h1) is hidden in this view, so the map names itself. */}
    <h1 className="sr-only">Human migration atlas: where the evidence places our species through time</h1>
    <div ref={stageRef} className={stageClass} tabIndex={0} data-zoom={camera.zoom.toFixed(2)} data-lon={(-camera.rot[0]).toFixed(1)} data-lat={(-camera.rot[1]).toFixed(1)} role="group" aria-roledescription="interactive map" aria-label="Human migration map. Arrow keys rotate, plus and minus zoom, 0 resets." onClick={onStageClick} onDoubleClick={()=>zoomBy(1.6)} {...handlers}>
      {ready&&<>
        <GlobeCanvas kind={projectionKind} camera={camera} size={size} insets={insets} land={land} palette={globePalette}/>
        <svg className="globe-map atlas-overlay" viewBox={`0 0 ${size.width} ${size.height}`} role="group" aria-labelledby="migration-globe-title migration-globe-desc">
          <title id="migration-globe-title">Human migration map</title>
          <desc id="migration-globe-desc">Documented evidence sites and generalized Homo sapiens dispersal corridors on a {projectionKind==='globe'?'rotatable globe':'flat world map'}. Every site is also listed in the Sites panel.</desc>
          {routeShapes.map(({route,ghost,drawn})=>{
            const isActive=activeRoute?.id===route.id
            return <g key={route.id} className="migration-route" data-no-drag role="button" tabIndex={0} aria-label={`Corridor: ${route.label}`} aria-pressed={selection?.type==='route'&&isActive} onClick={()=>{setSelection({type:'route',id:route.id});setCardPreference(true)}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelection({type:'route',id:route.id});setCardPreference(true)}}}>
              <path d={ghost} className="route-hit" fill="none" stroke="transparent" strokeWidth={22}/>
              <path d={ghost} fill="none" stroke={route.color} strokeOpacity={.2} strokeWidth={isActive?16:11} strokeLinecap="round" strokeLinejoin="round"/>
              <path d={ghost} fill="none" stroke={route.color} strokeOpacity={.3} strokeWidth={1.4} strokeDasharray="2 6" strokeLinecap="round"/>
              {drawn&&<><path d={drawn} fill="none" stroke={globePalette.routeCasing} strokeOpacity={.8} strokeWidth={(isActive?4:2.6)+3} strokeLinecap="round" strokeLinejoin="round"/>
              <path d={drawn} fill="none" stroke={route.color} strokeWidth={isActive?4:2.6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={route.certainty==='possible'?'2 7':undefined}/></>}
            </g>
          })}
          {clusters.map(cluster=>{
            if(cluster.ids.length>1) return <g key={cluster.id} className="evidence-cluster" data-no-drag role="button" tabIndex={0} transform={`translate(${cluster.x.toFixed(1)} ${cluster.y.toFixed(1)})`} aria-label={`${cluster.ids.length} evidence sites close together. Activate to zoom in.`} onClick={()=>onClusterClick(cluster)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onClusterClick(cluster)}}}>
              <circle r={15} className="hit" fill="transparent"/><circle r={11} fill="#0b1b1d" stroke="#d9e4df" strokeWidth={1.6}/><text textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="#eee8dc">{cluster.ids.length}</text>
            </g>
            const site=siteById.get(cluster.ids[0])
            if(!site) return null
            const meta=KIND_META[site.kind]
            const isSelected=String(site.id)===selectedSiteId
            const dim=highlightExists&&!site.relatedTaxonIds.some(id=>String(id)===selected)&&!isSelected
            const fresh=playing&&temporalMode==='trail'&&site.ageKa-ka<=pulseKa
            return <g key={cluster.id} className={`evidence-marker${isSelected?' selected':''}${dim?' dim':''}${fresh?' fresh':''}`} data-no-drag role="button" tabIndex={0} transform={`translate(${cluster.x.toFixed(1)} ${cluster.y.toFixed(1)})`} aria-label={`${meta.label}: ${site.name}, ${site.ageLabel}`} aria-pressed={isSelected} onClick={()=>{if(!wasDrag()) selectSite(String(site.id))}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectSite(String(site.id))}}}>
              <circle r={16} className="hit" fill="transparent"/>
              {isSelected&&<circle r={14} fill="none" stroke="#eee8dc" strokeWidth={1.5}/>}
              {fresh&&<circle className="pulse" r={9} fill="none" stroke={meta.color} strokeWidth={2}/>}
              <path d={shapePath(meta.shape,6.5)} fill={meta.color} stroke="#031013" strokeWidth={2} paintOrder="stroke"/>
            </g>
          })}
        </svg>
      </>}

      <div className="atlas-top" data-no-drag>
        <div className="atlas-scene-chip"><span className="atlas-kicker">SCENE {sceneIndex+1} / {SCENE_COUNT}</span><strong>{scene.title}</strong></div>
        {!compact&&<label className="atlas-species"><span>Species</span>
          <select value={selected} onChange={event=>onSelectSpecies(event.target.value)} aria-label="Highlight species">{speciesOptions.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}</select></label>}
        <div className="atlas-tools" role="toolbar" aria-label="Map panels">
          <button type="button" onClick={()=>togglePanel('layers')} className={`atlas-icon-btn${panel==='layers'?' on':''}`} aria-label="Layers" aria-expanded={panel==='layers'}><Layers3 size={18} aria-hidden="true"/></button>
          <button type="button" onClick={()=>togglePanel('sites')} className={`atlas-icon-btn${panel==='sites'?' on':''}`} aria-label="Sites list" aria-expanded={panel==='sites'}><List size={18} aria-hidden="true"/></button>
          <button type="button" onClick={()=>togglePanel('about')} className={`atlas-icon-btn${panel==='about'?' on':''}`} aria-label="About this map" aria-expanded={panel==='about'}><Info size={18} aria-hidden="true"/></button>
        </div>
      </div>

      <div className="atlas-zoom" data-no-drag role="group" aria-label="Map view">
        <button type="button" onClick={()=>zoomBy(1.5)} className="atlas-icon-btn" aria-label="Zoom in"><Plus size={18} aria-hidden="true"/></button>
        <button type="button" onClick={()=>zoomBy(1/1.5)} className="atlas-icon-btn" aria-label="Zoom out"><Minus size={18} aria-hidden="true"/></button>
        <button type="button" onClick={resetView} className="atlas-icon-btn" aria-label="Reset view"><RotateCcw size={17} aria-hidden="true"/></button>
        <button type="button" onClick={()=>setProjectionKind(kind=>kind==='globe'?'flat':'globe')} className="atlas-icon-btn" aria-label={projectionKind==='globe'?'Switch to flat map':'Switch to globe'}>{projectionKind==='globe'?<FlatMapIcon size={17} aria-hidden="true"/>:<Globe2 size={17} aria-hidden="true"/>}</button>
      </div>

      {panel&&<div className="atlas-panel-slot" data-no-drag>
        {panel==='layers'&&<LayersPanel kindsOn={kindsOn} onToggleKind={toggleKind} routesOn={routesOn} routesAvailable={routesAvailable} onToggleRoutes={()=>setRoutesOn(value=>!value)} temporalMode={temporalMode} onTemporalMode={setTemporalMode} windowLabel={temporalWindow.label} excludedCount={excludedCount} projection={projectionKind} onProjection={setProjectionKind} species={compact?{value:selected,options:speciesOptions,onChange:onSelectSpecies}:undefined} onClose={()=>setPanel(null)}/>}
        {panel==='sites'&&<SitesPanel items={siteItems} onPick={id=>{selectSite(id);flyToSite(id,Math.max(camera.zoom,2.4))}} onClose={()=>setPanel(null)}/>}
        {panel==='about'&&<AboutPanel onClose={()=>setPanel(null)}/>}
      </div>}

      <div className="atlas-bottom" data-no-drag>
        {compact&&!cardOpen?<button type="button" onClick={()=>setCardPreference(true)} className="atlas-card-collapsed" aria-expanded="false"><span>{cardTitle}</span><ChevronUp size={16} aria-hidden="true"/></button>
          :<div className="atlas-card-wrap">{compact&&<button type="button" onClick={()=>setCardPreference(false)} className="atlas-card-fold" aria-label="Collapse details">Hide</button>}{card}</div>}
        <AtlasDock fraction={fraction} sceneIndex={sceneIndex} playing={playing} speed={speed} readout={readout} onPlay={togglePlay} onSeek={seek} onScene={jumpToScene} onSpeed={()=>setSpeedIndex(index=>(index+1)%SPEEDS.length)}/>
      </div>
    </div>
    <p className="sr-only" aria-live="polite">{`Scene ${sceneIndex+1} of ${SCENE_COUNT}: ${scene.title}. ${visibleEvidence.length} evidence sites shown.`}</p>
  </div>
}
