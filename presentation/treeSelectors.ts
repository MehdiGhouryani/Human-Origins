import type {RelationshipRecord} from '../domain/contracts'

/**
 * Direct lineage of the selected taxon: everything reachable by walking ancestor links up and descendant links down.
 * Siblings and cousins are deliberately excluded (a fully connected tree would otherwise highlight every node).
 * Gene-flow links are not descent and are ignored.
 */
export function relatedTaxa(selected:string,links:readonly RelationshipRecord[]):Set<string>{
  const descent=links.filter(link=>link.type!=='gene-flow')
  const walk=(start:string,next:(id:string)=>string[])=>{
    const seen=new Set<string>()
    const queue=[start]
    while(queue.length){
      const id=queue.shift() as string
      for(const n of next(id)) if(!seen.has(n)){seen.add(n);queue.push(n)}
    }
    return seen
  }
  const up=walk(selected,id=>descent.filter(link=>String(link.to)===id).map(link=>String(link.from)))
  const down=walk(selected,id=>descent.filter(link=>String(link.from)===id).map(link=>String(link.to)))
  return new Set([selected,...up,...down])
}

/** Taxa joined to the selected one by documented gene flow (shown separately from lineage). */
export function geneFlowPartners(selected:string,links:readonly RelationshipRecord[]):Set<string>{
  const out=new Set<string>()
  for(const link of links){
    if(link.type!=='gene-flow') continue
    if(String(link.from)===selected) out.add(String(link.to))
    if(String(link.to)===selected) out.add(String(link.from))
  }
  return out
}
