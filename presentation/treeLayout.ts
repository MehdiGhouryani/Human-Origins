import {ageMaToFraction} from '../domain/time'
import {compareTaxaChronologically} from '../domain/taxon-model'

export type TreePoint={x:number;y:number}

export const TREE_WIDTH=1440
export const TREE_PLOT_X={left:70,right:1290} as const
export const TREE_NODE_RADIUS=18
/**
 * Vertical distance between lanes. Labels sit to the RIGHT of their node (as in the reference design), so a lane only
 * has to fit one node plus the clade caption that may sit above the first node of a clade.
 */
export const TREE_LANE_HEIGHT=62
/** Gap between the node circle and its label. */
export const TREE_LABEL_OFFSET=7
export const TREE_LABEL_HEIGHT=32
/** Space above the first lane: the time axis (drawn at the top) and a clade caption. */
const TOP_MARGIN=82
export const TREE_AXIS_Y=22
const BOTTOM_MARGIN=26
const LABEL_GAP=12
const BAR_HALF_THICKNESS=4
const CLADE_CAPTION_HEIGHT=14

/** Horizontal position on the piecewise-linear deep-time axis. */
export function xForAge(ageMa:number):number{
  return TREE_PLOT_X.left+ageMaToFraction(ageMa)*(TREE_PLOT_X.right-TREE_PLOT_X.left)
}

export type TreeTaxon={id:string;start:number;end:number;group?:string;short?:string;date?:string}
export type TreeLink={id?:string;from:string;to:string;type:string;eventAgeMa?:number}
export type TreeNodeGeometry={id:string;x:number;y:number;endX:number;lane:number;labelWidth:number;labelDate:string;
  /** True when the layout reserved the full lifespan bar in the lane (the "time ranges" view). */
  rangeReserved:boolean}
export type TreePlot={left:number;right:number;top:number;bottom:number}
export type Box={left:number;right:number;top:number;bottom:number}
export type GeneFlowGeometry={id:string;x:number;top:number;bottom:number;path:string;pill:Box;pillSide:'left'|'right'}
export type CladeCaption={group:string;x:number;y:number;anchorId:string;count:number}
export type TreeLayoutOptions={
  /**
   * Reserve each taxon's full documented time range in its lane, so lifespan bars can be drawn for every taxon without
   * touching anything else. Off by default: the compact view only reserves the node and its label, and the range of the
   * selected taxon is drawn as an overlay.
   */
  reserveRanges?:boolean
}
export type TreeLayout={
  nodes:Readonly<Record<string,TreeNodeGeometry>>
  viewBox:{width:number;height:number}
  plot:TreePlot
  lanes:number
  geneFlow:readonly GeneFlowGeometry[]
  /** One caption per clade with at least two visible taxa, above that clade's oldest node. */
  clades:readonly CladeCaption[]
}

/** Labels carry a compact date: parenthetical qualifiers stay in the overview panel, where there is room to read them. */
export const compactDate=(date:string|undefined):string=>(date??'').replace(/\s*\([^)]*\)\s*/g,' ').replace(/\s+/g,' ').trim()

/** Approximate rendered label width for collision checking (12px name / 11px date). */
export function labelWidthFor(taxon:TreeTaxon):number{
  const name=(taxon.short??taxon.id).length*6.9
  const date=compactDate(taxon.date).length*6.1
  return Math.round(Math.max(56,name+18,date+18))
}

/** Every rectangle a taxon occupies: node, label (to the right of the node), and lifespan bar when it is reserved. */
export function boxesOf(node:TreeNodeGeometry):{node:Box;label:Box;bar:Box}{
  const r=TREE_NODE_RADIUS
  const labelLeft=node.x+r+TREE_LABEL_OFFSET
  return {
    node:{left:node.x-r,right:node.x+r,top:node.y-r,bottom:node.y+r},
    label:{left:labelLeft,right:labelLeft+node.labelWidth,top:node.y-TREE_LABEL_HEIGHT/2,bottom:node.y+TREE_LABEL_HEIGHT/2},
    // In the compact view the range is not drawn in the lane, so it occupies nothing there.
    bar:node.rangeReserved
      ?{left:node.x,right:Math.max(node.x,node.endX),top:node.y-BAR_HALF_THICKNESS,bottom:node.y+BAR_HALF_THICKNESS}
      :{left:node.x,right:node.x,top:node.y,bottom:node.y},
  }
}

export const boxesIntersect=(a:Box,b:Box,gap=0):boolean=>{
  // A zero-area box (an unreserved bar) occupies nothing.
  if(a.right<=a.left&&a.bottom<=a.top) return false
  if(b.right<=b.left&&b.bottom<=b.top) return false
  return a.left<b.right+gap&&b.left<a.right+gap&&a.top<b.bottom+gap&&b.top<a.bottom+gap
}

/** Horizontal span a taxon claims inside its lane. */
export function footprint(taxon:TreeTaxon,options:TreeLayoutOptions={}):{from:number;to:number}{
  const x=xForAge(taxon.start)
  const labelRight=x+TREE_NODE_RADIUS+TREE_LABEL_OFFSET+labelWidthFor(taxon)
  const rangeRight=options.reserveRanges?xForAge(taxon.end)+6:labelRight
  return {from:x-TREE_NODE_RADIUS,to:Math.max(labelRight,rangeRight)}
}

/** Descent parent of each taxon: the oldest source of a non-gene-flow link. Gene flow never defines placement. */
function parentMap(taxa:readonly TreeTaxon[],links:readonly TreeLink[]):Map<string,string>{
  const byId=new Map(taxa.map(t=>[t.id,t]))
  const parents=new Map<string,string>()
  for(const link of links){
    if(link.type==='gene-flow'||!byId.has(link.from)||!byId.has(link.to)||link.from===link.to) continue
    const current=parents.get(link.to)
    if(!current||compareTaxaChronologically(byId.get(link.from)!,byId.get(current)!)<0) parents.set(link.to,link.from)
  }
  return parents
}

/** Lane-change cost for sharing a lane with another clade: keeps clades in visual bands without forbidding it. */
const FOREIGN_LANE_PENALTY=2.5

/**
 * Deterministic, relationship- and clade-aware layout.
 *
 * Taxa are placed oldest first. A taxon prefers its parent's lane when both belong to the same clade (a lineage reads
 * as a line), otherwise the mean lane of its clade, otherwise its parent's lane (a new clade branches off next to its
 * source). Among free lanes it picks the cheapest: distance from the preferred lane plus a penalty for lanes already
 * used by another clade, so clades form bands as in the reference design. Nothing depends on taxon ids: a taxon added
 * to the catalogue is laid out automatically.
 */
export function computeTreeLayout(taxa:readonly TreeTaxon[],links:readonly TreeLink[]=[],options:TreeLayoutOptions={}):TreeLayout{
  const ordered=[...taxa].sort(compareTaxaChronologically)
  const byId=new Map(taxa.map(t=>[t.id,t]))
  const parents=parentMap(taxa,links)
  const laneOf=new Map<string,number>()
  const rows=new Map<number,{from:number;to:number}[]>()
  const laneGroups=new Map<number,Set<string>>()
  const groupLanes=new Map<string,number[]>()
  const free=(lane:number,span:{from:number;to:number})=>!(rows.get(lane)??[]).some(other=>span.from<other.to+LABEL_GAP&&other.from<span.to+LABEL_GAP)

  for(const taxon of ordered){
    const span=footprint(taxon,options)
    const parentId=parents.get(taxon.id)
    const parentLane=parentId!==undefined?laneOf.get(parentId):undefined
    const sameGroupParent=parentId!==undefined&&byId.get(parentId)?.group===taxon.group
    const lanesOfGroup=taxon.group?groupLanes.get(taxon.group):undefined
    const groupMean=lanesOfGroup?.length?Math.round(lanesOfGroup.reduce((sum,v)=>sum+v,0)/lanesOfGroup.length):undefined
    const preferred=(sameGroupParent?parentLane:undefined)??groupMean??parentLane??0
    let best:{lane:number;cost:number}|undefined
    for(let step=0;step<=2*ordered.length+2;step++){
      // 0, +1, -1, +2, -2 … : the same alternation as before, so ties resolve deterministically.
      const candidate=step===0?preferred:preferred+(step%2===1?(step+1)/2:-step/2)
      if(!free(candidate,span)) continue
      const others=laneGroups.get(candidate)
      const foreign=others&&taxon.group?[...others].some(g=>g!==taxon.group):false
      const cost=Math.abs(candidate-preferred)+(foreign?FOREIGN_LANE_PENALTY:0)
      if(!best||cost<best.cost) best={lane:candidate,cost}
      if(best.cost<=Math.ceil((step+1)/2)) break
    }
    const lane=best?.lane??preferred
    laneOf.set(taxon.id,lane)
    ;(rows.get(lane)??rows.set(lane,[]).get(lane)!).push(span)
    if(taxon.group){
      ;(groupLanes.get(taxon.group)??groupLanes.set(taxon.group,[]).get(taxon.group)!).push(lane)
      ;(laneGroups.get(lane)??laneGroups.set(lane,new Set()).get(lane)!).add(taxon.group)
    }
  }

  const minLane=ordered.length?Math.min(...laneOf.values()):0
  const maxLane=ordered.length?Math.max(...laneOf.values())-minLane:0
  const nodes:Record<string,TreeNodeGeometry>={}
  for(const taxon of taxa){
    const lane=(laneOf.get(taxon.id)??minLane)-minLane
    nodes[taxon.id]={id:taxon.id,x:xForAge(taxon.start),endX:xForAge(taxon.end),y:TOP_MARGIN+lane*TREE_LANE_HEIGHT,lane,labelWidth:labelWidthFor(taxon),labelDate:compactDate(taxon.date),rangeReserved:Boolean(options.reserveRanges)}
  }
  const lastY=TOP_MARGIN+maxLane*TREE_LANE_HEIGHT
  // Room under the last lane for the selected taxon's range overlay.
  const bottom=lastY+TREE_NODE_RADIUS+BOTTOM_MARGIN
  const plot:TreePlot={left:TREE_PLOT_X.left,right:TREE_PLOT_X.right,top:TREE_AXIS_Y+12,bottom}
  const height=bottom+12

  const clades:CladeCaption[]=[]
  const byGroup=new Map<string,TreeTaxon[]>()
  for(const taxon of ordered) if(taxon.group) (byGroup.get(taxon.group)??byGroup.set(taxon.group,[]).get(taxon.group)!).push(taxon)
  for(const [group,members] of byGroup){
    if(members.length<2) continue
    const anchor=nodes[members[0].id]
    clades.push({group,anchorId:anchor.id,x:anchor.x-TREE_NODE_RADIUS,y:anchor.y-TREE_NODE_RADIUS-CLADE_CAPTION_HEIGHT/2-2,count:members.length})
  }

  return {nodes,lanes:maxLane+1,plot,viewBox:{width:TREE_WIDTH,height},geneFlow:layoutGeneFlow(links.filter(l=>l.type==='gene-flow'),nodes,height),clades}
}

export const GENE_FLOW_AGE_MA=0.05
export const GENE_FLOW_PILL={width:86,height:20} as const

/** Gene-flow connectors: vertical arcs at the event age, with label pills kept inside the canvas and clear of each other. */
function layoutGeneFlow(links:readonly TreeLink[],nodes:Readonly<Record<string,TreeNodeGeometry>>,canvasHeight:number):GeneFlowGeometry[]{
  const placed:GeneFlowGeometry[]=[]
  const sorted=[...links].sort((a,b)=>String(a.id??`${a.from}>${a.to}`).localeCompare(String(b.id??`${b.from}>${b.to}`)))
  sorted.forEach((link,index)=>{
    const a=nodes[link.from],b=nodes[link.to]
    if(!a||!b) return
    const x=xForAge(link.eventAgeMa??GENE_FLOW_AGE_MA)
    const top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y)
    const bow=22+index*14
    const span=bottom-top
    const path=`M${x} ${top} C${x+bow} ${top+span*0.25} ${x+bow} ${top+span*0.75} ${x} ${bottom}`
    const w=GENE_FLOW_PILL.width,h=GENE_FLOW_PILL.height
    const fitsRight=x+bow+8+w<=TREE_WIDTH-8
    const left=fitsRight?x+bow+8:x-bow-8-w
    let cy=top+span*(0.5+((index%3)-1)*0.14)
    const clash=(cyTry:number)=>placed.some(p=>boxesIntersect(p.pill,{left,right:left+w,top:cyTry-h/2,bottom:cyTry+h/2},4))
    for(let guard=0;clash(cy)&&guard<200;guard++) cy+=h+4
    cy=Math.max(h/2,Math.min(cy,canvasHeight-h/2))
    placed.push({id:String(link.id??`${link.from}>${link.to}`),x,top,bottom,path,pill:{left,right:left+w,top:cy-h/2,bottom:cy+h/2},pillSide:fitsRight?'right':'left'})
  })
  return placed
}

export type BranchGeometry={d:string;end:TreePoint;/** Direction of travel at the end point, in degrees (0 = rightwards). */angle:number}

/**
 * Smooth branch from a parent node to a child node, ending at the child's circle so a marker can sit on it.
 * Far-apart nodes get an S-curve that leaves the parent horizontally (reference style); nodes that are close in time
 * get a quarter curve that drops out of the parent's top or bottom edge.
 */
export function branchGeometry(parent:Pick<TreeNodeGeometry,'x'|'y'>,child:Pick<TreeNodeGeometry,'x'|'y'>):BranchGeometry{
  const r=TREE_NODE_RADIUS
  const {x:px,y:py}=parent
  const {x:cx,y:cy}=child
  const f=(n:number)=>n.toFixed(1)
  if(Math.abs(cy-py)<2){
    const end={x:cx-r,y:cy}
    return {d:`M${f(px+r)} ${f(py)} H${f(end.x)}`,end,angle:0}
  }
  const sy=cy>py?1:-1
  const dx=(cx-r)-(px+r)
  if(dx>=40){
    const s=Math.min(dx,110)
    const bx=cx-r-s
    const end={x:cx-r,y:cy}
    return {d:`M${f(px+r)} ${f(py)} H${f(bx)} C${f(bx+s*0.55)} ${f(py)} ${f(bx+s*0.45)} ${f(cy)} ${f(end.x)} ${f(cy)}`,end,angle:0}
  }
  if(cx-r>px+4){
    const end={x:cx-r,y:cy}
    return {d:`M${f(px)} ${f(py+sy*r)} C${f(px)} ${f(cy)} ${f(px)} ${f(cy)} ${f(end.x)} ${f(cy)}`,end,angle:0}
  }
  // Child starts (almost) directly above or below the parent: a short vertical link into its edge.
  const end={x:cx,y:cy-sy*r}
  return {d:`M${f(px)} ${f(py+sy*r)} C${f(px)} ${f((py+cy)/2)} ${f(cx)} ${f((py+cy)/2)} ${f(end.x)} ${f(end.y)}`,end,angle:sy>0?90:-90}
}

/** Path only (kept for callers that do not draw markers). */
export function branchPath(parent:Pick<TreeNodeGeometry,'x'|'y'|'endX'>,child:Pick<TreeNodeGeometry,'x'|'y'>):string{
  return branchGeometry(parent,child).d
}
