import {describe,expect,it} from 'vitest'
import {TIME_DOMAIN,ageMaToSlider,containsAge,containsAgeWithUncertainty,formatAgeMa,sliderToAgeMa} from '../domain/time'

describe('Temporal engine',()=>{
  it('keeps the project domain bounded',()=>{
    expect(sliderToAgeMa(0)).toBe(TIME_DOMAIN.oldestMa)
    expect(sliderToAgeMa(100)).toBe(TIME_DOMAIN.youngestMa)
    expect(ageMaToSlider(8)).toBe(0)
    expect(ageMaToSlider(0)).toBe(100)
  })
  it('is monotonic from deep time toward the present',()=>{
    expect(sliderToAgeMa(20)).toBeGreaterThan(sliderToAgeMa(80))
  })
  it('distinguishes interval inclusion from uncertainty inclusion',()=>{
    const interval={olderMa:0.35,youngerMa:0.30,label:'test',uncertaintyMa:0.03}
    expect(containsAge(interval,0.34)).toBe(true)
    expect(containsAge(interval,0.38)).toBe(false)
    expect(containsAgeWithUncertainty(interval,0.38)).toBe(true)
  })
  it('formats Ma/ka/year scales explicitly',()=>{
    expect(formatAgeMa(2.4)).toContain('Ma')
    expect(formatAgeMa(0.044)).toContain('ka')
    expect(formatAgeMa(0.00004)).toContain('years')
  })
})

import {intervalsOverlap,rangesOverlap,taxaAtAge} from '../domain/time'
describe('time overlap reasoning (V35)',()=>{
  it('detects range overlap and separation',()=>{
    expect(rangesOverlap({olderMa:2,youngerMa:1},{olderMa:1.5,youngerMa:0.5})).toBe(true)
    expect(rangesOverlap({olderMa:2,youngerMa:1},{olderMa:0.9,youngerMa:0.1})).toBe(false)
    expect(rangesOverlap({olderMa:2,youngerMa:1},{olderMa:0.9,youngerMa:0.1},0.2)).toBe(true)
  })
  it('lets uncertainty bridge a narrow gap only when requested',()=>{
    const a={olderMa:0.315,youngerMa:0.315,uncertaintyMa:0.034,label:'a'}
    const b={olderMa:0.27,youngerMa:0.27,uncertaintyMa:0.02,label:'b'}
    expect(intervalsOverlap(a,b)).toBe(false)
    expect(intervalsOverlap(a,b,{withUncertainty:true})).toBe(true)
  })
  it('finds taxa that coexisted at an age',()=>{
    const taxa=[{id:'n',start:0.4,end:0.04},{id:'s',start:0.3,end:0},{id:'e',start:1.9,end:0.1}]
    expect(taxaAtAge(taxa,0.2).map(t=>t.id)).toEqual(['n','s','e'])
    expect(taxaAtAge(taxa,1).map(t=>t.id)).toEqual(['e'])
  })
})
