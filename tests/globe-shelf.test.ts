import {readFileSync,statSync} from 'node:fs'
import {geoArea,geoContains,type GeoPermissibleObjects} from 'd3-geo'
import {gzipSync} from 'node:zlib'
import {describe,expect,it,vi} from 'vitest'
import {decodeShelf,loadShelf,type ShelfTopology} from '../presentation/globe/shelf'
import {decodeLand,type LandTopology} from '../presentation/globe/land'
import {globePalette} from '../presentation/migrationScene'

const read=(detail:'110m'|'50m')=>decodeShelf(JSON.parse(readFileSync(`public/geo/shelf-edge-${detail}.json`,'utf8')) as ShelfTopology)
const land=decodeLand(JSON.parse(readFileSync('public/geo/land-110m.json','utf8')) as LandTopology)
const inDeep=(deep:GeoPermissibleObjects,lon:number,lat:number)=>geoContains(deep,[lon,lat])
const inLand=(lon:number,lat:number)=>geoContains(land,[lon,lat])

const luminance=(hex:string)=>{
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4)
  return 0.2126*r+0.7152*g+0.0722*b
}
const contrast=(a:string,b:string)=>{const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x);return (hi+0.05)/(lo+0.05)}

describe('shipped continental shelf layer',()=>{
  // The shelf is "sea that is NOT in the deep-ocean polygons". These are the shelves the dispersal story depends on.
  it.each([['Sunda shelf (Java Sea)',110,-5],['Sahul shelf (Arafura Sea)',135,-9],['Bering shelf',-172,62],['North Sea',2,54],['English Channel',-2,50],['Persian Gulf',51,27]] as const)('%s is shelf at both detail levels',(_name,lon,lat)=>{
    for(const detail of ['110m','50m'] as const){
      const deep=read(detail)
      expect(inLand(lon,lat),'test point must be sea').toBe(false)
      expect(inDeep(deep,lon,lat),`${detail} marks it deep`).toBe(false)
    }
  })
  it.each([['mid Pacific',-150,0],['mid Atlantic',-30,20],['Indian Ocean',75,-30]] as const)('%s is deep ocean',(_name,lon,lat)=>{
    expect(inDeep(read('110m'),lon,lat)).toBe(true)
    expect(inDeep(read('50m'),lon,lat)).toBe(true)
  })
  it('keeps every polygon smaller than a hemisphere and the total close to the source (degenerate rings read as the whole sphere)',()=>{
    for(const detail of ['110m','50m'] as const){
      const deep=read(detail) as unknown as {features:object[]}
      const areas=deep.features.map(item=>geoArea(item as never))
      expect(Math.max(...areas),`${detail} has a polygon covering a hemisphere or more`).toBeLessThan(2*Math.PI)
      const share=areas.reduce((sum,value)=>sum+value,0)/(4*Math.PI)
      expect(share).toBeGreaterThan(.645)
      expect(share).toBeLessThan(.67)
    }
  })
  it('stays within a transfer budget (it is fetched on demand)',()=>{
    const gz=(detail:string)=>gzipSync(readFileSync(`public/geo/shelf-edge-${detail}.json`)).length
    expect(gz('110m')).toBeLessThan(100*1024)
    expect(gz('50m')).toBeLessThan(400*1024)
    expect(statSync('public/geo/shelf-edge-50m.json').size).toBeGreaterThan(statSync('public/geo/shelf-edge-110m.json').size)
  })
  it('credits its source and says it is today\'s seabed',()=>{
    const notice=readFileSync('public/geo/NOTICE.txt','utf8')
    expect(notice).toMatch(/ne_10m_bathymetry_K_200/)
    expect(notice).toMatch(/not a reconstruction of/)
  })
})

describe('shelf loader',()=>{
  const topology=JSON.parse(readFileSync('public/geo/shelf-edge-110m.json','utf8'))
  it('fetches /geo/shelf-edge-*.json once and caches it',async()=>{
    const fetchImpl=vi.fn(()=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(topology)} as Response))
    const a=await loadShelf('110m',fetchImpl as unknown as typeof fetch)
    const b=await loadShelf('110m',fetchImpl as unknown as typeof fetch)
    expect(a).toBe(b)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledWith('/geo/shelf-edge-110m.json')
  })
  it('does not cache failures',async()=>{
    const failing=vi.fn(()=>Promise.resolve({ok:false,status:500} as Response))
    await expect(loadShelf('50m',failing as unknown as typeof fetch)).rejects.toThrow(/500/)
  })
})

describe('shelf palette',()=>{
  it('keeps the shelf edge visible against both sea tones',()=>{
    expect(contrast(globePalette.shelfEdge,globePalette.oceanCenter)).toBeGreaterThanOrEqual(3)
    expect(contrast(globePalette.shelfEdge,globePalette.shelf)).toBeGreaterThanOrEqual(3)
  })
  it('keeps the coastline visible against the shelf tone',()=>{
    expect(contrast(globePalette.coast,globePalette.shelf)).toBeGreaterThanOrEqual(3)
  })
  it('keeps land clearly separate from the shelf tone',()=>{
    expect(contrast(globePalette.land,globePalette.shelf)).toBeGreaterThanOrEqual(2.5)
  })
})
