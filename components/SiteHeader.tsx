'use client'

import {Menu,X} from 'lucide-react'
import {useEffect,useRef,useState} from 'react'
import Link from 'next/link'

const navItems=[
  ['Explore','/'],
  ['Evolution Tree','/?mode=tree'],
  ['Timeline','/?mode=timeline'],
  ['Migration','/?mode=migration'],
  ['Evidence','/?mode=evidence'],
  ['Journey','/?journey=1'],
  ['About','/#about'],
] as const

export default function SiteHeader(){
  const [open,setOpen]=useState(false)
  const [activeLabel,setActiveLabel]=useState('Explore')
  const toggleRef=useRef<HTMLButtonElement>(null)
  const menuRef=useRef<HTMLDivElement>(null)
  const headerRef=useRef<HTMLElement>(null)
  const close=()=>setOpen(false)
  useEffect(()=>{
    const sync=()=>{
      const params=new URLSearchParams(window.location.search)
      if(window.location.hash==='#about') setActiveLabel('About')
      else if(params.get('journey')==='1') setActiveLabel('Journey')
      else {
        const mode=params.get('mode')
        setActiveLabel(mode==='tree'?'Evolution Tree':mode==='timeline'?'Timeline':mode==='migration'?'Migration':mode==='evidence'?'Evidence':'Explore')
      }
    }
    sync()
    window.addEventListener('popstate',sync)
    window.addEventListener('hashchange',sync)
    window.addEventListener('human-origins:navigation',sync)
    return ()=>{window.removeEventListener('popstate',sync);window.removeEventListener('hashchange',sync);window.removeEventListener('human-origins:navigation',sync)}
  },[])
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
      {navItems.map(([label,href])=><a className={activeLabel===label?'active':''} href={href} key={label} aria-current={activeLabel===label?'page':undefined}>{label}</a>)}
    </nav>
    <div className="top-actions">
      <form className="search" action="/" method="get" role="search">
        <span aria-hidden="true">⌕</span>
        <label className="sr-only" htmlFor="site-search">Search taxa, fossils, sites, evidence or sources</label>
        <input id="site-search" name="q" placeholder="Search taxa, fossils, sites, sources..." autoComplete="off"/>
        <input type="hidden" name="mode" value="tree"/>
      </form>
      <span className="lang" aria-label="Current language">EN</span>
      <button ref={toggleRef} type="button" className="mobile-menu-toggle" aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(value=>!value)}>
        {open?<X size={17} aria-hidden="true"/>:<Menu size={17} aria-hidden="true"/>}
      </button>
    </div>
    {open&&<div ref={menuRef} id="mobile-navigation" className="mobile-navigation">
      <nav aria-label="Mobile navigation">
        {navItems.map(([label,href])=><a href={href} key={label} onClick={close} className={activeLabel===label?'active':''} aria-current={activeLabel===label?'page':undefined}>{label}</a>)}
      </nav>
    </div>}
  </header>
}
