import {geoDistance,geoInterpolate} from 'd3-geo'

export type LonLat=[number,number]

/** Makes longitudes continuous across the antimeridian (…170, -165 → …170, 195) so interpolation does not cross the whole map. */
export function unwrapLongitudes(points:readonly LonLat[]):LonLat[]{
  const out:LonLat[]=[]
  for(const [lon,lat] of points){
    if(!out.length){out.push([lon,lat]);continue}
    let next=lon
    const previous=out[out.length-1][0]
    while(next-previous>180) next-=360
    while(next-previous<-180) next+=360
    out.push([next,lat])
  }
  return out
}
const wrapLon=(lon:number)=>((((lon+180)%360)+360)%360)-180

/**
 * Display-only smoothing (Chaikin corner cutting) of a schematic corridor. Endpoints are kept exactly. The source
 * waypoints are generalized to begin with, so rounding the corners does not add or remove any claim.
 */
export function smoothRoute(points:readonly LonLat[],iterations=2):LonLat[]{
  if(points.length<3) return points.map(point=>[point[0],point[1]] as LonLat)
  let current=unwrapLongitudes(points)
  for(let step=0;step<iterations;step++){
    const next:LonLat[]=[current[0]]
    for(let index=0;index<current.length-1;index++){
      const [aLon,aLat]=current[index]
      const [bLon,bLat]=current[index+1]
      next.push([aLon*.75+bLon*.25,aLat*.75+bLat*.25],[aLon*.25+bLon*.75,aLat*.25+bLat*.75])
    }
    next.push(current[current.length-1])
    current=next
  }
  return current.map(([lon,lat])=>[wrapLon(lon),lat] as LonLat)
}

/** Length in radians along great-circle legs. */
export function routeLength(points:readonly LonLat[]):number{
  let total=0
  for(let index=1;index<points.length;index++) total+=geoDistance(points[index-1],points[index])
  return total
}

/** Leading part of a route, `fraction` (0..1) of its great-circle length. Always returns at least one point. */
export function sliceRoute(points:readonly LonLat[],fraction:number):LonLat[]{
  if(!points.length) return []
  if(fraction>=1) return points.map(point=>[point[0],point[1]] as LonLat)
  if(fraction<=0||points.length===1) return [[points[0][0],points[0][1]]]
  const total=routeLength(points)
  if(total===0) return [[points[0][0],points[0][1]]]
  let remaining=fraction*total
  const out:LonLat[]=[[points[0][0],points[0][1]]]
  for(let index=1;index<points.length;index++){
    const leg=geoDistance(points[index-1],points[index])
    if(remaining>=leg){out.push([points[index][0],points[index][1]]);remaining-=leg;continue}
    const along=geoInterpolate(points[index-1],points[index])(leg===0?0:remaining/leg)
    out.push([along[0],along[1]])
    break
  }
  return out
}
