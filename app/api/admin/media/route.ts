import 'server-only'
import {NextResponse} from 'next/server'
import {randomBytes} from 'node:crypto'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'
import {listMedia,createMedia} from '../../../../infrastructure/cms/store'
import {processUploadedImage,deleteProcessedImage,InvalidImageError} from '../../../../infrastructure/cms/assets'
import {MAX_UPLOAD_REQUEST_BYTES,MediaInputError,parseKind,parseOptionalText,parsePublicationStatus,parseRequiredText,parseRightsStatus,parseRoles,parseSourceUrl} from '../../../../infrastructure/cms/mediaInput'
import {contentCatalog} from '../../../../content/catalog'

// node:sqlite and sharp need the Node.js runtime.
export const runtime='nodejs'

const ID_SAFE=/^[a-z0-9-]+$/

export async function GET(){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  return NextResponse.json({media:listMedia()})
}

export async function POST(request:Request){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  // Refuse obviously oversized bodies before buffering them (the reverse proxy should enforce the same limit).
  const declaredLength=Number(request.headers.get('content-length')??'0')
  if(Number.isFinite(declaredLength) && declaredLength>MAX_UPLOAD_REQUEST_BYTES) return NextResponse.json({error:'Upload is larger than 20 MB.'},{status:413})
  const form=await request.formData().catch(()=>null)
  if(!form) return NextResponse.json({error:'Expected multipart/form-data.'},{status:400})

  const file=form.get('file')
  if(!(file instanceof File)) return NextResponse.json({error:'A file is required.'},{status:400})
  if(file.size>MAX_UPLOAD_REQUEST_BYTES) return NextResponse.json({error:'Upload is larger than 20 MB.'},{status:413})
  const subjectId=String(form.get('subjectId')??'')
  if(!contentCatalog.taxa.some(t=>String(t.id)===subjectId)) return NextResponse.json({error:`Unknown taxon: ${subjectId}.`},{status:400})

  let input:{roles:ReturnType<typeof parseRoles>;kind:ReturnType<typeof parseKind>;alt:string;note:string;credit:string;license:string|null;sourceUrl:string;linkedSourceId:string|null;publicationStatus:ReturnType<typeof parsePublicationStatus>;rightsStatus:ReturnType<typeof parseRightsStatus>;isDefault:boolean}
  try{
    const linkedSourceId=parseOptionalText(form.get('linkedSourceId'),'Linked source')
    if(linkedSourceId && !contentCatalog.sources.some(s=>String(s.id)===linkedSourceId)) throw new MediaInputError(`Unknown catalog source: ${linkedSourceId}.`)
    input={
      roles:parseRoles(form.get('roles')??''),
      kind:parseKind(String(form.get('kind')??'')),
      alt:parseRequiredText(String(form.get('alt')??''),'Alt text'),
      note:parseRequiredText(String(form.get('note')??''),'Note'),
      credit:parseRequiredText(String(form.get('credit')??''),'Credit'),
      license:parseOptionalText(form.get('license'),'License'),
      sourceUrl:parseSourceUrl(form.get('sourceUrl')??''),
      linkedSourceId,
      publicationStatus:parsePublicationStatus(String(form.get('publicationStatus')??'review-required')),
      rightsStatus:parseRightsStatus(String(form.get('rightsStatus')??'unknown')),
      isDefault:form.get('isDefault')==='true',
    }
    if(!input.alt) throw new MediaInputError('Alt text is required.')
  }catch(error){
    if(error instanceof MediaInputError) return NextResponse.json({error:error.message},{status:400})
    throw error
  }

  const id=`cms-media-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`
  if(!ID_SAFE.test(id)) return NextResponse.json({error:'Generated id was not URL-safe; please retry.'},{status:500})

  const buffer=Buffer.from(await file.arrayBuffer())
  let processed:Awaited<ReturnType<typeof processUploadedImage>>
  try{
    processed=await processUploadedImage(id,buffer)
  }catch(error){
    deleteProcessedImage(id)
    if(error instanceof InvalidImageError) return NextResponse.json({error:error.message},{status:400})
    throw error
  }

  try{
    const created=createMedia({id,subjectId,filePath:`/cms-media/${id}`,width:processed.width,height:processed.height,variants:processed.variants,...input})
    return NextResponse.json({media:created},{status:201})
  }catch(error){
    // Never leave orphaned files behind when the database write fails.
    deleteProcessedImage(id)
    throw error
  }
}
