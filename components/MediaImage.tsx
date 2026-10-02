'use client'

import Image from 'next/image'
import {useEffect,useState} from 'react'

type Props={src:string;alt:string;className?:string;sizes?:string;priority?:boolean;loading?:'lazy'|'eager'}

export default function MediaImage({src,alt,className,sizes='100vw',priority=false,loading}:Props){
  const [failed,setFailed]=useState(false)
  // A new src (e.g. an avatar replaced in the CMS) deserves a fresh attempt.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset local error state when the image source changes
  useEffect(()=>{setFailed(false)},[src])
  // Visitors never see an error string: a neutral, labelled placeholder keeps the layout and the accessible name.
  if(failed) return <div className={`media-image-fallback ${className??''}`} role={alt?'img':undefined} aria-label={alt||undefined} aria-hidden={alt?undefined:true}><span aria-hidden="true">✦</span></div>
  return <Image
    src={src}
    alt={alt}
    fill
    sizes={sizes}
    priority={priority}
    loading={priority?undefined:loading}
    unoptimized={src.startsWith('/cms-media/')}
    className={className}
    onError={()=>setFailed(true)}
  />
}
