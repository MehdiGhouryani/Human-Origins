import {memo} from 'react'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {RelationshipRecord} from '../domain/contracts'
import {RELATION_SEMANTICS} from '../domain/relationship-semantics'
import {certaintyLabel} from '../domain/labels'
import {taxonStatusLabel} from '../domain/taxon-model'
import {relationsOf} from '../presentation/treeSelectors'
import {getExplorerSpeciesById} from '../features/explorer/selectors'
import {RelationSwatch} from './RelationshipLegend'

type Role='from'|'to'|'gene'

function RelativeCard({bootstrap,link,otherId,role,onSelect}:{bootstrap:ExplorerBootstrap;link:RelationshipRecord;otherId:string;role:Role;onSelect:(id:string)=>void}){
  const other=getExplorerSpeciesById(bootstrap,otherId)
  const s=RELATION_SEMANTICS[link.relation]
  return <li className={`family-card rel-${link.relation}`}>
    <button type="button" className="family-card-name" onClick={()=>onSelect(otherId)}>
      <div className="family-card-header">
        <strong>{other.short}</strong>
        <span className="family-card-rel"><RelationSwatch relation={link.relation} width={30}/><b>{s.label}</b></span>
      </div>
      <small>{other.date} · {taxonStatusLabel(other)}{role==='gene'&&link.eventAgeMa!==undefined?` · ~${link.eventAgeMa>=1?`${link.eventAgeMa} Ma`:`${Math.round(link.eventAgeMa*1000)} ka`} ago`:''}</small>
    </button>
    <details className="family-card-details">
      <summary>{s.meaning}</summary>
      <p className="family-card-no">{s.doesNotClaim}</p>
      <p className="family-card-meta">Certainty: {link.certainty?certaintyLabel[link.certainty]:'not stated'}</p>
    </details>
  </li>
}

/**
 * Relationship view that needs no graph: walk from the selected taxon to what it came from, what leads from it, and
 * where genetic exchange is documented. Rendered compactly and collapsed inside a summary element.
 */
function FamilyView({bootstrap,taxonId,onSelect}:{bootstrap:ExplorerBootstrap;taxonId:string;onSelect:(id:string)=>void}){
  const taxon=getExplorerSpeciesById(bootstrap,taxonId)
  const r=relationsOf(taxonId,bootstrap.relationships)
  const count=r.incoming.length+r.outgoing.length+r.geneFlow.length
  const empty=count===0
  return <section className="family-view" aria-labelledby="family-title">
    <details className="family-view-accordion">
      <summary id="family-title" className="family-view-summary">
        <span>Relationships of <strong>{taxon.short}</strong></span>
        <span className="family-view-badge">{empty?'0 recorded':`${count} connected`}</span>
      </summary>
      <div className="family-view-body">
        {empty&&<p className="empty-state">No relationships recorded for this taxon in the catalogue.</p>}
        {r.incoming.length>0&&<><h4>Drawn from</h4><ul>{r.incoming.map(l=><RelativeCard key={String(l.id)} bootstrap={bootstrap} link={l} otherId={String(l.from)} role="from" onSelect={onSelect}/>)}</ul></>}
        {r.outgoing.length>0&&<><h4>Branches drawn from it</h4><ul>{r.outgoing.map(l=><RelativeCard key={String(l.id)} bootstrap={bootstrap} link={l} otherId={String(l.to)} role="to" onSelect={onSelect}/>)}</ul></>}
        {r.geneFlow.length>0&&<><h4>Documented genetic exchange</h4><ul>{r.geneFlow.map(l=><RelativeCard key={String(l.id)} bootstrap={bootstrap} link={l} otherId={String(l.from)===taxonId?String(l.to):String(l.from)} role="gene" onSelect={onSelect}/>)}</ul></>}
      </div>
    </details>
  </section>
}

// Memoised: the explorer re-renders on every time tick (slider, play); this panel does not depend on time.
export default memo(FamilyView)
