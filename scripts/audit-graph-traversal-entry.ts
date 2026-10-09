import {contentCatalog} from '../content/catalog'
import {buildResearchGraph} from '../domain/research-graph'
import {buildAdjacencyIndex,nodesOfKind,provenanceChainForClaim} from '../domain/graph-traversal'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

const graph=buildResearchGraph(contentCatalog,catalogRuntimeMetadata.fingerprint)
const index=buildAdjacencyIndex(graph)
const failures:string[]=[]

const totalOutgoing=[...index.outgoing.values()].reduce((sum,edges)=>sum+edges.length,0)
const totalIncoming=[...index.incoming.values()].reduce((sum,edges)=>sum+edges.length,0)
if(totalOutgoing!==graph.edges.length) failures.push(`Adjacency index outgoing edge count ${totalOutgoing} does not match graph edge count ${graph.edges.length}.`)
if(totalIncoming!==graph.edges.length) failures.push(`Adjacency index incoming edge count ${totalIncoming} does not match graph edge count ${graph.edges.length}.`)

for(const claim of contentCatalog.claims){
  const chain=provenanceChainForClaim(graph,index,String(claim.id))
  if(!chain.reachedSource) failures.push(`Claim ${String(claim.id)} has no traversable path to any source node.`)
}

const claimNodeCount=nodesOfKind(graph,'claim').length
if(claimNodeCount!==contentCatalog.claims.length) failures.push(`Traversal-visible claim node count ${claimNodeCount} does not match catalog claim count ${contentCatalog.claims.length}.`)

if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);throw new Error(`Graph traversal audit failed with ${failures.length} issue(s).`)}
console.log(`Graph traversal audit passed: ${contentCatalog.claims.length}/${contentCatalog.claims.length} claims resolve to at least one source via traversal.`)
