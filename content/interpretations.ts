import type {InterpretationPositionRecord,InterpretationSetRecord,SourceLink} from '../domain/contracts'
import {asClaimId,asEvidenceId,asInterpretationPositionId,asInterpretationSetId,asSourceId} from '../domain/ids'

const rawSets=[
  {
    id:'interp-heidelbergensis-neanderthal',
    claimId:'claim-neanderthal-heidelbergensis',
    question:'How should the Homo heidelbergensis → Neanderthal relationship be interpreted?',
    status:'multiple-positions' as const,
    scope:'Evolutionary relationship interpretation',
    note:'The interface preserves an explicitly open relationship rather than selecting a single parent–offspring narrative.',
    positions:[
      {
        id:'interp-pos-heidelbergensis-continuity',
        label:'Possible evolutionary continuity',
        summary:'A broad relationship between Middle Pleistocene Homo populations and later Neanderthals can be represented as a possible connection, without asserting a direct ancestor–descendant sequence.',
        kind:'documented-interpretation' as const,
        sourceLinks:[{sourceId:'si-human-species-index',role:'interprets'} as SourceLink],
        evidenceIds:[],
        sourceIds:['si-human-species-index'],
      },
      {
        id:'interp-pos-heidelbergensis-caution',
        label:'Direct ancestry remains unresolved',
        summary:'The fossil record and current high-level species synthesis do not justify converting the relationship into a settled direct parent–offspring claim.',
        kind:'methodological-caution' as const,
        sourceLinks:[{sourceId:'si-human-species-index',role:'contextualizes'} as SourceLink],
        evidenceIds:[],
        sourceIds:['si-human-species-index'],
      },
    ],
  },
  {
    id:'interp-sapiens-dispersal',
    claimId:'claim-sapiens-dispersal',
    question:'How should modern-human dispersal be represented?',
    status:'multiple-positions' as const,
    scope:'Migration narrative interpretation',
    note:'The atlas distinguishes a narrative corridor from a claim that a single route fully explains modern-human expansion.',
    positions:[
      {
        id:'interp-pos-dispersal-single-route-caution',
        label:'Single-route model is insufficient',
        summary:'A single canonical migration line would overstate what the combined fossil, archaeological and genetic record can establish.',
        kind:'methodological-caution' as const,
        sourceLinks:[{sourceId:'si-human-evidence',role:'contextualizes'} as SourceLink],
        evidenceIds:['migration-evidence'],
        sourceIds:['si-human-evidence'],
      },
      {
        id:'interp-pos-dispersal-multiple',
        label:'Multiple dispersals remain part of the synthesis',
        summary:'Institutional educational synthesis describes a changing picture that includes more than one dispersal episode, so the atlas keeps routes generalized and time-bounded.',
        kind:'documented-interpretation' as const,
        sourceLinks:[{sourceId:'si-dispersal-summary',role:'documents'} as SourceLink],
        evidenceIds:['migration-evidence'],
        sourceIds:['si-dispersal-summary'],
      },
    ],
  },
] as const

const sourceIdsBySet=new Map<string,string[]>()
for(const set of rawSets){
  const sourceIds=[...new Set(set.positions.flatMap(position=>position.sourceIds))]
  sourceIdsBySet.set(set.id,sourceIds)
}

export const interpretationSets:readonly InterpretationSetRecord[]=rawSets.map(item=>({
  id:asInterpretationSetId(item.id),
  claimId:asClaimId(item.claimId),
  question:item.question,
  status:item.status,
  scope:item.scope,
  positionIds:item.positions.map(position=>asInterpretationPositionId(position.id)),
  sourceIds:(sourceIdsBySet.get(item.id)??[]).map(asSourceId),
  sourceLinks:(sourceIdsBySet.get(item.id)??[]).map(sourceId=>({sourceId:asSourceId(sourceId),role:'interprets' as const})),
  note:item.note,
}))

export const interpretationPositions:readonly InterpretationPositionRecord[]=rawSets.flatMap(item=>item.positions.map(position=>({
  id:asInterpretationPositionId(position.id),
  setId:asInterpretationSetId(item.id),
  label:position.label,
  summary:position.summary,
  kind:position.kind,
  evidenceIds:position.evidenceIds.map(asEvidenceId),
  sourceIds:position.sourceIds.map(asSourceId),
  sourceLinks:position.sourceLinks.map(link=>({sourceId:asSourceId(String(link.sourceId)),role:link.role,note:link.note})),
})))
