import type {RelationshipRecord,SourceLink} from './contracts'
import {asRelationshipId,asSourceId,asTaxonId} from './ids'
import {compareTaxaChronologically} from './taxon-model'

/**
 * Main-path graph: the curated "main route of human evolution" shown on the home page.
 *
 * The full catalogue keeps every taxon and every relationship. This module projects it onto an editorially chosen set
 * of taxa (see `content/featured.ts`) and guarantees that the projection is a well-formed, connected, acyclic,
 * chronological graph. When a chosen taxon's registered parent is NOT in the set (for example H. erectus, whose
 * parent in the catalogue is H. ergaster), the chain is contracted through the hidden taxa into one edge that says
 * so in its note, instead of leaving the node floating or inventing a new claim.
 *
 * Pure and deterministic: same input → same output, independent of input order. Nothing here throws; every
 * problem is reported as an issue so the audit, the tests and the runtime can each decide what to do with it.
 */

export type MainPathTaxon={id:string;name?:string;short?:string;start:number;end:number;inferred?:true}

export type MainPathIssueCode=
  |'MAIN_PATH_SIZE'|'MAIN_PATH_DUPLICATE'|'MAIN_PATH_UNKNOWN_TAXON'|'MAIN_PATH_INFERRED_NODE'
  |'MAIN_PATH_NO_ROOT'|'MAIN_PATH_MULTIPLE_ROOTS'|'MAIN_PATH_ORPHAN'|'MAIN_PATH_CYCLE'|'MAIN_PATH_ANACHRONISM'

export type MainPathIssue={code:MainPathIssueCode;taxonId?:string;message:string}

export type MainPathGraph={
  /** Taxon ids in the main path, oldest first. Only ids that exist in the catalogue. */
  taxonIds:readonly string[]
  /** Relationships whose two ends are both in the main path: catalogue records plus contracted edges. */
  relationships:readonly RelationshipRecord[]
  /** Contracted edges only, keyed by id → hidden taxa they pass through (oldest first). */
  contractedVia:Readonly<Record<string,readonly string[]>>
  issues:readonly MainPathIssue[]
}

export const MAIN_PATH_CONTRACTED_PREFIX='main-path:'
const isDescentLink=(link:Pick<RelationshipRecord,'type'>)=>link.type!=='gene-flow'

/** Every hidden-ancestor chain from `id` upward that ends at a visible taxon. Breadth-first, cycle-safe. */
function visibleAncestors(id:string,incoming:ReadonlyMap<string,readonly RelationshipRecord[]>,visible:ReadonlySet<string>,blocked:ReadonlySet<string>=new Set()):{ancestor:string;via:string[];links:RelationshipRecord[]}[]{
  const found=new Map<string,{ancestor:string;via:string[];links:RelationshipRecord[]}>()
  const queue:{at:string;via:string[];links:RelationshipRecord[]}[]=[{at:id,via:[],links:[]}]
  const seen=new Set<string>([id])
  while(queue.length){
    const {at,via,links}=queue.shift()!
    for(const link of incoming.get(at)??[]){
      const parent=String(link.from)
      // A switched-off taxon is a wall: a simplified link never passes through it (see graph-visibility.ts).
      if(blocked.has(parent)) continue
      if(visible.has(parent)){
        if(via.length>0&&!found.has(parent)) found.set(parent,{ancestor:parent,via:[...via].reverse(),links:[...links,link]})
        continue
      }
      if(seen.has(parent)) continue
      seen.add(parent)
      queue.push({at:parent,via:[...via,parent],links:[...links,link]})
    }
  }
  return [...found.values()].sort((a,b)=>a.ancestor.localeCompare(b.ancestor))
}

function weakestCertainty(links:readonly RelationshipRecord[]):RelationshipRecord['certainty']{
  const rank={high:2,medium:1,debated:0} as const
  let out:RelationshipRecord['certainty']='high'
  for(const link of links){const c=link.certainty??'debated';if(rank[c]<rank[out!]) out=c}
  return out
}

export function buildMainPathGraph(
  taxa:readonly MainPathTaxon[],
  relationships:readonly RelationshipRecord[],
  requestedIds:readonly string[],
  expectedSize:number=requestedIds.length,
  options:{blocked?:ReadonlySet<string>}={},
):MainPathGraph{
  const blocked=options.blocked??new Set<string>()
  const issues:MainPathIssue[]=[]
  const byId=new Map(taxa.map(t=>[t.id,t]))
  const seen=new Set<string>()
  for(const id of requestedIds){
    if(seen.has(id)){issues.push({code:'MAIN_PATH_DUPLICATE',taxonId:id,message:`Taxon ${id} is listed twice in the main path.`});continue}
    seen.add(id)
    const taxon=byId.get(id)
    if(!taxon) issues.push({code:'MAIN_PATH_UNKNOWN_TAXON',taxonId:id,message:`Main-path taxon ${id} does not exist in the catalogue.`})
    else if(taxon.inferred===true) issues.push({code:'MAIN_PATH_INFERRED_NODE',taxonId:id,message:`${id} is an inferred node; the main path lists named taxa only.`})
  }
  const ids=[...seen].filter(id=>byId.has(id))
  if(ids.length!==expectedSize) issues.push({code:'MAIN_PATH_SIZE',message:`The main path must contain exactly ${expectedSize} existing taxa; it has ${ids.length}.`})
  const visible=new Set(ids)
  const ordered=ids.map(id=>byId.get(id)!).sort(compareTaxaChronologically).map(t=>t.id)

  const incoming=new Map<string,RelationshipRecord[]>()
  for(const link of relationships){
    if(!isDescentLink(link)||String(link.from)===String(link.to)) continue
    const to=String(link.to)
    ;(incoming.get(to)??incoming.set(to,[]).get(to)!).push(link)
  }

  const kept:RelationshipRecord[]=[]
  const contractedVia:Record<string,readonly string[]>={}
  const keyOf=(from:string,to:string)=>`${from}>${to}`
  const keptKeys=new Set<string>()
  // 1. Catalogue relationships with both ends visible, in catalogue order (deterministic).
  for(const link of relationships){
    const from=String(link.from),to=String(link.to)
    if(!visible.has(from)||!visible.has(to)||from===to) continue
    kept.push(link)
    if(isDescentLink(link)) keptKeys.add(keyOf(from,to))
  }
  // 2. Contract hidden chains only for taxa that would otherwise have no visible parent.
  for(const id of ordered){
    if(kept.some(link=>isDescentLink(link)&&String(link.to)===id)) continue
    for(const chain of visibleAncestors(id,incoming,visible,blocked)){
      if(keptKeys.has(keyOf(chain.ancestor,id))) continue
      const edgeId=`${MAIN_PATH_CONTRACTED_PREFIX}${chain.ancestor}:${id}`
      const sourceIds=[...new Set(chain.links.flatMap(l=>l.sourceIds.map(String)))].sort()
      const viaNames=chain.via.map(v=>byId.get(v)?.short??byId.get(v)?.name??v)
      const sourceLinks:SourceLink[]=sourceIds.map(sourceId=>({sourceId:asSourceId(sourceId),role:'contextualizes'}))
      kept.push({
        id:asRelationshipId(edgeId),
        from:asTaxonId(chain.ancestor),
        to:asTaxonId(id),
        type:'possible',
        relation:'proposed-descent',
        label:'simplified main-path link',
        certainty:weakestCertainty(chain.links),
        sourceIds:sourceIds.map(asSourceId),
        sourceLinks,
        note:`Simplified for the main-path view: in the full atlas this link passes through ${viaNames.join(' → ')}, which is not shown here. It is not a separate claim of direct ancestry.`,
      })
      keptKeys.add(keyOf(chain.ancestor,id))
      contractedVia[edgeId]=chain.via
    }
  }

  // 3. Structural guarantees.
  const descent=kept.filter(isDescentLink)
  const parentsOf=(id:string)=>descent.filter(l=>String(l.to)===id).map(l=>String(l.from))
  const roots=ordered.filter(id=>parentsOf(id).length===0)
  if(ordered.length&&roots.length===0) issues.push({code:'MAIN_PATH_NO_ROOT',message:'Every main-path taxon has a parent: the graph has a cycle and no root.'})
  if(roots.length>1){
    const [root,...orphans]=roots
    for(const orphan of orphans) issues.push({code:'MAIN_PATH_ORPHAN',taxonId:orphan,message:`${orphan} has no registered relationship to an earlier main-path taxon (root is ${root}).`})
    issues.push({code:'MAIN_PATH_MULTIPLE_ROOTS',message:`The main path must have exactly one root; found ${roots.join(', ')}.`})
  }
  for(const link of descent){
    const from=byId.get(String(link.from))!,to=byId.get(String(link.to))!
    if(from.start<to.start) issues.push({code:'MAIN_PATH_ANACHRONISM',taxonId:to.id,message:`${String(link.id)} draws ${from.id} (first ~${from.start} Ma) as the source of the older ${to.id} (~${to.start} Ma).`})
  }
  // Cycle detection (Kahn): every node must be removable.
  const indeg=new Map(ordered.map(id=>[id,0]))
  for(const link of descent) indeg.set(String(link.to),(indeg.get(String(link.to))??0)+1)
  const stack=ordered.filter(id=>indeg.get(id)===0)
  let removed=0
  while(stack.length){
    const id=stack.pop()!;removed++
    for(const link of descent) if(String(link.from)===id){const to=String(link.to);indeg.set(to,indeg.get(to)!-1);if(indeg.get(to)===0) stack.push(to)}
  }
  if(removed!==ordered.length) issues.push({code:'MAIN_PATH_CYCLE',message:'The main-path relationships contain a cycle.'})

  return {taxonIds:ordered,relationships:kept,contractedVia,issues}
}
