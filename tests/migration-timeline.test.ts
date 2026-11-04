import {describe,expect,it} from 'vitest'
import {ageMaToSlider} from '../domain/time'
import {SCENE_COUNT,SCENE_DWELL_MS,advanceFraction,fractionToKa,kaToFraction,sceneIndexAtKa,sceneProgress,sceneStartFraction,scenes} from '../presentation/migrationTimeline'

describe('migration scenes',()=>{
  it('are contiguous, ordered old to young, and cover the story',()=>{
    for(let index=1;index<scenes.length;index++) expect(scenes[index].fromKa).toBe(scenes[index-1].toKa)
    for(const scene of scenes) expect(scene.fromKa).toBeGreaterThan(scene.toKa)
    expect(scenes[0].fromKa).toBe(8000)
  })
  it('give every scene the same share of the track',()=>{
    for(let index=0;index<scenes.length;index++){
      const start=kaToFraction(scenes[index].fromKa)
      const end=kaToFraction(scenes[index].toKa)
      expect(end-start).toBeCloseTo(1/SCENE_COUNT,9)
    }
  })
})

describe('story track mapping',()=>{
  it('is monotonic (older moments sit further left)',()=>{
    let previous=-1
    for(let ka=8000;ka>=5;ka-=25){const fraction=kaToFraction(ka);expect(fraction).toBeGreaterThanOrEqual(previous);previous=fraction}
  })
  it('round-trips inside the scenes',()=>{
    for(const ka of [7000,3000,315.5,250,100,59,48,30,20,9]) expect(fractionToKa(kaToFraction(ka))).toBeCloseTo(ka,3)
  })
  it('clamps moments outside the story to its ends',()=>{
    expect(kaToFraction(20000)).toBe(0)
    expect(kaToFraction(0)).toBe(1)
    expect(sceneIndexAtKa(20000)).toBe(0)
    expect(sceneIndexAtKa(0)).toBe(scenes.length-1)
  })
  it('keeps the deep-time scene on the global non-linear scale',()=>{
    // 2 Ma sits at 40% of the global axis, so it must sit at the same relative place inside scene 0.
    const local=kaToFraction(2000)*SCENE_COUNT
    const expected=(ageMaToSlider(2)-ageMaToSlider(8))/(ageMaToSlider(.315)-ageMaToSlider(8))
    expect(local).toBeCloseTo(expected,6)
  })
  it('scene starts and progress agree',()=>{
    expect(sceneStartFraction(0)).toBe(0)
    expect(sceneProgress(sceneStartFraction(2))).toBeCloseTo(0,9)
    expect(sceneProgress(sceneStartFraction(2)+.5/SCENE_COUNT)).toBeCloseTo(.5,9)
    expect(sceneProgress(1)).toBe(1)
  })
})

describe('playback',()=>{
  const play=(from:number,to:number,speed=1)=>{
    let fraction=from
    let elapsed=0
    while(fraction<to){fraction=advanceFraction(fraction,16,speed).fraction;elapsed+=16}
    return elapsed
  }
  it('gives each scene a readable dwell time (the global Play crossed the whole 60-5 ka dispersal in 0.5 s)',()=>{
    expect(SCENE_DWELL_MS).toBeGreaterThanOrEqual(6000)
    const eurasia=scenes.findIndex(scene=>scene.id==='eurasia')
    const elapsed=play(sceneStartFraction(eurasia),sceneStartFraction(eurasia+1))
    expect(elapsed).toBeGreaterThanOrEqual(6000)
    expect(elapsed).toBeLessThan(SCENE_DWELL_MS+100)
  })
  it('honours speed and stops at the end instead of looping',()=>{
    expect(play(0,sceneStartFraction(1),2)).toBeLessThan(play(0,sceneStartFraction(1),1))
    expect(advanceFraction(.999,100000)).toEqual({fraction:1,ended:true})
    expect(advanceFraction(.2,0).fraction).toBe(.2)
  })
})
