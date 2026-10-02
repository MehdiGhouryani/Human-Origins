import 'server-only'
import {NextResponse} from 'next/server'
import {hasValidSession} from '../../../../../infrastructure/cms/requireSession'
import {getMedia,updateMedia,setMediaStatus,deleteMedia,assignMediaSlot,type CmsMediaRecord} from '../../../../../infrastructure/cms/store'
import {transaction} from '../../../../../infrastructure/cms/db'
import {validateWithPendingMedia} from '../../../../../infrastructure/cms/validate'
import {deleteProcessedImage} from '../../../../../infrastructure/cms/assets'
import {MediaInputError,parseMediaPatch,parseSlot,parseStatus} from '../../../../../infrastructure/cms/mediaInput'
import {contentCatalog} from '../../../../../content/catalog'

export const runtime='nodejs'

type Params={params:Promise<{id:string}>}

const TAXON_IDS=new Set(contentCatalog.taxa.map(t=>String(t.id)))
const SOURCE_IDS=new Set(contentCatalog.sources.map(s=>String(s.id)))

/** What a slot assignment does to a row, mirrored here so the dry-run audit sees the final record. */
function withSlot(row:CmsMediaRecord,slot:'tree-icon'|'portrait'):CmsMediaRecord{
  if(slot==='portrait') return {...row,isDefault:true,roles:row.roles.includes('profile-portrait')?row.roles:[...row.roles,'profile-portrait']}
  return {...row,roles:row.roles.includes('tree-thumbnail')?row.roles:[...row.roles,'tree-thumbnail']}
}

export async function PATCH(request:Request,{params}:Params){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  const {id}=await params
  const existing=getMedia(id)
  if(!existing) return NextResponse.json({error:'Not found.'},{status:404})

  const body=await request.json().catch(()=>null) as Record<string,unknown>|null
  if(!body || typeof body!=='object' || Array.isArray(body)) return NextResponse.json({error:'Invalid JSON body.'},{status:400})
  const {status:rawStatus,slot:rawSlot,...rawPatch}=body

  let status:ReturnType<typeof parseStatus>,slot:ReturnType<typeof parseSlot>,patch:ReturnType<typeof parseMediaPatch>
  try{
    status=parseStatus(rawStatus)
    slot=parseSlot(rawSlot)
    patch=parseMediaPatch(rawPatch,TAXON_IDS,SOURCE_IDS)
  }catch(error){
    if(error instanceof MediaInputError) return NextResponse.json({error:error.message},{status:400})
    throw error
  }

  const wantsPublished=status==='published' || (status===undefined && existing.status==='published')
  if(wantsPublished){
    let candidate:CmsMediaRecord={...existing,...patch,status:'published'}
    if(slot) candidate=withSlot(candidate,slot)
    const report=validateWithPendingMedia([candidate])
    if(!report.ok) return NextResponse.json({error:'Validation failed; nothing was changed.',report},{status:422})
  }

  // Metadata, slot and status change commit together or not at all.
  transaction(()=>{
    if(Object.keys(patch).length) updateMedia(id,patch)
    if(slot) assignMediaSlot(id,slot)
    if(status && status!==existing.status) setMediaStatus(id,status)
  })
  return NextResponse.json({media:getMedia(id)})
}

export async function DELETE(_request:Request,{params}:Params){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  const {id}=await params
  if(!getMedia(id)) return NextResponse.json({error:'Not found.'},{status:404})
  deleteMedia(id)
  try{ deleteProcessedImage(id) }catch(error){ console.error(`[cms] Media row ${id} deleted but its files could not be removed:`,error) }
  return NextResponse.json({ok:true})
}
