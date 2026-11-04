import {describe,expect,it} from 'vitest'

const {createLoginLimiter,createLoginTarpit,loginDelayMs,LOGIN_PRESSURE_FREE_FAILURES,GLOBAL_LOGIN_KEY}=await import('../infrastructure/cms/rateLimit')

describe('login delay curve',()=>{
  it('is free below the threshold and never locks (always finite, capped at 5 s)',()=>{
    expect(loginDelayMs(0)).toBe(0)
    expect(loginDelayMs(LOGIN_PRESSURE_FREE_FAILURES-1)).toBe(0)
    expect(loginDelayMs(LOGIN_PRESSURE_FREE_FAILURES)).toBe(250)
    expect(loginDelayMs(LOGIN_PRESSURE_FREE_FAILURES+1)).toBe(500)
    expect(loginDelayMs(1_000_000)).toBe(5000)
  })
  it('is monotonic',()=>{
    let previous=0
    for(let failures=0;failures<60;failures+=1){const delay=loginDelayMs(failures);expect(delay).toBeGreaterThanOrEqual(previous);previous=delay}
  })
})

describe('limiter.count',()=>{
  it('counts failures inside the window only and keeps memory bounded',()=>{
    const limiter=createLoginLimiter({maxFailures:3,windowMs:1000})
    limiter.recordFailure('k',0);limiter.recordFailure('k',500)
    expect(limiter.count('k',600)).toBe(2)
    expect(limiter.count('k',1200)).toBe(1)
    for(let index=0;index<5000;index+=1) limiter.recordFailure('flood',index/10)
    expect(limiter.count('flood',500)).toBeLessThanOrEqual(1000)
  })
})

describe('login tarpit',()=>{
  const slept:number[]=[]
  const make=(maxConcurrentDelayed=8,release?:(()=>void)[])=>{
    slept.length=0
    const limiter=createLoginLimiter({maxFailures:50,windowMs:60_000,maxKeys:1})
    const tarpit=createLoginTarpit({limiter,maxConcurrentDelayed,now:()=>0,sleep:ms=>{slept.push(ms);return new Promise<void>(resolve=>{if(release) release.push(resolve); else resolve()})}})
    return {limiter,tarpit}
  }

  it('does not delay normal use',async()=>{
    const {tarpit}=make()
    for(let index=0;index<LOGIN_PRESSURE_FREE_FAILURES-1;index+=1) tarpit.recordFailure()
    expect(await tarpit.enter()).toEqual({ok:true})
    expect(slept).toEqual([])
  })

  it('slows every attempt (including a correct password) once failures pile up, but still lets it through',async()=>{
    const {tarpit}=make()
    for(let index=0;index<LOGIN_PRESSURE_FREE_FAILURES+2;index+=1) tarpit.recordFailure()
    expect(await tarpit.enter()).toEqual({ok:true})
    expect(slept).toEqual([1000])
  })

  it('caps parallel delayed attempts so guesses cannot dodge the delay',async()=>{
    const gates:(()=>void)[]=[]
    const {tarpit,limiter}=make(2,gates)
    for(let index=0;index<LOGIN_PRESSURE_FREE_FAILURES+1;index+=1) limiter.recordFailure(GLOBAL_LOGIN_KEY,0)
    const first=tarpit.enter()
    const second=tarpit.enter()
    const third=await tarpit.enter()
    expect(third).toMatchObject({ok:false})
    gates.forEach(release=>release())
    await first;await second
    // capacity is released after the delayed attempts finish
    const again=tarpit.enter()
    gates.forEach(release=>release())
    expect(await again).toEqual({ok:true})
  })
})
