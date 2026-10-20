import {describe,expect,it} from 'vitest'
import {flattenLineage,type LineageNode} from '../components/LineageList'

const node=(id:string,children:LineageNode[]=[]):LineageNode=>({item:{id} as never,relationLabel:null,parentShort:null,flowPartners:[],children})

describe('phone lineage list',()=>{
  it('lists every node once, with each parent before its children', ()=>{
    const tree=[node('a',[node('b',[node('c')]),node('d')]),node('e')]
    expect(flattenLineage(tree).map(n=>n.item.id)).toEqual(['a','b','c','d','e'])
  })

  it('keeps all eleven levels of a deep chain in order, so no card is indented into a sliver', ()=>{
    let chain=node('n10')
    for(let i=9;i>=0;i--) chain=node(`n${i}`,[chain])
    expect(flattenLineage([chain]).map(n=>n.item.id)).toEqual(Array.from({length:11},(_,i)=>`n${i}`))
  })
})
