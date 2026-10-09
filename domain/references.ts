import type {PublicationRecord} from './research-model'

/**
 * Pure helpers for rendering and checking scholarly references on species pages.
 * Metadata comes from `content/publications.ts`; nothing here guesses missing data.
 */
export type CitationParts={
  authors:string
  year:number|null
  title:string
  /** Journal or book title; may already contain volume and pages for older records. */
  venue:string
  /** Volume(issue): pages, only when the record carries structured fields. */
  locator:string
  doi:string|null
  href:string
}

const clean=(value:string|undefined)=>(value??'').trim()

export function citationParts(pub:PublicationRecord):CitationParts{
  const volume=clean(pub.volume)
  const issue=clean(pub.issue)
  const pages=clean(pub.pages)
  const locator=[volume?`${volume}${issue?`(${issue})`:''}`:'',pages].filter(Boolean).join(': ')
  const doi=pub.doi?clean(pub.doi):null
  return {
    authors:pub.authors.join(', '),
    year:typeof pub.year==='number'?pub.year:null,
    title:clean(pub.title).replace(/[.]+$/,''),
    venue:clean(pub.journal)||clean(pub.publisher),
    locator,
    doi,
    href:doi?`https://doi.org/${doi}`:pub.url,
  }
}

/** One plain-text line (used for copy-to-clipboard and for tests). */
export function formatCitation(pub:PublicationRecord):string{
  const parts=citationParts(pub)
  const venue=[parts.venue,parts.locator].filter(Boolean).join(' ')
  return `${parts.authors}${parts.year?` (${parts.year})`:''}. ${parts.title}. ${venue}${venue?'.':''}${parts.doi?` doi:${parts.doi}`:''}`.replace(/\s+/g,' ').trim()
}

/** True when the reference was published within the last `years` calendar years (inclusive of the current year). */
export function isRecent(pub:Pick<PublicationRecord,'year'>,years:number,now:Date=new Date()):boolean{
  return typeof pub.year==='number'&&pub.year>=now.getUTCFullYear()-years
}

const ISO=/^\d{4}-\d{2}-\d{2}$/
export function isIsoDate(value:string):boolean{
  if(!ISO.test(value)) return false
  const [year,month,day]=value.split('-').map(Number)
  const date=new Date(Date.UTC(year,month-1,day))
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day
}

/** A reference is usable on a species page once its kind and verification are recorded. */
export const isCitable=(pub:PublicationRecord):boolean=>!!pub.kind&&!!pub.verifiedOn&&!!pub.verification&&isIsoDate(pub.verifiedOn)
