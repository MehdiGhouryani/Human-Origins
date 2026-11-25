'use client'

import {useEffect,useState} from 'react'
import {ExternalLink} from 'lucide-react'
import {normalizeQuery} from '../features/search/targets'

type SearchItem={id:string;title:string;subtitle?:string;href:string;external:boolean}
type SearchGroup={kind:string;label:string;items:SearchItem[]}
type SearchResponse={query:string;total:number;groups:SearchGroup[]}
type ResultState={query:string;data?:SearchResponse;error?:string;loading:boolean}

/**
 * In-flow search results for the explorer URL. The server resolves matches and destinations, so the full catalogue
 * never needs to be serialized to the browser for search.
 */
export default function SearchResultsPanel({query,onClear,onSelectTaxon}:{query:string;onClear:()=>void;onSelectTaxon:(id:string)=>void}){
  const q=normalizeQuery(query)
  const [state,setState]=useState<ResultState>({query:'',loading:false})

  useEffect(()=>{
    if(q.length<2){setState({query:q,loading:false});return}
    const controller=new AbortController()
    setState({query:q,loading:true})
    fetch('/api/search?q='+encodeURIComponent(q),{signal:controller.signal,cache:'no-store',headers:{Accept:'application/json'}})
      .then(async response=>{
        if(!response.ok) throw new Error('Search is temporarily unavailable.')
        return await response.json() as SearchResponse
      })
      .then(data=>setState({query:q,data,loading:false}))
      .catch(error=>{
        if(controller.signal.aborted) return
        setState({query:q,error:error instanceof Error?error.message:'Search is temporarily unavailable.',loading:false})
      })
    return()=>controller.abort()
  },[q])

  if(q.length<2) return null
  const current=state.query===q?state:undefined
  const data=current?.data
  const total=data?.total??0
  return <section className="search-page" aria-labelledby="search-page-title" aria-busy={Boolean(current?.loading)}>
    <h2 id="search-page-title">{data?total?total+' '+(total===1?'result':'results')+' for “'+q+'”':'No results for “'+q+'”':'Search results for “'+q+'”'}</h2>
    {current?.loading&&!data&&<p className="empty-state" role="status">Searching the research catalogue…</p>}
    {current?.error&&<p className="empty-state" role="alert">{current.error}</p>}
    {data&&total===0&&<p className="empty-state">Nothing in the atlas matches that. Try a taxon name (for example “erectus”), a site, or a source title. Searching covers taxa, specimens, sites, evidence, claims, sources, publications and institutions.</p>}
    {data?.groups.map(group=><div key={group.kind} className="search-page-group"><h3>{group.label}</h3><ul>{group.items.map(item=><li key={group.kind+':'+item.id}>
      {group.kind==='taxon'?<button type="button" className="search-taxon" onClick={()=>onSelectTaxon(String(item.id))}><strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}</button>:<a href={item.href} {...(item.external?{target:'_blank',rel:'noopener noreferrer'}:{})}>
        <strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}
        {item.external&&<><ExternalLink size={12} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></>}
      </a>}</li>)}</ul></div>)}
    <p><button type="button" className="search-clear" onClick={onClear}>Clear search</button></p>
  </section>
}
