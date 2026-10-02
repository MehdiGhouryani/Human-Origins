import {describe,expect,it} from 'vitest'
import {DEFAULT_EXPLORER_STATE,readExplorerState,writeExplorerUrl} from '../features/explorer/state'

describe('Explorer state codec',()=>{
  it('keeps the default contract stable',()=>{
    expect(DEFAULT_EXPLORER_STATE.selectedId).toBe('')
    expect(DEFAULT_EXPLORER_STATE.time).toBeGreaterThan(0)
    expect(DEFAULT_EXPLORER_STATE.mode).toBe('tree')
  })
  it('clamps deep-linked time and bounds the search query',()=>{
    const q='x'.repeat(500)
    const decoded=readExplorerState(`?species=sapiens&mode=timeline&time=9999&q=${q}`)
    expect(decoded.time).toBe(100)
    expect(decoded.query?.length).toBe(160)
    expect(decoded.selectedId).toBe('sapiens')
    expect(decoded.mode).toBe('timeline')
  })
  it('rejects unsupported modes without inventing state',()=>{
    const decoded=readExplorerState('?mode=not-a-mode&journey=1')
    expect(decoded.mode).toBeUndefined()
    expect(decoded.journey).toBe(true)
  })
  it('serializes the state needed for reproducible deep links',()=>{
    const url=writeExplorerUrl('/',{...DEFAULT_EXPLORER_STATE,selectedId:'sapiens',mode:'timeline',time:91,query:'Jebel Irhoud',focusSite:'jebel-irhoud',journey:true})
    expect(url).toContain('species=sapiens')
    expect(url).toContain('mode=timeline')
    expect(url).toContain('time=91')
    expect(url).toContain('site=jebel-irhoud')
    expect(url).toContain('journey=1')
    expect(url).toContain('q=Jebel+Irhoud')
  })
})
