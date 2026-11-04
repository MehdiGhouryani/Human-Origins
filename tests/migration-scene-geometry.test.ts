import {describe,expect,it} from 'vitest'
import {geoArea} from 'd3-geo'
import {continents,globePalette} from '../presentation/migrationScene'

const HEMISPHERE=2*Math.PI

const luminance=(hex:string)=>{
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(c=>c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4)
  return 0.2126*r+0.7152*g+0.0722*b
}
const contrast=(a:string,b:string)=>{
  const [hi,lo]=[luminance(a),luminance(b)].sort((x,y)=>y-x)
  return (hi+0.05)/(lo+0.05)
}

describe('migration globe base geometry',()=>{
  it.each(continents.map(([name,ring])=>[name,ring] as const))('%s ring is wound the way d3-geo expects (area below a hemisphere)',(name,ring)=>{
    const feature={type:'Feature' as const,properties:null,geometry:{type:'Polygon' as const,coordinates:[[...ring,ring[0]]]}}
    // d3-geo reads a counter-clockwise ring as the complement (area ~ 4π - small). That floods the whole globe with land colour.
    expect(geoArea(feature),`${name} is inverted`).toBeLessThan(HEMISPHERE)
  })

  it('has at least three vertices per ring',()=>{
    for(const [name,ring] of continents) expect(ring.length,name).toBeGreaterThanOrEqual(3)
  })
})

describe('migration globe palette (WCAG 1.4.11 non-text contrast)',()=>{
  it('keeps land distinguishable from the ocean at centre and edge',()=>{
    expect(contrast(globePalette.land,globePalette.oceanCenter)).toBeGreaterThanOrEqual(3)
    expect(contrast(globePalette.land,globePalette.oceanEdge)).toBeGreaterThanOrEqual(3)
  })
  it('keeps the coastline distinguishable from land',()=>{
    expect(contrast(globePalette.coast,globePalette.land)).toBeGreaterThanOrEqual(3)
  })
})
