import type {ResearchGraphEdge,ResearchGraphEdgePredicate,ResearchGraphNode,ResearchGraphSnapshot} from './research-graph'

/**
 * Graph traversal contracts (V24.1).
 *
 * research-graph.ts produces a deterministic *projection* of the canonical catalog:
 * a flat, sorted list of nodes and edges. That projection is the source of truth, but
 * on its own it only supports a full scan -- there was no way to ask "what is adjacent
 * to this node", "is there a path from this claim to any source", or "what does the
 * documented chain behind this claim look like" without every caller re-implementing
 * its own scan. This module adds that traversal layer without altering the projection.
 */

export type TraversalDirection='out'|'in'|'both'

export type AdjacencyIndex={
  outgoing:ReadonlyMap<string,readonly ResearchGraphEdge[]>
  incoming:ReadonlyMap<string,readonly ResearchGraphEdge[]>
}

export type TraversalOptions={
  direction?:TraversalDirection
  predicates?:readonly ResearchGraphEdgePredicate[]
  maxDepth?:number
}

export type TraversalVisit={
  nodeId:string
  depth:number
  viaEdgeId?:string
}

export type TraversalResult={
  visited:readonly TraversalVisit[]
  edges:readonly ResearchGraphEdge[]
}

const push=(map:Map<string,ResearchGraphEdge[]>,key:string,edge:ResearchGraphEdge)=>{
  const list=map.get(key)
  if(list) list.push(edge)
  else map.set(key,[edge])
}

/** Builds O(1) adjacency lookups from a graph snapshot's flat, sorted edge list. Build once per snapshot and reuse across calls -- it is pure and depends only on the snapshot's edges. */
export function buildAdjacencyIndex(graph:ResearchGraphSnapshot):AdjacencyIndex{
  const outgoing=new Map<string,ResearchGraphEdge[]>()
  const incoming=new Map<string,ResearchGraphEdge[]>()
  for(const edge of graph.edges){
    push(outgoing,edge.from,edge)
    push(incoming,edge.to,edge)
  }
  return {outgoing,incoming}
}

const matchesPredicate=(edge:ResearchGraphEdge,predicates:readonly ResearchGraphEdgePredicate[]|undefined)=>
  !predicates || predicates.includes(edge.predicate)

/** Edges touching `nodeId` in the requested direction, optionally restricted to a predicate allow-list. */
export function neighborEdges(index:AdjacencyIndex,nodeId:string,direction:TraversalDirection='both',predicates?:readonly ResearchGraphEdgePredicate[]):readonly ResearchGraphEdge[]{
  const out=direction==='in'?[]:index.outgoing.get(nodeId)??[]
  const inn=direction==='out'?[]:index.incoming.get(nodeId)??[]
  return [...out,...inn].filter(edge=>matchesPredicate(edge,predicates))
}

/** The node id an edge leads to, seen from the side of `fromNodeId` (handles both directions, since an "in" edge is traversed from its `to` side). */
const otherEnd=(edge:ResearchGraphEdge,fromNodeId:string)=>edge.from===fromNodeId?edge.to:edge.from

/**
 * Breadth-first traversal from `startNodeId`. Cycle-safe (a visited-set guarantees each
 * node is reached at most once, at its shortest depth from the start), deterministic
 * (edges are walked in the snapshot's own sorted order), and bounded by `maxDepth` when
 * given. Returns every reached node with its depth and the edge that first reached it,
 * plus the flat list of edges actually used to reach them (the traversal tree).
 */
export function traverse(graph:ResearchGraphSnapshot,index:AdjacencyIndex,startNodeId:string,options:TraversalOptions={}):TraversalResult{
  const {direction='out',predicates,maxDepth=Infinity}=options
  if(!graph.nodes.some(node=>node.id===startNodeId)) return {visited:[],edges:[]}
  const visited=new Map<string,TraversalVisit>([[startNodeId,{nodeId:startNodeId,depth:0}]])
  const usedEdges:ResearchGraphEdge[]=[]
  let frontier=[startNodeId]
  let depth=0
  while(frontier.length && depth<maxDepth){
    const next:string[]=[]
    for(const nodeId of frontier){
      for(const edge of neighborEdges(index,nodeId,direction,predicates)){
        const neighborId=otherEnd(edge,nodeId)
        if(visited.has(neighborId)) continue
        visited.set(neighborId,{nodeId:neighborId,depth:depth+1,viaEdgeId:edge.id})
        usedEdges.push(edge)
        next.push(neighborId)
      }
    }
    frontier=next
    depth+=1
  }
  return {visited:[...visited.values()],edges:usedEdges}
}

/**
 * Shortest path (fewest edges, BFS) from `fromNodeId` to `toNodeId`, as an ordered list
 * of edges to walk. Returns undefined when no such path exists within `maxDepth`.
 */
export function findPath(graph:ResearchGraphSnapshot,index:AdjacencyIndex,fromNodeId:string,toNodeId:string,options:TraversalOptions={}):readonly ResearchGraphEdge[]|undefined{
  // Unknown endpoints have no path (previously findPath('x','x') returned [] for ids that are not in the graph).
  const known=(id:string)=>graph.nodes.some(node=>node.id===id)
  if(!known(fromNodeId) || !known(toNodeId)) return undefined
  if(fromNodeId===toNodeId) return []
  const {direction='out',predicates,maxDepth=Infinity}=options
  const cameFrom=new Map<string,ResearchGraphEdge>()
  const visited=new Set<string>([fromNodeId])
  let frontier=[fromNodeId]
  let depth=0
  while(frontier.length && depth<maxDepth){
    const next:string[]=[]
    for(const nodeId of frontier){
      for(const edge of neighborEdges(index,nodeId,direction,predicates)){
        const neighborId=otherEnd(edge,nodeId)
        if(visited.has(neighborId)) continue
        visited.add(neighborId)
        cameFrom.set(neighborId,edge)
        if(neighborId===toNodeId) return reconstructPath(cameFrom,fromNodeId,toNodeId)
        next.push(neighborId)
      }
    }
    frontier=next
    depth+=1
  }
  return undefined
}

/** Walks the BFS parent-edge map backwards from `toNodeId` to `fromNodeId` and returns the edges in forward (from -> to) order. */
function reconstructPath(cameFrom:ReadonlyMap<string,ResearchGraphEdge>,fromNodeId:string,toNodeId:string):readonly ResearchGraphEdge[]{
  const path:ResearchGraphEdge[]=[]
  let cursor=toNodeId
  while(cursor!==fromNodeId){
    const edge=cameFrom.get(cursor)
    if(!edge) throw new Error(`Broken path reconstruction at ${cursor}.`)
    path.unshift(edge)
    cursor=edge.from===cursor?edge.to:edge.from
  }
  return path
}

export function nodeById(graph:ResearchGraphSnapshot,nodeId:string):ResearchGraphNode|undefined{
  return graph.nodes.find(node=>node.id===nodeId)
}

export function nodesOfKind(graph:ResearchGraphSnapshot,kind:ResearchGraphNode['kind']):readonly ResearchGraphNode[]{
  return graph.nodes.filter(node=>node.kind===kind)
}

export type ClaimProvenanceChain={
  claim:ResearchGraphNode
  evidence:readonly ResearchGraphNode[]
  sources:readonly ResearchGraphNode[]
  specimens:readonly ResearchGraphNode[]
  sites:readonly ResearchGraphNode[]
  reachedSource:boolean
}

const EVIDENTIARY_PREDICATES:readonly ResearchGraphEdgePredicate[]=['supported-by','documented-by','dated-by','contextualized-by','catalogued-by','hosted-by','interpreted-by','has-evidence','materialized-by','at-site','has-specimen','has-occurrence','derived-from','challenged-by']

/**
 * Walks outward from a claim node along evidentiary predicates only (skipping
 * incidental edges such as `has-media`/`illustrated-by`) and buckets what it reaches
 * by node kind. `reachedSource` is the traversal-backed version of the project's
 * "no source -> no factual claim" rule: it is true only if at least one source node is
 * actually reachable, not merely that the claim has a non-empty sourceIds list.
 */
export function provenanceChainForClaim(graph:ResearchGraphSnapshot,index:AdjacencyIndex,claimId:string,maxDepth=4):ClaimProvenanceChain{
  const claimNodeId=`claim:${claimId}`
  const claim=nodeById(graph,claimNodeId)
  if(!claim) throw new Error(`Unknown claim node: ${claimNodeId}.`)
  const {visited}=traverse(graph,index,claimNodeId,{direction:'out',predicates:EVIDENTIARY_PREDICATES,maxDepth})
  const reached=(kind:ResearchGraphNode['kind'])=>visited.map(v=>nodeById(graph,v.nodeId)).filter((node):node is ResearchGraphNode=>node!==undefined && node.kind===kind && node.id!==claimNodeId)
  const sources=reached('source')
  return {
    claim,
    evidence:reached('evidence'),
    sources,
    specimens:reached('specimen'),
    sites:reached('site'),
    reachedSource:sources.length>0,
  }
}
