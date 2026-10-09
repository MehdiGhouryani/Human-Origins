import {NextResponse} from 'next/server'
import {buildExplorerBootstrap} from '../../../features/explorer/bootstrap'
import {searchExplorerCatalog} from '../../../features/explorer/selectors'
import {getLiveContent} from '../../../infrastructure/cms/live'
import {groupSearchResults,normalizeQuery} from '../../../features/search/targets'

export const dynamic='force-dynamic'

/**
 * Typed global search. Runs on the server so the header never has to ship the catalogue to the client.
 * Input is normalised and length-capped; only display fields and a resolved destination are returned.
 */
export function GET(request:Request){
  const q=normalizeQuery(new URL(request.url).searchParams.get('q'))
  if(q.length<2) return NextResponse.json({query:q,groups:[],total:0},{headers:{'Cache-Control':'no-store'}})
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy,live.graphConfig)
  const groups=groupSearchResults(bootstrap,searchExplorerCatalog(bootstrap,q,80))
  const total=groups.reduce((sum,group)=>sum+group.items.length,0)
  return NextResponse.json({
    query:q,total,
    groups:groups.map(group=>({kind:group.kind,label:group.label,items:group.items.map(({id,title,subtitle,target})=>({id,title,subtitle,href:target.href,external:target.external}))})),
  },{headers:{'Cache-Control':'no-store'}})
}
