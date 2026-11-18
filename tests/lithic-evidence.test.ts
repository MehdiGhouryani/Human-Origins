import {describe,expect,it} from 'vitest'
import {taxa} from '../content/taxa'
import {
  LITHIC_EVIDENCE,
  LITHIC_TAXON_IDS,
  getLithicEvidence,
  hasActionableLithicContext,
} from '../content/lithics'

const namedTaxonIds=taxa.filter(item=>!item.inferred).map(item=>String(item.id)).sort()
const recordsById=new Map(LITHIC_EVIDENCE.map(record=>[String(record.taxonId),record]))

describe('per-taxon lithic evidence registry',()=>{
  it('covers every named taxon and excludes the inferred common-ancestor node',()=>{
    expect(LITHIC_TAXON_IDS).toHaveLength(17)
    expect([...LITHIC_TAXON_IDS].sort()).toEqual(namedTaxonIds)
    expect(getLithicEvidence('common')).toBeUndefined()
  })

  it('keeps absence of secure evidence distinct from unattributed or disputed site records',()=>{
    for(const record of LITHIC_EVIDENCE){
      if(record.status==='no-secure-association') expect(record.contexts,String(record.taxonId)).toHaveLength(0)
      if(record.status==='unattributed-evidence') {
        expect(record.contexts.length,String(record.taxonId)).toBeGreaterThan(0)
        expect(record.contexts.every(context=>context.relationship==='unattributed-site-record'),String(record.taxonId)).toBe(true)
      }
      if(record.status==='disputed-evidence') {
        expect(record.contexts.some(context=>context.relationship==='disputed'),String(record.taxonId)).toBe(true)
      }
    }
  })

  it('requires site, date, technology, an attribution relationship, caveats and sources for every context',()=>{
    for(const record of LITHIC_EVIDENCE){
      for(const context of record.contexts){
        expect(context.site,context.id).not.toBe('')
        expect(context.region,context.id).not.toBe('')
        expect(context.ageLabel,context.id).not.toBe('')
        expect(context.technology,context.id).not.toBe('')
        expect(context.relationship,context.id).not.toBe('none')
        expect(context.caveat,context.id).toContain(' ')
        expect(context.sources.length,context.id).toBeGreaterThan(0)
        for(const source of context.sources){
          expect(new URL(source.url).protocol,source.label).toBe('https:')
          expect(source.label.length,context.id).toBeGreaterThan(10)
        }
      }
    }
  })

  it('never treats a photo search brief as permission to fabricate an artefact photograph',()=>{
    for(const record of LITHIC_EVIDENCE){
      for(const context of record.contexts){
        expect(context.assemblagePhotoBrief,context.id).toMatch(/documented|catalog|Do not create|do not add/i)
        expect(context.artefactPhotoBrief,context.id).toMatch(/catalog|Do not add|do not add/i)
      }
    }
  })

  it('does not create a lithic-reduction diagram when the evidence itself is disputed or absent',()=>{
    for(const record of LITHIC_EVIDENCE){
      const actionable=hasActionableLithicContext(record)
      if(record.status==='no-secure-association'||record.status==='disputed-evidence') expect(actionable,String(record.taxonId)).toBe(false)
    }
    expect(hasActionableLithicContext(recordsById.get('habilis')!)).toBe(true)
    expect(hasActionableLithicContext(recordsById.get('denisovan')!)).toBe(true)
    expect(hasActionableLithicContext(recordsById.get('floresiensis')!)).toBe(true)
  })

  it('keeps the two Homo erectus contexts separate and distinguishes Mode 1 from Acheulean',()=>{
    const erectus=recordsById.get('erectus')!
    expect(erectus.contexts.map(context=>context.id)).toEqual([
      'erectus-dmanisi-mode1',
      'erectus-kokiselei-acheulean',
    ])
    expect(erectus.contexts[0].technology).toMatch(/Mode 1/)
    expect(erectus.contexts[0].objects.join(' ')).not.toMatch(/handaxe/i)
    expect(erectus.contexts[1].technology).toMatch(/Acheulean/)
  })

  it('keeps the Liang Bua artefact interval distinct from the H. floresiensis fossil interval',()=>{
    const context=recordsById.get('floresiensis')!.contexts[0]
    expect(context.ageLabel).toContain('190,000–50,000')
    expect(context.ageLabel).toContain('100,000–60,000')
    expect(context.caveat).toMatch(/not coextensive/i)
  })

  it('keeps Denisovan stone artefacts distinct from the reported unmodified bone objects',()=>{
    const denisovan=recordsById.get('denisovan')!
    expect(denisovan.contexts[0].objects).toContain('unmodified bone objects (separate material class)')
    expect(denisovan.relatedNonLithicNote).toMatch(/separate bone\/organic technology group/)
    expect(denisovan.contexts[0].sources.some(source=>source.url.includes('s41586-026-10997-4'))).toBe(true)
  })
})
