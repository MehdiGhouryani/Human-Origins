import {NextResponse} from 'next/server'
import {buildExplorerBootstrap} from '../../../../features/explorer/bootstrap'
import {buildExplorerEvidenceSources} from '../../../../features/explorer/details'
import {getLiveContent} from '../../../../infrastructure/cms/live'

export const dynamic='force-dynamic'

/** Claim-linked source labels and URLs only; the Evidence overview does not need the full taxon dossier bundle. */
export function GET(request:Request){
  const taxonId=(new URL(request.url).searchParams.get('taxon')??'').trim()
  if(!taxonId||taxonId.length>128){
    return NextResponse.json({error:'A valid taxon id is required.'},{status:400,headers:{'Cache-Control':'no-store'}})
  }
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy,live.graphConfig)
  const details=buildExplorerEvidenceSources(bootstrap,taxonId)
  if(!details){
    return NextResponse.json({error:'Taxon not found.'},{status:404,headers:{'Cache-Control':'no-store'}})
  }
  return NextResponse.json(details,{headers:{'Cache-Control':'no-store'}})
}
