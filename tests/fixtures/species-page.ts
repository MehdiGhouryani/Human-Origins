import type {PublicationRecord} from '../../domain/research-model'
import {SECTION_IDS,type PageBlock,type SpeciesPageContent} from '../../domain/species-page'
import type {PageValidationContext} from '../../infrastructure/validation/species-pages'

/** Neutral filler text with an exact word count; contains no banned wording. */
const VOCABULARY=['stone','river','tooth','bone','valley','layer','sample','survey','method','record','region','season','trench','sediment','cranium','fragment']
export const filler=(count:number,offset=0):string=>Array.from({length:count},(_,index)=>VOCABULARY[(index+offset)%VOCABULARY.length]).join(' ')+'.'

const NOW=new Date(Date.UTC(2026,9,6))
// A literal (not read from the real registry) so tests can mock the registry without a circular import.
const base:PublicationRecord={
  id:'ref-0' as PublicationRecord['id'],type:'journal-article',title:'A synthetic reference used only in tests',authors:['Test Author et al.'],
  journal:'Journal of Test Evidence',volume:'1',issue:'1',pages:'1–10',year:2024,doi:'10.1234/test.0001',url:'https://doi.org/10.1234/test.0001',
  publisher:'Test Press',institutionIds:[],identifiers:[{scheme:'doi',value:'10.1234/test.0001'}] as PublicationRecord['identifiers'],
  kind:'primary',verifiedOn:'2026-10-06',verification:'publisher-page',
}
const synthetic=(id:string,year:number,overrides:Partial<PublicationRecord>={}):PublicationRecord=>({...base,id:id as PublicationRecord['id'],year,...overrides})

/** Ten citable synthetic references (five recent) so page tests do not depend on the real registry. */
export const SYNTHETIC_REFS:PublicationRecord[]=[
  synthetic('ref-1',2024),synthetic('ref-2',2023),synthetic('ref-3',2022),synthetic('ref-4',2021),synthetic('ref-5',2019),
  synthetic('ref-6',2008),synthetic('ref-7',2001),synthetic('ref-8',1995),synthetic('ref-9',1978),synthetic('ref-10',1925),
]

export const makeContext=(overrides:Partial<PageValidationContext>={}):PageValidationContext=>({
  taxonIds:new Set(['afarensis']),
  publications:Object.fromEntries(SYNTHETIC_REFS.map(pub=>[String(pub.id),pub])),
  scientificNames:{afarensis:'Australopithecus afarensis'},
  now:NOW,
  ...overrides,
})

const paragraph=(words:number,offset:number,refs:string[]):PageBlock=>({type:'paragraph',text:filler(words,offset),refs})

/** A page that satisfies every rule (about 1,100 words of narrative, eight references). */
export function makeValidPage():SpeciesPageContent{
  return {
    taxonId:'afarensis',
    lead:{text:filler(70),refs:['ref-1','ref-6']},
    facts:['Time range','Region','Brain size','Body size','Locomotion','Diet','Key fossils','Stone tools'].map((label,index)=>({label,value:filler(4,index),certainty:'estimated' as const,refs:['ref-2']})),
    sections:SECTION_IDS.map((id,index)=>({id,blocks:[paragraph(120,index,['ref-1','ref-'+(2+(index%8))])]})),
    debates:[{id:'locomotion',question:'How much time did it spend climbing?',updated:'2026-09-01',positions:[
      {label:'Mostly terrestrial',summary:filler(20),refs:['ref-3']},
      {label:'Climbing retained',summary:filler(20,3),refs:['ref-4','ref-5']},
    ]}],
    unknowns:[{text:filler(15),refs:['ref-7']}],
    reviewedOn:'2026-09-15',
  }
}
