import 'server-only'
import {getDb,recordRevision,transaction} from './db'
import type {ContentCatalog,MediaAsset,MediaKind,MediaRightsStatus,MediaPublicationStatus,MediaRole,MediaVariant,TaxonRecord} from '../../domain/contracts'
import {asMediaAssetId,asSourceId,asTaxonId} from '../../domain/ids'

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
  createdAt:string
  updatedAt:string
}

type MediaRow={
  id:string;subject_type:string;subject_id:string;roles:string;kind:string;file_path:string;
  width:number;height:number;variants:string;credit:string;license:string|null;source_url:string;linked_source_id:string|null;
  note:string;alt:string;publication_status:string;rights_status:string;status:string;is_default:number;
  created_at:string;updated_at:string
}

function fromRow(row:MediaRow):CmsMediaRecord{
  return {
    id:row.id,subjectType:'taxon',subjectId:row.subject_id,roles:JSON.parse(row.roles),kind:row.kind as MediaKind,
    filePath:row.file_path,width:row.width,height:row.height,variants:JSON.parse(row.variants) as MediaVariant[],credit:row.credit,license:row.license,
    sourceUrl:row.source_url,linkedSourceId:row.linked_source_id,note:row.note,alt:row.alt,
    publicationStatus:row.publication_status as MediaPublicationStatus,rightsStatus:row.rights_status as MediaRightsStatus,
    status:row.status as CmsMediaStatus,isDefault:row.is_default===1,createdAt:row.created_at,updatedAt:row.updated_at,
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
}

export function createMedia(input:CreateMediaInput):CmsMediaRecord{
  const now=new Date().toISOString()
  return transaction(()=>{
    getDb().prepare(`INSERT INTO media_assets(id,subject_type,subject_id,roles,kind,file_path,width,height,variants,credit,license,source_url,linked_source_id,note,alt,publication_status,rights_status,status,is_default,created_at,updated_at)
      VALUES (@id,'taxon',@subjectId,@roles,@kind,@filePath,@width,@height,@variants,@credit,@license,@sourceUrl,@linkedSourceId,@note,@alt,@publicationStatus,@rightsStatus,'draft',@isDefault,@now,@now)`)
      .run({...input,roles:JSON.stringify(input.roles),variants:JSON.stringify(input.variants),isDefault:input.isDefault?1:0,now})
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
    }
    getDb().prepare(`UPDATE media_assets SET subject_id=@subjectId,roles=@roles,kind=@kind,credit=@credit,license=@license,source_url=@sourceUrl,linked_source_id=@linkedSourceId,note=@note,alt=@alt,publication_status=@publicationStatus,rights_status=@rightsStatus,is_default=@isDefault,updated_at=@updatedAt WHERE id=@id`)
      .run({...next,roles:JSON.stringify(next.roles),isDefault:next.isDefault?1:0,updatedAt:new Date().toISOString(),id})
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

export type CmsCopyRecord={slotId:string;value:string;status:CmsMediaStatus;updatedAt:string}

export function listCopy():readonly CmsCopyRecord[]{
  const rows=getDb().prepare('SELECT slot_id as slotId, value, status, updated_at as updatedAt FROM copy_blocks').all() as CmsCopyRecord[]
  return rows
}

export function upsertCopy(slotId:string,value:string):CmsCopyRecord{
  const now=new Date().toISOString()
  getDb().prepare(`INSERT INTO copy_blocks(slot_id,value,status,updated_at) VALUES (?,?, 'draft',?)
    ON CONFLICT(slot_id) DO UPDATE SET value=excluded.value, status='draft', updated_at=excluded.updated_at`).run(slotId,value,now)
  recordRevision('copy',slotId,'updated',`Edited copy slot ${slotId}`)
  return {slotId,value,status:'draft',updatedAt:now}
}

export function setCopyStatus(slotId:string,status:CmsMediaStatus):void{
  getDb().prepare('UPDATE copy_blocks SET status=?, updated_at=? WHERE slot_id=?').run(status,new Date().toISOString(),slotId)
  recordRevision('copy',slotId,status==='published'?'published':'unpublished',`Set status to ${status}`)
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
  const taxa:TaxonRecord[]=base.taxa.map(taxon=>{
    const additions=byTaxon.get(String(taxon.id))
    if(!additions) return taxon
    const mediaIds=[...taxon.mediaIds,...additions.map(asMediaAssetId)]
    const defaultId=defaultByTaxon.get(String(taxon.id))
    const treeIconId=treeIconByTaxon.get(String(taxon.id))
    return {
      ...taxon,
      mediaIds,
      defaultMediaId:defaultId?asMediaAssetId(defaultId):taxon.defaultMediaId,
      ...(treeIconId?{treeIconMediaId:asMediaAssetId(treeIconId)}:{}),
    }
  })
  const catalog:ContentCatalog={...base,taxa,media:[...base.media,...newMedia]}
  const copy=Object.fromEntries(publishedCopy.map(row=>[row.slotId,row.value]))
  return {catalog,copy}
}
