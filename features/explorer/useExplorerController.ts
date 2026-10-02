'use client'

import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {getExplorerEvidenceSites,getExplorerSpeciesById,getExplorerSpeciesList,searchExplorerCatalog} from './selectors'
import type {ExplorerBootstrap} from './bootstrap'
import type {ExplorerMode,ExplorerState} from './state'
import {DEFAULT_EXPLORER_STATE,readExplorerState,writeExplorerUrl} from './state'
import {deepFreeze} from '../../domain/immutability'
import {formatAgeMa,sliderToAgeMa} from '../../domain/time'

export function useExplorerController(bootstrap:ExplorerBootstrap,initialState:Partial<ExplorerState>={}){
  const immutableBootstrap=useMemo(()=>deepFreeze(bootstrap),[bootstrap])
  const defaultId=immutableBootstrap.species.find(t=>t.id==='neanderthal')?.id ?? immutableBootstrap.species[0]?.id??''
  const validTaxon=initialState.selectedId && immutableBootstrap.species.some(t=>t.id===initialState.selectedId)?initialState.selectedId:defaultId
  const validSite=initialState.focusSite && getExplorerEvidenceSites(immutableBootstrap).some(site=>String(site.id)===initialState.focusSite)?initialState.focusSite:null
  const [state,setState]=useState<ExplorerState>({...DEFAULT_EXPLORER_STATE,...initialState,selectedId:validTaxon,focusSite:validSite,playing:false})

  const latestStateRef=useRef(state)
  const lastPushedSelectedId=useRef(state.selectedId)
  useEffect(()=>{
    latestStateRef.current=state
  },[state])
  const writeUrl=useCallback(()=>{
    const latest=latestStateRef.current
    const url=writeExplorerUrl(window.location.pathname,latest)
    if(latest.selectedId!==lastPushedSelectedId.current){
      window.history.pushState(null,'',url)
      lastPushedSelectedId.current=latest.selectedId
    }else window.history.replaceState(null,'',url)
    window.dispatchEvent(new Event('human-origins:navigation'))
  },[])

  useEffect(()=>{
    if(state.playing) return
    const id=window.setTimeout(writeUrl,120)
    return ()=>window.clearTimeout(id)
  },[state.selectedId,state.mode,state.focusSite,state.journey,state.time,state.query,state.playing,writeUrl])

  useEffect(()=>{
    if(!state.playing) return
    const id=window.setInterval(writeUrl,300)
    return ()=>window.clearInterval(id)
  },[state.playing,writeUrl])

  useEffect(()=>{
    const restoreFromUrl=()=>{
      const decoded=readExplorerState(window.location.search)
      const selectedId=decoded.selectedId && immutableBootstrap.species.some(item=>item.id===decoded.selectedId)?decoded.selectedId:defaultId
      const focusSite=decoded.focusSite && getExplorerEvidenceSites(immutableBootstrap).some(site=>String(site.id)===decoded.focusSite)?decoded.focusSite:null
      lastPushedSelectedId.current=selectedId
      setState(previous=>({...previous,...decoded,selectedId,focusSite,playing:false}))
    }
    window.addEventListener('popstate',restoreFromUrl)
    return ()=>window.removeEventListener('popstate',restoreFromUrl)
  },[immutableBootstrap,defaultId])

  useEffect(()=>{
    if(!state.playing) return
    const id=window.setInterval(()=>setState(prev=>({...prev,time:prev.time>=100?0:Math.min(100,prev.time+0.6)})),80)
    return ()=>window.clearInterval(id)
  },[state.playing])

  const current=getExplorerSpeciesById(immutableBootstrap,state.selectedId)
  const age=sliderToAgeMa(state.time)
  const results=useMemo(()=>searchExplorerCatalog(immutableBootstrap,state.query),[immutableBootstrap,state.query])
  const explorerSpecies=getExplorerSpeciesList(immutableBootstrap)
  const visibleSearchResults=results.filter(item=>item.kind==='taxon')
  // Journey is a full-panel view: picking any other mode leaves it.
  const setMode=useCallback((mode:ExplorerMode)=>setState(prev=>({...prev,mode,journey:false})),[])
  const setSelected=useCallback((selectedId:string)=>setState(prev=>({...prev,selectedId})),[])

  return {
    bootstrap:immutableBootstrap,
    state,
    setState,
    current,
    age,
    results,
    visibleSearchResults,
    explorerSpecies,
    setMode,
    setSelected,
    timeLabel:formatAgeMa(age),
  } as const
}
