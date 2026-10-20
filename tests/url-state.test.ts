import {describe,expect,it} from 'vitest'
import {COMPARE_LIMIT,DEFAULT_EXPLORER_STATE,applyUrlState,readExplorerState,writeExplorerSearch,writeExplorerUrl,type ExplorerState,type UrlValidity} from '../features/explorer/state'

const valid:UrlValidity={
  taxonIds:new Set(['neanderthal','sapiens','erectus','habilis']),
  siteIds:new Set(['jebel-irhoud']),
  defaultTaxonId:'neanderthal',
  compareIds:new Set(['neanderthal','sapiens','erectus','habilis']),
  compareDefault:['sapiens','neanderthal','erectus'],
}
const base:ExplorerState={...DEFAULT_EXPLORER_STATE,selectedId:'sapiens',time:40,mode:'timeline',focusSite:'jebel-irhoud'}

describe('URL is the source of explorer state',()=>{
  it('a URL without a species selects the default species, not the current one', ()=>{
    expect(applyUrlState(base,readExplorerState(''),valid).selectedId).toBe('neanderthal')
  })

  it('an unknown species falls back to the default', ()=>{
    expect(applyUrlState(base,readExplorerState('species=nobody'),valid).selectedId).toBe('neanderthal')
  })

  it('a URL without time keeps the current position, because Map range does not carry time', ()=>{
    expect(applyUrlState(base,readExplorerState('species=erectus&mode=migration'),valid).time).toBe(40)
  })

  it('a time in the URL wins', ()=>{
    expect(applyUrlState(base,readExplorerState('time=75'),valid).time).toBe(75)
  })

  it('a URL without mode is the tree, and a URL without site has no focused site', ()=>{
    const next=applyUrlState(base,readExplorerState('species=sapiens'),valid)
    expect(next.mode).toBe('tree')
    expect(next.focusSite).toBeNull()
    expect(next.journey).toBe(false)
  })

  it('an unknown site is dropped, and playback never survives a navigation', ()=>{
    const next=applyUrlState({...base,playing:true},readExplorerState('site=nowhere'),valid)
    expect(next.focusSite).toBeNull()
    expect(next.playing).toBe(false)
  })

  it('the written URL keeps the hash, so #about survives explorer changes', ()=>{
    expect(writeExplorerUrl('/',base,'#about').endsWith('#about')).toBe(true)
    expect(writeExplorerUrl('/',base,'about').endsWith('#about')).toBe(true)
    expect(writeExplorerUrl('/',base)).not.toContain('#')
  })

  it('the written search reads back to the same state', ()=>{
    const decoded=readExplorerState(writeExplorerSearch(base))
    expect(decoded.selectedId).toBe('sapiens')
    expect(decoded.mode).toBe('timeline')
    expect(decoded.time).toBe(40)
    expect(decoded.focusSite).toBe('jebel-irhoud')
  })
})

describe('the comparison is shareable and bounded',()=>{
  it('mode=compare with cmp reads the taxa in order', ()=>{
    const next=applyUrlState(base,readExplorerState('mode=compare&cmp=erectus,habilis'),valid)
    expect(next.mode).toBe('compare')
    expect(next.compare).toEqual(['erectus','habilis'])
  })

  it('an empty or unknown cmp falls back to the featured trio', ()=>{
    expect(applyUrlState(base,readExplorerState('mode=compare&cmp=nobody'),valid).compare).toEqual(['sapiens','neanderthal','erectus'])
    expect(applyUrlState(base,readExplorerState('mode=compare'),valid).compare).toEqual(['sapiens','neanderthal','erectus'])
  })

  it('the comparison holds at most three taxa, and repeats are dropped', ()=>{
    const next=applyUrlState(base,readExplorerState('mode=compare&cmp=erectus,erectus,habilis,sapiens,neanderthal'),valid)
    expect(next.compare).toHaveLength(COMPARE_LIMIT)
    expect(new Set(next.compare).size).toBe(next.compare.length)
  })

  it('cmp is written only in compare mode, so other URLs stay short', ()=>{
    const compare={...base,mode:'compare' as const,compare:['sapiens','erectus']}
    expect(writeExplorerSearch(compare)).toContain('cmp=sapiens%2Cerectus')
    expect(writeExplorerSearch(base)).not.toContain('cmp=')
  })

  it('a header link that names no comparison keeps the reader\'s current selection', ()=>{
    const current={...base,mode:'compare' as const,compare:['habilis','erectus']}
    expect(applyUrlState(current,readExplorerState('species=erectus'),valid).compare).toEqual(['habilis','erectus'])
  })
})
