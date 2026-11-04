import {feature} from 'topojson-client'
import type {GeoPermissibleObjects} from 'd3-geo'
import type {GeometryCollection,Topology} from 'topojson-specification'
import type {LandDetail} from './view'

/** Deep ocean (seabed deeper than 200 m today). The shelf is what is left when it is drawn over a lighter sea tone. */
export type ShelfTopology=Topology<{deep:GeometryCollection}>

export function decodeShelf(topology:ShelfTopology):GeoPermissibleObjects{
  return feature(topology,topology.objects.deep) as GeoPermissibleObjects
}

const cache=new Map<LandDetail,Promise<GeoPermissibleObjects>>()

/** Natural Earth bathymetry (public domain), simplified by tools/geo/build-shelf.mjs. A failed request is not cached. */
export function loadShelf(detail:LandDetail,fetchImpl:typeof fetch=fetch):Promise<GeoPermissibleObjects>{
  const hit=cache.get(detail)
  if(hit) return hit
  const request=fetchImpl(`/geo/shelf-edge-${detail}.json`).then(response=>{
    if(!response.ok) throw new Error(`shelf-edge-${detail}: HTTP ${response.status}`)
    return response.json() as Promise<ShelfTopology>
  }).then(decodeShelf).catch(error=>{cache.delete(detail);throw error})
  cache.set(detail,request)
  return request
}
