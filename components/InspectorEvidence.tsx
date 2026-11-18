'use client'

import type {ExplorerSpecies as Species} from '../features/explorer/types'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {SourceRecord} from '../domain/contracts'
import {ExternalLink} from 'lucide-react'
import EvidenceGraph from './EvidenceGraph'
import RelationshipHypotheses from './RelationshipHypotheses'
import SourceIntelligence from './SourceIntelligence'

/** Evidence-only modules are kept out of the initial Overview bundle and loaded when the reader opens Evidence. */
export default function InspectorEvidence({bootstrap,species,onRevealSite,sources}:{bootstrap:ExplorerBootstrap;species:Species;onRevealSite:(siteId:string)=>void;sources:readonly SourceRecord[]}){
  return <>
    <EvidenceGraph bootstrap={bootstrap} species={species} onRevealSite={onRevealSite}/>
    <RelationshipHypotheses bootstrap={bootstrap} species={species}/>
    <div className="evidence-panel"><div className="evidence-head"><strong>Source-backed record</strong><span>{sources.length} {sources.length===1?'source':'sources'}</span></div>{sources.map(source=><a className="source-card" key={source.id} href={source.url} target="_blank" rel="noreferrer"><span><b>{source.title}</b><small>{source.note}</small></span><ExternalLink size={14} aria-hidden="true"/><span className="sr-only">(opens in a new tab)</span></a>)}</div>
    <SourceIntelligence bootstrap={bootstrap} species={species}/>
  </>
}
