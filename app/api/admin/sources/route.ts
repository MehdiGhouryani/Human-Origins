import 'server-only'
import {NextResponse} from 'next/server'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'
import {contentCatalog} from '../../../../content/catalog'

export async function GET(){
  if(!await hasValidSession()) return NextResponse.json({error:'Unauthorized'},{status:401})
  const sources=contentCatalog.sources.map(s=>({id:String(s.id),title:s.title,type:s.type}))
  return NextResponse.json({sources,taxa:contentCatalog.taxa.map(t=>({id:String(t.id),name:t.name}))})
}
