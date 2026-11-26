import type {ExplorerBootstrap} from '../explorer/bootstrap'
import {searchExplorerCatalog} from '../explorer/selectors'
import {groupSearchResults,normalizeQuery} from './targets'

/** Compact, serializable search view model used by both SSR and the search API. */
export type SearchResponse={
  query:string
  total:number
  groups:{
    kind:string
    label:string
    items:{id:string;title:string;subtitle?:string;href:string;external:boolean}[]
  }[]
}

export function buildSearchResponse(bootstrap:ExplorerBootstrap,rawQuery:string|null|undefined):SearchResponse{
  const query=normalizeQuery(rawQuery)
  if(query.length<2) return {query,total:0,groups:[]}
  const groups=groupSearchResults(bootstrap,searchExplorerCatalog(bootstrap,query,80))
  const items=groups.map(group=>({
    kind:group.kind,
    label:group.label,
    items:group.items.map(({id,title,subtitle,target})=>({
      id:String(id),
      title,
      ...(subtitle?{subtitle}:{}),
      href:target.href,
      external:target.external,
    })),
  }))
  return {query,total:items.reduce((sum,group)=>sum+group.items.length,0),groups:items}
}
