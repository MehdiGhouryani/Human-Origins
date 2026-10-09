import 'server-only'
import {NextResponse} from 'next/server'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'
import {contentCatalog} from '../../../../content/catalog'
import {DEFAULT_GRAPH_CONFIG} from '../../../../features/explorer/bootstrap'
import {parseGraphConfig,projectGraph,type GraphConfig} from '../../../../domain/graph-visibility'
import {getGraphConfig,resetGraphConfig,setGraphStatus,upsertGraphConfig} from '../../../../infrastructure/cms/store'
import {transaction} from '../../../../infrastructure/cms/db'

export const runtime='nodejs'
export const dynamic='force-dynamic'

const taxa=contentCatalog.taxa.map(taxon=>({id:String(taxon.id),short:taxon.short,start:taxon.start,end:taxon.end,inferred:taxon.inferred}))
const relationships=contentCatalog.relationships
const knownIds=new Set(taxa.map(taxon=>taxon.id))
const projection=(config:GraphConfig)=>projectGraph(taxa,relationships,config)
const unauthorized=()=>NextResponse.json({error:'Unauthorized'},{status:401})

/** Shape returned by every method, so the admin UI can always re-sync from the server's answer. */
function snapshot(){
  const stored=getGraphConfig()
  const config=stored?.config??DEFAULT_GRAPH_CONFIG
  return {
    config,
    status:stored?(stored.status==='published'?'published':'draft'):'built-in',
    live:stored?.live??false,
    publishedConfig:stored?.publishedConfig??null,
    updatedAt:stored?.updatedAt??null,
    projection:projection(config),
  }
}

export async function GET(){
  if(!await hasValidSession()) return unauthorized()
  return NextResponse.json(snapshot())
}

/**
 * PATCH {config?, status?}
 *  - config only          → save a draft (the live graph is untouched)
 *  - status:'published'   → validate, then promote the (new or stored) draft to live
 *  - status:'draft'       → unpublish: the public site goes back to the built-in graph
 * Writes run in one transaction, so a failed validation never leaves a half-saved state.
 */
export async function PATCH(request:Request){
  if(!await hasValidSession()) return unauthorized()
  const body=await request.json().catch(()=>null) as {config?:unknown;status?:unknown}|null
  if(!body||typeof body!=='object') return NextResponse.json({error:'Request body must be JSON.'},{status:400})
  if(body.status!==undefined&&body.status!=='draft'&&body.status!=='published') return NextResponse.json({error:'Status must be draft or published.'},{status:400})
  const current=getGraphConfig()
  let config:GraphConfig|undefined
  if(body.config!==undefined){
    config=parseGraphConfig(body.config,knownIds)
    if(!config) return NextResponse.json({error:'Graph configuration is invalid. Choose at least one shown taxon and use known catalogue ids.'},{status:400})
  }else config=current?.config
  if(!config) return NextResponse.json({error:'Save the graph as a draft before publishing it.'},{status:400})
  if(body.config===undefined&&body.status===undefined) return NextResponse.json({error:'Nothing to change.'},{status:400})
  const result=projection(config)
  const errors=result.issues.filter(issue=>issue.severity==='error')
  if(body.status==='published'&&errors.length) return NextResponse.json({error:'Publishing is blocked until the graph is valid.',issues:errors},{status:422})
  transaction(()=>{
    if(body.config!==undefined) upsertGraphConfig(config)
    if(body.status) setGraphStatus(body.status as 'draft'|'published')
  })
  return NextResponse.json(snapshot())
}

/** DELETE → discard draft and live configuration; the built-in curated graph is served again. */
export async function DELETE(){
  if(!await hasValidSession()) return unauthorized()
  resetGraphConfig()
  return NextResponse.json(snapshot())
}
