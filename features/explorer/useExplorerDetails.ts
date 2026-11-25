'use client'

import {useEffect,useState} from 'react'
import type {ExplorerDetailBundle,ExplorerMigrationDetails,ExplorerTaxonDetails} from './details'

type DetailState<T>={key:string;data?:T;error?:string;loading:boolean}
const resolved=new Map<string,ExplorerDetailBundle>()
const inFlight=new Map<string,Promise<ExplorerDetailBundle>>()

async function requestDetails<T extends ExplorerDetailBundle>(key:string,url:string,kind:T['kind']):Promise<T>{
  const cached=resolved.get(key)
  if(cached){
    if(cached.kind!==kind) throw new Error('The detail response had an unexpected type.')
    return cached as T
  }
  const active=inFlight.get(key)
  if(active){
    const data=await active
    if(data.kind!==kind) throw new Error('The detail response had an unexpected type.')
    return data as T
  }
  const pending=(async()=>{
    const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}})
    if(!response.ok) throw new Error(response.status===404?'This record could not be found.':'Research details could not be loaded.')
    const data=await response.json() as ExplorerDetailBundle
    if(data.kind!==kind) throw new Error('The detail response had an unexpected type.')
    resolved.set(key,data)
    return data
  })()
  inFlight.set(key,pending)
  try{return await pending as T}
  finally{inFlight.delete(key)}
}

function useDetailRequest<T extends ExplorerDetailBundle>(key:string,url:string,kind:T['kind'],enabled:boolean){
  const [state,setState]=useState<DetailState<T>>({key,loading:false})
  useEffect(()=>{
    if(!enabled) return
    let active=true
    const cached=resolved.get(key)
    if(cached&&cached.kind===kind){
      setState({key,data:cached as T,loading:false})
      return
    }
    setState({key,loading:true})
    requestDetails<T>(key,url,kind).then(
      data=>{if(active)setState({key,data,loading:false})},
      error=>{if(active)setState({key,error:error instanceof Error?error.message:'Research details could not be loaded.',loading:false})},
    )
    return()=>{active=false}
  },[key,url,kind,enabled])
  const cached=resolved.get(key)
  const data=state.key===key?state.data:(cached?.kind===kind?cached as T:undefined)
  const error=state.key===key?state.error:undefined
  return {data,loading:enabled&&!data&&!error||Boolean(state.key===key&&state.loading),error}
}

/** Loads one taxon's source/specimen/site detail only when its Evidence or specimen panel is opened. */
export function useExplorerTaxonDetails(taxonId:string,enabled=true){
  const id=encodeURIComponent(taxonId)
  return useDetailRequest<ExplorerTaxonDetails>(`taxon:${taxonId}`,`/api/explorer/details?taxon=${id}`,'taxon',enabled)
}

/** Loads the full site/dating/source set only while the Migration view is mounted. */
export function useExplorerMigrationDetails(enabled=true){
  return useDetailRequest<ExplorerMigrationDetails>('migration','/api/explorer/migration','migration',enabled)
}

/** Follows the native ResponsiveDetails disclosure so closed mobile panels do not fetch their records. */
export function useDetailsPanelOpen(id:string){
  const [open,setOpen]=useState(false)
  useEffect(()=>{
    const element=document.getElementById(id) as HTMLDetailsElement|null
    if(!element){setOpen(true);return}
    const sync=()=>setOpen(element.open)
    const frame=requestAnimationFrame(sync)
    element.addEventListener('toggle',sync)
    return()=>{
      cancelAnimationFrame(frame)
      element.removeEventListener('toggle',sync)
    }
  },[id])
  return open
}
