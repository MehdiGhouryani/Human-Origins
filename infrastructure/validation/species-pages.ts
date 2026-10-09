import {BANNED_PHRASES,CERTAINTIES,DATED_SUPERLATIVES,REQUIRED_FACT_LABELS,SECTION_IDS,SPECIES_PAGE_LIMITS,type PageBlock,type SpeciesPageContent} from '../../domain/species-page'
import {isCitable,isIsoDate,isRecent} from '../../domain/references'
import type {PublicationRecord} from '../../domain/research-model'

export type PageIssue={severity:'error'|'warning';code:string;path:string;message:string}
export type PageValidationContext={
  taxonIds:ReadonlySet<string>
  publications:Readonly<Record<string,PublicationRecord>>
  /** taxon id -> scientific name, for the italics check. */
  scientificNames:Readonly<Record<string,string>>
  now:Date
}

export const countWords=(text:string):number=>text.replace(/\*/g,'').split(/\s+/).filter(Boolean).length

type TextPart={path:string;text:string;refs:readonly string[];single?:boolean}

function blockParts(block:PageBlock,path:string):TextPart[]{
  switch(block.type){
    case 'paragraph':
    case 'note': return [{path,text:block.text,refs:block.refs,single:block.singleSource}]
    case 'list': return block.items.map((item,index)=>({path:`${path}.items[${index}]`,text:item.text,refs:item.refs}))
    case 'table': return block.rows.map((row,index)=>({path:`${path}.rows[${index}]`,text:`${row.label}: ${row.value}`,refs:row.refs}))
  }
}
const blockWords=(block:PageBlock):number=>blockParts(block,'').reduce((sum,part)=>sum+countWords(part.text),0)+(block.type==='table'?countWords(block.caption):0)

/** Validates one page against the writing rules of docs/IMPLEMENTATION-PLAN.md section 9a. Pure. */
export function validateSpeciesPage(page:SpeciesPageContent,context:PageValidationContext):PageIssue[]{
  const issues:PageIssue[]=[]
  const add=(severity:PageIssue['severity'],code:string,path:string,message:string)=>issues.push({severity,code,path,message})
  const L=SPECIES_PAGE_LIMITS
  const at=`${page.taxonId}`

  if(!context.taxonIds.has(page.taxonId)) add('error','PAGE_TAXON_UNKNOWN',at,`Unknown taxon ${page.taxonId}.`)

  const parts:TextPart[]=[]
  parts.push({path:`${at}.lead`,text:page.lead.text,refs:page.lead.refs})

  // lead
  const leadWords=countWords(page.lead.text)
  if(leadWords<L.leadWords.min||leadWords>L.leadWords.max) add('error','LEAD_WORDS',`${at}.lead`,`The lead has ${leadWords} words; it must have ${L.leadWords.min}–${L.leadWords.max}.`)

  // facts
  const labels=new Set(page.facts.map(fact=>fact.label))
  for(const required of REQUIRED_FACT_LABELS) if(!labels.has(required)) add('error','FACT_MISSING',`${at}.facts`,`The fact table lacks the row “${required}”.`)
  if(labels.size!==page.facts.length) add('error','FACT_DUPLICATE',`${at}.facts`,'A fact label appears twice.')
  page.facts.forEach((fact,index)=>{
    const path=`${at}.facts[${index}]`
    if(!CERTAINTIES.includes(fact.certainty)) add('error','FACT_CERTAINTY',path,`Unknown certainty “${String(fact.certainty)}”.`)
    if(!fact.value.trim()) add('error','FACT_EMPTY',path,'A fact needs a value.')
    parts.push({path,text:`${fact.label}: ${fact.value}`,refs:fact.refs})
  })

  // sections
  const order=page.sections.map(section=>section.id)
  if(order.join('|')!==SECTION_IDS.join('|')) add('error','SECTIONS_ORDER',`${at}.sections`,`Sections must be exactly, in order: ${SECTION_IDS.join(', ')}.`)
  let narrativeWords=leadWords
  page.sections.forEach(section=>{
    const path=`${at}.sections.${section.id}`
    const words=section.blocks.reduce((sum,block)=>sum+blockWords(block),0)
    narrativeWords+=words
    if(words<L.sectionWords.min||words>L.sectionWords.max) add('error','SECTION_WORDS',path,`Section “${section.id}” has ${words} words; it must have ${L.sectionWords.min}–${L.sectionWords.max}.`)
    section.blocks.forEach((block,index)=>{
      blockParts(block,`${path}[${index}]`).forEach(part=>{
        parts.push(part)
        if(part.text.length>L.blockChars) add('error','BLOCK_TOO_LONG',part.path,`A block is ${part.text.length} characters long; the limit is ${L.blockChars}.`)
      })
      if((block.type==='paragraph'||block.type==='note')&&block.refs.length===1&&!block.singleSource) add('warning','SINGLE_REF_NOT_FLAGGED',`${path}[${index}]`,'This statement cites one reference; set singleSource and say in the text that it rests on one study, or add a second reference.')
    })
  })

  // debates
  if(page.debates.length<L.minDebates) add('error','DEBATE_MISSING',`${at}.debates`,`At least ${L.minDebates} debated question is required.`)
  const debateIds=new Set<string>()
  page.debates.forEach((debate,index)=>{
    const path=`${at}.debates[${index}]`
    if(debateIds.has(debate.id)) add('error','DEBATE_DUPLICATE',path,`Duplicate debate id ${debate.id}.`)
    debateIds.add(debate.id)
    if(!debate.question.trim().endsWith('?')) add('error','DEBATE_QUESTION',path,'A debate is phrased as a question ending in “?”.')
    narrativeWords+=countWords(debate.question)
    if(debate.positions.length<L.debatePositions.min||debate.positions.length>L.debatePositions.max) add('error','DEBATE_POSITIONS',path,`A debate needs ${L.debatePositions.min}–${L.debatePositions.max} positions; it has ${debate.positions.length}.`)
    if(!isIsoDate(debate.updated)) add('error','DEBATE_DATE',path,'A debate needs the ISO date of its latest update.')
    debate.positions.forEach((position,positionIndex)=>{
      narrativeWords+=countWords(position.summary)+countWords(position.label)
      parts.push({path:`${path}.positions[${positionIndex}]`,text:`${position.label}: ${position.summary}`,refs:position.refs})
    })
  })

  // unknowns
  if(page.unknowns.length<1) add('error','UNKNOWNS_MISSING',`${at}.unknowns`,'State at least one thing that is not known.')
  page.unknowns.forEach((item,index)=>{
    narrativeWords+=countWords(item.text)
    parts.push({path:`${at}.unknowns[${index}]`,text:item.text,refs:item.refs})
  })

  // total length
  if(narrativeWords<L.totalWords.min||narrativeWords>L.totalWords.max) add('error','TOTAL_WORDS',at,`The page has ${narrativeWords} words of narrative; it must have ${L.totalWords.min}–${L.totalWords.max}.`)

  // text rules and citations on every part
  const scientific=context.scientificNames[page.taxonId]
  for(const part of parts){
    if(part.refs.length<1) add('error','CITATION_MISSING',part.path,'Every statement needs at least one reference.')
    if(new Set(part.refs).size!==part.refs.length) add('error','CITATION_DUPLICATE',part.path,'A reference is listed twice in one statement.')
    for(const ref of part.refs){
      const publication=context.publications[ref]
      if(!publication) add('error','REF_UNKNOWN',part.path,`Unknown reference ${ref}.`)
      else if(!isCitable(publication)) add('error','REF_NOT_VERIFIED',part.path,`Reference ${ref} has no kind and verification; verify it first.`)
    }
    for(const pattern of BANNED_PHRASES){
      const match=pattern.exec(part.text)
      if(match) add('error','BANNED_WORD',part.path,`The wording “${match[0]}” is not allowed on a species page.`)
    }
    if(DATED_SUPERLATIVES.some(pattern=>pattern.test(part.text))&&!/\b(?:19|20)\d{2}\b/.test(part.text)) add('error','SUPERLATIVE_UNDATED',part.path,'A superlative (earliest, oldest, latest…) needs the year of the source in the same statement.')
    if(/<[^>]+>|\[[^\]]*\]\([^)]*\)|https?:\/\//.test(part.text)) add('error','TEXT_MARKUP',part.path,'Only *italic* markup is allowed: no HTML, no Markdown links, no URLs.')
    if(/\[\d+\]/.test(part.text)) add('error','MANUAL_CITATION',part.path,'Do not type citation numbers; list the references in `refs`.')
    if((part.text.match(/\*/g)??[]).length%2!==0) add('error','TEXT_ITALIC_UNBALANCED',part.path,'Unbalanced *italic* markers.')
    if(scientific){
      const plain=part.text.replace(/\*[^*]*\*/g,'')
      if(plain.includes(scientific)) add('warning','TAXON_NAME_NOT_ITALIC',part.path,`Write the scientific name *${scientific}* in italics.`)
    }
  }

  // references used by the page
  const used=new Set(parts.flatMap(part=>[...part.refs]))
  const known=[...used].map(ref=>context.publications[ref]).filter((pub):pub is PublicationRecord=>!!pub)
  if(known.length<L.minReferences) add('error','REFERENCES_FEW',at,`The page cites ${known.length} distinct references; it needs at least ${L.minReferences}.`)
  const recent=known.filter(pub=>isRecent(pub,L.recentReferences.years,context.now)).length
  if(recent<L.recentReferences.count){
    if(page.recentWaiver?.trim()) add('warning','REFERENCES_RECENT_WAIVED',at,`Only ${recent} of the references are from the last ${L.recentReferences.years} years; waiver: ${page.recentWaiver.trim()}`)
    else add('error','REFERENCES_RECENT',at,`At least ${L.recentReferences.count} references must be from the last ${L.recentReferences.years} years (found ${recent}); if none exist, explain in recentWaiver.`)
  }
  if(known.length>0&&known.every(pub=>pub.kind==='institutional')) add('error','REFERENCES_ONLY_INSTITUTIONAL',at,'Institutional pages cannot be the only support of a page.')

  // review date
  if(!isIsoDate(page.reviewedOn)) add('error','REVIEWED_ON',at,'reviewedOn must be a real date written YYYY-MM-DD.')
  else {
    const reviewed=new Date(`${page.reviewedOn}T00:00:00Z`)
    const limit=new Date(context.now)
    limit.setUTCMonth(limit.getUTCMonth()-L.staleAfterMonths)
    if(reviewed>context.now) add('error','REVIEWED_IN_FUTURE',at,'reviewedOn is in the future.')
    else if(reviewed<limit) add('warning','PAGE_STALE',at,`This page was last reviewed on ${page.reviewedOn}; review it again (limit ${L.staleAfterMonths} months).`)
  }
  return issues
}
