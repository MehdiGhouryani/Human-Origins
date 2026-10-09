import type {RelationshipRecord} from './contracts'
import {buildMainPathGraph,type MainPathGraph,type MainPathIssue,type MainPathTaxon} from './main-path'
import {compareTaxaChronologically} from './taxon-model'

/**
 * Graph visibility: which taxa the public evolutionary graph draws, and why.
 *
 * Every taxon in the catalogue is in exactly one of three states for the graph:
 *  - `shown`    : drawn as a node.
 *  - `bridged`  : not drawn, but it never breaks the graph. A visible descendant is joined to the nearest visible
 *                 ancestor by a simplified link whose note names the hidden taxa (main-path contraction).
 *  - `off`      : switched off by an editor. The taxon is not drawn AND neither is anything that is 100% dependent on it,
 *                 i.e. every descent path from a root of the catalogue to that taxon runs through a switched-off taxon.
 *                 A taxon that still has another descent path (a second parent that is not off) stays.
 *
 * Gene flow never defines dependency: it is exchange between populations, not placement. Relationships touching an
 * invisible taxon are dropped together with it.
 *
 * Pure and deterministic. Nothing throws; problems are reported with a severity so the CMS can block publishing on
 * errors and merely warn on the rest.
 */

export type GraphTaxonState='shown'|'bridged'|'off'

/** What editors store. Ids that are neither in `shown` nor in `off` are bridged. */
export type GraphConfig={
  /** Taxa drawn on the graph, any order (the layout orders them chronologically). */
  shown:readonly string[]
  /** Taxa switched off together with their 100%-dependent descendants. */
  off:readonly string[]
  /** Taxon selected when the explorer opens. Falls back to the youngest visible taxon when missing or invisible. */
  defaultTaxonId?:string
}

export type GraphIssueSeverity='error'|'warning'
export type GraphIssue=MainPathIssue&{severity:GraphIssueSeverity}

export type GraphProjection={
  /** Visible taxa, oldest first. */
  taxonIds:readonly string[]
  /** Relationships drawn on the graph: catalogue records with both ends visible plus simplified (contracted) links. */
  relationships:readonly RelationshipRecord[]
  contractedVia:Readonly<Record<string,readonly string[]>>
  /** Switched-off taxa (as configured, existing ids only). */
  off:readonly string[]
  /** Taxa hidden only because they depend 100% on a switched-off taxon → the off taxa responsible (oldest first). */
  dependents:Readonly<Record<string,readonly string[]>>
  /** Final state of every catalogue taxon. */
  states:Readonly<Record<string,GraphTaxonState|'dependent'>>
  defaultTaxonId:string
  issues:readonly GraphIssue[]
}

const isPlacement=(link:Pick<RelationshipRecord,'type'>)=>link.type!=='gene-flow'

/** Descent parents of every taxon (gene flow excluded), only between existing taxa. */
function parentsIndex(ids:ReadonlySet<string>,relationships:readonly RelationshipRecord[]):Map<string,string[]>{
  const parents=new Map<string,string[]>()
  for(const link of relationships){
    const from=String(link.from),to=String(link.to)
    if(!isPlacement(link)||from===to||!ids.has(from)||!ids.has(to)) continue
    const list=parents.get(to)??[]
    if(!list.includes(from)) list.push(from)
    parents.set(to,list)
  }
  return parents
}

/**
 * Taxa that are unreachable from every root without passing through a switched-off taxon. The switched-off taxa
 * themselves are not included. Returned map: dependent → the switched-off taxa that block it.
 */
export function dependentsOf(taxa:readonly Pick<MainPathTaxon,'id'|'start'|'end'>[],relationships:readonly RelationshipRecord[],off:Iterable<string>):Map<string,string[]>{
  const ids=new Set(taxa.map(t=>t.id))
  const offSet=new Set([...off].filter(id=>ids.has(id)))
  const result=new Map<string,string[]>()
  if(!offSet.size) return result
  const parents=parentsIndex(ids,relationships)
  const children=new Map<string,string[]>()
  for(const [child,list] of parents) for(const parent of list) (children.get(parent)??children.set(parent,[]).get(parent)!).push(child)
  // Reachability from roots, never entering a switched-off taxon.
  const roots=taxa.map(t=>t.id).filter(id=>!(parents.get(id)?.length))
  const reachable=new Set<string>()
  const queue=roots.filter(id=>!offSet.has(id))
  for(const id of queue) reachable.add(id)
  while(queue.length){
    const id=queue.shift()!
    for(const child of children.get(id)??[]){
      if(offSet.has(child)||reachable.has(child)) continue
      reachable.add(child);queue.push(child)
    }
  }
  const byId=new Map(taxa.map(t=>[t.id,t]))
  const order=(list:Iterable<string>)=>[...list].sort((a,b)=>compareTaxaChronologically(byId.get(a)!,byId.get(b)!))
  for(const taxon of taxa){
    if(offSet.has(taxon.id)||reachable.has(taxon.id)) continue
    // Which switched-off taxa block it: walk up until a switched-off ancestor is hit.
    const blockers=new Set<string>()
    const seen=new Set<string>([taxon.id])
    const up=[taxon.id]
    while(up.length){
      const id=up.pop()!
      for(const parent of parents.get(id)??[]){
        if(seen.has(parent)) continue
        seen.add(parent)
        if(offSet.has(parent)) blockers.add(parent)
        else up.push(parent)
      }
    }
    result.set(taxon.id,order(blockers))
  }
  return result
}

/** Taxa that turning `id` off would additionally hide, given what is already off. Used for the CMS impact preview. */
export function impactOfSwitchingOff(taxa:readonly Pick<MainPathTaxon,'id'|'start'|'end'>[],relationships:readonly RelationshipRecord[],currentlyOff:readonly string[],id:string):string[]{
  const before=dependentsOf(taxa,relationships,currentlyOff)
  const after=dependentsOf(taxa,relationships,[...currentlyOff,id])
  return [...after.keys()].filter(other=>other!==id&&!before.has(other)&&!currentlyOff.includes(other))
}

const ERROR_CODES=new Set(['MAIN_PATH_DUPLICATE','MAIN_PATH_UNKNOWN_TAXON','MAIN_PATH_CYCLE','MAIN_PATH_ANACHRONISM','GRAPH_TOO_SMALL'])

export function projectGraph(taxa:readonly MainPathTaxon[],relationships:readonly RelationshipRecord[],config:GraphConfig):GraphProjection{
  const ids=new Set(taxa.map(t=>t.id))
  const issues:GraphIssue[]=[]
  const off=[...new Set(config.off)].filter(id=>{
    if(ids.has(id)) return true
    issues.push({code:'MAIN_PATH_UNKNOWN_TAXON',taxonId:id,message:`Switched-off taxon ${id} does not exist in the catalogue.`,severity:'warning'})
    return false
  })
  const offSet=new Set(off)
  const dependents=dependentsOf(taxa,relationships,off)
  const blocked=new Set([...offSet,...dependents.keys()])
  const requested=config.shown.filter(id=>!blocked.has(id))
  const graph:MainPathGraph=buildMainPathGraph(taxa,relationships,requested,requested.filter(id=>ids.has(id)).length,{blocked})
  for(const issue of graph.issues){
    if(issue.code==='MAIN_PATH_SIZE') continue
    issues.push({...issue,severity:ERROR_CODES.has(issue.code)?'error':'warning'})
  }
  if(graph.taxonIds.length<2) issues.push({code:'MAIN_PATH_SIZE',message:`The graph needs at least two visible taxa; it has ${graph.taxonIds.length}.`,severity:'error'})
  const shownSet=new Set(graph.taxonIds)
  const states:Record<string,GraphTaxonState|'dependent'>={}
  for(const taxon of taxa) states[taxon.id]=offSet.has(taxon.id)?'off':dependents.has(taxon.id)?'dependent':shownSet.has(taxon.id)?'shown':'bridged'
  const byId=new Map(taxa.map(t=>[t.id,t]))
  const youngest=[...graph.taxonIds].sort((a,b)=>compareTaxaChronologically(byId.get(b)!,byId.get(a)!))[0]??''
  const wanted=config.defaultTaxonId
  if(wanted&&!shownSet.has(wanted)) issues.push({code:'MAIN_PATH_UNKNOWN_TAXON',taxonId:wanted,message:`The default taxon ${wanted} is not visible on the graph; ${youngest||'nothing'} is selected instead.`,severity:'warning'})
  return {
    taxonIds:graph.taxonIds,
    relationships:graph.relationships,
    contractedVia:graph.contractedVia,
    off,
    dependents:Object.fromEntries(dependents),
    states,
    defaultTaxonId:wanted&&shownSet.has(wanted)?wanted:youngest,
    issues,
  }
}

/** Normalizes untrusted input (CMS request bodies, stored JSON) into a GraphConfig over known ids. */
export function parseGraphConfig(value:unknown,knownIds:ReadonlySet<string>):GraphConfig|undefined{
  if(!value||typeof value!=='object'||Array.isArray(value)) return undefined
  const raw=value as Record<string,unknown>
  const list=(v:unknown)=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&knownIds.has(x)))]:undefined
  const shown=list(raw.shown),off=list(raw.off)
  if(!shown||!off) return undefined
  const offSet=new Set(off)
  const defaultTaxonId=typeof raw.defaultTaxonId==='string'&&knownIds.has(raw.defaultTaxonId)?raw.defaultTaxonId:undefined
  return {shown:shown.filter(id=>!offSet.has(id)),off,...(defaultTaxonId?{defaultTaxonId}:{})}
}
