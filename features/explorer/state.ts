export type ExplorerMode='tree'|'timeline'|'migration'|'evidence'
export type ExplorerState={
  selectedId:string
  time:number
  journey:boolean
  playing:boolean
  query:string
  mode:ExplorerMode
  focusSite:string|null
}

export const DEFAULT_EXPLORER_STATE:ExplorerState={
  selectedId:'',time:89.3,journey:false,playing:false,query:'',mode:'tree',focusSite:null
}

const isMode=(value:string|null):value is ExplorerMode=>value==='tree'||value==='timeline'||value==='migration'||value==='evidence'
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))

export function readExplorerState(search:string):Partial<ExplorerState>{
  const params=new URLSearchParams(search)
  const state:Partial<ExplorerState>={}
  const species=params.get('species'); if(species?.trim()) state.selectedId=species.trim()
  const mode=params.get('mode'); if(isMode(mode)) state.mode=mode
  const site=params.get('site'); if(site?.trim()) state.focusSite=site.trim()
  const q=params.get('q'); if(q!==null) state.query=q.slice(0,160)
  const time=params.get('time'); if(time!==null){const parsed=Number(time);if(Number.isFinite(parsed))state.time=clamp(parsed,0,100)}
  state.journey=params.get('journey')==='1'
  return state
}

export function writeExplorerUrl(pathname:string,state:ExplorerState):string{
  const params=new URLSearchParams()
  params.set('species',state.selectedId)
  params.set('mode',state.mode)
  params.set('time',Math.round(state.time*10)/10+'')
  if(state.focusSite) params.set('site',state.focusSite)
  if(state.journey) params.set('journey','1')
  if(state.query.trim()) params.set('q',state.query.trim().slice(0,160))
  return `${pathname}?${params.toString()}`
}
