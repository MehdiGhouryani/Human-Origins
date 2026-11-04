import {geoEqualEarth,geoOrthographic,type GeoProjection} from 'd3-geo'

export type ProjectionKind='globe'|'flat'
/** `rot` follows d3: [lambda, phi] is the NEGATED centre, so centre longitude = -rot[0] and centre latitude = -rot[1]. */
export type Camera={rot:[number,number];zoom:number}
export type Size={width:number;height:number}
/** Pixels reserved by overlays. The projection centres inside what is left, so the Earth is never hidden under a panel. */
export type Insets={top:number;bottom:number}

export const ZOOM_MIN=.85
export const ZOOM_MAX=12
export const DEFAULT_CAMERA:Camera={rot:[-20,-8],zoom:1}
/** Above this zoom the 1:50m coastline replaces 1:110m. */
export const DETAIL_ZOOM=2

export const clampZoom=(zoom:number)=>Math.min(ZOOM_MAX,Math.max(ZOOM_MIN,zoom))
export const clampTilt=(lat:number)=>Math.max(-80,Math.min(80,lat))
export const wrapLongitude=(lon:number)=>((((lon+180)%360)+360)%360)-180

/** Camera that centres a longitude/latitude. */
export const cameraFor=(lon:number,lat:number,zoom:number):Camera=>({rot:[wrapLongitude(-lon),clampTilt(-lat)],zoom:clampZoom(zoom)})
export const centreOf=(camera:Camera):[number,number]=>[wrapLongitude(-camera.rot[0]),-camera.rot[1]]

export function freeArea(size:Size,insets:Insets){
  const top=Math.max(0,insets.top)
  const height=Math.max(80,size.height-top-Math.max(0,insets.bottom))
  return {top,height,centreY:top+height/2,centreX:size.width/2}
}

/** Globe radius at zoom 1: the Earth fills 92% of the free area. */
export function baseRadius(size:Size,insets:Insets={top:0,bottom:0}):number{
  const area=freeArea(size,insets)
  return Math.max(60,Math.min(size.width,area.height)*.46)
}

export function makeProjection(kind:ProjectionKind,camera:Camera,size:Size,insets:Insets={top:0,bottom:0}):GeoProjection{
  const area=freeArea(size,insets)
  if(kind==='globe'){
    return geoOrthographic().translate([area.centreX,area.centreY]).scale(baseRadius(size,insets)*camera.zoom).rotate([camera.rot[0],camera.rot[1]]).clipAngle(90).precision(.4)
  }
  const fitted=geoEqualEarth().fitSize([size.width,area.height],{type:'Sphere'})
  const unit=fitted.scale()
  return geoEqualEarth().scale(unit*camera.zoom).translate([area.centreX,area.centreY]).rotate([camera.rot[0],0]).center([0,-camera.rot[1]]).precision(.4)
}

/** Radius in px of the Earth's disc (globe) or pixels per radian at the equator (flat). Used to size drag gestures. */
export function pixelsPerRadian(kind:ProjectionKind,camera:Camera,size:Size,insets:Insets):number{
  return makeProjection(kind,camera,size,insets).scale()
}

export type LandDetail='110m'|'50m'
export const landDetailFor=(zoom:number,settled:boolean,has50m:boolean):LandDetail=>zoom>=DETAIL_ZOOM&&settled&&has50m?'50m':'110m'

/** Great-circle test: is the point on the visible hemisphere of a globe with this camera? */
export function onVisibleHemisphere(camera:Camera,lon:number,lat:number):boolean{
  const [cLon,cLat]=centreOf(camera)
  const toRad=Math.PI/180
  const cos=Math.sin(cLat*toRad)*Math.sin(lat*toRad)+Math.cos(cLat*toRad)*Math.cos(lat*toRad)*Math.cos((lon-cLon)*toRad)
  return cos>=0
}
