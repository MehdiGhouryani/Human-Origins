import 'server-only'
import {contentCatalog} from '../../content/catalog'
import type {ContentCatalog} from '../../domain/contracts'
import {listMedia,listPublishedCopy,mergeCmsIntoCatalog,getGraphConfig} from './store'
import {parseGraphConfig,type GraphConfig} from '../../domain/graph-visibility'
import {validateCatalog} from '../validation/audit'

export type LiveContent={
  catalog:ContentCatalog
  copy:Readonly<Record<string,string>>
  graphConfig?:GraphConfig
  source:'cms'|'built-in'
  rejectedMedia:readonly {id:string;issues:readonly string[]}[]
}

/**
 * The content the public site renders. Published CMS media/copy are merged over the
 * built-in catalog. Two independent safety nets keep the public page from ever breaking
 * because of the CMS:
 *  1. If the CMS store cannot be opened (e.g. a read-only filesystem) we serve the built-in catalog.
 *  2. If the merged catalog fails the project's own audit (should be impossible, since every
 *     publish is gated, but e.g. a hand-edited database could do it) we also serve the built-in catalog.
 */
// Do not memoize this across requests: admin publish/unpublish writes the same process-local SQLite store.
// A global cache would serve stale CMS content until the process restarted. The catalog audit is intentionally
// kept here as the correctness boundary; Next can cache individual public routes later with explicit revalidation.
export function getLiveContent():LiveContent{
  const builtIn:LiveContent={catalog:contentCatalog,copy:{},source:'built-in',rejectedMedia:[]}
  try{
    const media=listMedia().filter(row=>row.status==='published')
    const copy=listPublishedCopy()
    const graph=getGraphConfig()
    const graphIds=new Set(contentCatalog.taxa.map(taxon=>String(taxon.id)))
    const graphConfig=graph?.publishedConfig?parseGraphConfig(graph.publishedConfig,graphIds):undefined
    if(media.length===0 && copy.length===0 && !graphConfig) return builtIn
    // A corrupt row cannot take unrelated published content down with it; rejected records are shown on the dashboard.
    // Fast path (0.32): one audit for the whole published set. Only when it fails do we fall back to admitting rows
    // one by one, so a normal request costs one audit instead of one per published image.
    const accepted:typeof media[number][]=[]
    const rejected:{id:string;issues:readonly string[]}[]=[]
    const fastPathOk=validateCatalog(mergeCmsIntoCatalog(contentCatalog,media,copy).catalog).ok
    if(fastPathOk) accepted.push(...media)
    else for(const row of media){
      const candidate=mergeCmsIntoCatalog(contentCatalog,[...accepted,row],copy)
      const report=validateCatalog(candidate.catalog)
      if(report.ok) accepted.push(row)
      else{
        const issues=report.issues.filter(item=>item.severity==='error').map(item=>`${item.code}: ${item.message}`)
        rejected.push({id:row.id,issues})
        console.error(`[cms] Published media ${row.id} failed the catalog audit; this row is omitted from live content.`)
      }
    }
    // Bug fix (0.31): a single rejected row used to drop ALL published CMS media and copy. Only the rejected rows
    // are omitted now; everything that passed the audit stays live, and the rejects are listed on the dashboard.
    const merged=mergeCmsIntoCatalog(contentCatalog,accepted,copy)
    if(!fastPathOk&&!validateCatalog(merged.catalog).ok) return {...builtIn,rejectedMedia:rejected}
    return {catalog:merged.catalog,copy:merged.copy,graphConfig,source:accepted.length||copy.length||graphConfig?'cms':'built-in',rejectedMedia:rejected}
  }catch(error){
    console.error('[cms] CMS store unavailable; serving built-in content.',error)
    return builtIn
  }
}
