import {describe,expect,it} from 'vitest'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerSpeciesById} from '../features/explorer/selectors'
import {journeyChapterTexts} from '../components/SpeciesJourney'

const bootstrap=buildExplorerBootstrap()
const texts=(id:string)=>journeyChapterTexts(getExplorerSpeciesById(bootstrap,id),bootstrap)

describe('journey chapter texts come from the taxon\'s own data',()=>{
  it('differ between taxa in every chapter that has data', ()=>{
    const a=texts('afarensis'); const n=texts('neanderthal')
    expect(a.origin).not.toBe(n.origin)
    expect(a.range).not.toBe(n.range)
    expect(a.encounters).not.toBe(n.encounters)
  })

  it('no longer use the old shared wording', ()=>{
    for(const id of ['afarensis','neanderthal','sapiens']){
      const all=Object.values(texts(id)).join(' ')
      expect(all).not.toContain('Explore the documented and inferred geographic context')
      expect(all).not.toContain('Move from the species label to the physical record')
    }
  })

  it('names the taxa whose date ranges overlap, and states that overlap is not contact', ()=>{
    const e=texts('neanderthal').encounters
    expect(e).toContain('H. sapiens')
    expect(e).toContain('do not show that the populations met')
  })

  it('reports recorded gene flow by name, and says plainly when there is none', ()=>{
    expect(texts('neanderthal').genetics).toMatch(/Gene flow is recorded between/)
    expect(texts('afarensis').genetics).toMatch(/^(No genetic evidence is recorded|Genetic evidence exists)/)
  })
})
