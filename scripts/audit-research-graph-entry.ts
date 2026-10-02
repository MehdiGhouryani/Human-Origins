import {contentCatalog} from '../content/catalog'
import {buildResearchGraph} from '../domain/research-graph'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

const graph=buildResearchGraph(contentCatalog,catalogRuntimeMetadata.fingerprint)
const nodeIds=new Set(graph.nodes.map(node=>node.id))
const failures:string[]=[]
for(const node of graph.nodes){
  if(!node.id.includes(':')) failures.push(`Node ${node.id} does not use the canonical kind:id format.`)
}
const edgeIds=new Set<string>()
for(const edge of graph.edges){
  if(edgeIds.has(edge.id)) failures.push(`Duplicate edge ${edge.id}.`)
  edgeIds.add(edge.id)
  if(!nodeIds.has(edge.from)) failures.push(`Missing edge source ${edge.from}.`)
  if(!nodeIds.has(edge.to)) failures.push(`Missing edge target ${edge.to}.`)
  if(edge.from===edge.to) failures.push(`Self-loop ${edge.id}.`)
}
for(const relation of contentCatalog.relationships){
  const expected=`taxon:${String(relation.from)}|${relation.type}|taxon:${String(relation.to)}|${String(relation.id)}`
  if(!edgeIds.has(expected)) failures.push(`Relationship ${String(relation.id)} is missing from the graph projection.`)
}
const expectedNodes=contentCatalog.taxa.length+contentCatalog.taxonNames.length+contentCatalog.media.length+contentCatalog.sources.length+contentCatalog.publications.length+contentCatalog.institutions.length+contentCatalog.collections.length+contentCatalog.materialEntities.length+contentCatalog.specimens.length+contentCatalog.occurrences.length+contentCatalog.sites.length+contentCatalog.siteContexts.length+contentCatalog.evidence.length+contentCatalog.claims.length+contentCatalog.interpretationSets.length+contentCatalog.interpretationPositions.length+contentCatalog.claims.reduce((sum,claim)=>sum+claim.uncertaintyProfile.length,0)
if(graph.sourceFingerprint!==catalogRuntimeMetadata.fingerprint) failures.push('Graph source fingerprint does not match the catalog runtime fingerprint.')
if(graph.nodes.length!==expectedNodes) failures.push(`Graph node count ${graph.nodes.length} does not match canonical entity count ${expectedNodes}.`)
if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);throw new Error(`Research graph audit failed with ${failures.length} issue(s).`)}
console.log(`Research graph audit passed: ${graph.nodes.length} nodes / ${graph.edges.length} deterministic edges.`)
