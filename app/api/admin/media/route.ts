import 'server-only'
import {NextResponse} from 'next/server'
import {randomBytes} from 'node:crypto'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'
import {listMedia,createMedia} from '../../../../infrastructure/cms/store'
import {processUploadedImage,deleteProcessedImage,InvalidImageError} from '../../../../infrastructure/cms/assets'
import {MAX_UPLOAD_REQUEST_BYTES,MediaInputError,parseAssumptions,parseGenerator,parseKind,parseOptionalText,parsePublicationStatus,parseRequiredText,parseReview,parseRightsStatus,parseRoles,parseSlotId,parseSourceUrl,parseSpecimenRef,resolveSlotAssignment} from '../../../../infrastructure/cms/mediaInput'
import {contentCatalog} from '../../../../content/catalog'
import type {MediaEvidenceClass} from '../../../../domain/contracts'
import {MEDIA_SLOTS} from '../../../../content/media-slots.generated'
import {findSlot,slotAspect} from '../../../../domain/media-slots'

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

  type UploadInput={
    roles:ReturnType<typeof parseRoles>;kind:ReturnType<typeof parseKind>;alt:string;note:string;credit:string;license:string|null;sourceUrl:string;linkedSourceId:string|null
    publicationStatus:ReturnType<typeof parsePublicationStatus>;rightsStatus:ReturnType<typeof parseRightsStatus>;isDefault:boolean
    slotId:string|null;evidenceClass:MediaEvidenceClass|null;specimenRef:string;assumptions:string;generator:ReturnType<typeof parseGenerator>;review:ReturnType<typeof parseReview>
  }
  let input:UploadInput
  try{
    const linkedSourceId=parseOptionalText(form.get('linkedSourceId'),'Linked source')
    if(linkedSourceId && !contentCatalog.sources.some(s=>String(s.id)===linkedSourceId)) throw new MediaInputError(`Unknown catalog source: ${linkedSourceId}.`)
    // A slot upload may omit roles and kind: the slot supplies the role, the evidence class and a valid kind.
    const slotId=parseSlotId(form.get('slotId'))
    const rawRoles=String(form.get('roles')??'')
    const rawKind=String(form.get('kind')??'')
    let roles:ReturnType<typeof parseRoles>=rawRoles.trim()?parseRoles(rawRoles):[]
    let kind:ReturnType<typeof parseKind>|undefined=rawKind.trim()?parseKind(rawKind):undefined
    let evidenceClass:MediaEvidenceClass|null=null
    if(slotId){
      const assignment=resolveSlotAssignment(slotId,subjectId,roles,kind)
      roles=assignment.roles
      kind=assignment.kind
      evidenceClass=assignment.evidenceClass
    }else{
      if(!roles.length) throw new MediaInputError('At least one role is required.')
      if(!kind) throw new MediaInputError('Media kind is required.')
    }
    input={
      roles,
      kind:kind!,
      alt:parseRequiredText(String(form.get('alt')??''),'Alt text'),
      note:parseRequiredText(String(form.get('note')??''),'Note'),
      credit:parseRequiredText(String(form.get('credit')??''),'Credit'),
      license:parseOptionalText(form.get('license'),'License'),
      sourceUrl:parseSourceUrl(form.get('sourceUrl')??''),
      linkedSourceId,
      publicationStatus:parsePublicationStatus(String(form.get('publicationStatus')??'review-required')),
      rightsStatus:parseRightsStatus(String(form.get('rightsStatus')??'unknown')),
      isDefault:form.get('isDefault')==='true',
      slotId,
      evidenceClass,
      specimenRef:parseSpecimenRef(form.get('specimenRef')),
      assumptions:parseAssumptions(form.get('assumptions')),
      generator:parseGenerator(form.get('generator')),
      review:parseReview(form.get('review')),
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
    const slotDefinition=input.slotId?findSlot(MEDIA_SLOTS,input.slotId):undefined
    processed=await processUploadedImage(id,buffer,{aspect:slotDefinition?slotAspect(slotDefinition):null})
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
