import {readFileSync} from 'node:fs'
import {geoContains,type GeoPermissibleObjects} from 'd3-geo'
import {describe,expect,it,vi} from 'vitest'
import {decodeLand,loadLand,type LandTopology} from '../presentation/globe/land'
import {evidenceSites} from '../content/sites'

const read=(detail:'110m'|'50m')=>decodeLand(JSON.parse(readFileSync(`public/geo/land-${detail}.json`,'utf8')) as LandTopology)
const land110=read('110m')
const land50=read('50m')
const on=(land:GeoPermissibleObjects,lon:number,lat:number)=>geoContains(land,[lon,lat])

describe('shipped Natural Earth land',()=>{
  it('decodes both resolutions',()=>{
    for(const land of [land110,land50]) expect((land as {type:string}).type).toMatch(/Feature/)
  })

  // These are exactly the places the old nine-polygon sketch could not draw.
  it.each([['Flores',121,-8.7],['Luzon',121,16],['Britain',-1.5,52.5],['Honshu',138,36],['Madagascar',47,-19],['Sri Lanka',80.7,7.6],['Java',110,-7.5],['New Guinea',143,-6],['Tasmania',146.5,-42],['Iceland',-19,64.9],['Cyprus',33,35],['Sicily',14,37.5]] as const)('%s is land at both resolutions',(_name,lon,lat)=>{
    expect(on(land110,lon,lat)).toBe(true)
    expect(on(land50,lon,lat)).toBe(true)
  })

  it('open ocean is not land',()=>{
    for(const [lon,lat] of [[-30,0],[75,-30],[-150,0],[90,-5]] as const) expect(on(land110,lon,lat)).toBe(false)
  })

  it('puts every registered evidence site on land (the sketch left 4 of 27 in the sea)',()=>{
    const offenders=evidenceSites.filter(site=>!on(land110,site.lon,site.lat)).map(site=>site.name)
    expect(offenders).toEqual([])
  })
})

describe('loadLand',()=>{
  const topology=JSON.parse(readFileSync('public/geo/land-110m.json','utf8'))
  const ok=()=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(topology)} as Response)

  it('fetches from /geo, decodes, and caches per resolution',async()=>{
    const fetchImpl=vi.fn(ok)
    const first=await loadLand('110m',fetchImpl as unknown as typeof fetch)
    const second=await loadLand('110m',fetchImpl as unknown as typeof fetch)
    expect(first).toBe(second)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl).toHaveBeenCalledWith('/geo/land-110m.json')
  })

  it('does not cache a failure, so a retry can succeed',async()=>{
    const failing=vi.fn(()=>Promise.resolve({ok:false,status:503} as Response))
    await expect(loadLand('50m',failing as unknown as typeof fetch)).rejects.toThrow(/503/)
    const working=vi.fn(()=>Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(JSON.parse(readFileSync('public/geo/land-50m.json','utf8')))} as Response))
    await expect(loadLand('50m',working as unknown as typeof fetch)).resolves.toBeTruthy()
  })
})
