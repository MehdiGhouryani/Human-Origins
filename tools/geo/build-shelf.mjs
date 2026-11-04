// Builds the continental-shelf edge layers from Natural Earth 10m bathymetry (public domain).
//
//   node tools/geo/build-shelf.mjs <path/to/ne_10m_bathymetry_K_200.geojson>
//
// Source: https://github.com/nvkelso/natural-earth-vector (geojson/ne_10m_bathymetry_K_200.geojson).
// Meaning of the input: ocean DEEPER than 200 m today. Drawn over a lighter sea tone it leaves the shelf (seabed shallower
// than 200 m) visible. These are TODAY'S depths: this is not a reconstruction of any past shoreline.
// Output (committed, so builds never depend on this script): public/geo/shelf-edge-110m.json (coarse) and
// public/geo/shelf-edge-50m.json (detailed, used when zoomed in). The names mirror the land files; they are simplification
// levels of the same source, not the Natural Earth scales.
//
// Why rings are dropped BEFORE quantising: a ring that is a few cells wide collapses to a degenerate ring when quantised, and
// d3-geo reads a degenerate ring as "the whole sphere". The build therefore measures ring area on the exact coordinates,
// and finally refuses to write a file in which any polygon covers more than a hemisphere.
import {readFileSync,writeFileSync,statSync} from 'node:fs'
import {geoArea} from 'd3-geo'
import {feature} from 'topojson-client'
import {topology} from 'topojson-server'
import {presimplify,simplify,sphericalTriangleArea} from 'topojson-simplify'

const input=process.argv[2]
if(!input){console.error('usage: node tools/geo/build-shelf.mjs <ne_10m_bathymetry_K_200.geojson>');process.exit(1)}
const source=JSON.parse(readFileSync(input,'utf8'))
const SPHERE=4*Math.PI

// Area of a ring on its own, independent of winding (a clockwise ring and its mirror differ by 4π - A).
const ringArea=ring=>{const a=geoArea({type:'Polygon',coordinates:[ring]});return Math.min(a,SPHERE-a)}

// minRing: rings smaller than this many steradians are dropped (1 sr is about 40.6 million km2).
// minWeight: simplification drops points whose triangle area (sr) is smaller than this.
// Measured against the source on a 3-degree grid of 3,878 sea points: 110m agrees on about 98.7%, 50m on about 99.5%.
// Quantisation matters more than simplification: at 1e4 the same 110m file disagreed on 11% of the points.
const levels=[
  {name:'110m',quantization:1e5,minWeight:3e-5,minRing:2e-4},
  {name:'50m',quantization:1e5,minWeight:4e-6,minRing:2e-5},
]

function clean(minRing){
  const polygons=[]
  for(const item of source.features){
    const parts=item.geometry.type==='Polygon'?[item.geometry.coordinates]:item.geometry.coordinates
    for(const rings of parts){
      if(ringArea(rings[0])<minRing) continue
      polygons.push({type:'Polygon',coordinates:[rings[0],...rings.slice(1).filter(hole=>ringArea(hole)>=minRing)]})
    }
  }
  return {type:'FeatureCollection',features:polygons.map(geometry=>({type:'Feature',properties:{},geometry}))}
}

const inputShare=source.features.reduce((sum,item)=>sum+geoArea(item),0)/SPHERE
for(const level of levels){
  const cleaned=clean(level.minRing)
  const built=topology({deep:cleaned},level.quantization)
  const simplified=simplify(presimplify(built,sphericalTriangleArea),level.minWeight)
  // Validation: every decoded polygon must be smaller than a hemisphere and the total must stay close to the source.
  const decoded=feature(simplified,simplified.objects.deep)
  const areas=decoded.features.map(item=>geoArea(item))
  const worst=Math.max(...areas)
  const share=areas.reduce((sum,value)=>sum+value,0)/SPHERE
  if(worst>2*Math.PI||Math.abs(share-inputShare)>.02){
    console.error(`${level.name}: refusing to write. largest polygon ${(worst/SPHERE*100).toFixed(1)}% of the sphere, total ${(share*100).toFixed(2)}% (source ${(inputShare*100).toFixed(2)}%)`)
    process.exit(2)
  }
  const out=`public/geo/shelf-edge-${level.name}.json`
  writeFileSync(out,JSON.stringify(simplified))
  console.log(out,Math.round(statSync(out).size/1024)+' KB','polygons:',decoded.features.length,'total',(share*100).toFixed(2)+'% (source',(inputShare*100).toFixed(2)+'%)')
}
