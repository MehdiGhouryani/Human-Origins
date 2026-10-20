import {describe,expect,it} from 'vitest'
import {CC_SCALE,cranialPercent,extractCranialCc,pairOverlaps} from '../components/CompareMatrix'

describe('cranial scale',()=>{
  it('places the ends of the scale at the ends of the track and clamps values outside it', ()=>{
    expect(cranialPercent(CC_SCALE.min)).toBe(0)
    expect(cranialPercent(CC_SCALE.max)).toBe(100)
    expect(cranialPercent(100)).toBe(0)
    expect(cranialPercent(2500)).toBe(100)
  })

  it('keeps a 1,750 cm³ bar inside the track', ()=>{
    expect(cranialPercent(1750)).toBeLessThanOrEqual(100)
    expect(cranialPercent(1750)).toBeGreaterThan(cranialPercent(1000))
  })

  it('reads a range from a typed fact and never invents one', ()=>{
    expect(extractCranialCc([['Brain size','1,200–1,750 cm³']] as never)).toEqual({label:'1,200–1,750 cm³',minCc:1200,maxCc:1750})
    expect(extractCranialCc([['Brain size','not recorded']] as never)).toBeNull()
    expect(extractCranialCc([] as never)).toBeNull()
  })
})

describe('temporal overlap',()=>{
  const A={short:'A',start:2,end:0.5}
  const B={short:'B',start:1.5,end:0.1}
  const C={short:'C',start:0.4,end:0.1}

  it('reports every overlapping pair with the shared interval, and no other pair', ()=>{
    const pairs=pairOverlaps([A,B,C])
    expect(pairs.map(p=>`${p.a}-${p.b}`)).toEqual(['A-B','B-C'])
    expect(pairs[0]).toEqual({a:'A',b:'B',fromMa:1.5,toMa:0.5})
    expect(pairs[1]).toEqual({a:'B',b:'C',fromMa:0.4,toMa:0.1})
  })

  it('reports nothing for taxa whose dates do not meet', ()=>{
    expect(pairOverlaps([A,C])).toEqual([])
    expect(pairOverlaps([A])).toEqual([])
  })
})
