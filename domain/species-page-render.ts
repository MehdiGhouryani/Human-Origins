import type {PageBlock,RefId,SpeciesPageContent} from './species-page'

/**
 * Citation numbering for a species page. References are numbered by first appearance in reading order:
 * lead, fact table, sections, debates, unknowns. `firstAt` names the place of the first citation of each
 * reference so the reference list can link back to it (and so rendering stays pure).
 */
export type ReferenceNumbering={
  order:RefId[]
  numbers:ReadonlyMap<RefId,number>
  firstAt:ReadonlyMap<RefId,string>
}

export const citationKey={
  lead:'lead',
  fact:(label:string)=>`fact-${label.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`,
  block:(sectionId:string,blockIndex:number,itemIndex?:number)=>`${sectionId}-${blockIndex}${itemIndex===undefined?'':`-${itemIndex}`}`,
  position:(debateId:string,positionIndex:number)=>`debate-${debateId}-${positionIndex}`,
  unknown:(index:number)=>`unknown-${index}`,
}

function* blockRefs(sectionId:string,block:PageBlock,blockIndex:number):Generator<[RefId,string]>{
  switch(block.type){
    case 'paragraph':
    case 'note': for(const ref of block.refs) yield [ref,citationKey.block(sectionId,blockIndex)]; break
    case 'list': for(const [itemIndex,item] of block.items.entries()) for(const ref of item.refs) yield [ref,citationKey.block(sectionId,blockIndex,itemIndex)]; break
    case 'table': for(const [rowIndex,row] of block.rows.entries()) for(const ref of row.refs) yield [ref,citationKey.block(sectionId,blockIndex,rowIndex)]; break
  }
}

function* allRefs(page:SpeciesPageContent):Generator<[RefId,string]>{
  for(const ref of page.lead.refs) yield [ref,citationKey.lead]
  for(const fact of page.facts) for(const ref of fact.refs) yield [ref,citationKey.fact(fact.label)]
  for(const section of page.sections) for(const [index,block] of section.blocks.entries()) yield* blockRefs(section.id,block,index)
  for(const debate of page.debates) for(const [index,position] of debate.positions.entries()) for(const ref of position.refs) yield [ref,citationKey.position(debate.id,index)]
  for(const [index,item] of page.unknowns.entries()) for(const ref of item.refs) yield [ref,citationKey.unknown(index)]
}

export function numberReferences(page:SpeciesPageContent):ReferenceNumbering{
  const order:RefId[]=[]
  const numbers=new Map<RefId,number>()
  const firstAt=new Map<RefId,string>()
  for(const [ref,where] of allRefs(page)){
    if(numbers.has(ref)) continue
    order.push(ref)
    numbers.set(ref,order.length)
    firstAt.set(ref,where)
  }
  return {order,numbers,firstAt}
}

/** Splits `*italic*` markup into alternating plain/italic segments. */
export type RichSegment={text:string;italic:boolean}
export function parseRichText(text:string):RichSegment[]{
  return text.split('*').map((part,index)=>({text:part,italic:index%2===1})).filter(segment=>segment.text!=='')
}

/** Sections shown in the in-page navigation, in order, with the anchor ids used by the page. */
export type NavItem={id:string;label:string}
