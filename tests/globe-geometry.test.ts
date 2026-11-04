import {geoDistance} from 'd3-geo'
import {describe,expect,it} from 'vitest'
import {clusterPins} from '../presentation/globe/cluster'
import {routeLength,sliceRoute,smoothRoute,unwrapLongitudes,type LonLat} from '../presentation/globe/routes'
import {routes} from '../presentation/migrationScene'

describe('clusterPins',()=>{
  const pins=[{id:'a',x:10,y:10},{id:'b',x:14,y:12},{id:'c',x:200,y:200}]
  it('merges close pins and leaves distant ones',()=>{
    const clusters=clusterPins(pins,20)
    expect(clusters).toHaveLength(2)
    expect(clusters.find(cluster=>cluster.ids.length===2)?.ids).toEqual(['a','b'])
    expect(clusters.find(cluster=>cluster.id==='c')).toBeTruthy()
  })
  it('is deterministic whatever the input order',()=>{
    expect(clusterPins([...pins].reverse(),20)).toEqual(clusterPins(pins,20))
  })
  it('never merges a sticky pin (the selected site)',()=>{
    const clusters=clusterPins([{id:'a',x:10,y:10,sticky:true},{id:'b',x:12,y:11},{id:'c',x:13,y:11}],20)
    expect(clusters.find(cluster=>cluster.id==='a')?.ids).toEqual(['a'])
    expect(clusters.some(cluster=>cluster.ids.includes('b')&&cluster.ids.includes('c'))).toBe(true)
  })
  it('keeps every pin exactly once',()=>{
    const ids=clusterPins(pins,500).flatMap(cluster=>cluster.ids).sort()
    expect(ids).toEqual(['a','b','c'])
  })
})

describe('route geometry',()=>{
  it('unwraps the antimeridian instead of crossing the whole map',()=>{
    const unwrapped=unwrapLongitudes([[170,55],[-165,55],[-130,50]])
    for(let index=1;index<unwrapped.length;index++) expect(Math.abs(unwrapped[index][0]-unwrapped[index-1][0])).toBeLessThan(180)
  })

  it.each(routes.map(route=>[route.id,route.points as LonLat[]] as const))('%s: smoothing keeps its endpoints and stays continuous',(_id,points)=>{
    const smooth=smoothRoute(points)
    expect(smooth[0]).toEqual(points[0])
    expect(smooth[smooth.length-1]).toEqual(points[points.length-1])
    expect(smooth.length).toBeGreaterThan(points.length)
    const unwrapped=unwrapLongitudes(smooth)
    for(let index=1;index<unwrapped.length;index++) expect(Math.abs(unwrapped[index][0]-unwrapped[index-1][0])).toBeLessThan(40)
  })

  it('slices a route by great-circle length',()=>{
    const points:LonLat[]=[[0,0],[40,0],[40,40]]
    const total=routeLength(points)
    const half=sliceRoute(points,.5)
    expect(routeLength(half)).toBeCloseTo(total/2,6)
    expect(half[0]).toEqual([0,0])
    expect(sliceRoute(points,0)).toEqual([[0,0]])
    expect(sliceRoute(points,1)).toEqual(points)
    expect(geoDistance(sliceRoute(points,1)[2],[40,40])).toBe(0)
  })
})
