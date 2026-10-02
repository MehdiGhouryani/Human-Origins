import type {RelationshipRecord} from '../domain/contracts'
import {asTaxonId,asSourceId,asRelationshipId} from '../domain/ids'

const rawRelationships=[
  {
    "id": "rel-common-sahelanthropus-1",
    "from": "common",
    "to": "sahelanthropus",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-common-orrin-2",
    "from": "common",
    "to": "orrin",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-common-ardipithecus-29",
    "from": "common",
    "to": "ardipithecus",
    "type": "possible",
    "label": "possible / debated relationship",
    "note": "Ardipithecus is one of the earliest well-documented hominins; it is drawn from the inferred common-ancestor node because no named older species is shown as its direct ancestor (Ar. kadabba is not displayed in this curated tree).",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "rel-ardipithecus-anamensis-16",
    "from": "ardipithecus",
    "to": "anamensis",
    "type": "possible",
    "label": "possible / debated relationship",
    "note": "Ardipithecus is often discussed as close to the ancestry of Australopithecus, but a direct ancestor–descendant link is not established.",
    "sourceIds": [
      "si-anamensis-species"
    ]
  },
  {
    "id": "rel-anamensis-afarensis-4",
    "from": "anamensis",
    "to": "afarensis",
    "type": "possible",
    "label": "likely ancestor, with temporal overlap",
    "note": "A. anamensis has long been treated as the direct ancestor of A. afarensis; the MRD cranium suggests the two overlapped for at least ~100 kyr, so the transition was not a simple straight-line change.",
    "sourceIds": [
      "si-anamensis-species",
      "nature-haileselassie-2019"
    ]
  },
  {
    "id": "rel-afarensis-africanus-5",
    "from": "afarensis",
    "to": "africanus",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-afarensis-boisei-30",
    "from": "afarensis",
    "to": "boisei",
    "type": "context",
    "label": "Paranthropus branches from an australopith stem",
    "note": "Robust australopiths arise from within Australopithecus; an A. afarensis-grade stem is a common, not settled, interpretation. The earlier East African robust form P. aethiopicus is often treated as the ancestor of P. boisei but is not displayed in this curated tree.",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "rel-afarensis-robustus-7",
    "from": "afarensis",
    "to": "robustus",
    "type": "context",
    "label": "Paranthropus branches from an australopith stem",
    "note": "Whether P. robustus shares a single robust ancestor with P. boisei or evolved its robust anatomy in parallel from a southern australopith is debated; see the competing hypotheses."
  },
  {
    "id": "rel-afarensis-habilis-8",
    "from": "afarensis",
    "to": "habilis",
    "type": "possible",
    "label": "early Homo arises from an australopith",
    "note": "Early Homo descends from an australopith; which one (A. afarensis, A. garhi, A. sediba or another) is unresolved."
  },
  {
    "id": "rel-habilis-ergaster-9",
    "from": "habilis",
    "to": "ergaster",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-ergaster-erectus-10",
    "from": "ergaster",
    "to": "erectus",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-erectus-naledi-23",
    "from": "erectus",
    "to": "naledi",
    "type": "possible",
    "label": "unresolved placement within Homo",
    "note": "H. naledi's position inside Homo is unresolved; the line is drawn to place it in the genus, not to assert descent from H. erectus.",
    "sourceIds": [
      "si-naledi-species",
      "elife-berger-2015"
    ]
  },
  {
    "id": "rel-erectus-floresiensis-24",
    "from": "erectus",
    "to": "floresiensis",
    "type": "possible",
    "label": "debated origin (see competing hypotheses)",
    "note": "Island dwarfing of H. erectus is one hypothesis; descent from an earlier small-bodied Homo is the main alternative.",
    "sourceIds": [
      "si-floresiensis-species",
      "nature-brown-2004"
    ]
  },
  {
    "id": "rel-erectus-heidelbergensis-11",
    "from": "erectus",
    "to": "heidelbergensis",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-heidelbergensis-neanderthal-12",
    "from": "heidelbergensis",
    "to": "neanderthal",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-heidelbergensis-denisovan-26",
    "from": "heidelbergensis",
    "to": "denisovan",
    "type": "possible",
    "label": "sister lineage of Neanderthals",
    "note": "Genomes place Denisovans as a sister group of Neanderthals; their shared Middle Pleistocene ancestor is not tied to a single named fossil species.",
    "sourceIds": [
      "nature-reich-2010"
    ]
  },
  {
    "id": "rel-heidelbergensis-sapiens-13",
    "from": "heidelbergensis",
    "to": "sapiens",
    "type": "possible",
    "label": "possible / debated relationship"
  },
  {
    "id": "rel-neanderthal-sapiens-14",
    "from": "neanderthal",
    "to": "sapiens",
    "type": "gene-flow",
    "label": "documented gene flow",
    "eventAgeMa": 0.05,
    "sourceIds": [
      "science-green-2010"
    ]
  },
  {
    "id": "rel-denisovan-sapiens-27",
    "from": "denisovan",
    "to": "sapiens",
    "type": "gene-flow",
    "label": "documented gene flow",
    "note": "Denisovan ancestry is present in present-day Melanesian and other Asian-Pacific populations.",
    "eventAgeMa": 0.05,
    "sourceIds": [
      "nature-reich-2010"
    ]
  },
  {
    "id": "rel-neanderthal-denisovan-28",
    "from": "neanderthal",
    "to": "denisovan",
    "type": "gene-flow",
    "label": "documented gene flow",
    "note": "Denisova 11 (~90 ka) was the first-generation child of a Neanderthal mother and a Denisovan father.",
    "eventAgeMa": 0.09,
    "sourceIds": [
      "nature-slon-2018"
    ]
  }
] as const
type RawRelationship=typeof rawRelationships[number]
const certaintyOf=(item:RawRelationship)=>item.type==='gene-flow'?'high' as const:item.type==='possible'?'debated' as const:'medium' as const
// Every edge now names its own sources; the institutional species index is only a fallback for legacy context edges.
const sourceIdsOf=(item:RawRelationship):readonly string[]=>'sourceIds' in item && item.sourceIds.length ? item.sourceIds : ['si-human-species-index']
const roleOf=(item:RawRelationship)=>item.type==='gene-flow'?'supports' as const:'contextualizes' as const

export const relationships:RelationshipRecord[]=rawRelationships.map(item=>({
  // IDs are explicit and stable: deleting or reordering an edge never renames the others. Retired IDs are
  // listed in migrations/ and must never be reused (tests/relationship-ids.test.ts).
  id:asRelationshipId(item.id),
  from:asTaxonId(item.from),
  to:asTaxonId(item.to),
  type:item.type,
  label:item.label,
  note:'note' in item ? item.note : undefined,
  eventAgeMa:'eventAgeMa' in item ? item.eventAgeMa : undefined,
  certainty:certaintyOf(item),
  sourceIds:sourceIdsOf(item).map(asSourceId),
  sourceLinks:sourceIdsOf(item).map(sourceId=>({sourceId:asSourceId(sourceId),role:roleOf(item)})),
}))
