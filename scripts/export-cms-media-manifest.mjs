#!/usr/bin/env node
/**
 * Export a sanitized inventory of CMS media metadata and verify the processed files on disk.
 *
 * Usage:
 *   npm run export:cms-media
 *   CMS_DB_PATH=.cms-data/cms.sqlite CMS_MEDIA_DIR=.cms-data/media npm run export:cms-media > cms-media-manifest.json
 *
 * The export intentionally excludes admin sessions, password data, review identities and generator account metadata.
 * It never modifies the CMS database or media directory and never deletes or publishes files.
 */
import {createHash} from 'node:crypto'
import {DatabaseSync} from 'node:sqlite'
import {existsSync,lstatSync,readdirSync,readFileSync} from 'node:fs'
import {join,resolve,sep} from 'node:path'

const dbPath=resolve(process.env.CMS_DB_PATH??'.cms-data/cms.sqlite')
const mediaRoot=resolve(process.env.CMS_MEDIA_DIR??'.cms-data/media')
const ALLOWED_FILES=new Set(['thumbnail.webp','card.webp','detail.webp','icon.webp'])
const ID_PATTERN=/^cms-media-[a-z0-9-]+$/
const REQUIRED_COLUMNS=[
  'id','subject_id','roles','kind','file_path','width','height','variants','credit','license',
  'source_url','linked_source_id','note','alt','publication_status','rights_status','status',
  'is_default','slot_id','evidence_class','specimen_ref','assumptions','created_at','updated_at',
]

function parseJson(value,label){
  try{return JSON.parse(value)}catch{throw new Error(`Invalid JSON in CMS ${label}.`)}
}
function safeFilePath(id,src){
  const prefix=`/cms-media/${id}/`
  if(typeof src!=='string'||!src.startsWith(prefix)) return null
  const name=src.slice(prefix.length)
  if(!ALLOWED_FILES.has(name)) return null
  return name
}
function fileInfo(id,name){
  const dir=resolve(join(mediaRoot,id))
  const target=resolve(join(dir,name))
  if(!dir.startsWith(mediaRoot+sep)||!target.startsWith(dir+sep)) return {exists:false,bytes:null,sha256:null,error:'path escaped media root'}
  try{
    const stat=lstatSync(target)
    if(stat.isSymbolicLink()||!stat.isFile()) return {exists:false,bytes:null,sha256:null,error:'not a regular file'}
    const bytes=readFileSync(target)
    return {exists:true,bytes:stat.size,sha256:createHash('sha256').update(bytes).digest('hex')}
  }catch{return {exists:false,bytes:null,sha256:null}}
}

if(!existsSync(dbPath)) throw new Error(`CMS database not found at ${dbPath}. Set CMS_DB_PATH to the database used by the site.`)
if(!existsSync(mediaRoot)) throw new Error(`CMS media directory not found at ${mediaRoot}. Set CMS_MEDIA_DIR to the processed media directory.`)

const db=new DatabaseSync(dbPath,{readOnly:true})
let rows
try{
  const columns=db.prepare('PRAGMA table_info(media_assets)').all().map(column=>column.name)
  const missing=REQUIRED_COLUMNS.filter(column=>!columns.includes(column))
  if(missing.length) throw new Error(`CMS database schema is missing columns: ${missing.join(', ')}.`)
  rows=db.prepare(`SELECT ${REQUIRED_COLUMNS.join(', ')} FROM media_assets ORDER BY created_at,id`).all()
}finally{db.close()}

const issues={
  invalidRows:[],
  invalidVariantPaths:[],
  missingVariantFiles:[],
  unreferencedFiles:[],
  untrackedDirectories:[],
  duplicatePublishedSlots:[],
}
const seenIds=new Set()
const publishedSlots=new Map()
const records=[]
let variantCount=0,verifiedVariantCount=0,totalBytes=0

for(const row of rows){
  const id=String(row.id)
  if(!ID_PATTERN.test(id)){issues.invalidRows.push({id,reason:'invalid media id'});continue}
  if(seenIds.has(id)){issues.invalidRows.push({id,reason:'duplicate media id'});continue}
  seenIds.add(id)
  let roles,variants
  try{roles=parseJson(row.roles,`roles for ${id}`)}catch(error){issues.invalidRows.push({id,reason:error.message});continue}
  try{variants=parseJson(row.variants,`variants for ${id}`)}catch(error){issues.invalidRows.push({id,reason:error.message});continue}
  if(!Array.isArray(roles)||!Array.isArray(variants)){
    issues.invalidRows.push({id,reason:'roles and variants must be arrays'})
    continue
  }
  const files=[]
  const referencedNames=new Set()
  for(const variant of variants){
    variantCount+=1
    const name=safeFilePath(id,variant?.src)
    if(!name){
      issues.invalidVariantPaths.push({id,src:variant?.src??null,purpose:variant?.purpose??null})
      files.push({purpose:variant?.purpose??null,src:variant?.src??null,width:variant?.width??null,height:variant?.height??null,format:variant?.format??null,exists:false,bytes:null,sha256:null})
      continue
    }
    referencedNames.add(name)
    const info=fileInfo(id,name)
    if(info.exists){verifiedVariantCount+=1;totalBytes+=info.bytes}
    else issues.missingVariantFiles.push({id,file:name,purpose:variant?.purpose??null,error:info.error??null})
    files.push({purpose:variant.purpose??null,src:variant.src,width:variant.width??null,height:variant.height??null,format:variant.format??null,...info})
  }
  const dir=resolve(join(mediaRoot,id))
  try{
    const entries=readdirSync(dir,{withFileTypes:true})
    for(const entry of entries){
      if(entry.isFile()&&!referencedNames.has(entry.name)){
        issues.unreferencedFiles.push({id,file:entry.name})
      }else if(entry.isSymbolicLink()){
        issues.unreferencedFiles.push({id,file:entry.name,reason:'symbolic link'})
      }
    }
  }catch{
    if(!issues.missingVariantFiles.some(item=>item.id===id)) issues.missingVariantFiles.push({id,file:'<media directory>',purpose:null})
  }
  if(row.status==='published'&&row.slot_id){
    const slot=String(row.slot_id)
    const owners=publishedSlots.get(slot)??[]
    owners.push(id)
    publishedSlots.set(slot,owners)
  }
  records.push({
    id,subjectId:row.subject_id,roles,kind:row.kind,filePath:row.file_path,
    width:row.width,height:row.height,variants:files,credit:row.credit,license:row.license,
    sourceUrl:row.source_url,linkedSourceId:row.linked_source_id,note:row.note,alt:row.alt,
    publicationStatus:row.publication_status,rightsStatus:row.rights_status,status:row.status,
    isDefault:row.is_default===1,slotId:row.slot_id,evidenceClass:row.evidence_class,
    specimenRef:row.specimen_ref,assumptions:row.assumptions,
    createdAt:row.created_at,updatedAt:row.updated_at,
  })
}

for(const [slot,ids] of publishedSlots) if(ids.length>1) issues.duplicatePublishedSlots.push({slot,mediaIds:ids})
for(const entry of readdirSync(mediaRoot,{withFileTypes:true})){
  if(entry.isDirectory()&&!seenIds.has(entry.name)) issues.untrackedDirectories.push(entry.name)
}

const issueCount=Object.values(issues).reduce((sum,list)=>sum+list.length,0)
const report={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  source:{databaseFile:'cms.sqlite',mediaDirectory:'media',databaseReadOnly:true},
  summary:{
    mediaRecords:records.length,variantRecords:variantCount,verifiedVariantFiles:verifiedVariantCount,
    verifiedBytes:totalBytes,issueCount,
  },
  issues,
  media:records,
}
process.stdout.write(JSON.stringify(report,null,2)+'\n')
process.stderr.write(`CMS media export: ${records.length} records, ${verifiedVariantCount}/${variantCount} variants verified, ${issueCount} issue(s). No files changed.\\n`)
