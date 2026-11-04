import {geoGraticule,geoPath,type GeoPermissibleObjects,type GeoProjection} from 'd3-geo'
import type {globePalette} from '../migrationScene'
import {makeProjection,type Camera,type Insets,type ProjectionKind,type Size} from './view'

export type Palette=typeof globePalette
export type DrawBaseOptions={
  kind:ProjectionKind
  camera:Camera
  size:Size
  insets:Insets
  /** Device pixel ratio the canvas backing store was sized with. */
  dpr:number
  land:GeoPermissibleObjects|null
  /** Deep-ocean polygons. When given, the sea is drawn in two tones so the continental shelf shows. */
  shelf?:GeoPermissibleObjects|null
  palette:Palette
}

const graticule=geoGraticule().step([20,20])()
const sphere={type:'Sphere'} as const

/**
 * Draws ocean, graticule and coastline into a 2D context and returns the projection that was used, so the SVG overlay
 * (markers, corridors) can be placed with exactly the same mapping. Pure with respect to its inputs.
 */
export function drawBase(ctx:CanvasRenderingContext2D,options:DrawBaseOptions):GeoProjection{
  const {kind,camera,size,insets,dpr,land,shelf,palette}=options
  const projection=makeProjection(kind,camera,size,insets)
  const path=geoPath(projection,ctx)
  ctx.setTransform(dpr,0,0,dpr,0,0)
  ctx.clearRect(0,0,size.width,size.height)

  const [cx,cy]=projection.translate()
  const radius=projection.scale()
  let deepFill:string|CanvasGradient=palette.oceanCenter
  if(kind==='globe'){
    const ocean=ctx.createRadialGradient(cx-radius*.3,cy-radius*.34,radius*.05,cx,cy,radius)
    ocean.addColorStop(0,palette.oceanCenter)
    ocean.addColorStop(1,palette.oceanEdge)
    deepFill=ocean
  }
  ctx.beginPath()
  path(sphere)
  // With the shelf layer the whole sea starts in the shallow tone and the deep ocean is painted over it.
  ctx.fillStyle=shelf?palette.shelf:deepFill
  ctx.fill()
  if(shelf){
    ctx.beginPath()
    path(shelf)
    ctx.fillStyle=deepFill
    ctx.fill()
    ctx.strokeStyle=palette.shelfEdge
    ctx.globalAlpha=.7
    ctx.lineWidth=.8
    ctx.lineJoin='round'
    ctx.stroke()
    ctx.globalAlpha=1
  }

  ctx.beginPath()
  path(graticule)
  ctx.strokeStyle=palette.graticule
  ctx.globalAlpha=.55
  ctx.lineWidth=.6
  ctx.stroke()
  ctx.globalAlpha=1

  if(land){
    ctx.beginPath()
    path(land)
    ctx.fillStyle=palette.land
    ctx.fill()
    ctx.strokeStyle=palette.coast
    ctx.lineWidth=.8
    ctx.lineJoin='round'
    ctx.stroke()
  }

  if(kind==='globe'){
    // Limb darkening gives the disc depth without lowering the land/ocean contrast near its centre.
    ctx.save()
    ctx.beginPath()
    path(sphere)
    ctx.clip()
    const shade=ctx.createRadialGradient(cx,cy,radius*.62,cx,cy,radius)
    shade.addColorStop(0,'rgba(2,8,10,0)')
    shade.addColorStop(1,'rgba(2,8,10,.42)')
    ctx.fillStyle=shade
    ctx.fillRect(cx-radius,cy-radius,radius*2,radius*2)
    ctx.restore()
  }

  ctx.beginPath()
  path(sphere)
  ctx.strokeStyle=palette.outline
  ctx.lineWidth=1.2
  ctx.stroke()
  return projection
}
