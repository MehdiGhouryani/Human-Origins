import {NextResponse} from 'next/server'
import {buildExplorerBootstrap} from '../../../../features/explorer/bootstrap'
import {buildExplorerMigrationDetails} from '../../../../features/explorer/details'
import {getLiveContent} from '../../../../infrastructure/cms/live'

export const dynamic='force-dynamic'

/** Site dating and source records are returned only when the Migration view is opened. */
export function GET(){
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy,live.graphConfig)
  return NextResponse.json(buildExplorerMigrationDetails(bootstrap),{headers:{'Cache-Control':'no-store'}})
}
