import {describe,expect,it} from 'vitest'
import {buildLineageTree,type FlowLink,type LineageNode,type ParentLink} from '../components/LineageList'

type Fake={id:string;short:string;name:string;date:string;start:number;end:number;group:string}
const sp=(id:string,start:number,end:number):Fake=>({id,short:id,name:id,date:`${start}–${end}`,start,end,group:'Australopithecines'})
const toMap=(items:Fake[])=>new Map(items.map(item=>[item.id,item]))
const ids=(nodes:LineageNode[]):string[]=>nodes.map(node=>node.item.id)

describe('lineage tree',()=>{
  const a=sp('a',7,6), b=sp('b',6,5), c=sp('c',4,3), d=sp('d',3.3,2.1), e=sp('e',2.4,1.4), g=sp('g',0.5,0.1)
  const all=[a,b,c,d,e,g]
  const parents=new Map<string,ParentLink>([
    ['b',{from:'a',relation:'descent' as ParentLink['relation']}],
    ['c',{from:'b',relation:'descent' as ParentLink['relation']}],
    ['d',{from:'c',relation:'descent' as ParentLink['relation']}],
    ['e',{from:'c',relation:'descent' as ParentLink['relation']}],
  ])
  const flows=new Map<string,FlowLink[]>([['e',[{from:'e',to:'g'}]],['g',[{from:'e',to:'g'}]]])
  const byId=toMap(all as never)

  it('puts the oldest root first and nests every child under its parent',()=>{
    const tree=buildLineageTree(all as never,parents,flows,byId as never)
    expect(ids(tree)).toEqual(['a','g'])
    const bNode=tree[0].children[0]
    expect(bNode.item.id).toBe('b')
    expect(ids(bNode.children)).toEqual(['c'])
    expect(ids(bNode.children[0].children)).toEqual(['d','e'])
  })

  it('keeps siblings oldest first and reports the parent and gene-flow partners',()=>{
    const tree=buildLineageTree(all as never,parents,flows,byId as never)
    const cNode=tree[0].children[0].children[0]
    const eNode=cNode.children[1]
    expect(eNode.parentShort).toBe('c')
    expect(eNode.relationLabel).not.toBeNull()
    expect(eNode.flowPartners).toEqual(['g'])
    expect(tree[0].parentShort).toBeNull()
  })

  it('lists a taxon whose parent is outside the graph as a root, never dropping it',()=>{
    const orphan=sp('o',1.2,0.8)
    const tree=buildLineageTree([...all,orphan] as never,parents,flows,toMap([...all,orphan]) as never)
    expect(ids(tree)).toContain('o')
  })

  it('does not lose or duplicate taxa when parent links form a cycle',()=>{
    const x=sp('x',1.5,1), y=sp('y',1.2,0.9)
    const cyclic=new Map<string,ParentLink>([['x',{from:'y',relation:'descent' as ParentLink['relation']}],['y',{from:'x',relation:'descent' as ParentLink['relation']}]])
    const items=[x,y]
    const tree=buildLineageTree(items as never,cyclic,new Map(),toMap(items) as never)
    const flat=(nodes:LineageNode[]):string[]=>nodes.flatMap(node=>[node.item.id,...flat(node.children)])
    expect(flat(tree).sort()).toEqual(['x','y'])
  })
})
