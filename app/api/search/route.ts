import {NextResponse} from 'next/server'
import {buildExplorerBootstrap} from '../../../features/explorer/bootstrap'
import {getLiveContent} from '../../../infrastructure/cms/live'
import {normalizeQuery} from '../../../features/search/targets'
import {buildSearchResponse} from '../../../features/search/response'

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
  return NextResponse.json(buildSearchResponse(bootstrap,q),{headers:{'Cache-Control':'no-store'}})
}
