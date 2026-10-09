import {describe,expect,it} from 'vitest'
import {taxa} from '../content/taxa'
import {relationships} from '../content/relationships'
import {boxesIntersect,boxesOf,computeTreeLayout,TREE_LANE_HEIGHT,TREE_WIDTH,type TreeLink,type TreeTaxon} from '../presentation/treeLayout'

const input:TreeTaxon[]=taxa.map(t=>({id:String(t.id),start:t.start,end:t.end,group:t.group,short:t.short,date:t.date}))
const links:TreeLink[]=relationships.map(r=>({id:String(r.id),from:String(r.from),to:String(r.to),type:r.type,eventAgeMa:r.eventAgeMa}))

/** Deterministic pseudo-random data so the dense-graph test is reproducible. */
function synthetic(count:number){
  let seed=1234567
  const rand=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296}
  const groups=['A','B','C','D','E']
  const nodes:TreeTaxon[]=[];const edges:TreeLink[]=[]
  for(let i=0;i<count;i++){
    const start=Math.max(0.06,8-rand()*7.8);const end=Math.max(0.01,start-rand()*1.2)
    nodes.push({id:`s${i}`,start,end,group:groups[i%groups.length],short:`Taxon number ${i}`,date:`~${start.toFixed(1)}–${end.toFixed(1)} Ma (qualifier text)`})
    if(i>0) edges.push({id:`e${i}`,from:`s${Math.floor(rand()*i)}`,to:`s${i}`,type:'possible'})
  }
  return {nodes,edges}
}

function assertNoOverlap(taxaIn:readonly TreeTaxon[],layout:ReturnType<typeof computeTreeLayout>){
  const items=taxaIn.map(t=>({id:t.id,boxes:boxesOf(layout.nodes[t.id])}))
  for(let i=0;i<items.length;i++) for(let j=i+1;j<items.length;j++){
    const a=items[i].boxes,b=items[j].boxes
    for(const [ka,ba] of Object.entries(a)) for(const [kb,bb] of Object.entries(b)) expect(boxesIntersect(ba,bb),`${items[i].id}.${ka} overlaps ${items[j].id}.${kb}`).toBe(false)
  }
}

describe('automatic tree layout',()=>{
  it('is deterministic and independent of input order',()=>{expect(computeTreeLayout(input,links)).toEqual(computeTreeLayout([...input].reverse(),[...links].reverse()))})
  it('places every catalogue taxon (none are filtered out)',()=>{const l=computeTreeLayout(input,links);expect(Object.keys(l.nodes).sort()).toEqual(input.map(t=>t.id).sort())})
  it('no node, label or lifespan bar overlaps another taxon (all 18 real taxa)',()=>assertNoOverlap(input,computeTreeLayout(input,links)))
  it('no overlap either when every lifespan bar is reserved (time-ranges view)',()=>assertNoOverlap(input,computeTreeLayout(input,links,{reserveRanges:true})))
  it('scales to 150 taxa in the time-ranges view too',()=>{const {nodes,edges}=synthetic(150);assertNoOverlap(nodes,computeTreeLayout(nodes,edges,{reserveRanges:true}))})
  it('keeps clades in bands: one caption per clade with two or more taxa, anchored on its oldest node',()=>{
    const l=computeTreeLayout(input,links)
    const groups=new Map<string,number>();for(const t of input) if(t.group) groups.set(t.group,(groups.get(t.group)??0)+1)
    expect(l.clades.map(c=>c.group).sort()).toEqual([...groups].filter(([,n])=>n>=2).map(([g])=>g).sort())
    for(const c of l.clades){const oldest=[...input].filter(t=>t.group===c.group).sort((a,b)=>b.start-a.start)[0];expect(c.anchorId).toBe(oldest.id)}
  })
  it('keeps every label inside the canvas',()=>{const l=computeTreeLayout(input,links);for(const n of Object.values(l.nodes)){const b=boxesOf(n);expect(b.label.right).toBeLessThanOrEqual(TREE_WIDTH);expect(b.label.bottom).toBeLessThanOrEqual(l.viewBox.height)}})
  it('keeps a lineage on its parent lane when the child starts after the parent ends',()=>{
    const chain:TreeTaxon[]=[{id:'p',start:6,end:5.5,group:'G',short:'P',date:'~6 Ma'},{id:'c',start:3,end:2,group:'G',short:'C',date:'~3 Ma'}]
    const l=computeTreeLayout(chain,[{from:'p',to:'c',type:'possible'}])
    expect(l.nodes.c.lane).toBe(l.nodes.p.lane)
  })
  it('puts temporally overlapping parent and child on different lanes (overlap is real, e.g. A. anamensis / A. afarensis)',()=>{
    const l=computeTreeLayout(input,links)
    expect(l.nodes['afarensis'].lane).not.toBe(l.nodes['anamensis'].lane)
  })
  it('scales to 150 taxa with no overlaps and a bounded canvas',()=>{
    const {nodes,edges}=synthetic(150);const l=computeTreeLayout(nodes,edges)
    expect(Object.keys(l.nodes)).toHaveLength(150)
    assertNoOverlap(nodes,l)
    expect(l.viewBox.height).toBeGreaterThan(TREE_LANE_HEIGHT)
    expect(l.lanes).toBeLessThan(150)
  })
  it('lays out a taxon added to the catalogue with no other change',()=>{
    const added:TreeTaxon={id:'brand-new-taxon',start:1.1,end:0.9,group:'Homo',short:'H. novus',date:'~1.1–0.9 Ma'}
    const l=computeTreeLayout([...input,added],[...links,{id:'rel-new',from:'erectus',to:'brand-new-taxon',type:'possible'}])
    expect(l.nodes['brand-new-taxon']).toBeDefined()
    assertNoOverlap([...input,added],l)
  })
  it('keeps gene-flow label pills inside the canvas and apart from each other',()=>{
    const l=computeTreeLayout(input,links)
    expect(l.geneFlow.length).toBe(links.filter(x=>x.type==='gene-flow').length)
    for(const g of l.geneFlow){expect(g.pill.left).toBeGreaterThanOrEqual(0);expect(g.pill.right).toBeLessThanOrEqual(TREE_WIDTH);expect(g.pill.bottom).toBeLessThanOrEqual(l.viewBox.height)}
    for(let i=0;i<l.geneFlow.length;i++) for(let j=i+1;j<l.geneFlow.length;j++) expect(boxesIntersect(l.geneFlow[i].pill,l.geneFlow[j].pill)).toBe(false)
  })
  it('ignores gene flow when choosing lanes (it is not descent)',()=>{
    const a=computeTreeLayout(input,links.filter(x=>x.type!=='gene-flow'));const b=computeTreeLayout(input,links)
    expect(b.nodes).toEqual(a.nodes)
  })
})
