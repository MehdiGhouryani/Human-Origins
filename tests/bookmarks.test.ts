import {describe,expect,it} from 'vitest'
import {BOOKMARK_STORAGE_KEY,EMPTY_BOOKMARKS,MAX_BOOKMARKS,isBookmarked,parseBookmarks,readBookmarks,serializeBookmarks,toggleBookmark,writeBookmarks,type StorageLike} from '../features/bookmarks/store'

const memory=():StorageLike&{data:Map<string,string>}=>{const data=new Map<string,string>();return {data,getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v)}}}

describe('bookmark persistence',()=>{
  it('round-trips through serialization and survives a simulated reload',()=>{
    const storage=memory()
    let state=toggleBookmark(EMPTY_BOOKMARKS,'neanderthal',100)
    state=toggleBookmark(state,'sapiens',200)
    expect(writeBookmarks(storage,state)).toBe(true)
    const reloaded=readBookmarks(storage).state   // a new page load reads only from storage
    expect(reloaded.items.map(i=>i.id)).toEqual(['sapiens','neanderthal'])
    expect(isBookmarked(reloaded,'neanderthal')).toBe(true)
  })
  it('toggling twice removes the bookmark',()=>{expect(toggleBookmark(toggleBookmark(EMPTY_BOOKMARKS,'a',1),'a',2).items).toEqual([])})
  it.each([['invalid JSON','{not json'],['wrong version','{"version":99,"items":[]}'],['not an object','"hello"'],['items not an array','{"version":1,"items":"x"}'],['null','null']])('recovers from corrupted storage: %s',(_,raw)=>{
    const storage=memory();storage.data.set(BOOKMARK_STORAGE_KEY,raw)
    const result=readBookmarks(storage)
    expect(result.state.items).toEqual([]);expect(result.recovered).toBe(true)
  })
  it('keeps valid entries and drops malformed, duplicate and unknown ones',()=>{
    const raw=JSON.stringify({version:1,items:[{id:'a',savedAt:1},{id:'a',savedAt:2},{id:42},null,{id:'gone',savedAt:3},{id:'b'}]})
    const result=parseBookmarks(raw,new Set(['a','b']))
    expect(result.state.items.map(i=>i.id)).toEqual(['a','b'])
  })
  it('never throws when storage itself throws (private mode / quota)',()=>{
    const hostile:StorageLike={getItem(){throw new Error('denied')},setItem(){throw new Error('quota')}}
    expect(readBookmarks(hostile).state.items).toEqual([]);expect(writeBookmarks(hostile,EMPTY_BOOKMARKS)).toBe(false)
    expect(readBookmarks(undefined).state.items).toEqual([]);expect(writeBookmarks(undefined,EMPTY_BOOKMARKS)).toBe(false)
  })
  it('caps the list size',()=>{let s=EMPTY_BOOKMARKS;for(let i=0;i<MAX_BOOKMARKS+20;i++) s=toggleBookmark(s,`t${i}`,i);expect(s.items).toHaveLength(MAX_BOOKMARKS);expect(parseBookmarks(serializeBookmarks(s)).state.items).toHaveLength(MAX_BOOKMARKS)})
})
