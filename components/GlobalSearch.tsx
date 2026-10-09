'use client'
import {useEffect,useId,useMemo,useRef,useState,useSyncExternalStore} from 'react'
import {ExternalLink,Search,X} from 'lucide-react'
import {MAX_QUERY_LENGTH,SEARCH_KIND_SINGULAR,type SearchGroup} from '../features/search/targets'

type ApiItem={id:string;title:string;subtitle?:string;href:string;external:boolean}
type ApiGroup={kind:SearchGroup['kind'];label:string;items:ApiItem[]}
type Status='idle'|'loading'|'done'|'error'

/**
 * Header search: an ARIA combobox over a server-side typed search. The popup is positioned against its own wrapper (no
 * viewport offsets). Options are real links, so open-in-new-tab, copy-link and no-JS fallback all work natively.
 */
export default function GlobalSearch(){
  const uid=useId()
  const listId=`${uid}-list`
  // The URL's ?q= seeds the field without touching state in an effect; server render and hydration both see ''.
  const urlQuery=useSyncExternalStore(()=>()=>{},()=>(new URLSearchParams(window.location.search).get('q')??'').slice(0,MAX_QUERY_LENGTH),()=>'')
  const [typed,setTyped]=useState<string|null>(null)
  const value=typed??urlQuery
  const [result,setResult]=useState<{q:string;groups:ApiGroup[];error:boolean}>({q:'',groups:[],error:false})
  const [open,setOpen]=useState(false)
  const [active,setActive]=useState(-1)
  const wrapRef=useRef<HTMLDivElement>(null)
  const inputRef=useRef<HTMLInputElement>(null)
  const query=value.replace(/\s+/g,' ').trim()
  // Loading and empty states are derived, so the effect below only ever sets state from an async callback.
  const settled=result.q===query
  const status:Status=query.length<2?'idle':!settled?'loading':result.error?'error':'done'
  const groups=useMemo(()=>settled&&!result.error&&query.length>=2?result.groups:[],[settled,result,query])
  const flat=useMemo(()=>groups.flatMap(g=>g.items.map(item=>({...item,kind:g.kind}))),[groups])
  const groupStart=useMemo(()=>groups.map((_,gi)=>groups.slice(0,gi).reduce((n,g)=>n+g.items.length,0)),[groups])

  useEffect(()=>{
    if(query.length<2) return
    const controller=new AbortController()
    const timer=window.setTimeout(async()=>{
      try{
        const response=await fetch(`/api/search?q=${encodeURIComponent(query)}`,{signal:controller.signal})
        if(!response.ok) throw new Error(String(response.status))
        const data=await response.json() as {groups:ApiGroup[]}
        setResult({q:query,groups:data.groups,error:false});setActive(-1)
      }catch(error){if((error as Error).name!=='AbortError') setResult({q:query,groups:[],error:true})}
    },200)
    return ()=>{window.clearTimeout(timer);controller.abort()}
  },[query])

  useEffect(()=>{
    if(!open) return
    const onPointer=(event:PointerEvent)=>{if(!wrapRef.current?.contains(event.target as Node)) setOpen(false)}
    document.addEventListener('pointerdown',onPointer)
    return ()=>document.removeEventListener('pointerdown',onPointer)
  },[open])

  const optionId=(index:number)=>`${uid}-opt-${index}`
  const activeEl=()=>active>=0?document.getElementById(optionId(active)) as HTMLAnchorElement|null:null
  useEffect(()=>{activeEl()?.scrollIntoView({block:'nearest'})})   // keep the active option visible inside the popup

  const onKeyDown=(event:React.KeyboardEvent<HTMLInputElement>)=>{
    if(event.key==='ArrowDown'){event.preventDefault();setOpen(true);setActive(i=>Math.min(flat.length-1,i+1))}
    else if(event.key==='ArrowUp'){event.preventDefault();setActive(i=>Math.max(-1,i-1))}
    else if(event.key==='Escape'){if(open){event.preventDefault();setOpen(false);setActive(-1)}else if(value){setTyped('')}}
    else if(event.key==='Enter'){const el=activeEl();if(el){event.preventDefault();el.click()}}
  }

  const showPanel=open&&query.length>=2
  const live=status==='loading'?'Searching…':status==='error'?'Search is unavailable right now.':status==='done'?(flat.length?`${flat.length} results. Use the up and down arrow keys to review them.`:`No results for ${query}.`):''

  return <div className="global-search" ref={wrapRef} role="search">
    <form className="search" action="/" method="get" onSubmit={event=>{if(activeEl()) event.preventDefault()}}>
      <Search size={15} aria-hidden="true"/>
      <label className="sr-only" htmlFor={`${uid}-input`}>Search taxa, specimens, sites, evidence or sources</label>
      <input ref={inputRef} id={`${uid}-input`} name="q" type="search" role="combobox" aria-expanded={showPanel&&flat.length>0} aria-controls={showPanel&&flat.length>0?listId:undefined} aria-autocomplete="list" aria-activedescendant={active>=0?optionId(active):undefined}
        placeholder="Search taxa, fossils, sites, sources..." autoComplete="off" maxLength={MAX_QUERY_LENGTH} value={value}
        onChange={event=>{setTyped(event.target.value);setOpen(true)}} onFocus={()=>setOpen(true)} onKeyDown={onKeyDown}/>
      <input type="hidden" name="mode" value="tree"/>
      {value&&<button type="button" className="search-clear-btn" aria-label="Clear search" onClick={()=>{setTyped('');setOpen(false);inputRef.current?.focus()}}><X size={14} aria-hidden="true"/></button>}
    </form>
    <p className="sr-only" role="status">{live}</p>
    {showPanel&&<div className="global-search-panel">
      {status==='loading'&&!flat.length&&<p className="gs-note">Searching…</p>}
      {status==='error'&&<p className="gs-note" role="alert">Search is unavailable right now. Press Enter to search on a full page instead.</p>}
      {status==='done'&&!flat.length&&<p className="gs-note">No results for “{query}”. Try a taxon name, a site, or a source title.</p>}
      {flat.length>0&&<div id={listId} role="listbox" aria-label="Search results">
        {groups.map((group,gi)=><div role="group" aria-label={group.label} key={group.kind} className="gs-group">
          <div className="gs-group-title" aria-hidden="true">{group.label}</div>
          {group.items.map((item,ii)=>{const i=groupStart[gi]+ii;return <a key={`${group.kind}:${item.id}`} id={optionId(i)} role="option" aria-selected={i===active} className={`gs-option ${i===active?'active':''}`} href={item.href}
            {...(item.external?{target:'_blank',rel:'noopener noreferrer'}:{})} onMouseMove={()=>setActive(i)}>
            <span className="gs-option-main"><strong>{item.title}</strong>{item.subtitle&&<small>{item.subtitle}</small>}</span>
            <span className="gs-kind">{SEARCH_KIND_SINGULAR[group.kind]}{item.external&&<><ExternalLink size={11} aria-hidden="true"/><span className="sr-only"> (opens in a new tab)</span></>}</span>
          </a>})}
        </div>)}
      </div>}
      {flat.length>0&&<a className="gs-all" href={`/?${new URLSearchParams({q:query,mode:'tree'}).toString()}`}>See all results on a page</a>}
    </div>}
  </div>
}
