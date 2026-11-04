import {feature} from 'topojson-client'
import type {GeoPermissibleObjects} from 'd3-geo'
import type {GeometryCollection,Topology} from 'topojson-specification'
import type {LandDetail} from './view'

export type LandTopology=Topology<{land:GeometryCollection}>

/** Pure decoding step, so tests can run it on the shipped files without a network. */
export function decodeLand(topology:LandTopology):GeoPermissibleObjects{
  return feature(topology,topology.objects.land) as GeoPermissibleObjects
}

const cache=new Map<LandDetail,Promise<GeoPermissibleObjects>>()

/** Present-day Natural Earth land (public domain), served from /geo. A failed request is not cached, so a retry can succeed. */
export function loadLand(detail:LandDetail,fetchImpl:typeof fetch=fetch):Promise<GeoPermissibleObjects>{
  const hit=cache.get(detail)
  if(hit) return hit
  const request=fetchImpl(`/geo/land-${detail}.json`).then(response=>{
    if(!response.ok) throw new Error(`land-${detail}: HTTP ${response.status}`)
    return response.json() as Promise<LandTopology>
  }).then(decodeLand).catch(error=>{cache.delete(detail);throw error})
  cache.set(detail,request)
  return request
}
