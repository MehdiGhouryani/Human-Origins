import 'server-only'
import {NextResponse} from 'next/server'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'
import {listCopy,upsertCopy,setCopyStatus} from '../../../../infrastructure/cms/store'
import {transaction} from '../../../../infrastructure/cms/db'
import {validateCurrentlyPublished} from '../../../../infrastructure/cms/validate'
import {copySlotIds} from '../../../../content/copy-registry'

const MAX_LENGTH=2000

export async function GET(){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  return NextResponse.json({copy:listCopy()})
}

export async function PATCH(request:Request){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  const body=await request.json().catch(()=>null) as {slotId?:unknown;value?:unknown;status?:unknown}|null
  if(typeof body?.slotId!=='string' || !copySlotIds.has(body.slotId)) return NextResponse.json({error:'Unknown copy slot.'},{status:400})
  if(body.value!==undefined && typeof body.value!=='string') return NextResponse.json({error:'Value must be text.'},{status:400})
  if(body.status!==undefined && body.status!=='draft' && body.status!=='published') return NextResponse.json({error:'Status must be draft or published.'},{status:400})
  if(body.status && body.value===undefined && !listCopy().some(row=>row.slotId===body.slotId)) return NextResponse.json({error:'Save a draft for this slot before publishing it.'},{status:400})
  let value:string|undefined
  if(body.value!==undefined){
    const trimmed=body.value.trim()
    if(!trimmed) return NextResponse.json({error:'Value cannot be empty.'},{status:400})
    if(trimmed.length>MAX_LENGTH) return NextResponse.json({error:`Value exceeds ${MAX_LENGTH} characters.`},{status:400})
    value=trimmed
  }
  const result=transaction(()=>{
    if(body.status==='published'){
      const report=validateCurrentlyPublished()
      if(!report.ok) return {error:'Publishing is blocked because the current live catalog failed validation.',issues:report.issues.filter(issue=>issue.severity==='error')}
    }
    if(value!==undefined) upsertCopy(body.slotId as string,value)
    if(body.status) setCopyStatus(body.slotId as string,body.status as 'draft'|'published')
    return {copy:listCopy()}
  })
  if('error' in result) return NextResponse.json(result,{status:422})
  return NextResponse.json(result)
}
