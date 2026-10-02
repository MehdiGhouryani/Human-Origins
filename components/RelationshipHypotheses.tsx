import {GitCompare} from 'lucide-react'
import type {ExplorerSpecies} from '../features/explorer/types'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerRelationships,getExplorerRelationshipHypothesisPositions,getExplorerRelationshipHypothesisSets,getExplorerSpeciesById} from '../features/explorer/selectors'
import {interpretationKindLabel} from '../domain/labels'

export default function RelationshipHypotheses({bootstrap,species}:{bootstrap:ExplorerBootstrap;species:ExplorerSpecies}){
  const entries=getExplorerRelationships(bootstrap)
    .filter(relation=>String(relation.from)===species.id||String(relation.to)===species.id)
    .flatMap(relation=>getExplorerRelationshipHypothesisSets(bootstrap,String(relation.id)).map(set=>({relation,set})))
  if(!entries.length) return null
  const nameOf=(id:string)=>getExplorerSpeciesById(bootstrap,id)?.name??id
  return <div className="interpretation-block" aria-label="Competing relationship hypotheses">
    <div className="claim-subhead"><span><GitCompare size={11}/> COMPETING RELATIONSHIP HYPOTHESES</span><small>{entries.length} set{entries.length===1?'':'s'}</small></div>
    {entries.map(({relation,set})=><div className="interpretation-set" key={String(set.id)}>
      <div className="interpretation-question"><strong>{set.question}</strong><small>{nameOf(String(relation.from))} → {nameOf(String(relation.to))} · {set.scope}</small></div>
      <div className="interpretation-positions">{getExplorerRelationshipHypothesisPositions(bootstrap,String(set.id)).map(position=><article className="interpretation-position" key={String(position.id)}><span>{interpretationKindLabel[position.kind]}</span><h5>{position.label}</h5><p>{position.summary}</p></article>)}</div>
    </div>)}
  </div>
}
