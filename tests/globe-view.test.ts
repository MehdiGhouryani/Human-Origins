import {describe,expect,it} from 'vitest'
import {DETAIL_ZOOM,ZOOM_MAX,ZOOM_MIN,baseRadius,cameraFor,centreOf,clampTilt,clampZoom,freeArea,landDetailFor,makeProjection,onVisibleHemisphere,wrapLongitude} from '../presentation/globe/view'

const size={width:830,height:620}
const none={top:0,bottom:0}

describe('camera helpers',()=>{
  it('round-trips a centre through the d3 rotation convention',()=>{
    const camera=cameraFor(46,27,2)
    expect(camera.rot).toEqual([-46,-27])
    expect(centreOf(camera)).toEqual([46,27])
  })
  it('wraps longitudes and clamps tilt and zoom',()=>{
    expect(wrapLongitude(190)).toBe(-170)
    expect(wrapLongitude(-190)).toBe(170)
    expect(wrapLongitude(360)).toBe(0)
    expect(clampTilt(120)).toBe(80)
    expect(clampZoom(0.1)).toBe(ZOOM_MIN)
    expect(clampZoom(99)).toBe(ZOOM_MAX)
  })
  it('allows region-level zoom (the old globe stopped at about 1.3x)',()=>{
    expect(ZOOM_MAX).toBeGreaterThanOrEqual(10)
  })
})

describe('projection',()=>{
  it('puts the camera centre in the middle of the free area for both projections',()=>{
    const insets={top:50,bottom:150}
    for(const kind of ['globe','flat'] as const){
      const camera=cameraFor(30,20,1.7)
      const projection=makeProjection(kind,camera,size,insets)
      const [x,y]=projection([30,20])!
      const area=freeArea(size,insets)
      expect(x).toBeCloseTo(area.centreX,1)
      expect(y).toBeCloseTo(area.centreY,1)
    }
  })
  it('keeps the whole globe inside the stage at zoom 1',()=>{
    const radius=baseRadius(size,none)
    expect(radius*2).toBeLessThanOrEqual(Math.min(size.width,size.height))
  })
  it('shrinks the globe when overlays take space, so it is never hidden',()=>{
    expect(baseRadius(size,{top:50,bottom:200})).toBeLessThan(baseRadius(size,none))
  })
})

describe('level of detail',()=>{
  it('uses the detailed coastline only when zoomed in, settled and loaded',()=>{
    expect(landDetailFor(1,true,true)).toBe('110m')
    expect(landDetailFor(DETAIL_ZOOM,true,true)).toBe('50m')
    expect(landDetailFor(DETAIL_ZOOM,false,true)).toBe('110m')
    expect(landDetailFor(DETAIL_ZOOM,true,false)).toBe('110m')
  })
})

describe('hemisphere test',()=>{
  it('sees the centre and not the antipode',()=>{
    const camera=cameraFor(20,10,1)
    expect(onVisibleHemisphere(camera,20,10)).toBe(true)
    expect(onVisibleHemisphere(camera,-160,-10)).toBe(false)
  })
})
