'use client'

import {Menu,X} from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import {Suspense,useEffect,useRef,useState} from 'react'
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

/** Fallback links carry the destination query; the explorer state is added on top by the hydrated header. */
function fallbackHref(item:Item):string{
  const query=new URLSearchParams(item.query).toString()
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

/** The served header without the explorer state: a native <details> disclosure, so the menu opens from the
    keyboard and its links navigate before React attaches. Shared structure with SiteHeaderContent, so no
    served variant of the header has an inert control. */
export function SiteHeaderFallback(){
  return <header className="topbar" aria-label="Human Origins primary navigation">
    <Link className="brand" href="/" aria-label="Human Origins Our story. A shared past. Home">
      <span className="mark" aria-hidden="true">✦</span>
      <span><strong>HUMAN ORIGINS</strong>{' '}<small>OUR STORY. A SHARED PAST.</small></span>
    </Link>
    <nav aria-label="Modes">
      {navItems.map(item=><Link href={fallbackHref(item)} key={item.label}>{item.label}</Link>)}
    </nav>
    <div className="top-actions">
      <GlobalSearch/>
      <details className="mobile-menu">
        <summary role="button" className="mobile-menu-toggle" aria-label="Open navigation" aria-expanded="false" aria-controls="mobile-navigation">
          <Menu size={17} aria-hidden="true"/>
        </summary>
        <div id="mobile-navigation" className="mobile-navigation">
          <nav aria-label="Mobile navigation">
            {navItems.map(item=><Link href={fallbackHref(item)} key={item.label}>{item.label}</Link>)}
          </nav>
        </div>
      </details>
    </div>
  </header>
}

function SiteHeaderContent(){
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
  // The disclosure is native: the browser owns [open]. close() resets the attribute (which fires the
  // toggle event and syncs the state) so the menu also closes before hydration completes.
  const close=()=>{
    if(menuDetailsRef.current?.open) menuDetailsRef.current.open=false
    setOpen(false)
  }
  const active=activeLabel(pathname,params)

  // Mobile menu (0.29): focus moves into the menu on open, Tab/Shift+Tab stay inside menu + toggle,
  // Escape / outside tap / rotating to desktop width close it, and focus returns to the toggle on Escape.
  useEffect(()=>{
    if(!open) return
    const links=()=>Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href]')??[])
    requestAnimationFrame(()=>(links().find(link=>link.classList.contains('active'))??links()[0])?.focus())
    const onKey=(event:KeyboardEvent)=>{
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
    window.addEventListener('keydown',onKey)
    document.addEventListener('pointerdown',onPointer)
    desktop.addEventListener('change',onResize)
    return ()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer);desktop.removeEventListener('change',onResize)}
  },[open])

  return <header ref={headerRef} className={`topbar ${open?'menu-open':''}`} aria-label="Human Origins primary navigation">
    <Link className="brand" href="/" aria-label="Human Origins Our story. A shared past. Home" onClick={close}>
      <span className="mark" aria-hidden="true">✦</span>
      <span><strong>HUMAN ORIGINS</strong>{' '}<small>OUR STORY. A SHARED PAST.</small></span>
    </Link>
    <nav aria-label="Modes">
      {navItems.map(item=><Link className={active===item.label?'active':''} href={hrefFor(item,params)} onClick={follow(item)} key={item.label} aria-current={active===item.label?'page':undefined}>{item.label}</Link>)}
    </nav>
    <div className="top-actions">
      <GlobalSearch/>
      <details ref={menuDetailsRef} className="mobile-menu" onToggle={()=>setOpen(Boolean(menuDetailsRef.current?.open))}>
        <summary ref={toggleRef} role="button" className="mobile-menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onKeyDown={event=>{if(event.key===' '){event.preventDefault();const det=menuDetailsRef.current;if(det)det.open=!det.open}}}>
          {open?<X size={17} aria-hidden="true"/>:<Menu size={17} aria-hidden="true"/>}
        </summary>
        <div ref={menuRef} id="mobile-navigation" className="mobile-navigation">
          <nav aria-label="Mobile navigation">
            {navItems.map(item=><Link href={hrefFor(item,params)} key={item.label} onClick={event=>{follow(item)(event);close()}} className={active===item.label?'active':''} aria-current={active===item.label?'page':undefined}>{item.label}</Link>)}
          </nav>
        </div>
      </details>
    </div>
  </header>
}

export default function SiteHeader(){
  return <Suspense fallback={<SiteHeaderFallback/>}>
    <SiteHeaderContent/>
  </Suspense>
}
