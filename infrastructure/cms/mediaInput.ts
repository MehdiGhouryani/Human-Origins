import 'server-only'
import type {MediaKind,MediaPublicationStatus,MediaRightsStatus,MediaRole} from '../../domain/contracts'
import type {CmsMediaStatus,MediaSlot,UpdateMediaInput} from './store'

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
  return patch
}

export function parseRequiredText(value:unknown,field:string,max=MAX_TEXT):string{
  const text=parseText(value,field,max)
  if(!text) throw new MediaInputError(`${field} is required.`)
  return text
}
