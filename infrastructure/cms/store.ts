import 'server-only'
import {getDb,recordRevision,transaction} from './db'
import type {ContentCatalog,MediaAsset,MediaEvidenceClass,MediaGenerator,MediaKind,MediaReview,MediaRightsStatus,MediaPublicationStatus,MediaRole,MediaVariant,TaxonRecord} from '../../domain/contracts'
import type {GraphConfig} from '../../domain/graph-visibility'
import {asMediaAssetId,asMediaSlotId,asSourceId,asTaxonId} from '../../domain/ids'

export type CmsMediaStatus='draft'|'published'

export type CmsMediaRecord={
  id:string
  subjectType:'taxon'
  subjectId:string
  roles:readonly MediaRole[]
  kind:MediaKind
  filePath:string
  width:number
  height:number
  variants:readonly MediaVariant[]
  credit:string
  license:string|null
  sourceUrl:string
  linkedSourceId:string|null
  note:string
  alt:string
  publicationStatus:MediaPublicationStatus
  rightsStatus:MediaRightsStatus
  status:CmsMediaStatus
  isDefault:boolean
  /** Named page slot this image fills (content/media-slots.generated.ts), or null for a free-standing image. */
  slotId:string|null
  evidenceClass:MediaEvidenceClass|null
  specimenRef:string
  assumptions:string
  generator:MediaGenerator|null
  review:MediaReview|null
  createdAt:string
  updatedAt:string
}

type MediaRow={
  id:string;subject_type:string;subject_id:string;roles:string;kind:string;file_path:string;
  width:number;height:number;variants:string;credit:string;license:string|null;source_url:string;linked_source_id:string|null;
  note:string;alt:string;publication_status:string;rights_status:string;status:string;is_default:number;
  slot_id:string|null;evidence_class:string|null;specimen_ref:string;assumptions:string;generator:string|null;reviewed_by:string|null;
  created_at:string;updated_at:string
}

const parseJsonColumn=<T,>(value:string|null):T|null=>{
  if(!value) return null
  try{return JSON.parse(value) as T}catch{return null}
}

function fromRow(row:MediaRow):CmsMediaRecord{
  return {
    id:row.id,subjectType:'taxon',subjectId:row.subject_id,roles:JSON.parse(row.roles),kind:row.kind as MediaKind,
    filePath:row.file_path,width:row.width,height:row.height,variants:JSON.parse(row.variants) as MediaVariant[],credit:row.credit,license:row.license,
    sourceUrl:row.source_url,linkedSourceId:row.linked_source_id,note:row.note,alt:row.alt,
    publicationStatus:row.publication_status as MediaPublicationStatus,rightsStatus:row.rights_status as MediaRightsStatus,
    status:row.status as CmsMediaStatus,isDefault:row.is_default===1,
    slotId:row.slot_id,evidenceClass:(row.evidence_class as MediaEvidenceClass|null),specimenRef:row.specimen_ref??'',assumptions:row.assumptions??'',
    generator:parseJsonColumn<MediaGenerator>(row.generator),review:parseJsonColumn<MediaReview>(row.reviewed_by),
    createdAt:row.created_at,updatedAt:row.updated_at,
  }
}

export function listMedia():readonly CmsMediaRecord[]{
  const rows=getDb().prepare('SELECT * FROM media_assets ORDER BY created_at DESC').all() as MediaRow[]
  return rows.map(fromRow)
}

export function getMedia(id:string):CmsMediaRecord|undefined{
  const row=getDb().prepare('SELECT * FROM media_assets WHERE id = ?').get(id) as MediaRow|undefined
  return row?fromRow(row):undefined
}

export type CreateMediaInput={
  id:string;subjectId:string;roles:readonly MediaRole[];kind:MediaKind;filePath:string;width:number;height:number;variants:readonly MediaVariant[];
  credit:string;license:string|null;sourceUrl:string;linkedSourceId:string|null;note:string;alt:string;
  publicationStatus:MediaPublicationStatus;rightsStatus:MediaRightsStatus;isDefault:boolean
  slotId?:string|null;evidenceClass?:MediaEvidenceClass|null;specimenRef?:string;assumptions?:string;generator?:MediaGenerator|null;review?:MediaReview|null
}

export function createMedia(input:CreateMediaInput):CmsMediaRecord{
  const now=new Date().toISOString()
  return transaction(()=>{
    getDb().prepare(`INSERT INTO media_assets(id,subject_type,subject_id,roles,kind,file_path,width,height,variants,credit,license,source_url,linked_source_id,note,alt,publication_status,rights_status,status,is_default,slot_id,evidence_class,specimen_ref,assumptions,generator,reviewed_by,created_at,updated_at)
      VALUES (@id,'taxon',@subjectId,@roles,@kind,@filePath,@width,@height,@variants,@credit,@license,@sourceUrl,@linkedSourceId,@note,@alt,@publicationStatus,@rightsStatus,'draft',@isDefault,@slotId,@evidenceClass,@specimenRef,@assumptions,@generator,@reviewedBy,@now,@now)`)
      .run({id:input.id,subjectId:input.subjectId,roles:JSON.stringify(input.roles),kind:input.kind,filePath:input.filePath,width:input.width,height:input.height,variants:JSON.stringify(input.variants),credit:input.credit,license:input.license,sourceUrl:input.sourceUrl,linkedSourceId:input.linkedSourceId,note:input.note,alt:input.alt,publicationStatus:input.publicationStatus,rightsStatus:input.rightsStatus,isDefault:input.isDefault?1:0,slotId:input.slotId??null,evidenceClass:input.evidenceClass??null,specimenRef:input.specimenRef??'',assumptions:input.assumptions??'',generator:input.generator?JSON.stringify(input.generator):null,reviewedBy:input.review?JSON.stringify(input.review):null,now})
    recordRevision('media',input.id,'created',`Uploaded media for ${input.subjectId}`)
    // New rows are always drafts: slot exclusivity is applied when (and only when) a row goes live,
    // so uploading a replacement never takes the currently published portrait/avatar off the site.
    const created=getMedia(input.id)
    if(!created) throw new Error('Failed to read back created media row.')
    return created
  })
}

export type UpdateMediaInput=Partial<Omit<CreateMediaInput,'id'|'filePath'|'width'|'height'|'variants'>>

export function updateMedia(id:string,patch:UpdateMediaInput):CmsMediaRecord{
  return transaction(()=>{
    const existing=getMedia(id)
    if(!existing) throw new Error(`Media ${id} does not exist.`)
    const next={
      subjectId:patch.subjectId??existing.subjectId,
      roles:patch.roles??existing.roles,
      kind:patch.kind??existing.kind,
      credit:patch.credit??existing.credit,
      license:patch.license===undefined?existing.license:patch.license,
      sourceUrl:patch.sourceUrl??existing.sourceUrl,
      linkedSourceId:patch.linkedSourceId===undefined?existing.linkedSourceId:patch.linkedSourceId,
      note:patch.note??existing.note,
      alt:patch.alt??existing.alt,
      publicationStatus:patch.publicationStatus??existing.publicationStatus,
      rightsStatus:patch.rightsStatus??existing.rightsStatus,
      isDefault:patch.isDefault??existing.isDefault,
      slotId:patch.slotId===undefined?existing.slotId:patch.slotId,
      evidenceClass:patch.evidenceClass===undefined?existing.evidenceClass:patch.evidenceClass,
      specimenRef:patch.specimenRef??existing.specimenRef,
      assumptions:patch.assumptions??existing.assumptions,
      generator:patch.generator===undefined?existing.generator:patch.generator,
      review:patch.review===undefined?existing.review:patch.review,
    }
    getDb().prepare(`UPDATE media_assets SET subject_id=@subjectId,roles=@roles,kind=@kind,credit=@credit,license=@license,source_url=@sourceUrl,linked_source_id=@linkedSourceId,note=@note,alt=@alt,publication_status=@publicationStatus,rights_status=@rightsStatus,is_default=@isDefault,slot_id=@slotId,evidence_class=@evidenceClass,specimen_ref=@specimenRef,assumptions=@assumptions,generator=@generatorJson,reviewed_by=@reviewJson,updated_at=@updatedAt WHERE id=@id`)
      .run({subjectId:next.subjectId,roles:JSON.stringify(next.roles),kind:next.kind,credit:next.credit,license:next.license,sourceUrl:next.sourceUrl,linkedSourceId:next.linkedSourceId,note:next.note,alt:next.alt,publicationStatus:next.publicationStatus,rightsStatus:next.rightsStatus,isDefault:next.isDefault?1:0,slotId:next.slotId,evidenceClass:next.evidenceClass,specimenRef:next.specimenRef,assumptions:next.assumptions,generatorJson:next.generator?JSON.stringify(next.generator):null,reviewJson:next.review?JSON.stringify(next.review):null,updatedAt:new Date().toISOString(),id})
    recordRevision('media',id,'updated','Edited media metadata')
    if(existing.status==='published') enforceSlotExclusivity(id)
    const updated=getMedia(id)
    if(!updated) throw new Error('Failed to read back updated media row.')
    return updated
  })
}

/**
 * A species has exactly one live CMS portrait and one live CMS tree avatar. Called only for a row that is
 * (or is becoming) published: it un-marks the portrait flag / removes the tree-thumbnail role from the
 * species' other rows. Drafts never displace live content.
 */
function enforceSlotExclusivity(id:string):void{
  const row=getMedia(id)
  if(!row) return
  if(row.isDefault) clearOtherDefaults(row.id,row.subjectId)
  if(row.roles.includes('tree-thumbnail')) clearOtherTreeIcons(row.id,row.subjectId)
  if(row.slotId) demoteOtherSlotOccupants(row.id,row.slotId)
}

/** A slot has at most one live image: publishing a replacement takes the previous occupant back to draft. */
function demoteOtherSlotOccupants(id:string,slotId:string):void{
  const others=getDb().prepare("SELECT id FROM media_assets WHERE slot_id=? AND id<>? AND status='published'").all(slotId,id) as {id:string}[]
  for(const other of others){
    getDb().prepare("UPDATE media_assets SET status='draft', updated_at=? WHERE id=?").run(new Date().toISOString(),other.id)
    recordRevision('media',other.id,'unpublished',`Replaced in slot ${slotId} by ${id}`)
  }
}

/** A species has exactly one CMS portrait: marking one row default un-marks the others of the same species. */
function clearOtherDefaults(id:string,subjectId:string):void{
  const result=getDb().prepare('UPDATE media_assets SET is_default=0, updated_at=? WHERE subject_id=? AND id<>? AND is_default=1').run(new Date().toISOString(),subjectId,id) as {changes?:number|bigint}
  if(Number(result?.changes??0)>0) recordRevision('media',id,'updated',`Became the portrait for ${subjectId}; previous portrait un-marked`)
}

/** A species has exactly one CMS tree avatar: giving one row the tree-thumbnail role removes it from the others. */
function clearOtherTreeIcons(id:string,subjectId:string):void{
  const rows=getDb().prepare('SELECT id, roles FROM media_assets WHERE subject_id=? AND id<>?').all(subjectId,id) as {id:string;roles:string}[]
  for(const row of rows){
    const roles=JSON.parse(row.roles) as MediaRole[]
    if(!roles.includes('tree-thumbnail')) continue
    const remaining=roles.filter(role=>role!=='tree-thumbnail')
    getDb().prepare('UPDATE media_assets SET roles=?, updated_at=? WHERE id=?').run(JSON.stringify(remaining.length?remaining:['gallery']),new Date().toISOString(),row.id)
    recordRevision('media',row.id,'updated',`Tree avatar for ${subjectId} replaced by ${id}`)
  }
}

export type MediaSlot='tree-icon'|'portrait'

/** One-click "use this image as the tree avatar / portrait" for an existing CMS row. */
export function assignMediaSlot(id:string,slot:MediaSlot):CmsMediaRecord{
  return transaction(()=>{
    const existing=getMedia(id)
    if(!existing) throw new Error(`Media ${id} does not exist.`)
    if(slot==='portrait') return updateMedia(id,{isDefault:true,roles:existing.roles.includes('profile-portrait')?existing.roles:[...existing.roles,'profile-portrait']})
    return updateMedia(id,{roles:existing.roles.includes('tree-thumbnail')?existing.roles:[...existing.roles,'tree-thumbnail']})
  })
}

export function setMediaStatus(id:string,status:CmsMediaStatus):void{
  transaction(()=>{
    getDb().prepare('UPDATE media_assets SET status=?, updated_at=? WHERE id=?').run(status,new Date().toISOString(),id)
    recordRevision('media',id,status==='published'?'published':'unpublished',`Set status to ${status}`)
    if(status==='published') enforceSlotExclusivity(id)
  })
}

export function deleteMedia(id:string):void{
  transaction(()=>{
    getDb().prepare('DELETE FROM media_assets WHERE id=?').run(id)
    recordRevision('media',id,'deleted','Removed media asset')
  })
}

// ---- Copy blocks ----

/**
 * A copy slot keeps two values: `value` is the working text the editor last saved, `publishedValue` is what
 * visitors see (null = the built-in wording). `status` is 'published' only when the two are identical, so the
 * admin can tell "live and up to date" from "live, with unpublished changes" (`live` true, status 'draft').
 */
export type CmsCopyRecord={slotId:string;value:string;status:CmsMediaStatus;updatedAt:string;publishedValue:string|null;live:boolean}
type CopyRow={slotId:string;value:string;publishedValue:string|null;updatedAt:string}
const copyFromRow=(row:CopyRow):CmsCopyRecord=>({
  slotId:row.slotId,value:row.value,publishedValue:row.publishedValue,updatedAt:row.updatedAt,
  live:row.publishedValue!==null,status:row.publishedValue!==null&&row.publishedValue===row.value?'published':'draft',
})

/** Same live/draft split as copy. `config` is the working draft, `publishedConfig` what the public graph uses. */
export type CmsGraphRecord={id:'main';config:GraphConfig;status:CmsMediaStatus;updatedAt:string;publishedConfig?:GraphConfig;live:boolean}
type GraphRow={id:string;value:string;published_value:string|null;updated_at:string}

const parseJson=<T,>(text:string|null):T|undefined=>{
  if(text===null) return undefined
  try{return JSON.parse(text) as T}catch{return undefined}
}

export function getGraphConfig():CmsGraphRecord|undefined{
  const row=getDb().prepare('SELECT id,value,published_value,updated_at FROM graph_configs WHERE id=?').get('main') as GraphRow|undefined
  if(!row) return undefined
  const config=parseJson<GraphConfig>(row.value)
  if(!config) return undefined
  const publishedConfig=parseJson<GraphConfig>(row.published_value)
  return {id:'main',config,publishedConfig,live:publishedConfig!==undefined,
    status:row.published_value!==null&&row.published_value===row.value?'published':'draft',updatedAt:row.updated_at}
}

/** Saves the working draft. The live graph is NOT touched until `setGraphStatus('published')`. */
export function upsertGraphConfig(config:GraphConfig):CmsGraphRecord{
  const now=new Date().toISOString()
  transaction(()=>{
    getDb().prepare(`INSERT INTO graph_configs(id,value,status,updated_at) VALUES ('main',?,'draft',?)
      ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`).run(JSON.stringify(config),now)
    recordRevision('graph','main','updated','Edited evolutionary graph visibility and main-path settings (draft)')
  })
  return getGraphConfig()!
}

/** 'published' promotes the draft to live; 'draft' takes the CMS graph offline (the built-in graph is served). */
export function setGraphStatus(status:CmsMediaStatus):void{
  transaction(()=>{
    const now=new Date().toISOString()
    if(status==='published') getDb().prepare("UPDATE graph_configs SET published_value=value,status='published',updated_at=? WHERE id=?").run(now,'main')
    else getDb().prepare("UPDATE graph_configs SET published_value=NULL,status='draft',updated_at=? WHERE id=?").run(now,'main')
    recordRevision('graph','main',status==='published'?'published':'unpublished',status==='published'?'Published the graph configuration':'Unpublished the graph configuration; the built-in graph is live')
  })
}

/** Drops the stored draft and live graph entirely, returning the site to the built-in graph. */
export function resetGraphConfig():void{
  transaction(()=>{
    getDb().prepare('DELETE FROM graph_configs WHERE id=?').run('main')
    recordRevision('graph','main','reset','Discarded the CMS graph configuration; restored the built-in graph')
  })
}

export function listCopy():readonly CmsCopyRecord[]{
  const rows=getDb().prepare('SELECT slot_id as slotId, value, published_value as publishedValue, updated_at as updatedAt FROM copy_blocks').all() as CopyRow[]
  return rows.map(copyFromRow)
}

/** The copy visitors see: one record per live slot, carrying the PUBLISHED text (never an unpublished draft). */
export function listPublishedCopy():readonly CmsCopyRecord[]{
  return listCopy().filter(row=>row.publishedValue!==null).map(row=>({...row,value:row.publishedValue as string,status:'published' as const}))
}

/** Saves the working text. If the slot is live, visitors keep seeing the published text until it is re-published. */
export function upsertCopy(slotId:string,value:string):CmsCopyRecord{
  const now=new Date().toISOString()
  transaction(()=>{
    getDb().prepare(`INSERT INTO copy_blocks(slot_id,value,status,updated_at) VALUES (?,?, 'draft',?)
      ON CONFLICT(slot_id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(slotId,value,now)
    recordRevision('copy',slotId,'updated',`Edited copy slot ${slotId} (draft)`)
  })
  return listCopy().find(row=>row.slotId===slotId)!
}

export function setCopyStatus(slotId:string,status:CmsMediaStatus):void{
  transaction(()=>{
    const now=new Date().toISOString()
    if(status==='published') getDb().prepare("UPDATE copy_blocks SET published_value=value, status='published', updated_at=? WHERE slot_id=?").run(now,slotId)
    else getDb().prepare("UPDATE copy_blocks SET published_value=NULL, status='draft', updated_at=? WHERE slot_id=?").run(now,slotId)
    recordRevision('copy',slotId,status==='published'?'published':'unpublished',`Set status to ${status}`)
  })
}

export function listRevisions(limit=100):readonly {id:number;entityType:string;entityId:string;action:string;summary:string;createdAt:string}[]{
  return getDb().prepare('SELECT id, entity_type as entityType, entity_id as entityId, action, summary, created_at as createdAt FROM revisions ORDER BY id DESC LIMIT ?').all(limit) as never
}

// ---- Merge into the live catalog ----

function toMediaAsset(row:CmsMediaRecord):MediaAsset{
  // Only variants that were actually written to disk at upload time are declared (small sources skip the larger sizes),
  // with their real dimensions. The thumbnail is always generated, so it is the safe fallback for the primary src.
  const variants=row.variants
  const primary=variants.find(variant=>variant.purpose==='card')??variants.find(variant=>variant.purpose==='thumbnail')??variants[0]
  return {
    id:asMediaAssetId(row.id),
    subject:{type:'taxon',id:asTaxonId(row.subjectId)},
    roles:row.roles,
    kind:row.kind,
    src:primary?.src??`${row.filePath}/thumbnail.webp`,
    sourceUrl:row.sourceUrl,
    credit:row.credit,
    license:row.license??undefined,
    note:row.note,
    alt:row.alt,
    publicationStatus:row.publicationStatus,
    rightsStatus:row.rightsStatus,
    variants,
    sourceLinks:row.linkedSourceId?[{sourceId:asSourceId(row.linkedSourceId),role:'illustrates' as const}]:[],
    ...(row.slotId?{slotId:asMediaSlotId(row.slotId)}:{}),
    ...(row.evidenceClass?{evidenceClass:row.evidenceClass}:{}),
    ...(row.specimenRef?{specimenRef:row.specimenRef}:{}),
    ...(row.assumptions?{assumptions:row.assumptions}:{}),
    ...(row.generator?{generator:row.generator}:{}),
    ...(row.review?{review:row.review}:{}),
  }
}

/**
 * Folds every *published* CMS media asset and copy block into a copy of the base catalog:
 * new media rows are appended, and each targeted taxon's mediaIds (and defaultMediaId, if
 * marked) are updated to reference them. Draft rows are never included here -- this is what
 * keeps them invisible to real visitors until an admin publishes. Pure function: does not
 * mutate `base`.
 */
export function mergeCmsIntoCatalog(base:ContentCatalog,publishedMedia:readonly CmsMediaRecord[],publishedCopy:readonly CmsCopyRecord[]):{catalog:ContentCatalog;copy:Record<string,string>}{
  // Oldest first, so that when several published rows claim the same slot the most recently edited one wins.
  const ordered=[...publishedMedia].sort((a,b)=>a.updatedAt.localeCompare(b.updatedAt)||a.id.localeCompare(b.id))
  const newMedia=ordered.map(toMediaAsset)
  const byTaxon=new Map<string,string[]>()
  const defaultByTaxon=new Map<string,string>()
  const treeIconByTaxon=new Map<string,string>()
  for(const row of ordered){
    const list=byTaxon.get(row.subjectId)??[]
    list.push(row.id)
    byTaxon.set(row.subjectId,list)
    if(row.isDefault) defaultByTaxon.set(row.subjectId,row.id)
    if(row.roles.includes('tree-thumbnail')) treeIconByTaxon.set(row.subjectId,row.id)
  }
  const placeholderIds=new Set(base.media.filter(item=>item.placeholder).map(item=>String(item.id)))
  const taxa:TaxonRecord[]=base.taxa.map(taxon=>{
    const additions=byTaxon.get(String(taxon.id))
    if(!additions) return taxon
    const defaultId=defaultByTaxon.get(String(taxon.id))
    // A real (CMS) image always beats a built-in sample: with a CMS portrait and no CMS tree icon, the portrait is
    // also used as the tree avatar, so no sample is left on screen once the admin has published a real picture.
    const treeIconId=treeIconByTaxon.get(String(taxon.id))??defaultId
    const nextDefault=defaultId?asMediaAssetId(defaultId):taxon.defaultMediaId
    const nextTreeIcon=treeIconId?asMediaAssetId(treeIconId):taxon.treeIconMediaId
    const keep=(id:string)=>!placeholderIds.has(id)||id===String(nextDefault)||id===String(nextTreeIcon)
    const mediaIds=[...taxon.mediaIds.filter(id=>keep(String(id))),...additions.map(asMediaAssetId)]
    return {
      ...taxon,
      mediaIds,
      defaultMediaId:nextDefault,
      ...(nextTreeIcon?{treeIconMediaId:nextTreeIcon}:{}),
    }
  })
  const catalog:ContentCatalog={...base,taxa,media:[...base.media,...newMedia]}
  const copy=Object.fromEntries(publishedCopy.map(row=>[row.slotId,row.value]))
  return {catalog,copy}
}
