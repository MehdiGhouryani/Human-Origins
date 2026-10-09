'use client'
import {useEffect,useRef,type ReactNode} from 'react'

/**
 * `<details>` that is open on wide screens and collapsed on narrow ones (below 640 px), except when `keepOpenOnMobile`.
 * Server markup is open, so the content is visible without JavaScript; the collapse happens after hydration and the
 * visitor's own toggling is never overridden afterwards.
 */
export default function ResponsiveDetails({id,summary,children,keepOpenOnMobile=false,className}:{id?:string;summary:ReactNode;children:ReactNode;keepOpenOnMobile?:boolean;className?:string}){
  const ref=useRef<HTMLDetailsElement>(null)
  useEffect(()=>{
    const element=ref.current
    if(!element||keepOpenOnMobile) return
    // An anchor link (#section) must reveal its target even on a phone.
    const hashTargetsThis=typeof window!=='undefined'&&!!id&&window.location.hash===`#${id}`
    if(window.matchMedia('(max-width: 639px)').matches&&!hashTargetsThis) element.open=false
  },[id,keepOpenOnMobile])
  useEffect(()=>{
    const element=ref.current
    if(!element||!id) return
    const reveal=()=>{ if(window.location.hash===`#${id}`) element.open=true }
    window.addEventListener('hashchange',reveal)
    return()=>window.removeEventListener('hashchange',reveal)
  },[id])
  return <details ref={ref} id={id} className={className} open>
    <summary>{summary}</summary>
    {children}
  </details>
}
