'use client'
import {useState} from 'react'

/** Small “copy citation” button; falls back silently when the clipboard is not available. */
export default function CopyCitation({text}:{text:string}){
  const [state,setState]=useState<'idle'|'done'|'failed'>('idle')
  return <button type="button" className="sp-copy" onClick={async()=>{
    try{await navigator.clipboard.writeText(text);setState('done')}catch{setState('failed')}
    window.setTimeout(()=>setState('idle'),1800)
  }} aria-label="Copy citation">{state==='done'?'Copied':state==='failed'?'Copy failed':'Copy'}</button>
}
