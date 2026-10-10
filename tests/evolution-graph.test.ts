import {describe,it,expect} from 'vitest'
import {fitZoom,initialZoom,GRAPH_COMPACT_WIDTH,lineageOf} from '../components/EvolutionGraph'

describe('responsive lineage graph',()=>{
  it('keeps a phone map legible instead of shrinking it below 80 percent',()=>{
    expect(fitZoom(390,1638)).toBe(.45)
    expect(initialZoom(390,1638)).toBe(.8)
    // At exactly the compact threshold the container is no longer "narrow": the whole map fits (floor((600-2)/1638)=0.36, raised to the 0.45 minimum: the map is panned, not shrunk further).
    expect(initialZoom(GRAPH_COMPACT_WIDTH,1638)).toBe(fitZoom(GRAPH_COMPACT_WIDTH,1638))
    expect(initialZoom(GRAPH_COMPACT_WIDTH,1638)).toBe(.45)
    expect(initialZoom(GRAPH_COMPACT_WIDTH-1,1638)).toBe(.8)
    expect(initialZoom(1200,1638)).toBe(.73)
  })
  it('walks descent in both directions but excludes gene flow',()=>{
    const links=[
      {from:'root',to:'child',type:'possible'},
      {from:'child',to:'grandchild',type:'possible'},
      {from:'other',to:'child',type:'possible'},
      {from:'donor',to:'grandchild',type:'gene-flow'},
    ] as const
    // 'other' is a registered parent of 'child', so it is an ancestor of both child and grandchild.
    expect([...lineageOf(links,'child')].sort()).toEqual(['child','grandchild','other','root'])
    expect([...lineageOf(links,'grandchild')].sort()).toEqual(['child','grandchild','other','root'])
    // 'donor' is connected only by gene flow, which is not ancestry: it never appears in any lineage.
    expect([...lineageOf(links,'grandchild')]).not.toContain('donor')
    expect([...lineageOf(links,'donor')]).toEqual(['donor'])
  })
})
