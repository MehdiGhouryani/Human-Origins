import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {buildResearchGraph} from '../domain/research-graph'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

describe('research graph projection',()=>{
  const graph=buildResearchGraph(contentCatalog,catalogRuntimeMetadata.fingerprint)
  it('creates a node for every canonical entity',()=>{
    const uncertaintyNodeCount=contentCatalog.claims.reduce((total,claim)=>total+claim.uncertaintyProfile.length,0)
    const expected=contentCatalog.taxa.length+contentCatalog.taxonNames.length+contentCatalog.media.length+contentCatalog.sources.length+contentCatalog.publications.length+contentCatalog.institutions.length+contentCatalog.collections.length+contentCatalog.materialEntities.length+contentCatalog.specimens.length+contentCatalog.occurrences.length+contentCatalog.sites.length+contentCatalog.siteContexts.length+contentCatalog.evidence.length+contentCatalog.claims.length+contentCatalog.interpretationSets.length+contentCatalog.interpretationPositions.length+uncertaintyNodeCount
    expect(graph.nodes).toHaveLength(expected)
  })
  it('keeps the catalog fingerprint attached to the projection',()=>{
    expect(graph.sourceFingerprint).toBe(catalogRuntimeMetadata.fingerprint)
  })
  it('has deterministic, resolvable edges',()=>{
    const nodes=new Set(graph.nodes.map(node=>node.id))
    expect(new Set(graph.edges.map(edge=>edge.id)).size).toBe(graph.edges.length)
    for(const edge of graph.edges){expect(nodes.has(edge.from)).toBe(true);expect(nodes.has(edge.to)).toBe(true);expect(edge.from).not.toBe(edge.to)}
  })
  it('projects all taxonomic relationships',()=>{
    for(const relation of contentCatalog.relationships){
      const match=graph.edges.find(edge=>edge.recordId===String(relation.id) && edge.predicate===relation.type)
      expect(match?.from).toBe(`taxon:${String(relation.from)}`)
      expect(match?.to).toBe(`taxon:${String(relation.to)}`)
    }
  })
})
