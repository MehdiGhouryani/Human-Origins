import 'server-only'
import {cache} from 'react'
import {contentCatalog} from '../../content/catalog'
import type {ContentCatalog} from '../../domain/contracts'
import {listMedia,listCopy,mergeCmsIntoCatalog} from './store'
import {validateCatalog} from '../validation/audit'

export type LiveContent={
  catalog:ContentCatalog
  copy:Readonly<Record<string,string>>
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
export const getLiveContent=cache(function getLiveContent():LiveContent{
  const builtIn:LiveContent={catalog:contentCatalog,copy:{},source:'built-in',rejectedMedia:[]}
  try{
    const media=listMedia().filter(row=>row.status==='published')
    const copy=listCopy().filter(row=>row.status==='published')
    if(media.length===0 && copy.length===0) return builtIn
    // Admit CMS rows one by one. A corrupt row cannot take unrelated published content
    // down with it, and any rejected record is made visible to the admin dashboard.
    const accepted:typeof media[number][]=[]
    const rejected:{id:string;issues:readonly string[]}[]=[]
    for(const row of media){
      const candidate=mergeCmsIntoCatalog(contentCatalog,[...accepted,row],copy)
      const report=validateCatalog(candidate.catalog)
      if(report.ok) accepted.push(row)
      else{
        const issues=report.issues.filter(item=>item.severity==='error').map(item=>`${item.code}: ${item.message}`)
        rejected.push({id:row.id,issues})
        console.error(`[cms] Published media ${row.id} failed the catalog audit; this row is omitted from live content.`)
      }
    }
    if(rejected.length>0) return {...builtIn,rejectedMedia:rejected}
    const merged=mergeCmsIntoCatalog(contentCatalog,accepted,copy)
    return {catalog:merged.catalog,copy:merged.copy,source:accepted.length||copy.length?'cms':'built-in',rejectedMedia:rejected}
  }catch(error){
    console.error('[cms] CMS store unavailable; serving built-in content.',error)
    return builtIn
  }
})
