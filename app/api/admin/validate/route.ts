import 'server-only'
import {NextResponse} from 'next/server'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'
import {validateCurrentlyPublished} from '../../../../infrastructure/cms/validate'

export async function GET(){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  return NextResponse.json(validateCurrentlyPublished())
}
