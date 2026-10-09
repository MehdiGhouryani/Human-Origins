import {describe,expect,it} from 'vitest'
import {countWords,validateSpeciesPage} from '../infrastructure/validation/species-pages'
import {SPECIES_PAGE_LIMITS,type SpeciesPageContent} from '../domain/species-page'
import {filler,makeContext,makeValidPage,SYNTHETIC_REFS} from './fixtures/species-page'
import {speciesPages} from '../content/species-pages'
import {taxa} from '../content'
import {publicationsById} from '../content/publications'

const codes=(page:SpeciesPageContent,context=makeContext())=>validateSpeciesPage(page,context).map(issue=>issue.code)
const errors=(page:SpeciesPageContent,context=makeContext())=>validateSpeciesPage(page,context).filter(issue=>issue.severity==='error').map(issue=>issue.code)
const withSection=(page:SpeciesPageContent,id:string,text:string,refs=['ref-1','ref-2']):SpeciesPageContent=>({...page,sections:page.sections.map(section=>section.id===id?{...section,blocks:[{type:'paragraph',text,refs}]}:section)})

describe('word counting',()=>{
  it('ignores italic markers and extra spaces',()=>{
    expect(countWords('  *Homo sapiens*   lived   here ')).toBe(4)
    expect(countWords('')).toBe(0)
  })
})

describe('species page rules',()=>{
  it('accepts the valid fixture page',()=>{
    expect(validateSpeciesPage(makeValidPage(),makeContext())).toEqual([])
  })

  it('checks the lead length',()=>{
    expect(errors({...makeValidPage(),lead:{text:filler(30),refs:['ref-1']}})).toContain('LEAD_WORDS')
    expect(errors({...makeValidPage(),lead:{text:filler(120),refs:['ref-1']}})).toContain('LEAD_WORDS')
  })

  it('requires every fact row, once, with a known certainty and a value',()=>{
    const page=makeValidPage()
    expect(errors({...page,facts:page.facts.filter(fact=>fact.label!=='Diet')})).toContain('FACT_MISSING')
    expect(errors({...page,facts:[...page.facts,page.facts[0]]})).toContain('FACT_DUPLICATE')
    expect(errors({...page,facts:page.facts.map((fact,index)=>index===0?{...fact,certainty:'certain' as never}:fact)})).toContain('FACT_CERTAINTY')
    expect(errors({...page,facts:page.facts.map((fact,index)=>index===0?{...fact,value:' '}:fact)})).toContain('FACT_EMPTY')
  })

  it('requires the eight sections in order and keeps each within the word budget',()=>{
    const page=makeValidPage()
    expect(errors({...page,sections:[...page.sections].reverse()})).toContain('SECTIONS_ORDER')
    expect(errors({...page,sections:page.sections.slice(1)})).toContain('SECTIONS_ORDER')
    expect(errors(withSection(page,'anatomy',filler(20)))).toContain('SECTION_WORDS')
    expect(errors(withSection(page,'anatomy',filler(260)))).toContain('SECTION_WORDS')
  })

  it('keeps the whole page within 900–1,500 words',()=>{
    const page=makeValidPage()
    const small:SpeciesPageContent={...page,sections:page.sections.map(section=>({...section,blocks:[{type:'paragraph',text:filler(81),refs:['ref-1','ref-2']}]}))}
    expect(errors(small)).toContain('TOTAL_WORDS')
    const large:SpeciesPageContent={...page,sections:page.sections.map(section=>({...section,blocks:[{type:'paragraph',text:filler(199),refs:['ref-1','ref-2']}]}))}
    expect(errors(large)).toContain('TOTAL_WORDS')
    expect(SPECIES_PAGE_LIMITS.totalWords.max).toBe(1500)
  })

  it('requires debates with two to four sourced positions and a dated update',()=>{
    const page=makeValidPage()
    const [debate]=page.debates
    expect(errors({...page,debates:[]})).toContain('DEBATE_MISSING')
    expect(errors({...page,debates:[{...debate,positions:debate.positions.slice(0,1)}]})).toContain('DEBATE_POSITIONS')
    expect(errors({...page,debates:[{...debate,positions:[...debate.positions,...debate.positions,debate.positions[0]]}]})).toContain('DEBATE_POSITIONS')
    expect(errors({...page,debates:[{...debate,question:'A statement.'}]})).toContain('DEBATE_QUESTION')
    expect(errors({...page,debates:[{...debate,updated:'2026-13-01'}]})).toContain('DEBATE_DATE')
    expect(errors({...page,debates:[debate,debate]})).toContain('DEBATE_DUPLICATE')
    expect(errors({...page,debates:[{...debate,positions:[{...debate.positions[0],refs:[]},debate.positions[1]]}]})).toContain('CITATION_MISSING')
  })

  it('requires a statement of what is not known',()=>{
    expect(errors({...makeValidPage(),unknowns:[]})).toContain('UNKNOWNS_MISSING')
  })

  it('cites known, verified references only, once per statement',()=>{
    const page=makeValidPage()
    expect(errors({...page,lead:{...page.lead,refs:[]}})).toContain('CITATION_MISSING')
    expect(errors({...page,lead:{...page.lead,refs:['ref-1','ref-1']}})).toContain('CITATION_DUPLICATE')
    expect(errors({...page,lead:{...page.lead,refs:['nope']}})).toContain('REF_UNKNOWN')
    const context=makeContext({publications:{...makeContext().publications,'ref-1':{...SYNTHETIC_REFS[0],verifiedOn:undefined,verification:undefined}}})
    expect(errors(page,context)).toContain('REF_NOT_VERIFIED')
  })

  it('rejects banned wording',()=>{
    for(const phrase of ['This proves it','It was proved','a definitive answer','definitively dated','a missing link','a primitive trait','an ape-man','a caveman']){
      expect(errors(withSection(makeValidPage(),'anatomy',`${filler(110)} ${phrase}`)),phrase).toContain('BANNED_WORD')
    }
    expect(errors(withSection(makeValidPage(),'anatomy',`${filler(110)} an ancestral trait that was retained`))).not.toContain('BANNED_WORD')
  })

  it('allows a superlative only with the year of its source in the same statement',()=>{
    expect(errors(withSection(makeValidPage(),'discovery',`${filler(110)} the earliest specimen`))).toContain('SUPERLATIVE_UNDATED')
    expect(errors(withSection(makeValidPage(),'discovery',`${filler(110)} the earliest specimen, reported in 2019`))).not.toContain('SUPERLATIVE_UNDATED')
  })

  it('allows italic markup only, and no typed citation numbers',()=>{
    const bad=(text:string)=>errors(withSection(makeValidPage(),'anatomy',`${filler(110)} ${text}`))
    expect(bad('<b>bold</b>')).toContain('TEXT_MARKUP')
    expect(bad('[link](https://example.org)')).toContain('TEXT_MARKUP')
    expect(bad('see https://example.org')).toContain('TEXT_MARKUP')
    expect(bad('as shown [1]')).toContain('MANUAL_CITATION')
    expect(bad('an *unbalanced marker')).toContain('TEXT_ITALIC_UNBALANCED')
    expect(bad('the *Australopithecus afarensis* skull')).not.toContain('TEXT_MARKUP')
  })

  it('warns when the scientific name is not italic',()=>{
    const page=withSection(makeValidPage(),'anatomy',`${filler(110)} Australopithecus afarensis skull`)
    expect(codes(page)).toContain('TAXON_NAME_NOT_ITALIC')
    expect(codes(withSection(makeValidPage(),'anatomy',`${filler(110)} *Australopithecus afarensis* skull`))).not.toContain('TAXON_NAME_NOT_ITALIC')
  })

  it('warns about a statement that rests on one reference unless it is flagged',()=>{
    const single=withSection(makeValidPage(),'anatomy',filler(110),['ref-1'])
    expect(codes(single)).toContain('SINGLE_REF_NOT_FLAGGED')
    const flagged:SpeciesPageContent={...single,sections:single.sections.map(section=>section.id==='anatomy'?{...section,blocks:[{type:'paragraph',text:filler(110),refs:['ref-1'],singleSource:true}]}:section)}
    expect(codes(flagged)).not.toContain('SINGLE_REF_NOT_FLAGGED')
  })

  it('limits the length of one block',()=>{
    expect(errors(withSection(makeValidPage(),'anatomy',`${'x'.repeat(901)} ${filler(80)}`))).toContain('BLOCK_TOO_LONG')
  })

  it('needs eight distinct references, three of them recent, and not only institutional pages',()=>{
    const page=makeValidPage()
    const few:SpeciesPageContent={...page,sections:page.sections.map(section=>({...section,blocks:section.blocks.map(block=>block.type==='paragraph'?{...block,refs:['ref-1','ref-2']}:block)})),facts:page.facts.map(fact=>({...fact,refs:['ref-1']})),debates:page.debates.map(debate=>({...debate,positions:debate.positions.map(position=>({...position,refs:['ref-2']}))})),unknowns:[{text:filler(15),refs:['ref-1']}],lead:{text:filler(70),refs:['ref-1']}}
    expect(errors(few)).toContain('REFERENCES_FEW')

    const oldContext=makeContext({publications:Object.fromEntries(SYNTHETIC_REFS.map((pub,index)=>[String(pub.id),{...pub,year:1990+index}]))})
    expect(errors(page,oldContext)).toContain('REFERENCES_RECENT')
    const waived={...page,recentWaiver:'No new studies of this taxon since 2005.'}
    expect(errors(waived,oldContext)).not.toContain('REFERENCES_RECENT')
    expect(codes(waived,oldContext)).toContain('REFERENCES_RECENT_WAIVED')

    const institutional=makeContext({publications:Object.fromEntries(SYNTHETIC_REFS.map(pub=>[String(pub.id),{...pub,kind:'institutional' as const}]))})
    expect(errors(page,institutional)).toContain('REFERENCES_ONLY_INSTITUTIONAL')
  })

  it('checks the review date: real, not in the future, warns when older than twelve months',()=>{
    expect(errors({...makeValidPage(),reviewedOn:'2026-02-31'})).toContain('REVIEWED_ON')
    expect(errors({...makeValidPage(),reviewedOn:'2027-01-01'})).toContain('REVIEWED_IN_FUTURE')
    expect(codes({...makeValidPage(),reviewedOn:'2025-09-01'})).toContain('PAGE_STALE')
    expect(codes({...makeValidPage(),reviewedOn:'2025-11-01'})).not.toContain('PAGE_STALE')
  })

  it('rejects a page for an unknown taxon',()=>{
    expect(errors({...makeValidPage(),taxonId:'nobody'})).toContain('PAGE_TAXON_UNKNOWN')
  })
})

describe('registered pages',()=>{
  it('validate against the real registry (none yet is fine)',()=>{
    const context=makeContext({taxonIds:new Set(taxa.map(taxon=>String(taxon.id))),publications:publicationsById,scientificNames:Object.fromEntries(taxa.map(taxon=>[String(taxon.id),taxon.taxonomy.scientificName])),now:new Date()})
    for(const [key,page] of Object.entries(speciesPages)){
      expect(page.taxonId).toBe(key)
      expect(errors(page,context),key).toEqual([])
    }
  })
})
