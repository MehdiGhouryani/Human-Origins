/**
 * Versioned, corruption-tolerant bookmark persistence (localStorage). Pure functions only; the React binding lives in
 * `useBookmarks.ts`. There is no account backend, so bookmarks are per browser and are never sent anywhere.
 */
export const BOOKMARK_STORAGE_KEY='human-origins:bookmarks'
export const BOOKMARK_SCHEMA_VERSION=1
export const MAX_BOOKMARKS=500

export type Bookmark={id:string;savedAt:number}
export type BookmarkState={version:typeof BOOKMARK_SCHEMA_VERSION;items:readonly Bookmark[]}
export type ParseResult={state:BookmarkState;/** True when stored data existed but was unusable and had to be discarded. */recovered:boolean}

export const EMPTY_BOOKMARKS:BookmarkState={version:BOOKMARK_SCHEMA_VERSION,items:[]}

/** Never throws. Unknown ids (taxa removed from the catalogue) are dropped when `validIds` is supplied. */
export function parseBookmarks(raw:string|null|undefined,validIds?:ReadonlySet<string>):ParseResult{
  if(raw===null||raw===undefined||raw==='') return {state:EMPTY_BOOKMARKS,recovered:false}
  let data:unknown
  try{data=JSON.parse(raw)}catch{return {state:EMPTY_BOOKMARKS,recovered:true}}
  if(typeof data!=='object'||data===null||(data as {version?:unknown}).version!==BOOKMARK_SCHEMA_VERSION||!Array.isArray((data as {items?:unknown}).items)) return {state:EMPTY_BOOKMARKS,recovered:true}
  const seen=new Set<string>(); const items:Bookmark[]=[]; let dropped=false
  for(const entry of (data as {items:unknown[]}).items){
    const id=typeof entry==='object'&&entry!==null?(entry as {id?:unknown}).id:undefined
    const savedAt=typeof entry==='object'&&entry!==null?(entry as {savedAt?:unknown}).savedAt:undefined
    if(typeof id!=='string'||!id||id.length>120||seen.has(id)||(validIds&&!validIds.has(id))){dropped=true;continue}
    seen.add(id); items.push({id,savedAt:typeof savedAt==='number'&&Number.isFinite(savedAt)?savedAt:0})
    if(items.length>=MAX_BOOKMARKS) break
  }
  return {state:{version:BOOKMARK_SCHEMA_VERSION,items},recovered:dropped&&items.length===0}
}

export const serializeBookmarks=(state:BookmarkState):string=>JSON.stringify({version:state.version,items:state.items})
export const isBookmarked=(state:BookmarkState,id:string):boolean=>state.items.some(item=>item.id===id)

export function toggleBookmark(state:BookmarkState,id:string,now:number=Date.now()):BookmarkState{
  if(isBookmarked(state,id)) return {version:state.version,items:state.items.filter(item=>item.id!==id)}
  return {version:state.version,items:[{id,savedAt:now},...state.items].slice(0,MAX_BOOKMARKS)}
}

/** Minimal Storage surface so tests can inject a fake and private-mode browsers can fail safely. */
export type StorageLike=Pick<Storage,'getItem'|'setItem'>
export function readBookmarks(storage:StorageLike|undefined,validIds?:ReadonlySet<string>):ParseResult{
  if(!storage) return {state:EMPTY_BOOKMARKS,recovered:false}
  try{return parseBookmarks(storage.getItem(BOOKMARK_STORAGE_KEY),validIds)}catch{return {state:EMPTY_BOOKMARKS,recovered:false}}
}
/** Returns false when the browser refused the write (quota, private mode) so the UI can say so instead of pretending. */
export function writeBookmarks(storage:StorageLike|undefined,state:BookmarkState):boolean{
  if(!storage) return false
  try{storage.setItem(BOOKMARK_STORAGE_KEY,serializeBookmarks(state));return true}catch{return false}
}
