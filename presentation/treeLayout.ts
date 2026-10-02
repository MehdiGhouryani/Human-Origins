import {ageMaToFraction} from '../domain/time'

export type TreePoint={x:number;y:number}

/**
 * Presentation-only geometry. Scientific records never carry screen coordinates: every position below is computed
 * deterministically from a taxon's age range and clade group, so adding a taxon never requires hand-placed coordinates.
 */
export const TREE_WIDTH=1120
export const TREE_PLOT_X={left:70,right:1070} as const
export const TREE_NODE_RADIUS=22
/**
 * Vertical grid step. A taxon occupies two consecutive rows: the node + bar on its own row and its two label lines
 * on the row below. Staggering on a half-height grid keeps the drawing compact without labels touching nodes.
 */
export const TREE_LANE_HEIGHT=52
const TOP_MARGIN=60
const BOTTOM_MARGIN=60
const LABEL_GAP=16

/** Clade bands from top to bottom. Unknown groups are appended after these, in first-seen order. */
export const TREE_BAND_ORDER=['Paranthropus','Australopithecines','Early hominins','Homo','Denisovans','Neanderthals','Modern humans'] as const

/** Horizontal position is never hand-placed: it is the taxon's age on the shared deep-time axis. */
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

/** Approximate rendered label widths (node-name 13px display font, node-date 10px). Deterministic, no DOM measuring. */
export function labelWidth(taxon:TreeTaxon):number{
  const name=(taxon.short??taxon.id).length*7.1
  const date=(taxon.date??'').length*5.6
  return Math.max(TREE_NODE_RADIUS*2,name,date)
}

/** Horizontal span a taxon occupies on its lane: label box around the node plus its lifespan bar. */
export function footprint(taxon:TreeTaxon):{from:number;to:number}{
  const x=xForAge(taxon.start)
  const half=labelWidth(taxon)/2
  return {from:x-half,to:Math.max(x+half,xForAge(taxon.end)+4)}
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
 * 1. taxa are grouped into clade bands (TREE_BAND_ORDER), bands stacked top → bottom;
 * 2. inside a band, taxa are taken oldest-first (ties by id) and placed on the first row pair of that band whose
 *    occupied spans do not collide with the taxon's footprint (label box + lifespan bar);
 * 3. each taxon reserves two rows (node row + label row); a band may start on the label row of the band above when
 *    nothing collides, which keeps the drawing compact without interleaving clades.
 * The same input always yields the same output, and no two footprints on one lane overlap (tests/tree-layout.test.ts).
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
      // New band: may share the last occupied lane of the previous band, never anything above it.
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
  // The last row only holds labels, so the plot ends one row (plus margin) below the last node row.
  const bottom=top+(laneCount-2)*TREE_LANE_HEIGHT+BOTTOM_MARGIN
  const nodes:Record<string,TreeNodeGeometry>={}
  for(const taxon of taxa){
    const lane=laneOf.get(taxon.id) ?? 0
    nodes[taxon.id]={id:taxon.id,x:xForAge(taxon.start),y:top+lane*TREE_LANE_HEIGHT,endX:xForAge(taxon.end),lane}
  }
  return {
    nodes,
    lanes:laneCount,
    plot:{left:TREE_PLOT_X.left,right:TREE_PLOT_X.right,top:top-18,bottom},
    viewBox:{width:TREE_WIDTH,height:bottom+40},
  }
}

/**
 * Organic branch curve from the parent's lifespan bar to the child node. The branch leaves the parent at the child's
 * first appearance when that falls inside the parent's range (otherwise at the nearest range edge) using a smooth
 * horizontal-tangent cubic Bézier S-curve, providing an authentic phylogenetic cladogram appearance.
 */
export function branchPath(parent:TreeTaxon & TreeNodeGeometry,child:TreeTaxon & TreeNodeGeometry):string{
  const branchAge=Math.max(parent.end,Math.min(parent.start,child.start))
  const bx=xForAge(branchAge)
  const {y:py}=parent
  const {x:cx,y:cy}=child
  if(Math.abs(cy-py)<1) return `M${bx.toFixed(1)} ${py} H${cx.toFixed(1)}`
  const dx=Math.max(12,cx-bx)
  const c1x=bx+dx*0.5
  const c2x=cx-dx*0.5
  return `M${bx.toFixed(1)} ${py} C${c1x.toFixed(1)} ${py} ${c2x.toFixed(1)} ${cy} ${cx.toFixed(1)} ${cy}`
}

/** Fallback age for a gene-flow connector when the relationship record carries no dated admixture signal. */
export const GENE_FLOW_AGE_MA=0.05
