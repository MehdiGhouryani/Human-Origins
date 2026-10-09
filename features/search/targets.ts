import type {SearchResult,SearchResultKind} from '../../domain/contracts'
import type {ExplorerBootstrap} from '../explorer/bootstrap'

/** Where a search result leads. `external` results leave the atlas and are announced as such in the UI. */
export type SearchTarget={href:string;external:boolean}
export type ResolvedSearchResult=SearchResult&{target:SearchTarget}
export type SearchGroup={kind:SearchResultKind;label:string;items:ResolvedSearchResult[]}

export const SEARCH_KIND_ORDER:readonly SearchResultKind[]=['taxon','specimen','site','evidence','claim','source','publication','institution']
export const SEARCH_KIND_LABEL:Readonly<Record<SearchResultKind,string>>={taxon:'Taxa',specimen:'Specimens',site:'Sites',evidence:'Evidence',claim:'Claims',source:'Sources',publication:'Publications',institution:'Institutions'}
export const SEARCH_KIND_SINGULAR:Readonly<Record<SearchResultKind,string>>={taxon:'Taxon',specimen:'Specimen',site:'Site',evidence:'Evidence',claim:'Claim',source:'Source',publication:'Publication',institution:'Institution'}
export const MAX_QUERY_LENGTH=160

/** Only http(s) URLs may be followed. Anything else (javascript:, data:, malformed) is rejected, never rendered. */
export function safeExternalUrl(raw:string|undefined|null):string|null{
  if(!raw) return null
  try{const url=new URL(raw);return url.protocol==='https:'||url.protocol==='http:'?url.href:null}catch{return null}
}
const internal=(params:Record<string,string>):SearchTarget=>({href:`/?${new URLSearchParams(params).toString()}`,external:false})

/** Resolves a result to a destination, or null when it has none (such results are dropped, never shown as dead ends). */
export function resolveSearchTarget(bootstrap:ExplorerBootstrap,result:SearchResult):SearchTarget|null{
  switch(result.kind){
    case 'taxon': return bootstrap.species.some(t=>t.id===result.id)?internal({species:result.id,mode:'tree'}):null
    case 'specimen': {const s=bootstrap.specimens.find(x=>String(x.id)===result.id);return s?internal({species:String(s.taxonId),mode:'evidence'}):null}
    case 'evidence': {const e=bootstrap.evidence.find(x=>String(x.id)===result.id);return e?internal({species:String(e.taxonId),mode:'evidence'}):null}
    case 'claim': {const c=bootstrap.claims.find(x=>String(x.id)===result.id);return c?internal({species:String(c.taxonId),mode:'evidence'}):null}
    case 'site': return bootstrap.sites.some(x=>String(x.id)===result.id)?internal({mode:'migration',site:result.id}):null
    case 'source': {const url=safeExternalUrl(bootstrap.sources.find(x=>String(x.id)===result.id)?.url);return url?{href:url,external:true}:null}
    case 'publication': {const url=safeExternalUrl(bootstrap.publications.find(x=>String(x.id)===result.id)?.url);return url?{href:url,external:true}:null}
    case 'institution': {const url=safeExternalUrl(bootstrap.institutions.find(x=>String(x.id)===result.id)?.website);return url?{href:url,external:true}:null}
  }
}

/** Groups results by type in a fixed, meaningful order, capping each group so one type cannot crowd out the rest. */
export function groupSearchResults(bootstrap:ExplorerBootstrap,results:readonly SearchResult[],perKind=5):SearchGroup[]{
  const groups:SearchGroup[]=[]
  const seenExternal=new Set<string>()   // a source and its publication share one URL: list it once, under the first type
  for(const kind of SEARCH_KIND_ORDER){
    const items:ResolvedSearchResult[]=[]
    for(const result of results){
      if(result.kind!==kind) continue
      const target=resolveSearchTarget(bootstrap,result)
      if(!target||(target.external&&seenExternal.has(target.href))) continue
      if(target.external) seenExternal.add(target.href)
      items.push({...result,target})
      if(items.length>=perKind) break
    }
    if(items.length) groups.push({kind,label:SEARCH_KIND_LABEL[kind],items})
  }
  return groups
}

/** Normalises user input before searching: trims, collapses whitespace, and caps length. */
export const normalizeQuery=(raw:string|null|undefined):string=>(raw??'').replace(/\s+/g,' ').trim().slice(0,MAX_QUERY_LENGTH)
