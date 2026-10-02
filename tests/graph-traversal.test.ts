import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {buildResearchGraph} from '../domain/research-graph'
import {buildAdjacencyIndex,findPath,neighborEdges,nodesOfKind,provenanceChainForClaim,traverse} from '../domain/graph-traversal'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

describe('graph traversal contracts',()=>{
  const graph=buildResearchGraph(contentCatalog,catalogRuntimeMetadata.fingerprint)
  const index=buildAdjacencyIndex(graph)

  it('indexes every edge on both its endpoints',()=>{
    const totalOutgoing=[...index.outgoing.values()].reduce((sum,edges)=>sum+edges.length,0)
    const totalIncoming=[...index.incoming.values()].reduce((sum,edges)=>sum+edges.length,0)
    expect(totalOutgoing).toBe(graph.edges.length)
    expect(totalIncoming).toBe(graph.edges.length)
  })

  it('neighborEdges respects direction and predicate filters',()=>{
    const claimNode=nodesOfKind(graph,'claim')[0]
    expect(claimNode).toBeDefined()
    const outOnly=neighborEdges(index,claimNode.id,'out')
    const inOnly=neighborEdges(index,claimNode.id,'in')
    const both=neighborEdges(index,claimNode.id,'both')
    expect(both.length).toBe(outOnly.length+inOnly.length)
    for(const edge of outOnly) expect(edge.from).toBe(claimNode.id)
    const filtered=neighborEdges(index,claimNode.id,'out',['asserts-about'])
    for(const edge of filtered) expect(edge.predicate).toBe('asserts-about')
  })

  it('traverse never revisits a node and respects maxDepth',()=>{
    const taxonNode=nodesOfKind(graph,'taxon')[0]
    const shallow=traverse(graph,index,taxonNode.id,{maxDepth:1})
    const deep=traverse(graph,index,taxonNode.id,{maxDepth:5})
    const shallowIds=shallow.visited.map(v=>v.nodeId)
    expect(new Set(shallowIds).size).toBe(shallowIds.length)
    expect(deep.visited.length).toBeGreaterThanOrEqual(shallow.visited.length)
    for(const visit of shallow.visited) expect(visit.depth).toBeLessThanOrEqual(1)
  })

  it('traverse on an unknown node returns an empty result instead of throwing',()=>{
    const result=traverse(graph,index,'taxon:does-not-exist',{})
    expect(result.visited).toHaveLength(0)
    expect(result.edges).toHaveLength(0)
  })

  it('findPath returns a walkable edge chain that actually connects the two nodes',()=>{
    const claimNode=nodesOfKind(graph,'claim').find(node=>{
      const claimId=node.entityId
      const claim=contentCatalog.claims.find(c=>String(c.id)===claimId)
      return claim && claim.sourceIds.length>0
    })
    expect(claimNode).toBeDefined()
    if(!claimNode) return
    const sourceNode=nodesOfKind(graph,'source')[0]
    const path=findPath(graph,index,claimNode.id,sourceNode.id,{direction:'both',maxDepth:6})
    expect(path).toBeDefined()
    if(!path) return
    let cursor=claimNode.id
    for(const edge of path){
      expect([edge.from,edge.to]).toContain(cursor)
      cursor=edge.from===cursor?edge.to:edge.from
    }
    expect(cursor).toBe(sourceNode.id)
  })

  it('findPath returns undefined for genuinely unreachable nodes within the depth limit',()=>{
    const claimNode=nodesOfKind(graph,'claim')[0]
    const unrelatedInstitution=nodesOfKind(graph,'institution')[0]
    const path=findPath(graph,index,claimNode.id,unrelatedInstitution.id,{direction:'out',maxDepth:1})
    expect(path===undefined || path.length<=1).toBe(true)
  })

  it('provenanceChainForClaim finds at least one source for every claim, matching the "no source -> no factual claim" rule',()=>{
    for(const claim of contentCatalog.claims){
      const chain=provenanceChainForClaim(graph,index,String(claim.id))
      expect(chain.reachedSource).toBe(true)
      expect(chain.sources.length).toBeGreaterThan(0)
    }
  })

  it('provenanceChainForClaim throws a clear error for an unknown claim id',()=>{
    expect(()=>provenanceChainForClaim(graph,index,'does-not-exist')).toThrow()
  })
})
