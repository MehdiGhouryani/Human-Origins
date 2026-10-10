import {ExternalLink} from 'lucide-react'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {searchExplorerCatalog} from '../features/explorer/selectors'
import {groupSearchResults,normalizeQuery} from '../features/search/targets'

/**
 * In-flow search results for `/?q=…`. Rendered in normal document flow (never fixed or offset against the viewport), so it
 * works without JavaScript, is shareable as a URL, and cannot collide with the header at any width.
 */
export default function SearchResultsPanel({bootstrap,query,onClear,onSelectTaxon}:{bootstrap:ExplorerBootstrap;query:string;onClear:()=>void;onSelectTaxon:(id:string)=>void}){
  const q=normalizeQuery(query)
  if(q.length<2) return null
  const groups=groupSearchResults(bootstrap,searchExplorerCatalog(bootstrap,q,80))
  const total=groups.reduce((sum,g)=>sum+g.items.length,0)
  return <section className="search-page" aria-labelledby="search-page-title">
    <h2 id="search-page-title">{total?`${total} ${total===1?'result':'results'} for “${q}”`:`No results for “${q}”`}</h2>
    {total===0&&<p className="empty-state">Nothing in the atlas matches that. Try a taxon name (for example “erectus”), a site, or a source title. Searching covers taxa, specimens, sites, evidence, claims, sources, publications and institutions.</p>}
    {groups.map(group=><div key={group.kind} className="search-page-group"><h3>{group.label}</h3><ul>{group.items.map(item=><li key={`${item.kind}:${item.id}`}>
      {item.kind==='taxon'?<button type="button" className="search-taxon" onClick={()=>onSelectTaxon(String(item.id))}><strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}</button>:<a href={item.target.href} {...(item.target.external?{target:'_blank',rel:'noopener noreferrer'}:{})}>
        <strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}
        {item.target.external&&<><ExternalLink size={12} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></>}
      </a>}</li>)}</ul></div>)}
    <p><button type="button" className="search-clear" onClick={onClear}>Clear search</button></p>
  </section>
}
