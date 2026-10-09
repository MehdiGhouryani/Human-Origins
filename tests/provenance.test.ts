import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {resolveClaimProvenance} from '../domain/provenance'
import {buildResearchGraph} from '../domain/research-graph'

describe('claim provenance semantics',()=>{
  it('keeps compact evidence/source ids exactly aligned with role-aware links',()=>{
    for(const claim of contentCatalog.claims){
      expect(new Set(claim.evidenceIds.map(String))).toEqual(new Set(claim.evidenceLinks.map(link=>String(link.evidenceId))))
      expect(new Set(claim.sourceIds.map(String))).toEqual(new Set(claim.sourceLinks.map(link=>String(link.sourceId))))
    }
  })

  it('resolves a complete research trace for every canonical claim',()=>{
    for(const claim of contentCatalog.claims){
      const bundle=resolveClaimProvenance(contentCatalog,claim.id)
      expect(bundle?.completeness).toBe('complete')
      expect(bundle?.claim.id).toBe(claim.id)
    }
  })

  it('does not encode the reversed claim-supports-evidence direction',()=>{
    const graph=buildResearchGraph(contentCatalog,'test-fingerprint')
    const claimEvidence=graph.edges.filter(edge=>edge.from.startsWith('claim:') && edge.to.startsWith('evidence:'))
    expect(claimEvidence.length).toBeGreaterThan(0)
    expect(claimEvidence.every(edge=>edge.predicate!=='supports')).toBe(true)
    expect(claimEvidence.every(edge=>['supported-by','contextualized-by','challenged-by','dated-by','derived-from'].includes(edge.predicate))).toBe(true)
  })
})
