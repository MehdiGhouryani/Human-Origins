'use client'
import {useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react'
import type {KeyboardEvent as ReactKeyboardEvent,PointerEvent as ReactPointerEvent,RefObject} from 'react'
import {DEFAULT_CAMERA,clampTilt,clampZoom,pixelsPerRadian,wrapLongitude,type Camera,type Insets,type ProjectionKind,type Size} from '../../presentation/globe/view'

const RAD_TO_DEG=180/Math.PI
const easeInOut=(t:number)=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2

type Gesture=
  |{kind:'drag';x:number;y:number;camera:Camera;perRadian:number}
  |{kind:'pinch';distance:number;zoom:number}

type Options={
  stageRef:RefObject<HTMLElement|null>
  kind:ProjectionKind
  size:Size
  insets:Insets
  reducedMotion:boolean
  /** Called when the person, not a scripted move, changes the camera. */
  onUserMove:()=>void
  onReset:()=>void
}

/** Camera state, scripted fly-to moves, and mouse/touch/keyboard gestures. Camera writes are batched to one per frame. */
export function useCamera({stageRef,kind,size,insets,reducedMotion,onUserMove,onReset}:Options){
  const [camera,setCameraState]=useState<Camera>(DEFAULT_CAMERA)
  const cameraRef=useRef(camera)
  const pending=useRef<Camera|null>(null)
  const frame=useRef<number|null>(null)
  const tween=useRef<number|null>(null)
  const pointers=useRef(new Map<number,{x:number;y:number}>())
  /** Touches that began on a marker or button: ignored as drags, but promoted if a second finger lands on the map (pinch). */
  const candidates=useRef(new Map<number,{x:number;y:number}>())
  const gesture=useRef<Gesture|null>(null)
  const moved=useRef(false)
  const [dragging,setDragging]=useState(false)
  const latest=useRef({kind,size,insets,onUserMove,onReset,reducedMotion})
  useLayoutEffect(()=>{latest.current={kind,size,insets,onUserMove,onReset,reducedMotion}})

  const commit=useCallback((next:Camera)=>{cameraRef.current=next;setCameraState(next)},[])
  const queue=useCallback((next:Camera)=>{
    cameraRef.current=next
    pending.current=next
    if(frame.current!==null) return
    frame.current=requestAnimationFrame(()=>{frame.current=null;if(pending.current) setCameraState(pending.current);pending.current=null})
  },[])
  const stopTween=useCallback(()=>{if(tween.current!==null){cancelAnimationFrame(tween.current);tween.current=null}},[])

  const flyTo=useCallback((target:Camera,duration=1100)=>{
    stopTween()
    const from=cameraRef.current
    if(latest.current.reducedMotion||duration<=0){commit({rot:[target.rot[0],clampTilt(target.rot[1])],zoom:clampZoom(target.zoom)});return}
    // Rotate by the short way round the globe.
    const deltaLon=wrapLongitude(target.rot[0]-from.rot[0])
    const start=performance.now()
    const step=(now:number)=>{
      const t=Math.min(1,(now-start)/duration)
      const e=easeInOut(t)
      commit({rot:[wrapLongitude(from.rot[0]+deltaLon*e),clampTilt(from.rot[1]+(target.rot[1]-from.rot[1])*e)],zoom:clampZoom(from.zoom*Math.pow(target.zoom/from.zoom,e))})
      tween.current=t<1?requestAnimationFrame(step):null
    }
    tween.current=requestAnimationFrame(step)
  },[commit,stopTween])

  useEffect(()=>()=>{stopTween();if(frame.current!==null) cancelAnimationFrame(frame.current)},[stopTween])

  const user=useCallback(()=>{stopTween();latest.current.onUserMove()},[stopTween])
  const zoomBy=useCallback((factor:number)=>{user();commit({...cameraRef.current,zoom:clampZoom(cameraRef.current.zoom*factor)})},[commit,user])

  // React registers wheel listeners as passive, so preventDefault() has to be attached natively. Plain scrolling is left to the page.
  useEffect(()=>{
    const node=stageRef.current
    if(!node) return
    const onWheel=(event:WheelEvent)=>{
      if(!(event.ctrlKey||event.metaKey)) return
      event.preventDefault()
      user()
      queue({...cameraRef.current,zoom:clampZoom(cameraRef.current.zoom*Math.exp(-event.deltaY*.0022))})
    }
    node.addEventListener('wheel',onWheel,{passive:false})
    return ()=>node.removeEventListener('wheel',onWheel)
  },[stageRef,queue,user])

  const beginGesture=useCallback(()=>{
    const points=[...pointers.current.values()]
    const current=latest.current
    if(points.length>=2){
      gesture.current={kind:'pinch',distance:Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)||1,zoom:cameraRef.current.zoom}
    }else if(points.length===1){
      gesture.current={kind:'drag',x:points[0].x,y:points[0].y,camera:cameraRef.current,perRadian:pixelsPerRadian(current.kind,cameraRef.current,current.size,current.insets)}
    }else gesture.current=null
  },[])

  const onPointerDown=useCallback((event:ReactPointerEvent<HTMLElement>)=>{
    // Reset first: a marker or button (data-no-drag) must still see a fresh "not dragged" state on its click.
    if(pointers.current.size===0&&candidates.current.size===0) moved.current=false
    if(event.pointerType==='mouse'&&event.button!==0) return
    if((event.target as Element).closest('[data-no-drag]')){
      if(event.pointerType==='touch') candidates.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
    if(pointers.current.size===1&&candidates.current.size>0){
      for(const [id,position] of candidates.current){
        try{event.currentTarget.setPointerCapture(id)}catch{/* the touch already ended */}
        pointers.current.set(id,position)
      }
      candidates.current.clear()
    }
    beginGesture()
  },[beginGesture])

  const onPointerMove=useCallback((event:ReactPointerEvent<HTMLElement>)=>{
    if(candidates.current.has(event.pointerId)){candidates.current.set(event.pointerId,{x:event.clientX,y:event.clientY});return}
    if(!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY})
    const active=gesture.current
    if(!active) return
    if(active.kind==='pinch'){
      const points=[...pointers.current.values()]
      if(points.length<2) return
      const distance=Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y)||1
      user();moved.current=true;setDragging(true)
      queue({...cameraRef.current,zoom:clampZoom(active.zoom*(distance/active.distance))})
      return
    }
    const dx=event.clientX-active.x
    const dy=event.clientY-active.y
    if(!moved.current&&Math.hypot(dx,dy)<4) return
    moved.current=true;setDragging(true);user()
    // Divide by the projection scale so the surface follows the finger at any zoom level.
    const degreesPerPixel=RAD_TO_DEG/active.perRadian
    queue({rot:[wrapLongitude(active.camera.rot[0]+dx*degreesPerPixel),clampTilt(active.camera.rot[1]-dy*degreesPerPixel)],zoom:active.camera.zoom})
  },[queue,user])

  const endPointer=useCallback((event:ReactPointerEvent<HTMLElement>)=>{
    if(event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    pointers.current.delete(event.pointerId)
    candidates.current.delete(event.pointerId)
    beginGesture()
    if(pointers.current.size===0) setDragging(false)
  },[beginGesture])

  const onKeyDown=useCallback((event:ReactKeyboardEvent<HTMLElement>)=>{
    if((event.target as Element)!==event.currentTarget) return
    const step=10/Math.max(1,cameraRef.current.zoom)
    const current=cameraRef.current
    let next:Camera|null=null
    if(event.key==='ArrowLeft') next={...current,rot:[wrapLongitude(current.rot[0]+step),current.rot[1]]}
    else if(event.key==='ArrowRight') next={...current,rot:[wrapLongitude(current.rot[0]-step),current.rot[1]]}
    else if(event.key==='ArrowUp') next={...current,rot:[current.rot[0],clampTilt(current.rot[1]+step)]}
    else if(event.key==='ArrowDown') next={...current,rot:[current.rot[0],clampTilt(current.rot[1]-step)]}
    else if(event.key==='+'||event.key==='=') next={...current,zoom:clampZoom(current.zoom*1.3)}
    else if(event.key==='-'||event.key==='_') next={...current,zoom:clampZoom(current.zoom/1.3)}
    else if(event.key==='0'){event.preventDefault();latest.current.onReset();return}
    if(!next) return
    event.preventDefault();user();commit(next)
  },[commit,user])

  const handlers=useMemo(()=>({onPointerDown,onPointerMove,onPointerUp:endPointer,onPointerCancel:endPointer,onKeyDown}),[onPointerDown,onPointerMove,endPointer,onKeyDown])
  /** True when the last pointer interaction was a drag, so a following click should not select anything. */
  const wasDrag=useCallback(()=>moved.current,[])
  return {camera,cameraRef,commit,flyTo,zoomBy,handlers,dragging,wasDrag}
}
