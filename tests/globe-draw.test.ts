import {describe,expect,it} from 'vitest'
import {drawBase} from '../presentation/globe/drawBase'
import {decodeLand,type LandTopology} from '../presentation/globe/land'
import {readFileSync} from 'node:fs'
import {globePalette} from '../presentation/migrationScene'
import {cameraFor} from '../presentation/globe/view'

function recorder(){
  const calls:string[]=[]
  const ctx=new Proxy({},{
    get:(_target,property)=>property==='createRadialGradient'?()=>({addColorStop:()=>undefined}):()=>{calls.push(String(property))},
    set:(_target,property,value)=>{calls.push(`set:${String(property)}=${typeof value==='string'?value:'obj'}`);return true},
  })
  return {ctx:ctx as unknown as CanvasRenderingContext2D,calls}
}
const land=decodeLand(JSON.parse(readFileSync('public/geo/land-110m.json','utf8')) as LandTopology)
const base={camera:cameraFor(20,10,1),size:{width:830,height:620},insets:{top:0,bottom:0},dpr:2,palette:globePalette}

describe('drawBase',()=>{
  it('paints ocean, then land, then the rim, in that order',()=>{
    const {ctx,calls}=recorder()
    drawBase(ctx,{...base,kind:'globe',land})
    const landFill=calls.indexOf(`set:fillStyle=${globePalette.land}`)
    expect(calls[0]).toBe('setTransform')
    expect(calls).toContain('clearRect')
    expect(landFill).toBeGreaterThan(calls.indexOf('fill'))
    expect(calls.lastIndexOf(`set:strokeStyle=${globePalette.outline}`)).toBeGreaterThan(landFill)
  })
  it('skips land until it is loaded',()=>{
    const {ctx,calls}=recorder()
    drawBase(ctx,{...base,kind:'globe',land:null})
    expect(calls).not.toContain(`set:fillStyle=${globePalette.land}`)
  })
  it('returns the projection used, centred on the camera',()=>{
    const {ctx}=recorder()
    const projection=drawBase(ctx,{...base,kind:'flat',land})
    const [x,y]=projection([20,10])!
    expect(x).toBeCloseTo(415,0)
    expect(y).toBeCloseTo(310,0)
  })
})
