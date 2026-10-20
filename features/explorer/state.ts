export type ExplorerMode='tree'|'timeline'|'migration'|'evidence'|'compare'
/** Most taxa the comparison holds at once. Adding a fourth needs a removal first; nothing is dropped silently. */
export const COMPARE_LIMIT=3
export type ExplorerState={
  selectedId:string
  time:number
  journey:boolean
  playing:boolean
  query:string
  mode:ExplorerMode
  focusSite:string|null
  compare:string[]
}

export const DEFAULT_EXPLORER_STATE:ExplorerState={
  selectedId:'',time:89.3,journey:false,playing:false,query:'',mode:'tree',focusSite:null,compare:[]
}

/** The ids a URL may name. Anything else falls back to a valid value. */
export type UrlValidity={taxonIds:ReadonlySet<string>;siteIds:ReadonlySet<string>;defaultTaxonId:string;compareIds:ReadonlySet<string>;compareDefault:readonly string[]}

const isMode=(value:string|null):value is ExplorerMode=>value==='tree'||value==='timeline'||value==='migration'||value==='evidence'||value==='compare'
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

export function readExplorerState(search:string):Partial<ExplorerState>{
  const params=new URLSearchParams(search)
  const state:Partial<ExplorerState>={}
  const species=params.get('species'); if(species?.trim()) state.selectedId=species.trim()
  const mode=params.get('mode'); if(isMode(mode)) state.mode=mode
  const site=params.get('site'); if(site?.trim()) state.focusSite=site.trim()
  const q=params.get('q'); if(q!==null) state.query=q.slice(0,160)
  const cmp=params.get('cmp'); if(cmp!==null) state.compare=cmp.split(',').map(value=>value.trim()).filter(Boolean)
  const time=params.get('time'); if(time!==null){const parsed=Number(time);if(Number.isFinite(parsed))state.time=clamp(parsed,0,100)}
  state.journey=params.get('journey')==='1'
  return state
}

/**
 * Applies a decoded URL to the current state. A URL describes the explorer completely, so a missing species or mode
 * means the default. A missing time keeps the current position, because links such as the inspector's Map range do
 * not mention time. Ids the catalogue does not know are replaced by valid ones.
 */
export function applyUrlState(current:ExplorerState,decoded:Partial<ExplorerState>,valid:UrlValidity):ExplorerState{
  const selectedId=decoded.selectedId && valid.taxonIds.has(decoded.selectedId) ? decoded.selectedId : valid.defaultTaxonId
  // The comparison keeps its taxa when a URL does not name any; an empty or unknown list falls back to the featured trio.
  const compare=Array.from(new Set(decoded.compare??current.compare)).filter(id=>valid.compareIds.has(id)).slice(0,COMPARE_LIMIT)
  return {
    ...current,
    selectedId,
    compare:compare.length?compare:[...valid.compareDefault],
    time:decoded.time ?? current.time,
    journey:decoded.journey ?? false,
    mode:decoded.mode ?? 'tree',
    query:decoded.query ?? '',
    focusSite:decoded.focusSite && valid.siteIds.has(decoded.focusSite) ? decoded.focusSite : null,
    playing:false,
  }
}

/** Query string for a state, without the leading "?". Every value is written, so each URL describes its own view. */
export function writeExplorerSearch(state:ExplorerState):string{
  const params=new URLSearchParams()
  params.set('species',state.selectedId)
  params.set('mode',state.mode)
  params.set('time',Math.round(state.time*10)/10+'')
  if(state.mode==='compare') params.set('cmp',state.compare.join(','))
  if(state.focusSite) params.set('site',state.focusSite)
  if(state.journey) params.set('journey','1')
  if(state.query.trim()) params.set('q',state.query.trim().slice(0,160))
  return params.toString()
}

/** Full URL for a state. The hash is kept as given, so `#about` survives every explorer change. */
export function writeExplorerUrl(pathname:string,state:ExplorerState,hash=''):string{
  const fragment=hash?(hash.startsWith('#')?hash:`#${hash}`):''
  return `${pathname}?${writeExplorerSearch(state)}${fragment}`
}
