import 'server-only'
import type {MediaKind,MediaPublicationStatus,MediaRightsStatus,MediaRole} from '../../domain/contracts'
import type {CmsMediaStatus,MediaSlot,UpdateMediaInput} from './store'
import {MEDIA_SLOTS as SLOT_DEFINITIONS} from '../../content/media-slots.generated'
import {findSlot,isSlotOpen,type MediaSlotDefinition} from '../../domain/media-slots'
import type {MediaEvidenceClass,MediaGenerator,MediaReview,MediaReviewDecision} from '../../domain/contracts'

/**
 * Runtime allow-lists for every enum the admin API accepts. TypeScript casts do not validate request
 * bodies, so without these an arbitrary string could be persisted and later published.
 */
export const MEDIA_KINDS:readonly MediaKind[]=['specimen-photo','cast-photo','reconstruction','context-schematic']
export const MEDIA_ROLES:readonly MediaRole[]=['tree-thumbnail','profile-portrait','dossier-hero','anatomy-plate','comparative-morphology','specimen-reference','habitat','behavior','scale-reference','gallery','context']
/** `legacy` / `retired` describe the built-in catalog's history and are never accepted from the CMS. */
export const CMS_PUBLICATION_STATUSES:readonly MediaPublicationStatus[]=['approved','review-required','schematic']
export const MEDIA_RIGHTS_STATUSES:readonly MediaRightsStatus[]=['clear','review-required','institutional-terms','unknown']
export const CMS_STATUSES:readonly CmsMediaStatus[]=['draft','published']
export const MEDIA_SLOTS:readonly MediaSlot[]=['tree-icon','portrait']

/** Upper bound for a multipart upload request (file limit is 20 MB; the rest is form overhead). */
export const MAX_UPLOAD_REQUEST_BYTES=21*1024*1024
const MAX_TEXT=4000
const MAX_URL=2048

const isOneOf=<T extends string>(list:readonly T[],value:unknown):value is T=>typeof value==='string' && (list as readonly string[]).includes(value)

export class MediaInputError extends Error{}

export function parseKind(value:unknown):MediaKind{
  if(!isOneOf(MEDIA_KINDS,value)) throw new MediaInputError(`Unknown media kind: ${String(value)}.`)
  return value
}
export function parseRoles(value:unknown):MediaRole[]{
  const list=Array.isArray(value)?value:typeof value==='string'?value.split(','):undefined
  if(!list) throw new MediaInputError('Roles must be a list.')
  const roles=[...new Set(list.map(item=>String(item).trim()).filter(Boolean))]
  if(!roles.length) throw new MediaInputError('At least one role is required.')
  const unknown=roles.filter(role=>!isOneOf(MEDIA_ROLES,role))
  if(unknown.length) throw new MediaInputError(`Unknown role(s): ${unknown.join(', ')}.`)
  return roles as MediaRole[]
}
export function parsePublicationStatus(value:unknown):MediaPublicationStatus{
  if(!isOneOf(CMS_PUBLICATION_STATUSES,value)) throw new MediaInputError('Publication status must be approved, review-required or schematic (legacy/retired are not accepted from the CMS).')
  return value
}
export function parseRightsStatus(value:unknown):MediaRightsStatus{
  if(!isOneOf(MEDIA_RIGHTS_STATUSES,value)) throw new MediaInputError(`Unknown rights status: ${String(value)}.`)
  return value
}
export function parseStatus(value:unknown):CmsMediaStatus|undefined{
  if(value===undefined) return undefined
  if(!isOneOf(CMS_STATUSES,value)) throw new MediaInputError('Status must be draft or published.')
  return value
}
export function parseSlot(value:unknown):MediaSlot|undefined{
  if(value===undefined) return undefined
  if(!isOneOf(MEDIA_SLOTS,value)) throw new MediaInputError('Slot must be tree-icon or portrait.')
  return value
}
function parseText(value:unknown,field:string,max=MAX_TEXT):string{
  if(typeof value!=='string') throw new MediaInputError(`${field} must be text.`)
  const trimmed=value.trim()
  if(trimmed.length>max) throw new MediaInputError(`${field} is too long (max ${max} characters).`)
  return trimmed
}
export function parseOptionalText(value:unknown,field:string):string|null{
  if(value===null || value===undefined) return null
  const text=parseText(value,field)
  return text||null
}
export function parseSourceUrl(value:unknown):string{
  const text=parseText(value??'','Source URL',MAX_URL)
  if(!text) return ''
  let url:URL
  try{ url=new URL(text) }catch{ throw new MediaInputError('Source URL is not a valid URL.') }
  if(url.protocol!=='https:' && url.protocol!=='http:') throw new MediaInputError('Source URL must use http(s).')
  return url.toString()
}

/** Validates a PATCH body field by field; only the keys that are present are returned. */
export function parseMediaPatch(body:Record<string,unknown>,knownTaxonIds:ReadonlySet<string>,knownSourceIds:ReadonlySet<string>):UpdateMediaInput{
  const patch:{-readonly [K in keyof UpdateMediaInput]:UpdateMediaInput[K]}={}
  if('subjectId' in body){
    const subjectId=String(body.subjectId??'')
    if(!knownTaxonIds.has(subjectId)) throw new MediaInputError(`Unknown taxon: ${subjectId}.`)
    patch.subjectId=subjectId
  }
  if('roles' in body) patch.roles=parseRoles(body.roles)
  if('kind' in body) patch.kind=parseKind(body.kind)
  if('credit' in body) patch.credit=parseText(body.credit??'','Credit')
  if('license' in body) patch.license=parseOptionalText(body.license,'License')
  if('sourceUrl' in body) patch.sourceUrl=parseSourceUrl(body.sourceUrl)
  if('linkedSourceId' in body){
    const linked=parseOptionalText(body.linkedSourceId,'Linked source')
    if(linked && !knownSourceIds.has(linked)) throw new MediaInputError(`Unknown catalog source: ${linked}.`)
    patch.linkedSourceId=linked
  }
  if('note' in body) patch.note=parseText(body.note??'','Note')
  if('alt' in body){
    const alt=parseText(body.alt??'','Alt text')
    if(!alt) throw new MediaInputError('Alt text is required.')
    patch.alt=alt
  }
  if('publicationStatus' in body) patch.publicationStatus=parsePublicationStatus(body.publicationStatus)
  if('rightsStatus' in body) patch.rightsStatus=parseRightsStatus(body.rightsStatus)
  if('isDefault' in body){
    if(typeof body.isDefault!=='boolean') throw new MediaInputError('isDefault must be true or false.')
    patch.isDefault=body.isDefault
  }
  if('slotId' in body){
    patch.slotId=parseSlotId(body.slotId)
    // The class always follows the slot (the route fills it in); clearing the slot clears the class.
    if(patch.slotId===null) patch.evidenceClass=null
  }
  if('specimenRef' in body) patch.specimenRef=parseSpecimenRef(body.specimenRef)
  if('assumptions' in body) patch.assumptions=parseAssumptions(body.assumptions)
  if('generator' in body) patch.generator=parseGenerator(body.generator)
  if('review' in body) patch.review=parseReview(body.review)
  return patch
}

/* ---- Scientific-image metadata (plan task T13.1) ---- */

const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/
const isRealDate=(value:string)=>{
  if(!ISO_DATE.test(value)) return false
  const [year,month,day]=value.split('-').map(Number)
  const date=new Date(Date.UTC(year,month-1,day))
  // Round trip: rejects 2026-02-31, which engines would otherwise roll over to March.
  return date.getUTCFullYear()===year&&date.getUTCMonth()===month-1&&date.getUTCDate()===day
}
const REVIEW_DECISIONS:readonly MediaReviewDecision[]=['approve','revise','reject']
const objectOrJson=(value:unknown,field:string):Record<string,unknown>|null=>{
  if(value===null||value===undefined||value==='') return null
  let parsed:unknown=value
  if(typeof value==='string'){
    try{parsed=JSON.parse(value)}catch{throw new MediaInputError(`${field} must be a JSON object.`)}
  }
  if(parsed===null) return null
  if(typeof parsed!=='object'||Array.isArray(parsed)) throw new MediaInputError(`${field} must be an object.`)
  return parsed as Record<string,unknown>
}

/** Empty or null clears the slot; anything else must be a known, applicable, not-on-hold slot. */
export function parseSlotId(value:unknown):string|null{
  if(value===null||value===undefined||value==='') return null
  if(typeof value!=='string') throw new MediaInputError('Slot id must be text.')
  const slot=findSlot(SLOT_DEFINITIONS,value.trim())
  if(!slot) throw new MediaInputError(`Unknown image slot: ${value}.`)
  if(!slot.applicable) throw new MediaInputError(`Slot ${value} is not applicable: ${slot.notApplicableReason}`)
  if(slot.holdReason) throw new MediaInputError(`Slot ${value} is on hold: ${slot.holdReason}`)
  return String(slot.id)
}
export const parseSpecimenRef=(value:unknown):string=>parseText(value??'','Specimen reference',300)
export const parseAssumptions=(value:unknown):string=>parseText(value??'','Assumptions',3000)

export function parseGenerator(value:unknown):MediaGenerator|null{
  const raw=objectOrJson(value,'Generator')
  if(!raw) return null
  const name=parseText(raw.name??'','Generator name',80)
  const version=parseText(raw.version??'','Generator version',40)
  const date=parseText(raw.date??'','Generator date',10)
  if(!name) throw new MediaInputError('Generator name is required (use the artist name for hand-made work).')
  if(!isRealDate(date)) throw new MediaInputError('Generator date must be a real date written YYYY-MM-DD.')
  return {name,version,date}
}
export function parseReview(value:unknown):MediaReview|null{
  const raw=objectOrJson(value,'Review')
  if(!raw) return null
  const reviewer=parseText(raw.reviewer??'','Reviewer',80)
  const date=parseText(raw.date??'','Review date',10)
  const decision=raw.decision
  if(!reviewer) throw new MediaInputError('Reviewer name is required.')
  if(!isRealDate(date)) throw new MediaInputError('Review date must be a real date written YYYY-MM-DD.')
  if(!isOneOf(REVIEW_DECISIONS,decision)) throw new MediaInputError('Review decision must be approve, revise or reject.')
  return {reviewer,date,decision}
}

const DEFAULT_KIND_BY_CLASS:Record<MediaEvidenceClass,MediaKind>={A:'context-schematic',B:'context-schematic',C:'specimen-photo',D:'reconstruction'}
const ALLOWED_KINDS_BY_CLASS:Record<MediaEvidenceClass,readonly MediaKind[]>={A:['context-schematic'],B:['context-schematic'],C:['specimen-photo','cast-photo'],D:['reconstruction']}

export type SlotAssignment={slot:MediaSlotDefinition;roles:MediaRole[];kind:MediaKind;evidenceClass:MediaEvidenceClass}

/**
 * What assigning an image to a slot implies: the slot's role is added, the kind is kept when the class allows it
 * (otherwise the class default is used) and the evidence class comes from the slot, never from the client.
 * Throws when the slot is closed or belongs to another taxon.
 */
export function resolveSlotAssignment(slotId:string,subjectId:string,roles:readonly MediaRole[],kind:MediaKind|undefined):SlotAssignment{
  const slot=findSlot(SLOT_DEFINITIONS,slotId)
  if(!slot||!isSlotOpen(slot)) throw new MediaInputError(`Slot ${slotId} cannot be filled.`)
  if(slot.taxonId!==null&&String(slot.taxonId)!==subjectId) throw new MediaInputError(`Slot ${slotId} belongs to ${String(slot.taxonId)}, not to ${subjectId}.`)
  const nextRoles=roles.includes(slot.role)?[...roles]:[...roles,slot.role]
  const allowed=ALLOWED_KINDS_BY_CLASS[slot.evidenceClass]
  const nextKind=kind&&allowed.includes(kind)?kind:DEFAULT_KIND_BY_CLASS[slot.evidenceClass]
  return {slot,roles:nextRoles,kind:nextKind,evidenceClass:slot.evidenceClass}
}

export function parseRequiredText(value:unknown,field:string,max=MAX_TEXT):string{
  const text=parseText(value,field,max)
  if(!text) throw new MediaInputError(`${field} is required.`)
  return text
}
