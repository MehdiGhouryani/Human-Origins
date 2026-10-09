import type {PublicationRecord} from '../../domain/research-model'

/** The parts of a Crossref work message that the reference check compares. */
export type CrossrefWork={
  DOI?:string
  title?:string[]
  'container-title'?:string[]
  author?:{given?:string;family?:string}[]
  issued?:{'date-parts'?:number[][]}
  volume?:string
}

const normalize=(value:string)=>value
  .replace(/<[^>]*>/g,' ')
  .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()

/**
 * Compares a publication record with the Crossref message for its DOI and returns the human-readable mismatches
 * (empty = consistent). Pure, so it is unit-tested offline; the network part lives in scripts/check-references.mjs.
 */
export function compareWithCrossref(pub:PublicationRecord,work:CrossrefWork):string[]{
  const problems:string[]=[]
  if(work.DOI && pub.doi && work.DOI.toLowerCase()!==pub.doi.toLowerCase()) problems.push(`DOI differs: record ${pub.doi}, Crossref ${work.DOI}`)
  const title=work.title?.[0]
  if(!title) problems.push('Crossref returned no title')
  else if(normalize(title)!==normalize(pub.title)) problems.push(`Title differs: record "${pub.title}", Crossref "${title}"`)
  const year=work.issued?.['date-parts']?.[0]?.[0]
  if(typeof year==='number' && typeof pub.year==='number' && year!==pub.year) problems.push(`Year differs: record ${pub.year}, Crossref ${year}`)
  const container=work['container-title']?.[0]
  if(container && pub.journal && !normalize(pub.journal).includes(normalize(container)) && !normalize(container).includes(normalize(pub.journal))) problems.push(`Journal differs: record "${pub.journal}", Crossref "${container}"`)
  const family=work.author?.[0]?.family
  if(family && !normalize(pub.authors.join(' ')).includes(normalize(family))) problems.push(`First author "${family}" is not in the record's authors`)
  if(work.volume && pub.volume && work.volume!==pub.volume) problems.push(`Volume differs: record ${pub.volume}, Crossref ${work.volume}`)
  return problems
}
