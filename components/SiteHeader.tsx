'use client'

import {Menu,X} from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {usePathname,useRouter,useSearchParams} from 'next/navigation'

type Item={label:string;path:string;query:Record<string,string>;carry:boolean}
// Views of the explorer that live on the home page are reached from the tab bar (Tree, Timeline, Migration).
const navItems:Item[]=[
  {label:'Species',path:'/species',query:{},carry:false},
  {label:'Journey',path:'/',query:{journey:'1'},carry:true},
  {label:'Evidence',path:'/',query:{mode:'evidence'},carry:true},
  {label:'About',path:'/about',query:{},carry:false},
]

/** Explorer links keep the species and time the reader is looking at. */
function hrefFor(item:Item,params:URLSearchParams):string{
  const next=new URLSearchParams()
  if(item.carry) for(const key of ['species','time']){const value=params.get(key); if(value) next.set(key,value)}
  for(const [key,value] of Object.entries(item.query)) next.set(key,value)
  const query=next.toString()
  return `${item.path}${query?`?${query}`:''}`
}

/** The active item follows the route and the URL on every render, so it cannot drift from what is shown. */
function activeLabel(pathname:string,params:URLSearchParams):string|null{
  if(pathname==='/species'||pathname.startsWith('/species/')) return 'Species'
  if(pathname==='/about') return 'About'
  if(pathname!=='/') return null
  if(params.get('journey')==='1') return 'Journey'
  if(params.get('mode')==='evidence') return 'Evidence'
  return null
}

/** The one header the visitor gets: the same markup is served and hydrated. There is no streamed Suspense
    fallback copy next to it (every page that shows the header is dynamic), so the document never holds a
    second header with duplicate ids. The mobile menu is a native <details> disclosure — the browser owns
    [open], so the menu opens from the keyboard and its links navigate before React attaches. */
function SiteHeaderMarkup({params,active,open,headerRef,toggleRef,detailsRef,menuRef,onClose,onNavLink,onToggleKeyDown}:{
  params:URLSearchParams
  active:string|null
  open:boolean
  headerRef?:React.Ref<HTMLElement>
  toggleRef?:React.Ref<HTMLElement>
  detailsRef?:React.Ref<HTMLDetailsElement>
  menuRef?:React.Ref<HTMLDivElement>
  onClose?:()=>void
  onNavLink?:(item:Item)=>(event:React.MouseEvent<HTMLAnchorElement>)=>void
  onToggleKeyDown?:(event:React.KeyboardEvent<HTMLElement>)=>void
}){
  const href=(item:Item)=>hrefFor(item,params)
  return <header ref={headerRef} className={`topbar ${open?'menu-open':''}`} aria-label="Human Origins primary navigation">
    <Link className="brand" href="/" aria-label="Human Origins Our story. A shared past. Home" onClick={onClose}>
      <span className="mark" aria-hidden="true">✦</span>
      <span><strong>HUMAN ORIGINS</strong>{' '}<small>OUR STORY. A SHARED PAST.</small></span>
    </Link>
    <nav aria-label="Modes">
      {navItems.map(item=><Link className={active===item.label?'active':undefined} href={href(item)} onClick={onNavLink?.(item)} key={item.label} aria-current={active===item.label?'page':undefined}>{item.label}</Link>)}
    </nav>
    <div className="top-actions">
      <GlobalSearch/>
      <details ref={detailsRef} className="mobile-menu">
        <summary ref={toggleRef} role="button" className="mobile-menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onKeyDown={onToggleKeyDown}>
          {open?<X size={17} aria-hidden="true"/>:<Menu size={17} aria-hidden="true"/>}
        </summary>
        <div ref={menuRef} id="mobile-navigation" className="mobile-navigation">
          <nav aria-label="Mobile navigation">
            {navItems.map(item=><Link href={href(item)} key={item.label} onClick={event=>{onNavLink?.(item)(event);onClose?.()}} className={active===item.label?'active':undefined} aria-current={active===item.label?'page':undefined}>{item.label}</Link>)}
          </nav>
        </div>
      </details>
    </div>
  </header>
}

/** The served markup without the explorer state — what a reader gets before React attaches. The pre-hydration
    contract (native disclosure, real destinations, no inert control) is pinned by tests/site-header-served.test.tsx. */
export function SiteHeaderServed(){
  return <SiteHeaderMarkup params={new URLSearchParams()} active={null} open={false}/>
}

export default function SiteHeader(){
  const pathname=usePathname()
  const params=useSearchParams()
  const router=useRouter()
  // useSearchParams can lag a URL write made by the explorer. A click builds the target from the address bar at that moment,
  // so a link pressed right after a selection keeps the species and the mode (phase 7 navigation fix).
  const follow=(item:Item)=>(event:React.MouseEvent<HTMLAnchorElement>)=>{
    const target=hrefFor(item,new URLSearchParams(window.location.search))
    if(target!==event.currentTarget.getAttribute('href')){event.preventDefault();router.push(target)}
  }
  const [open,setOpen]=useState(false)
  const toggleRef=useRef<HTMLElement>(null)
  const menuRef=useRef<HTMLDivElement>(null)
  const menuDetailsRef=useRef<HTMLDetailsElement>(null)
  const headerRef=useRef<HTMLElement>(null)
  const active=activeLabel(pathname,params)

  // Mobile menu (0.29): the native [open] attribute is the source of truth and React only mirrors it, so a
  // menu opened before hydration keeps its state (its toggle event fired before React could listen).
  // The listeners live for the lifetime of the header — no attach window after an open — and cover:
  // focus moves into the menu on open, Tab/Shift+Tab stay inside menu + toggle, Escape / outside tap /
  // rotating to desktop width close it, and focus returns to the toggle on Escape.
  useEffect(()=>{
    const details=()=>menuDetailsRef.current
    const isOpen=()=>Boolean(details()?.open)
    const close=()=>{const det=details(); if(det?.open) det.open=false; setOpen(false)}
    const links=()=>Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href]')??[])
    // Pick up a menu the visitor opened before React attached (the toggle event fired before this listener existed).
    setOpen(isOpen())
    const onToggleEvent=()=>{
      const now=isOpen()
      setOpen(now)
      if(now) requestAnimationFrame(()=>(links().find(link=>link.classList.contains('active'))??links()[0])?.focus())
    }
    const onKey=(event:KeyboardEvent)=>{
      if(!isOpen()) return
      if(event.key==='Escape'){event.preventDefault();close();toggleRef.current?.focus();return}
      if(event.key!=='Tab') return
      const focusables=[toggleRef.current,...links()].filter((el):el is HTMLElement=>Boolean(el))
      const index=focusables.indexOf(document.activeElement as HTMLElement)
      if(index===-1) return
      const next=event.shiftKey?(index-1+focusables.length)%focusables.length:(index+1)%focusables.length
      event.preventDefault()
      focusables[next].focus()
    }
    const onPointer=(event:PointerEvent)=>{if(headerRef.current&&!headerRef.current.contains(event.target as Node)) close()}
    const desktop=window.matchMedia('(min-width: 821px)')
    const onResize=()=>{if(desktop.matches) close()}
    const det=details()
    det?.addEventListener('toggle',onToggleEvent)
    window.addEventListener('keydown',onKey)
    document.addEventListener('pointerdown',onPointer)
    desktop.addEventListener('change',onResize)
    return ()=>{det?.removeEventListener('toggle',onToggleEvent);window.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer);desktop.removeEventListener('change',onResize)}
  },[])

  return <SiteHeaderMarkup params={params} active={active} open={open}
    headerRef={headerRef} toggleRef={toggleRef} detailsRef={menuDetailsRef} menuRef={menuRef}
    onClose={()=>{const det=menuDetailsRef.current; if(det?.open) det.open=false; setOpen(false)}}
    onNavLink={follow}
    onToggleKeyDown={event=>{if(event.key===' '){event.preventDefault();const det=menuDetailsRef.current;if(det)det.open=!det.open}}}/>
}
