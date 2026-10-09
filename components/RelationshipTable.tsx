import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerSourceById,getExplorerSpeciesById} from '../features/explorer/selectors'
import {RELATION_SEMANTICS} from '../domain/relationship-semantics'
import {certaintyLabel} from '../domain/labels'
import {relationsOf} from '../presentation/treeSelectors'
import {RelationSwatch} from './RelationshipLegend'
import type {RelationshipRecord} from '../domain/contracts'

const nameOf=(bootstrap:ExplorerBootstrap,id:string)=>{try{return getExplorerSpeciesById(bootstrap,id).short}catch{return id}}

function RelationRow({bootstrap,link,perspective,onShow}:{bootstrap:ExplorerBootstrap;link:RelationshipRecord;perspective?:string;onShow?:(id:string)=>void}){
  const s=RELATION_SEMANTICS[link.relation]
  const from=nameOf(bootstrap,String(link.from)),to=nameOf(bootstrap,String(link.to))
  const sources=link.sourceIds.map(id=>getExplorerSourceById(bootstrap,String(id))).filter(Boolean)
  const age=link.eventAgeMa!==undefined?` · dated signal ≈ ${link.eventAgeMa>=1?`${link.eventAgeMa} Ma`:`${Math.round(link.eventAgeMa*1000)} ka`}`:''
  return <tr>
    <th scope="row">{perspective&&String(link.from)===perspective?<>{from} <span aria-hidden="true">→</span><span className="sr-only">leads to</span> <b>{to}</b></>:perspective?<><b>{from}</b> <span aria-hidden="true">→</span><span className="sr-only">leads to</span> {to}</>:<>{from} <span aria-hidden="true">→</span><span className="sr-only">to</span> {to}</>}</th>
    <td><span className="rel-type"><RelationSwatch relation={link.relation} width={36}/>{s.label}</span></td>
    <td>{s.meaning}{link.note&&<small className="rel-note">{link.note}</small>}<small className="rel-no-claim">{s.doesNotClaim}</small></td>
    <td>{link.certainty?certaintyLabel[link.certainty]:'Not stated'}{age}</td>
    <td>{sources.length?sources.map(src=>src&&<a key={String(src.id)} href={src.url} target="_blank" rel="noreferrer">{src.title}<span className="sr-only"> (opens in a new tab)</span></a>):'No source linked'}</td>
    {onShow&&<td><button type="button" className="rel-show" onClick={()=>onShow(String(link.id))}>Show on graph</button></td>}
  </tr>
}

/**
 * Accessible, text-first equivalent of the evolutionary graph. A real <table>, so screen-reader users get row/column
 * navigation, and the same content is the readable relationship view on small screens.
 */
export default function RelationshipTable({bootstrap,taxonId,onShow}:{bootstrap:ExplorerBootstrap;taxonId?:string;onShow?:(relationshipId:string)=>void}){
  const links=taxonId?(()=>{const r=relationsOf(taxonId,bootstrap.relationships);return [...r.incoming,...r.outgoing,...r.geneFlow]})():bootstrap.relationships
  if(!links.length) return <p className="empty-state">No relationships are recorded for this taxon in the current catalogue. This reflects what the dataset represents, not a finding that none exist.</p>
  const caption=taxonId?`Relationships of ${nameOf(bootstrap,taxonId)}`:'All relationships in the atlas'
  return <div className="rel-table-wrap" role="region" aria-label={caption} tabIndex={0}>
    <table className="rel-table">
      <caption>{caption}</caption>
      <thead><tr><th scope="col">Taxa</th><th scope="col">Type</th><th scope="col">What it means</th><th scope="col">Certainty</th><th scope="col">Sources</th>{onShow&&<th scope="col"><span className="sr-only">Action</span></th>}</tr></thead>
      <tbody>{links.map(link=><RelationRow key={String(link.id)} bootstrap={bootstrap} link={link} perspective={taxonId} onShow={onShow}/>)}</tbody>
    </table>
  </div>
}
