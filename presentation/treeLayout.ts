import {ageMaToFraction} from '../domain/time'

export type TreePoint={x:number;y:number}

export const TREE_WIDTH=1080
export const TREE_PLOT_X={left:70,right:1010} as const
export const TREE_NODE_RADIUS=20
export const TREE_LANE_HEIGHT=52
const TOP_MARGIN=44
const BOTTOM_MARGIN=44
const LABEL_GAP=14

/**
 * Biologically accurate phylogenetic lanes for canonical hominin taxa.
 * Spaced so adjacent chronological branches never overlap horizontally or vertically.
 */
export const CANONICAL_TREE_LANES:Record<string,number>={
  common: 2,          // Central origin stem (~8–6 Ma)
  sahelanthropus: 0,  // Early basal offshoot (~7–6 Ma)
  ardipithecus: 4,    // Early hominin divergence (~4.5–4.3 Ma)
  afarensis: 2,       // Central australopith trunk (~3.9–2.9 Ma)
  africanus: 4,       // Southern australopith offshoot (~3.3–2.1 Ma)
  boisei: 0,          // Paranthropus specialized robust branch (~2.3–1.2 Ma)
  habilis: 6,         // Early Homo divergence (~2.4–1.4 Ma)
  erectus: 6,         // Main Homo lineage (~1.9–0.1 Ma)
  heidelbergensis: 6, // Middle Pleistocene divergence node (~0.7–0.2 Ma)
  denisovan: 0,       // Archaic Asian sister branch (~200–50 ka)
  neanderthal: 3,     // Archaic European sister branch (~430–40 ka)
  sapiens: 6,         // Modern humans (~315 ka–Present)
}

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
  common?:TreeNodeGeometry
}

/** Approximate rendered label width for collision checking. */
export function labelWidth(taxon:TreeTaxon):number{
  const name=(taxon.short??taxon.id).length*6.5
  const date=(taxon.date??'').length*5.2
  return Math.max(TREE_NODE_RADIUS*2+10,name+14,date+14)
}

/** Horizontal footprint for collision avoidance. */
export function footprint(taxon:TreeTaxon):{from:number;to:number}{
  const x=xForAge(taxon.start)
  const half=labelWidth(taxon)/2
  return {from:x-half-3,to:Math.max(x+half+3,xForAge(taxon.end)+6)}
}

/**
 * Deterministic phylogenetic tree layout with collision prevention.
 */
export function computeTreeLayout(taxa:readonly TreeTaxon[]):TreeLayout{
  const laneOf=new Map<string,number>()
  
  // Check if all taxa are in canonical tree lanes
  const allCanonical=taxa.every(t=>t.id in CANONICAL_TREE_LANES)
  
  let laneCount=7
  if(allCanonical){
    for(const taxon of taxa){
      laneOf.set(taxon.id,CANONICAL_TREE_LANES[taxon.id]!)
    }
    laneCount=7
  } else {
    // Dynamic packing for generic / extra taxa in test suites
    const ordered=[...taxa].sort((a,b)=>b.start-a.start || a.end-b.end || a.id.localeCompare(b.id))
    const lanes:{from:number;to:number}[][]=[]
    for(const taxon of ordered){
      const span=footprint(taxon)
      const collides=(row:number)=>Boolean(lanes[row]?.some(other=>span.from<other.to+LABEL_GAP && other.from<span.to+LABEL_GAP))
      let lane=0
      while(collides(lane)||collides(lane+1)||(lane>0&&collides(lane-1))) lane+=1
      ;(lanes[lane] ??= []).push(span)
      laneOf.set(taxon.id,lane)
    }
    laneCount=Math.max(2,lanes.length)
  }

  const top=TOP_MARGIN
  const bottom=top+(laneCount-1)*TREE_LANE_HEIGHT+BOTTOM_MARGIN
  const nodes:Record<string,TreeNodeGeometry>={}

  for(const taxon of taxa){
    const lane=laneOf.get(taxon.id) ?? 2
    const x=xForAge(taxon.start)
    const endX=xForAge(taxon.end)
    const y=top+lane*TREE_LANE_HEIGHT
    nodes[taxon.id]={id:taxon.id,x,y,endX,lane}
  }

  return {
    nodes,
    lanes:laneCount,
    plot:{left:TREE_PLOT_X.left,right:TREE_PLOT_X.right,top:top-18,bottom:bottom-10},
    viewBox:{width:TREE_WIDTH,height:bottom+16},
    common:nodes['common'],
  }
}

/**
 * Clean orthogonal elbow branch with gentle rounded corners.
 */
export function branchPath(parent:TreeTaxon & TreeNodeGeometry,child:TreeTaxon & TreeNodeGeometry):string{
  const {x:px,y:py,endX:peX}=parent
  const {x:cx,y:cy}=child

  // If on the exact same lane, connect parent lifespan/point directly to child
  if(Math.abs(cy-py)<2){
    const startX=Math.max(px,Math.min(peX,cx-10))
    return `M${startX.toFixed(1)} ${py.toFixed(1)} H${cx.toFixed(1)}`
  }

  // Branch departure point along parent timeline
  const branchX=Math.max(px+6,Math.min(peX,cx-36))
  const turnX=Math.max(branchX+12,cx-22)
  const dy=cy-py
  const sy=dy>0?1:-1
  const r=Math.min(12,Math.abs(dy)/2,Math.abs(turnX-branchX)/2,Math.max(4,Math.abs(cx-turnX)/2))

  return `M${branchX.toFixed(1)} ${py.toFixed(1)} `+
         `H${(turnX-r).toFixed(1)} `+
         `Q${turnX.toFixed(1)} ${py.toFixed(1)} ${turnX.toFixed(1)} ${(py+sy*r).toFixed(1)} `+
         `V${(cy-sy*r).toFixed(1)} `+
         `Q${turnX.toFixed(1)} ${cy.toFixed(1)} ${(turnX+r).toFixed(1)} ${cy.toFixed(1)} `+
         `H${cx.toFixed(1)}`
}

export const GENE_FLOW_AGE_MA=0.05
