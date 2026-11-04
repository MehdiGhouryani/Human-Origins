'use client'
import {useLayoutEffect,useRef} from 'react'
import type {GeoPermissibleObjects} from 'd3-geo'
import {drawBase,type Palette} from '../../presentation/globe/drawBase'
import type {Camera,Insets,ProjectionKind,Size} from '../../presentation/globe/view'

type Props={kind:ProjectionKind;camera:Camera;size:Size;insets:Insets;land:GeoPermissibleObjects|null;shelf?:GeoPermissibleObjects|null;palette:Palette}

/** Base map on a 2D canvas: thousands of coastline vertices redraw cheaply, which an SVG path per frame cannot do on phones. */
export default function GlobeCanvas({kind,camera,size,insets,land,shelf,palette}:Props){
  const ref=useRef<HTMLCanvasElement>(null)
  useLayoutEffect(()=>{
    const canvas=ref.current
    if(!canvas||size.width<=0||size.height<=0) return
    const dpr=Math.min(2,window.devicePixelRatio||1)
    const width=Math.round(size.width*dpr)
    const height=Math.round(size.height*dpr)
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
    const ctx=canvas.getContext('2d')
    if(!ctx) return
    drawBase(ctx,{kind,camera,size,insets,dpr,land,shelf,palette})
  },[kind,camera,size,insets,land,shelf,palette])
  return <canvas ref={ref} className="atlas-canvas" aria-hidden="true"/>
}
