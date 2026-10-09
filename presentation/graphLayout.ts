import {compareTaxaChronologically} from '../domain/taxon-model'

/**
 * Evolutionary graph layout, v2 ("lineage rails").
 *
 * Why a new engine: the first layout placed nodes on a strictly time-scaled x axis. On the curated main path the
 * Pliocene taxa (Ardipithecus 4.5 Ma, A. anamensis 4.2 Ma, A. afarensis 3.9 Ma) land ~18px apart, so the engine had to
 * stair-step every node onto its own lane, labels collided with neighbouring nodes and S-curves crossed labels.
 *
 * This engine separates the two jobs of the x axis:
 *  - ORDER: every visible taxon gets its own column, oldest → youngest, so nodes and labels can never collide.
 *  - TIME: a monotone piecewise-linear warp passes exactly through each taxon's first appearance. Ticks, the time
 *    cursor and lifespan bars use the warp, so every time mark on screen is still honest, just unevenly spaced.
 *
 * Lanes come from the lineage structure: the "spine" (the chain from the root that leads to a living taxon, else the
 * largest subtree) runs straight along lane 0, and every side branch rises to the nearest free lane above with a single
 * rounded elbow. Lane occupancy is tracked as column intervals, plus the columns where vertical connectors cross a
 * lane, so lines never run through a node, a label or another line. Siblings that leave the same parent use separate
 * ports, farthest lane leftmost, so they never cross or overlap.
 *
 * Pure and deterministic: same input → same output, independent of input order. The same assignment is projected
 * horizontally (desktop) and vertically (mobile, "git graph" style).
 */

export type GraphTaxon={id:string;start:number;end:number;group?:string;short?:string;date?:string;status?:string;inferred?:boolean}
export type GraphLink={id:string;from:string;to:string;type:string;relation?:string;eventAgeMa?:number}

export type GraphNode={id:string;column:number;lane:number;x:number;y:number;parentId?:string;chainHead:boolean;labelSide:'below'|'above'}
export type GraphEdgeKind='rail'|'branch'|'secondary'
export type GraphEdge={id:string;from:string;to:string;kind:GraphEdgeKind;d:string;end:{x:number;y:number};angle:number}
export type GraphGeneFlow={id:string;from:string;to:string;d:string;a:{x:number;y:number};b:{x:number;y:number};pill:{x:number;y:number;width:number;height:number}}
export type GraphTick={ageMa:number;x:number;label:string}
export type GraphClade={group:string;fromX:number;toX:number;y:number;count:number}

export type GraphLayout={
  width:number
  height:number
  nodeRadius:number
  columnWidth:number
  laneHeight:number
  nodes:Readonly<Record<string,GraphNode>>
  order:readonly string[]
  edges:readonly GraphEdge[]
  geneFlow:readonly GraphGeneFlow[]
  ticks:readonly GraphTick[]
  clades:readonly GraphClade[]
  /** Plot area used by the axis, grid and time cursor. */
  plot:{left:number;right:number;top:number;bottom:number}
  /** Warp anchors: ages (Ma, strictly decreasing) and their x positions (strictly increasing). */
  warp:{ages:readonly number[];xs:readonly number[]}
  lanes:{min:number;max:number}
}

export type GraphLayoutOptions={columnWidth?:number;laneHeight?:number;nodeRadius?:number;marginLeft?:number;marginRight?:number}

const f=(n:number)=>Number(n.toFixed(1))
export const GRAPH_LABEL_GAP=8
export const GRAPH_LABEL_HEIGHT=36
const CORNER=16
const PORT_STEP=10

export function formatTick(ageMa:number):string{
  if(ageMa===0) return 'Present'
  return ageMa>=1?`${Number(ageMa.toFixed(1))} Ma`:`${Math.round(ageMa*1000)} ka`
}

/** x position on the warped axis (clamped to the plot). */
export function warpX(warp:GraphLayout['warp'],ageMa:number):number{
  const {ages,xs}=warp
  if(!ages.length) return 0
  if(ageMa>=ages[0]) return xs[0]
  for(let i=0;i<ages.length-1;i++){
    if(ageMa<=ages[i]&&ageMa>=ages[i+1]){
      const t=(ages[i]-ageMa)/(ages[i]-ages[i+1]||1)
      return xs[i]+t*(xs[i+1]-xs[i])
    }
  }
  return xs[xs.length-1]
}

/** Age under an x position (inverse of the warp), for pointer scrubbing. */
export function warpAge(warp:GraphLayout['warp'],x:number):number{
  const {ages,xs}=warp
  if(!ages.length) return 0
  if(x<=xs[0]) return ages[0]
  for(let i=0;i<xs.length-1;i++){
    if(x>=xs[i]&&x<=xs[i+1]){const t=(x-xs[i])/(xs[i+1]-xs[i]||1);return ages[i]+t*(ages[i+1]-ages[i])}
  }
  return ages[ages.length-1]
}

type Assignment={
  ordered:GraphTaxon[]
  column:Map<string,number>
  lane:Map<string,number>
  parent:Map<string,string>
  chainHead:Set<string>
  /** Port offset (px, along the parent's rim) for each branch child. */
  port:Map<string,number>
  /** Where each node's label sits: below by default, above when a branch leaves the node downwards. */
  labelSide:Map<string,'below'|'above'>
  secondary:GraphLink[]
}

/** Lineage structure → columns and lanes. Shared by the horizontal and vertical projections. */
export function assignLanes(taxa:readonly GraphTaxon[],links:readonly GraphLink[]):Assignment{
  const ordered=[...taxa].sort(compareTaxaChronologically)
  const column=new Map(ordered.map((t,i)=>[t.id,i]))
  const byId=new Map(ordered.map(t=>[t.id,t]))
  const parent=new Map<string,string>()
  const secondary:GraphLink[]=[]
  // Primary parent: the oldest descent source that sits in an earlier column. Others become secondary links.
  const descent=[...links].filter(l=>l.type!=='gene-flow'&&byId.has(l.from)&&byId.has(l.to)&&l.from!==l.to)
    .sort((a,b)=>column.get(a.from)!-column.get(b.from)!||a.id.localeCompare(b.id))
  for(const link of descent){
    if(column.get(link.from)!>=column.get(link.to)!){secondary.push(link);continue}
    if(!parent.has(link.to)) parent.set(link.to,link.from)
    else secondary.push(link)
  }
  const children=new Map<string,string[]>()
  for(const t of ordered){const p=parent.get(t.id);if(p)(children.get(p)??children.set(p,[]).get(p)!).push(t.id)}
  // Subtree facts, youngest first so children are known before parents.
  const living=new Map<string,boolean>(),size=new Map<string,number>()
  for(const t of [...ordered].reverse()){
    const kids=children.get(t.id)??[]
    living.set(t.id,t.status==='living'||t.end===0||kids.some(k=>living.get(k)))
    size.set(t.id,1+kids.reduce((s,k)=>s+size.get(k)!,0))
  }
  const heirOf=(id:string)=>{
    const kids=children.get(id)??[]
    return [...kids].sort((a,b)=>Number(living.get(b))-Number(living.get(a))||size.get(b)!-size.get(a)!||column.get(a)!-column.get(b)!)[0]
  }
  // Chains: a node continues its parent's chain when it is the parent's heir.
  const chains:{origin?:string;nodes:string[]}[]=[]
  const chainHead=new Set<string>()
  const startChain=(head:string,origin?:string)=>{
    const nodes=[head];let at=head
    for(let next=heirOf(at);next;next=heirOf(at)){nodes.push(next);at=next}
    chains.push({origin,nodes});chainHead.add(head)
  }
  const roots=ordered.filter(t=>!parent.has(t.id)).map(t=>t.id)
  const lane=new Map<string,number>()
  const port=new Map<string,number>()
  type Interval={from:number;to:number;origin?:string}
  const occupied=new Map<number,Interval[]>()
  const crossings=new Map<number,number[]>()
  const occupy=(l:number,iv:Interval)=>(occupied.get(l)??occupied.set(l,[]).get(l)!).push(iv)
  const cross=(l:number,c:number)=>(crossings.get(l)??crossings.set(l,[]).get(l)!).push(c)
  let minLane=0,maxLane=0
  /** -1 = the parent has a branch rising above it, 1 = a branch dropping below it. */
  const branchDirs=new Map<string,Set<number>>()

  const placeChain=(chain:{origin?:string;nodes:string[]},chosen:number)=>{
    const first=column.get(chain.nodes[0])!,last=column.get(chain.nodes[chain.nodes.length-1])!
    const from=chain.origin!==undefined?column.get(chain.origin)!:first
    for(const id of chain.nodes) lane.set(id,chosen)
    occupy(chosen,{from,to:last,origin:chain.origin})
    minLane=Math.min(minLane,chosen);maxLane=Math.max(maxLane,chosen)
  }
  const fits=(l:number,from:number,to:number,origin:string|undefined,parentLane:number)=>{
    if((occupied.get(l)??[]).some(iv=>!(from>iv.to||iv.from>to))) return false
    if((crossings.get(l)??[]).some(c=>c>=from&&c<=to)) return false
    // Every lane the vertical connector passes through must be clear at the origin column.
    const step=l<parentLane?-1:1
    for(let m=parentLane+step;m!==l;m+=step){
      if((occupied.get(m)??[]).some(iv=>iv.from<=from&&from<=iv.to&&!(iv.origin===origin&&iv.from===from))) return false
    }
    return true
  }

  // Process trees oldest root first; inside a tree, branch chains in order of their origin column, longest first.
  for(const root of roots){
    const pending:{origin?:string;nodes:string[]}[]=[]
    const before=chains.length
    startChain(root)
    const rootChain=chains[before]
    const rootLane=lane.size===0?0:minLane-1
    placeChain(rootChain,rootLane)
    const enqueueBranches=(chain:{nodes:string[]})=>{
      for(const id of chain.nodes){
        const heir=heirOf(id)
        for(const kid of children.get(id)??[]) if(kid!==heir){const at=chains.length;startChain(kid,id);pending.push(chains[at])}
      }
    }
    enqueueBranches(rootChain)
    while(pending.length){
      // Latest origin first: short, late branches hug the spine and earlier, longer branches nest outside them.
      pending.sort((a,b)=>column.get(b.origin!)!-column.get(a.origin!)!||(column.get(a.nodes[a.nodes.length-1])!-column.get(b.nodes[b.nodes.length-1])!)||column.get(a.nodes[0])!-column.get(b.nodes[0])!)
      const chain=pending.shift()!
      const parentLane=lane.get(chain.origin!)!
      const from=column.get(chain.origin!)!,to=column.get(chain.nodes[chain.nodes.length-1])!
      // Branches rise above their parent; they may drop below only when the parent has no rising branch (its label
      // then moves above the node, so the downward connector never crosses it).
      const dirs=branchDirs.get(chain.origin!)??new Set<number>()
      let chosen:number|undefined
      for(let d=1;d<=taxa.length+2&&chosen===undefined;d++){
        if(!dirs.has(1)&&fits(parentLane-d,from,to,chain.origin,parentLane)) chosen=parentLane-d
        else if(!dirs.has(-1)&&fits(parentLane+d,from,to,chain.origin,parentLane)) chosen=parentLane+d
      }
      chosen??=minLane-1
      ;(branchDirs.get(chain.origin!)??branchDirs.set(chain.origin!,new Set()).get(chain.origin!)!).add(chosen<parentLane?-1:1)
      placeChain(chain,chosen)
      const step=chosen<parentLane?-1:1
      for(let m=parentLane+step;m!==chosen;m+=step) cross(m,from)
      enqueueBranches(chain)
    }
  }
  // Ports: siblings leaving the same parent spread along its rim, the farthest lane leftmost.
  const branchKids=new Map<string,string[]>()
  for(const head of chainHead){const p=parent.get(head);if(p)(branchKids.get(p)??branchKids.set(p,[]).get(p)!).push(head)}
  for(const [p,kids] of branchKids){
    const pl=lane.get(p)!
    const sorted=[...kids].sort((a,b)=>Math.abs(lane.get(b)!-pl)-Math.abs(lane.get(a)!-pl)||column.get(a)!-column.get(b)!)
    sorted.forEach((kid,i)=>port.set(kid,f((i-(sorted.length-1)/2)*PORT_STEP)))
  }
  const labelSide=new Map<string,'below'|'above'>()
  for(const t of ordered){const dirs=branchDirs.get(t.id);labelSide.set(t.id,dirs?.has(1)&&!dirs.has(-1)?'above':'below')}
  return {ordered,column,lane,parent,chainHead,port,secondary,labelSide}
}

const portY=(r:number,offset:number)=>Math.sqrt(Math.max(0,r*r-offset*offset))

export function computeGraphLayout(taxa:readonly GraphTaxon[],links:readonly GraphLink[],options:GraphLayoutOptions={}):GraphLayout{
  const colW=options.columnWidth??132,laneH=options.laneHeight??104,r=options.nodeRadius??21
  const marginLeft=options.marginLeft??36,marginRight=options.marginRight??150
  const a=assignLanes(taxa,links)
  const minLane=Math.min(0,...a.lane.values()),maxLane=Math.max(0,...a.lane.values())

  const groups=[...new Set(a.ordered.map(t=>t.group).filter((g):g is string=>Boolean(g)))]
  // Clade brackets: one row unless clades interleave in column order.
  const spans=groups.map(group=>{const cols=a.ordered.filter(t=>t.group===group).map(t=>a.column.get(t.id)!);return {group,from:Math.min(...cols),to:Math.max(...cols),count:cols.length}}).sort((x,y)=>x.from-y.from)
  const rows:number[][]=[]
  const cladeRow=new Map<string,number>()
  for(const span of spans){
    let row=rows.findIndex(list=>list.every(end=>end<span.from))
    if(row<0){row=rows.length;rows.push([])}
    rows[row].push(span.to);cladeRow.set(span.group,row)
  }
  const cladeBand=rows.length*24
  const topHasAbove=a.ordered.some(t=>a.lane.get(t.id)===minLane&&a.labelSide.get(t.id)==='above')
  const top=cladeBand+40+r+(topHasAbove?GRAPH_LABEL_GAP+GRAPH_LABEL_HEIGHT:0)
  const xCol=(c:number)=>marginLeft+c*colW+colW/2
  const yLane=(l:number)=>top+(l-minLane)*laneH
  const nodes:Record<string,GraphNode>={}
  for(const t of a.ordered){
    const column=a.column.get(t.id)!,lane=a.lane.get(t.id)!
    nodes[t.id]={id:t.id,column,lane,x:xCol(column),y:yLane(lane),parentId:a.parent.get(t.id),chainHead:a.chainHead.has(t.id),labelSide:a.labelSide.get(t.id)??'below'}
  }
  const lastX=a.ordered.length?xCol(a.ordered.length-1):marginLeft
  const width=Math.round(lastX+colW/2+marginRight)
  const plotTop=cladeBand+16
  const lowestY=yLane(maxLane)
  const plotBottom=lowestY+r+GRAPH_LABEL_GAP+GRAPH_LABEL_HEIGHT+18
  const height=Math.round(plotBottom+36)

  // Warp anchors.
  const ages:number[]=[],xs:number[]=[]
  if(a.ordered.length){
    const first=a.ordered[0].start
    const leftAge=Math.max(first+0.25,Math.ceil(first+0.01))
    ages.push(leftAge);xs.push(marginLeft+8)
    const byAge=new Map<number,number[]>()
    for(const t of a.ordered) (byAge.get(t.start)??byAge.set(t.start,[]).get(t.start)!).push(nodes[t.id].x)
    for(const [age,list] of [...byAge].sort((p,q)=>q[0]-p[0])){
      if(age>=ages[ages.length-1]||age<=0) continue
      ages.push(age);xs.push(list.reduce((s,v)=>s+v,0)/list.length)
    }
    ages.push(0);xs.push(Math.max(xs[xs.length-1]+40,lastX+colW*0.62))
  }
  const warp={ages,xs}

  const tickCandidates=[7,6,5,4,3,2,1.5,1,0.5,0.3,0.2,0.1,0]
  const ticks:GraphTick[]=[]
  for(const age of tickCandidates){
    if(!ages.length||age>ages[0]) continue
    const x=warpX(warp,age)
    const prev=ticks[ticks.length-1]
    if(prev&&x-prev.x<64){if(age===0) ticks.pop();else continue}
    ticks.push({ageMa:age,x:f(x),label:formatTick(age)})
  }

  const edges:GraphEdge[]=[]
  const used=new Set<string>()
  for(const link of [...links].sort((p,q)=>p.id.localeCompare(q.id))){
    if(link.type==='gene-flow') continue
    const p=nodes[link.from],c=nodes[link.to]
    if(!p||!c||used.has(`${link.from}>${link.to}`)) continue
    used.add(`${link.from}>${link.to}`)
    const isPrimary=a.parent.get(link.to)===link.from
    if(isPrimary&&p.lane===c.lane){
      edges.push({id:link.id,from:link.from,to:link.to,kind:'rail',d:`M${f(p.x+r)} ${f(p.y)} H${f(c.x-r)}`,end:{x:f(c.x-r),y:f(c.y)},angle:0})
    }else if(isPrimary){
      const off=a.port.get(link.to)??0
      const up=c.y<p.y
      const sx=p.x+off,sy=p.y+(up?-1:1)*portY(r,off)
      const k=up?1:-1
      edges.push({id:link.id,from:link.from,to:link.to,kind:'branch',
        d:`M${f(sx)} ${f(sy)} V${f(c.y+k*CORNER)} Q${f(sx)} ${f(c.y)} ${f(sx+CORNER)} ${f(c.y)} H${f(c.x-r)}`,end:{x:f(c.x-r),y:f(c.y)},angle:0})
    }else{
      const sx=p.x+r,sy=p.y,ex=c.x-r,ey=c.y,mx=(sx+ex)/2
      edges.push({id:link.id,from:link.from,to:link.to,kind:'secondary',d:`M${f(sx)} ${f(sy)} C${f(mx)} ${f(sy)} ${f(mx)} ${f(ey)} ${f(ex)} ${f(ey)}`,end:{x:f(ex),y:f(ey)},angle:0})
    }
  }

  const geneFlow:GraphGeneFlow[]=[]
  const pills:{x:number;y:number;width:number;height:number}[]=[]
  const flows=links.filter(l=>l.type==='gene-flow'&&nodes[l.from]&&nodes[l.to]).sort((p,q)=>p.id.localeCompare(q.id))
  flows.forEach((link,index)=>{
    const n1=nodes[link.from],n2=nodes[link.to]
    const [upper,lower]=n1.y<=n2.y?[n1,n2]:[n2,n1]
    const A={x:f(upper.x+r*0.72),y:f(upper.y-r*0.69)}
    const B={x:f(lower.x+r),y:f(lower.y)}
    const bow=Math.max(upper.x,lower.x)+r+44+index*18
    const lift=upper.y-r-14-index*6
    const d=`M${A.x} ${A.y} C${f(A.x+28)} ${f(lift)} ${f(bow)} ${f(lift)} ${f(bow)} ${f((lift+B.y)/2)} S${f(B.x+26)} ${B.y} ${B.x} ${B.y}`
    const w=92,h=24
    let py=f((lift+B.y)/2-h/2)
    const px=Math.min(f(bow+10),width-w-6)
    while(pills.some(o=>!(px+w<o.x||o.x+o.width<px||py+h+4<o.y||o.y+o.height+4<py))) py+=h+6
    const pill={x:px,y:py,width:w,height:h}
    pills.push(pill)
    geneFlow.push({id:link.id,from:link.from,to:link.to,d,a:A,b:B,pill})
  })

  const clades:GraphClade[]=spans.map(span=>({group:span.group,fromX:f(xCol(span.from)-colW/2+10),toX:f(xCol(span.to)+colW/2-10),y:f(16+cladeRow.get(span.group)!*24),count:span.count}))

  return {width,height,nodeRadius:r,columnWidth:colW,laneHeight:laneH,nodes,order:a.ordered.map(t=>t.id),edges,geneFlow,ticks,clades,
    plot:{left:marginLeft,right:xs[xs.length-1]??width-marginRight,top:plotTop,bottom:plotBottom},warp,lanes:{min:minLane,max:maxLane}}
}

/** Vertical ("git graph") projection for narrow screens: one row per taxon, lanes become gutter columns. */
export type VerticalGraphLayout={
  rowHeight:number
  laneWidth:number
  gutter:number
  height:number
  dotRadius:number
  rows:readonly {id:string;row:number;lane:number;x:number;y:number}[]
  paths:readonly {id:string;from:string;to:string;kind:GraphEdgeKind;d:string}[]
}

export function computeVerticalGraphLayout(taxa:readonly GraphTaxon[],links:readonly GraphLink[],{rowHeight=76,laneWidth=22,dotRadius=8}:{rowHeight?:number;laneWidth?:number;dotRadius?:number}={}):VerticalGraphLayout{
  const a=assignLanes(taxa,links)
  const maxSide=Math.max(0,...[...a.lane.values()].map(l=>-l))
  const minDown=Math.min(0,...[...a.lane.values()].map(l=>-l))
  const pad=14
  const xOf=(lane:number)=>pad+(-lane-minDown)*laneWidth
  const rows=a.ordered.map((t,i)=>({id:t.id,row:i,lane:a.lane.get(t.id)!,x:xOf(a.lane.get(t.id)!),y:i*rowHeight+rowHeight/2}))
  const at=new Map(rows.map(row=>[row.id,row]))
  const R=10,r=dotRadius
  const paths:VerticalGraphLayout['paths'][number][]=[]
  const used=new Set<string>()
  for(const link of [...links].sort((p,q)=>p.id.localeCompare(q.id))){
    if(link.type==='gene-flow') continue
    const p=at.get(link.from),c=at.get(link.to)
    if(!p||!c||used.has(`${link.from}>${link.to}`)) continue
    used.add(`${link.from}>${link.to}`)
    const primary=a.parent.get(link.to)===link.from
    if(primary&&p.x===c.x) paths.push({id:link.id,from:link.from,to:link.to,kind:'rail',d:`M${f(p.x)} ${f(p.y+r)} V${f(c.y-r)}`})
    else if(primary){
      const off=(a.port.get(link.to)??0)*0.6
      const dir=c.x>p.x?1:-1
      const sy=p.y+off,sx=p.x+dir*portY(r,off)
      paths.push({id:link.id,from:link.from,to:link.to,kind:'branch',d:`M${f(sx)} ${f(sy)} H${f(c.x-dir*R)} Q${f(c.x)} ${f(sy)} ${f(c.x)} ${f(sy+R)} V${f(c.y-r)}`})
    }else paths.push({id:link.id,from:link.from,to:link.to,kind:'secondary',d:`M${f(p.x)} ${f(p.y+r)} C${f(p.x)} ${f((p.y+c.y)/2)} ${f(c.x)} ${f((p.y+c.y)/2)} ${f(c.x)} ${f(c.y-r)}`})
  }
  return {rowHeight,laneWidth,gutter:pad*2+(maxSide-minDown)*laneWidth,height:rows.length*rowHeight,dotRadius:r,rows,paths}
}
