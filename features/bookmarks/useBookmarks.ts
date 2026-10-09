'use client'
import {useCallback,useMemo,useSyncExternalStore} from 'react'
import {BOOKMARK_STORAGE_KEY,EMPTY_BOOKMARKS,isBookmarked,parseBookmarks,toggleBookmark,writeBookmarks,type BookmarkState} from './store'

const listeners=new Set<()=>void>()
const emit=()=>listeners.forEach(listener=>listener())
const subscribe=(listener:()=>void)=>{
  listeners.add(listener)
  const onStorage=(event:StorageEvent)=>{if(event.key===null||event.key===BOOKMARK_STORAGE_KEY) listener()}
  window.addEventListener('storage',onStorage)
  return ()=>{listeners.delete(listener);window.removeEventListener('storage',onStorage)}
}
const safeStorage=():Storage|undefined=>{try{return typeof window==='undefined'?undefined:window.localStorage}catch{return undefined}}

// useSyncExternalStore needs a referentially stable snapshot: parse only when the raw string changes.
let lastRaw:string|null|undefined; let lastState:BookmarkState=EMPTY_BOOKMARKS
function snapshot():BookmarkState{
  let raw:string|null=null
  try{raw=safeStorage()?.getItem(BOOKMARK_STORAGE_KEY)??null}catch{raw=null}
  if(raw!==lastRaw){lastRaw=raw;lastState=parseBookmarks(raw).state}
  return lastState
}
const serverSnapshot=()=>EMPTY_BOOKMARKS

/** Bookmarks for the current browser. Server render and first client render are empty, so hydration never mismatches. */
export function useBookmarks(validIds?:ReadonlySet<string>){
  const state=useSyncExternalStore(subscribe,snapshot,serverSnapshot)
  const items=useMemo(()=>validIds?state.items.filter(item=>validIds.has(item.id)):state.items,[state,validIds])
  const toggle=useCallback((id:string):boolean=>{
    const ok=writeBookmarks(safeStorage(),toggleBookmark(snapshot(),id))
    if(ok) emit()
    return ok
  },[])
  const has=useCallback((id:string)=>isBookmarked(state,id),[state])
  return {items,has,toggle} as const
}
