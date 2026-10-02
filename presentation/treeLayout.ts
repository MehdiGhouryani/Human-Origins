import {ageMaToFraction} from '../domain/time'

export type TreePoint={x:number;y:number}

/**
 * Presentation-only geometry. Scientific records never carry screen coordinates: every position below is computed
 * deterministically from a taxon's age range and clade group, so adding a taxon never requires hand-placed coordinates.
 */
export const TREE_WIDTH=1080
export const TREE_PLOT_X={left:60,right:1020} as const
export const TREE_NODE_RADIUS=18
/**
 * Compact vertical grid step so the full phylogenetic tree fits cleanly in standard viewports.
 */
export const TREE_LANE_HEIGHT=44
const TOP_MARGIN=42
const BOTTOM_MARGIN=42
const LABEL_GAP=12

/** Clade bands from top to bottom matching phylogenetic divergence flow. */
export const TREE_BAND_ORDER=['Early hominins','Australopithecines','Paranthropus','Homo','Denisovans','Neanderthals','Modern humans'] as const

/** Horizontal position on the piecewise-linear deep-time axis. */
export function xForAge(ageMa:number):number{
  return TREE_PLOT_X.left+ageMaToFraction(ageMa)*(TREE_PLOT_X.right-TREE_PLOT_X.left)
}

export type TreeTaxon={id:string;start:number;end:number;group?:string;short?:string;date?:string}
export type TreeNodeGeometry={id:string;x:number;y:number;endX:number;lane:number}
export type TreePlot={left:number;right:number;top:number;bottom:number}
export type TreeLayout={
  nodes:Readonly<Record<string,TreeNodeGeometry>>
  viewBox:{width:number;height:number}
  plot:TreePlot
  lanes:number
}

/** Approximate rendered label widths (node-name 11.5px font, node-date 9px). */
export function labelWidth(taxon:TreeTaxon):number{
  const name=(taxon.short??taxon.id).length*6.8
  const date=(taxon.date??'').length*5.4
  return Math.max(TREE_NODE_RADIUS*2+10,name+14,date+14)
}

/** Horizontal span a taxon occupies on its lane: label badge around the node plus its lifespan bar. */
export function footprint(taxon:TreeTaxon):{from:number;to:number}{
  const x=xForAge(taxon.start)
  const half=labelWidth(taxon)/2
  return {from:x-half-3,to:Math.max(x+half+3,xForAge(taxon.end)+6)}
}

const bandIndex=(group:string|undefined,extra:string[])=>{
  const g=group??''
  const known=(TREE_BAND_ORDER as readonly string[]).indexOf(g)
  if(known>=0) return known
  if(!extra.includes(g)) extra.push(g)
  return TREE_BAND_ORDER.length+extra.indexOf(g)
}

/**
 * Deterministic lane packing:
 * Compact, collision-free arrangement fitting within single-screen viewport.
 */
export function computeTreeLayout(taxa:readonly TreeTaxon[]):TreeLayout{
  const extra:string[]=[]
  const ordered=[...taxa].sort((a,b)=>bandIndex(a.group,extra)-bandIndex(b.group,extra) || b.start-a.start || a.end-b.end || a.id.localeCompare(b.id))
  const lanes:{from:number;to:number}[][]=[]
  const laneOf=new Map<string,number>()
  let currentBand=-1
  let bandFloor=0
  for(const taxon of ordered){
    const band=bandIndex(taxon.group,extra)
    if(band!==currentBand){
      bandFloor=Math.max(0,lanes.length-2)
      currentBand=band
    }
    const span=footprint(taxon)
    const collides=(row:number)=>Boolean(lanes[row]?.some(other=>span.from<other.to+LABEL_GAP && other.from<span.to+LABEL_GAP))
    let lane=bandFloor
    while(collides(lane)||collides(lane+1)) lane+=1
    ;(lanes[lane] ??= []).push(span)
    ;(lanes[lane+1] ??= []).push(span)
    laneOf.set(taxon.id,lane)
  }
  const laneCount=Math.max(2,lanes.length)
  const top=TOP_MARGIN
  const bottom=top+(laneCount-2)*TREE_LANE_HEIGHT+BOTTOM_MARGIN
  const nodes:Record<string,TreeNodeGeometry>={}
  for(const taxon of taxa){
    const lane=laneOf.get(taxon.id) ?? 0
    nodes[taxon.id]={id:taxon.id,x:xForAge(taxon.start),y:top+lane*TREE_LANE_HEIGHT,endX:xForAge(taxon.end),lane}
  }
  return {
    nodes,
    lanes:laneCount,
    plot:{left:TREE_PLOT_X.left,right:TREE_PLOT_X.right,top:top-16,bottom},
    viewBox:{width:TREE_WIDTH,height:bottom+38},
  }
}

/**
 * Orthogonal elbow with rounded corners from parent to child node.
 */
export function branchPath(parent:TreeTaxon & TreeNodeGeometry,child:TreeTaxon & TreeNodeGeometry):string{
  const branchAge=Math.max(parent.end,Math.min(parent.start,child.start))
  const bx=xForAge(branchAge)
  const {y:py}=parent
  const {x:cx,y:cy}=child
  if(Math.abs(cy-py)<1) return `M${bx.toFixed(1)} ${py} H${cx.toFixed(1)}`
  const turnX=Math.max(bx+10,cx-18)
  const r=Math.min(10,Math.abs(cy-py)/2,Math.abs(turnX-bx)/2,Math.abs(cx-turnX)/2)
  const sy=cy>py?1:-1
  return `M${bx.toFixed(1)} ${py} H${(turnX-r).toFixed(1)} Q${turnX.toFixed(1)} ${py} ${turnX.toFixed(1)} ${(py+sy*r).toFixed(1)} V${(cy-sy*r).toFixed(1)} Q${turnX.toFixed(1)} ${cy} ${(turnX+r).toFixed(1)} ${cy} H${cx.toFixed(1)}`
}

/** Fallback age for a gene-flow connector when the relationship record carries no dated admixture signal. */
export const GENE_FLOW_AGE_MA=0.05
