'use client'

import {Menu,X} from 'lucide-react'
import GlobalSearch from './GlobalSearch'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'
import {usePathname,useSearchParams} from 'next/navigation'

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

export default function SiteHeader(){
  const pathname=usePathname()
  const params=useSearchParams()
  const [open,setOpen]=useState(false)
  const toggleRef=useRef<HTMLButtonElement>(null)
  const menuRef=useRef<HTMLDivElement>(null)
  const headerRef=useRef<HTMLElement>(null)
  const close=()=>setOpen(false)
  const active=activeLabel(pathname,params)

  // Mobile menu (0.29): focus moves into the menu on open, Tab/Shift+Tab stay inside menu + toggle,
  // Escape / outside tap / rotating to desktop width close it, and focus returns to the toggle on Escape.
  useEffect(()=>{
    if(!open) return
    const links=()=>Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a[href]')??[])
    requestAnimationFrame(()=>(links().find(link=>link.classList.contains('active'))??links()[0])?.focus())
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();setOpen(false);toggleRef.current?.focus();return}
      if(event.key!=='Tab') return
      const focusables=[toggleRef.current,...links()].filter((el):el is HTMLElement=>Boolean(el))
      const index=focusables.indexOf(document.activeElement as HTMLElement)
      if(index===-1) return
      const next=event.shiftKey?(index-1+focusables.length)%focusables.length:(index+1)%focusables.length
      event.preventDefault()
      focusables[next].focus()
    }
    const onPointer=(event:PointerEvent)=>{if(headerRef.current&&!headerRef.current.contains(event.target as Node)) setOpen(false)}
    const desktop=window.matchMedia('(min-width: 821px)')
    const onResize=()=>{if(desktop.matches) setOpen(false)}
    window.addEventListener('keydown',onKey)
    document.addEventListener('pointerdown',onPointer)
    desktop.addEventListener('change',onResize)
    return ()=>{window.removeEventListener('keydown',onKey);document.removeEventListener('pointerdown',onPointer);desktop.removeEventListener('change',onResize)}
  },[open])

  return <header ref={headerRef} className={`topbar ${open?'menu-open':''}`} aria-label="Human Origins primary navigation">
    <Link className="brand" href="/" aria-label="Human Origins home" onClick={close}>
      <span className="mark" aria-hidden="true">✦</span>
      <span><strong>HUMAN ORIGINS</strong><small>OUR STORY. A SHARED PAST.</small></span>
    </Link>
    <nav aria-label="Modes">
      {navItems.map(item=><Link className={active===item.label?'active':''} href={hrefFor(item,params)} key={item.label} aria-current={active===item.label?'page':undefined}>{item.label}</Link>)}
    </nav>
    <div className="top-actions">
      <GlobalSearch/>
      <span className="lang" aria-label="Current language">EN</span>
      <button ref={toggleRef} type="button" className="mobile-menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(value=>!value)}>
        {open?<X size={17} aria-hidden="true"/>:<Menu size={17} aria-hidden="true"/>}
      </button>
    </div>
    {open&&<div ref={menuRef} id="mobile-navigation" className="mobile-navigation">
      <nav aria-label="Mobile navigation">
        {navItems.map(item=><Link href={hrefFor(item,params)} key={item.label} onClick={close} className={active===item.label?'active':''} aria-current={active===item.label?'page':undefined}>{item.label}</Link>)}
      </nav>
    </div>}
  </header>
}
