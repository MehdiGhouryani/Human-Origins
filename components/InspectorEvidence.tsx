'use client'

import type {ExplorerSpecies as Species} from '../features/explorer/types'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import EvidenceGraph from './EvidenceGraph'
import RelationshipHypotheses from './RelationshipHypotheses'

/** Evidence-only modules are kept out of the initial Overview bundle and loaded when the reader opens Evidence. */
export default function InspectorEvidence({bootstrap,species,onRevealSite}:{bootstrap:ExplorerBootstrap;species:Species;onRevealSite:(siteId:string)=>void}){
  return <>
    <EvidenceGraph bootstrap={bootstrap} species={species} onRevealSite={onRevealSite}/>
    <RelationshipHypotheses bootstrap={bootstrap} species={species}/>
  </>
}
