import type {RelationshipHypothesisPositionRecord,RelationshipHypothesisSetRecord,SourceLink} from '../domain/contracts'
import {asRelationshipId,asRelationshipHypothesisPositionId,asRelationshipHypothesisSetId,asSourceId} from '../domain/ids'

const rawSets=[
  {
    id:'relhyp-ergaster-erectus',
    relationshipId:'rel-ergaster-erectus-10',
    question:'Is Homo ergaster a separate species from Homo erectus?',
    scope:'Taxonomic splitting vs lumping',
    note:'The atlas keeps a single lineage line between these labels while flagging that their species-level separation is not settled.',
    positions:[
      {
        id:'relhyp-pos-ergaster-separate',
        label:'Treated as a distinct African species',
        summary:'Some researchers keep Homo ergaster as a separate early African species, distinguished from Asian Homo erectus by cranial and postcranial differences.',
        kind:'alternative-interpretation' as const,
        sourceIds:['si-human-species-index'],
        sourceLinks:[{sourceId:'si-human-species-index',role:'interprets'} as SourceLink],
      },
      {
        id:'relhyp-pos-ergaster-synonymous',
        label:'Treated as early African Homo erectus',
        summary:'Other researchers treat "ergaster" as a regional/temporal variant within a single, widely-distributed Homo erectus species rather than a separate one.',
        kind:'documented-interpretation' as const,
        sourceIds:['si-human-species-index'],
        sourceLinks:[{sourceId:'si-human-species-index',role:'documents'} as SourceLink],
      },
    ],
  },
  {
    id:'relhyp-erectus-heidelbergensis',
    relationshipId:'rel-erectus-heidelbergensis-11',
    question:'Does Homo heidelbergensis mark a real species boundary above Homo erectus?',
    scope:'Middle Pleistocene taxonomic boundary',
    note:'Middle Pleistocene Homo fossils are unevenly distributed and inconsistently classified across research groups; the atlas does not resolve this into a single settled boundary.',
    positions:[
      {
        id:'relhyp-pos-heidelbergensis-distinct',
        label:'A distinct transitional species',
        summary:'Many researchers use Homo heidelbergensis for a distinct Middle Pleistocene population ancestral to both Neanderthals and modern humans.',
        kind:'documented-interpretation' as const,
        sourceIds:['si-human-species-index'],
        sourceLinks:[{sourceId:'si-human-species-index',role:'documents'} as SourceLink],
      },
      {
        id:'relhyp-pos-heidelbergensis-caution',
        label:'Boundary and membership remain contested',
        summary:'Which fossils belong under this label, and whether it is a coherent species rather than a grade spanning late Homo erectus and early Neanderthal/Denisovan populations, is actively debated -- sometimes called the "muddle in the middle."',
        kind:'methodological-caution' as const,
        sourceIds:['si-human-species-index'],
        sourceLinks:[{sourceId:'si-human-species-index',role:'contextualizes'} as SourceLink],
      },
    ],
  },
  {
    id:'relhyp-paranthropus-origin',
    relationshipId:'rel-afarensis-robustus-7',
    question:'Do the robust australopiths (Paranthropus) form a single natural group?',
    scope:'Clade membership of P. boisei and P. robustus',
    note:'The atlas draws P. boisei and P. robustus as sibling branches off an australopith stem without asserting which model is correct.',
    positions:[
      {
        id:'relhyp-pos-paranthropus-monophyletic',
        label:'One robust lineage',
        summary:'Most phylogenetic analyses group P. aethiopicus, P. boisei and P. robustus into a single genus that shares a common robust ancestor.',
        kind:'documented-interpretation' as const,
        sourceIds:['si-human-species-index'],
        sourceLinks:[{sourceId:'si-human-species-index',role:'documents'} as SourceLink],
      },
      {
        id:'relhyp-pos-paranthropus-parallel',
        label:'Parallel robust adaptations',
        summary:'Some researchers argue the shared heavy-chewing anatomy evolved independently, with P. robustus derived from a southern African australopith such as A. africanus rather than sharing a robust ancestor with P. boisei.',
        kind:'alternative-interpretation' as const,
        sourceIds:['si-human-species-index'],
        sourceLinks:[{sourceId:'si-human-species-index',role:'interprets'} as SourceLink],
      },
    ],
  },
  {
    id:'relhyp-floresiensis-origin',
    relationshipId:'rel-erectus-floresiensis-24',
    question:'Where does Homo floresiensis come from?',
    scope:'Ancestry of the Flores hominin',
    note:'The atlas draws a debated line from H. erectus only to place H. floresiensis in Homo; it does not settle the ancestry.',
    positions:[
      {
        id:'relhyp-pos-floresiensis-dwarfing',
        label:'Island-dwarfed Homo erectus',
        summary:'H. floresiensis descends from an Asian H. erectus population that became smaller after reaching Flores, an example of island dwarfing.',
        kind:'documented-interpretation' as const,
        sourceIds:['si-floresiensis-species'],
        sourceLinks:[{sourceId:'si-floresiensis-species',role:'documents'} as SourceLink],
      },
      {
        id:'relhyp-pos-floresiensis-early-homo',
        label:'An earlier small-bodied Homo lineage',
        summary:'Features of the skull, wrist and feet resemble earlier Homo such as H. habilis, so the lineage may come from an older, already small-bodied Homo that left Africa early.',
        kind:'alternative-interpretation' as const,
        sourceIds:['nature-brown-2004'],
        sourceLinks:[{sourceId:'nature-brown-2004',role:'interprets'} as SourceLink],
      },
    ],
  },
  {
    id:'relhyp-anamensis-afarensis',
    relationshipId:'rel-anamensis-afarensis-4',
    question:'Did Australopithecus anamensis simply turn into A. afarensis?',
    scope:'Anagenesis vs. branching in early Australopithecus',
    note:'The atlas keeps an ancestor line from A. anamensis to A. afarensis while showing that the two may have overlapped in time.',
    positions:[
      {
        id:'relhyp-pos-anamensis-anagenesis',
        label:'One lineage changing over time',
        summary:'A. anamensis gradually evolved into A. afarensis within a single lineage (anagenesis), the long-standing reading of the East African record.',
        kind:'documented-interpretation' as const,
        sourceIds:['si-anamensis-species'],
        sourceLinks:[{sourceId:'si-anamensis-species',role:'documents'} as SourceLink],
      },
      {
        id:'relhyp-pos-anamensis-overlap',
        label:'Branching with a period of overlap',
        summary:'The 3.8 Ma MRD cranium and the 3.9 Ma Belohdelie frontal suggest that A. afarensis branched off while A. anamensis still lived, so the two coexisted for at least ~100 kyr.',
        kind:'alternative-interpretation' as const,
        sourceIds:['nature-haileselassie-2019'],
        sourceLinks:[{sourceId:'nature-haileselassie-2019',role:'interprets'} as SourceLink],
      },
    ],
  },
] as const

const sourceIdsBySet=new Map<string,string[]>()
for(const set of rawSets){
  const sourceIds=[...new Set(set.positions.flatMap(position=>position.sourceIds))]
  sourceIdsBySet.set(set.id,sourceIds)
}

export const relationshipHypothesisSets:readonly RelationshipHypothesisSetRecord[]=rawSets.map(item=>({
  id:asRelationshipHypothesisSetId(item.id),
  relationshipId:asRelationshipId(item.relationshipId),
  question:item.question,
  scope:item.scope,
  positionIds:item.positions.map(position=>asRelationshipHypothesisPositionId(position.id)),
  sourceIds:(sourceIdsBySet.get(item.id)??[]).map(asSourceId),
  sourceLinks:(sourceIdsBySet.get(item.id)??[]).map(sourceId=>({sourceId:asSourceId(sourceId),role:'interprets' as const})),
  note:item.note,
}))

export const relationshipHypothesisPositions:readonly RelationshipHypothesisPositionRecord[]=rawSets.flatMap(item=>item.positions.map(position=>({
  id:asRelationshipHypothesisPositionId(position.id),
  setId:asRelationshipHypothesisSetId(item.id),
  label:position.label,
  summary:position.summary,
  kind:position.kind,
  sourceIds:position.sourceIds.map(asSourceId),
  sourceLinks:position.sourceLinks.map(link=>({sourceId:asSourceId(String(link.sourceId)),role:link.role,note:link.note})),
})))
