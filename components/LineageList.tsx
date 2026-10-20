'use client'

import {type CSSProperties} from 'react'
import type {ExplorerSpecies} from '../features/explorer/types'
import {RELATION_SEMANTICS} from '../domain/relationship-semantics'
import {isInferredNode} from '../domain/taxon-model'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import {groupColors} from '../presentation/palette'
import {taxonInitials} from './TaxonNavigator'

/** The link that places a taxon under its parent. Gene flow is not ancestry, so it never places a taxon. */
export type ParentLink={from:string|number;relation:keyof typeof RELATION_SEMANTICS}
export type FlowLink={from:string|number;to:string|number}

export type LineageNode={
  item:ExplorerSpecies
  /** e.g. "Proposed descent"; null for a root. */
  relationLabel:string|null
  parentShort:string|null
  /** Short names of the taxa this one exchanges genes with. */
  flowPartners:string[]
  children:LineageNode[]
}

const colorFor=(species:ExplorerSpecies)=>groupColors[species.group as keyof typeof groupColors]??'#28a9ff'
const oldestFirst=(a:ExplorerSpecies,b:ExplorerSpecies)=>b.start-a.start||a.name.localeCompare(b.name)

/**
 * The lineage as a tree. A root is a taxon whose parent link is missing or points outside the drawn graph; every other
 * taxon is nested under the parent that places it. Oldest first at every level. A taxon caught in a cycle is listed as a
 * root, so no taxon ever disappears from the list.
 */
export function buildLineageTree(
  species:readonly ExplorerSpecies[],
  parentLinkById:ReadonlyMap<string,ParentLink>,
  geneFlowById:ReadonlyMap<string,readonly FlowLink[]>,
  byId:ReadonlyMap<string,ExplorerSpecies>,
):LineageNode[]{
  const childrenOf=new Map<string,ExplorerSpecies[]>()
  const roots:ExplorerSpecies[]=[]
  for(const item of species){
    const link=parentLinkById.get(item.id)
    const parentId=link?String(link.from):null
    if(link&&parentId&&parentId!==item.id&&byId.has(parentId)){
      const siblings=childrenOf.get(parentId)??[]
      siblings.push(item)
      childrenOf.set(parentId,siblings)
    } else roots.push(item)
  }
  const reached=new Set<string>()
  const build=(item:ExplorerSpecies):LineageNode|null=>{
    if(reached.has(item.id)) return null
    reached.add(item.id)
    const link=parentLinkById.get(item.id)
    const parent=link?byId.get(String(link.from)):undefined
    const flowPartners=(geneFlowById.get(item.id)??[])
      .map(flow=>byId.get(String(flow.from)===item.id?String(flow.to):String(flow.from))?.short)
      .filter((name):name is string=>Boolean(name))
    const children=(childrenOf.get(item.id)??[]).sort(oldestFirst).map(build).filter((node):node is LineageNode=>node!==null)
    return {
      item,
      relationLabel:link&&parent?(RELATION_SEMANTICS[link.relation]?.label??'Related'):null,
      parentShort:parent?.short??null,
      flowPartners,
      children,
    }
  }
  const nodes=roots.sort(oldestFirst).map(build).filter((node):node is LineageNode=>node!==null)
  for(const item of [...species].sort(oldestFirst)){
    if(reached.has(item.id)) continue
    const node=build(item)
    if(node) nodes.push(node)
  }
  return nodes
}

type Context={
  selected:string
  lineage:ReadonlySet<string>
  currentAge:number
  failedIds:ReadonlySet<string>
  onSelect:(id:string)=>void
  onImageFailed:(id:string)=>void
}

/** Every node in parent-before-child order. Phones use it: nested indentation squeezes the names (11 levels deep). */
export function flattenLineage(roots:readonly LineageNode[]):LineageNode[]{
  const out:LineageNode[]=[]
  const walk=(node:LineageNode)=>{out.push(node);node.children.forEach(walk)}
  roots.forEach(walk)
  return out
}

export function LineageList({roots,flat=false,...context}:{roots:readonly LineageNode[];flat?:boolean}&Context){
  const nodes=flat?flattenLineage(roots):roots
  return <ol className={`atlas-graph-tree${flat?' is-flat':''}`} aria-label="Evolutionary graph as a list, oldest first">
    {nodes.map(node=><TreeItem key={node.item.id} node={node} context={context} flat={flat}/>)}
  </ol>
}

function TreeItem({node,context,flat=false}:{node:LineageNode;context:Context;flat?:boolean}){
  const {item}=node
  const inferred=isInferredNode(item)
  const isSelected=item.id===context.selected
  const alive=!inferred&&context.currentAge<=item.start&&context.currentAge>=item.end
  const media=findMedia(item.media,item.treeIconId)
  const showImage=Boolean(media)&&!context.failedIds.has(item.id)
  const relation=node.relationLabel&&node.parentShort?`${node.relationLabel} · from ${node.parentShort}`:'Root of the drawn graph'
  const className=['atlas-graph-row',isSelected&&'selected',alive&&'in-time',context.lineage.has(item.id)&&'on-lineage'].filter(Boolean).join(' ')
  return <li className="atlas-graph-tree-item">
    <button
      type="button"
      className={className}
      onClick={()=>context.onSelect(item.id)}
      aria-pressed={isSelected}
      aria-label={`${item.name}, ${inferred?'inferred node':item.date}${alive?', alive at the selected time':''}`}
      style={{'--clade':colorFor(item)} as CSSProperties}
    >
      <span className="atlas-graph-row-avatar" aria-hidden="true">
        {showImage&&media
          ?(
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaSrc(media,'icon',128)} alt="" width={36} height={36} loading="lazy" decoding="async" onError={()=>context.onImageFailed(item.id)}/>
          )
          :<b>{inferred?'?':taxonInitials(item.short)}</b>}
      </span>
      <span className="atlas-graph-row-text">
        <strong>{item.short}</strong>
        <small>{inferred?'Inferred node':item.date}{alive?' · alive at selected time':''}</small>
        <span className="atlas-graph-row-rel">
          {relation}
          {node.flowPartners.length>0&&<em> · ⇄ {node.flowPartners.join(', ')}</em>}
        </span>
      </span>
    </button>
    {!flat&&node.children.length>0&&<ol className="atlas-graph-tree-children">
      {node.children.map(child=><TreeItem key={child.item.id} node={child} context={context} flat={flat}/>)}
    </ol>}
  </li>
}
