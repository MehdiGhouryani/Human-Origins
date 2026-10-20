'use client'

import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {useSearchParams} from 'next/navigation'
import {getExplorerEvidenceSites,getExplorerSpeciesById,getExplorerSpeciesList} from './selectors'
import type {ExplorerBootstrap} from './bootstrap'
import type {ExplorerMode,ExplorerState,UrlValidity} from './state'
import {DEFAULT_EXPLORER_STATE,applyUrlState,readExplorerState,writeExplorerSearch} from './state'
import {deepFreeze} from '../../domain/immutability'
import {formatAgeMa,sliderToAgeMa} from '../../domain/time'

type Update=(previous:ExplorerState)=>ExplorerState

/**
 * Explorer state with the URL as its source of truth.
 *  - Links, Back/Forward and typed URLs change the state through `useSearchParams`.
 *  - Changes made on the page are written to the URL with the History API. Next.js integrates those calls, so no
 *    server request is made, and the page's hash (for example `#about`) is kept.
 *  - Nothing is written on mount, so a URL such as `/#about` is not rewritten when the page loads.
 */
export function useExplorerController(bootstrap:ExplorerBootstrap,initialState:Partial<ExplorerState>={}){
  const immutableBootstrap=useMemo(()=>deepFreeze(bootstrap),[bootstrap])
  const defaultId=immutableBootstrap.species.find(t=>t.id===immutableBootstrap.featured.defaultTaxonId)?.id ?? immutableBootstrap.species[0]?.id ?? ''
  const validity=useMemo<UrlValidity>(()=>{
    const compareIds=new Set(immutableBootstrap.species.filter(t=>!t.inferred).map(t=>t.id))
    return {
      taxonIds:new Set(immutableBootstrap.species.map(t=>t.id)),
      siteIds:new Set(getExplorerEvidenceSites(immutableBootstrap).map(site=>String(site.id))),
      defaultTaxonId:defaultId,
      compareIds,
      compareDefault:immutableBootstrap.featured.compareTaxonIds.filter(id=>compareIds.has(id)),
    }
  },[immutableBootstrap,defaultId])
  const validityRef=useRef(validity)
  useEffect(()=>{validityRef.current=validity},[validity])

  const [state,setState]=useState<ExplorerState>(()=>applyUrlState(DEFAULT_EXPLORER_STATE,initialState,validity))
  const compareKey=state.compare.join(',')
  const latestRef=useRef(state)
  useEffect(()=>{latestRef.current=state},[state])

  // Set by changes made on the page; cleared when the URL has been written.
  const dirtyRef=useRef(false)
  // The search string this hook last wrote, or the one the page was loaded with.
  const lastSearchRef=useRef<string|null>(null)
  // Species of the last history entry created here: a species change adds an entry, a time change does not.
  const lastPushedIdRef=useRef(state.selectedId)

  // Every change made on the page goes through `commit`, so the URL is known to need writing.
  const commit=useCallback((update:Update)=>{dirtyRef.current=true;setState(update)},[])

  const searchParams=useSearchParams()
  const urlSearch=searchParams.toString()

  // Links, Back/Forward and typed URLs: the URL changed without this hook writing it, so the state follows the URL.
  useEffect(()=>{
    const actual=window.location.search.replace(/^\?/,'')
    if(lastSearchRef.current===null){lastSearchRef.current=actual;return}
    if(actual===lastSearchRef.current) return
    lastSearchRef.current=actual
    const next=applyUrlState(latestRef.current,readExplorerState(actual),validityRef.current)
    lastPushedIdRef.current=next.selectedId
    setState(next)
  },[urlSearch])

  const writeUrl=useCallback(()=>{
    // A navigation (a link, Back or Forward) that happened after our last write wins over a pending write: the pending
    // write carries the state from before that navigation, and writing it would undo the navigation (race found in use).
    const actual=window.location.search.replace(/^\?/,'')
    if(lastSearchRef.current!==null && actual!==lastSearchRef.current){
      dirtyRef.current=false
      lastSearchRef.current=actual
      const adopted=applyUrlState(latestRef.current,readExplorerState(actual),validityRef.current)
      lastPushedIdRef.current=adopted.selectedId
      setState(adopted)
      return
    }
    const latest=latestRef.current
    const search=writeExplorerSearch(latest)
    dirtyRef.current=false
    if(search===lastSearchRef.current) return
    const url=`${window.location.pathname}?${search}${window.location.hash}`
    if(latest.selectedId!==lastPushedIdRef.current){
      window.history.pushState(null,'',url)
      lastPushedIdRef.current=latest.selectedId
    }else window.history.replaceState(null,'',url)
    lastSearchRef.current=search
  },[])

  // A species change is written at once, because it is its own history entry. Time and mode changes are written
  // shortly after they happen. While playing, `writeUrl` runs on an interval.
  useEffect(()=>{
    if(state.playing||!dirtyRef.current) return
    if(state.selectedId!==lastPushedIdRef.current){writeUrl();return}
    const id=window.setTimeout(writeUrl,120)
    return ()=>window.clearTimeout(id)
  },[state.selectedId,state.mode,state.focusSite,state.journey,state.time,state.query,compareKey,state.playing,writeUrl])

  // A link click starts a navigation. Anything still pending is written first, so the navigation never races a late
  // write from before it (the race that undid a Journey link pressed right after a tab).
  useEffect(()=>{
    const flushBeforeLink=(event:MouseEvent)=>{
      if(dirtyRef.current && event.target instanceof Element && event.target.closest('a[href]')) writeUrl()
    }
    document.addEventListener('click',flushBeforeLink,true)
    return ()=>document.removeEventListener('click',flushBeforeLink,true)
  },[writeUrl])

  useEffect(()=>{
    if(!state.playing) return
    const id=window.setInterval(writeUrl,300)
    return ()=>window.clearInterval(id)
  },[state.playing,writeUrl])

  useEffect(()=>{
    if(!state.playing) return
    const id=window.setInterval(()=>commit(prev=>({...prev,time:prev.time>=100?0:Math.min(100,prev.time+0.6)})),80)
    return ()=>window.clearInterval(id)
  },[state.playing,commit])

  const current=getExplorerSpeciesById(immutableBootstrap,state.selectedId)
  const age=sliderToAgeMa(state.time)
  const explorerSpecies=getExplorerSpeciesList(immutableBootstrap)
  // Journey is a full-panel view: picking any other mode leaves it.
  const setMode=useCallback((mode:ExplorerMode)=>commit(prev=>({...prev,mode,journey:false})),[commit])
  const setSelected=useCallback((selectedId:string)=>commit(prev=>({...prev,selectedId})),[commit])
  const setCompare=useCallback((compare:string[])=>commit(prev=>({...prev,compare})),[commit])

  return {
    bootstrap:immutableBootstrap,
    state,
    setState:commit,
    current,
    age,
    explorerSpecies,
    setMode,
    setSelected,
    setCompare,
    timeLabel:formatAgeMa(age),
  } as const
}
