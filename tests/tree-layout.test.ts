import {describe,expect,it} from 'vitest'
import {taxa} from '../content/taxa'
import {computeTreeLayout,footprint,TREE_LANE_HEIGHT} from '../presentation/treeLayout'

const input=taxa.map(t=>({id:String(t.id),start:t.start,end:t.end,group:t.group,short:t.short,date:t.date}))

describe('automatic tree layout',()=>{
  it('is deterministic',()=>{expect(computeTreeLayout(input)).toEqual(computeTreeLayout([...input].reverse()))})
  it('places every taxon without hand-written coordinates',()=>{const l=computeTreeLayout(input);for(const t of input) expect(l.nodes[t.id]).toBeDefined()})
  it('never lets a node or its labels overlap another taxon',()=>{
    const l=computeTreeLayout(input)
    for(const a of input) for(const b of input){
      if(a.id>=b.id) continue
      const la=l.nodes[a.id].lane,lb=l.nodes[b.id].lane
      if(Math.abs(la-lb)>1) continue
      const fa=footprint(a),fb=footprint(b)
      expect(fa.from<fb.to && fb.from<fa.to, `${a.id} vs ${b.id}`).toBe(false)
    }
  })
  it('scales past 40 taxa',()=>{
    const many=Array.from({length:45},(_,i)=>({id:`t${i}`,start:8-i*0.17,end:7.9-i*0.17,group:'Homo',short:`T${i}`,date:'x'}))
    const l=computeTreeLayout(many)
    expect(Object.keys(l.nodes)).toHaveLength(45)
    expect(l.viewBox.height).toBeGreaterThan(TREE_LANE_HEIGHT)
  })
})
