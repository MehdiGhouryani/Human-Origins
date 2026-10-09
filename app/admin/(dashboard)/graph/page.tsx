import 'server-only'
import {contentCatalog} from '../../../../content/catalog'
import {DEFAULT_GRAPH_CONFIG} from '../../../../features/explorer/bootstrap'
import {getGraphConfig} from '../../../../infrastructure/cms/store'
import GraphManager from './GraphManager'
import {requireAdminSession} from '../../../../infrastructure/cms/requireSession'

export const dynamic='force-dynamic'

export default async function AdminGraphPage(){
  await requireAdminSession()
  const stored=getGraphConfig()
  const taxa=contentCatalog.taxa.map(taxon=>({id:String(taxon.id),name:taxon.name,short:taxon.short,group:taxon.group,start:taxon.start,end:taxon.end,date:taxon.date,inferred:taxon.inferred}))
  const relationships=contentCatalog.relationships
  return <>
    <h1>Graph control room</h1>
    <p>Choose what the public evolutionary graph draws. <strong>Shown</strong> draws a node, <strong>Bridge</strong> keeps the node hidden but lets the curated path contract through it, and <strong>Off</strong> removes the node plus anything that depends on it through every descent path. Saving a draft never changes what visitors see; only <strong>Publish</strong> does.</p>
    <GraphManager initialConfig={stored?.config??DEFAULT_GRAPH_CONFIG} defaultConfig={DEFAULT_GRAPH_CONFIG} initialStatus={stored?stored.status:'built-in'} initialLive={stored?.live??false} taxa={taxa} relationships={relationships}/>
  </>
}
