import type {EvidenceRecord} from '../domain/contracts'
import {asEvidenceId,asTaxonId,asSiteId,asSourceId,asSpecimenId,asOccurrenceId} from '../domain/ids'

const rawEvidence=[
  {
    "id": "neanderthal-1",
    "taxonId": "neanderthal",
    "siteId": "feldhofer",
    "title": "Neanderthal 1 · Feldhofer Cave",
    "kind": "fossil",
    "ageLabel": "Pleistocene",
    "claim": "The specimen recognized in 1856 became the type specimen for Homo neanderthalensis.",
    "sourceIds": [
      "si-feldhofer",
      "si-neanderthal-species"
    ],
    "status": "documented",
    "claimScope": "Specimen identity and historical classification",
    "specimenIds": ["neanderthal-1"],
    "occurrenceIds": ["occ-neanderthal-1"]
  },
  {
    "id": "sima-dna",
    "taxonId": "neanderthal",
    "siteId": "sima-los-huesos",
    "title": "Sima de los Huesos",
    "kind": "genetics",
    "ageLabel": "~430 ka",
    "claim": "Ancient DNA from Sima fossils provides evidence relevant to early Neanderthal-lineage history.",
    "sourceIds": [
      "nature-meyer-2014",
      "si-neanderthal-dna"
    ],
    "status": "documented",
    "claimScope": "Mitochondrial DNA phylogenetic evidence",
    "specimenIds": ["sima-hominins"],
    "occurrenceIds": ["occ-sima-hominins"]
  },
  {
    "id": "neanderthal-dna",
    "taxonId": "neanderthal",
    "siteId": "eurasia",
    "title": "Ancient Neanderthal DNA",
    "kind": "genetics",
    "ageLabel": "~400 ka and younger",
    "claim": "Ancient genomes provide evidence for genetic distinction and admixture involving Neanderthal and modern-human populations.",
    "sourceIds": [
      "science-green-2010",
      "si-neanderthal-dna"
    ],
    "status": "documented",
    "claimScope": "Nuclear genome comparison and gene flow"
  },
  {
    "id": "jebel-irhoud",
    "taxonId": "sapiens",
    "siteId": "jebel-irhoud",
    "title": "Jebel Irhoud fossils",
    "kind": "fossil",
    "ageLabel": "315 ± 34 ka",
    "claim": "Jebel Irhoud preserves early Homo sapiens fossils and associated Middle Stone Age material.",
    "sourceIds": [
      "nature-hublin-2017",
      "nature-richter-2017",
      "nature-richter-correction",
      "si-sapiens-300ka"
    ],
    "status": "documented",
    "datingMethod": "Thermoluminescence; U-series/ESR support",
    "claimScope": "Fossil attribution and chronology",
    "specimenIds": ["jebel-irhoud"],
    "occurrenceIds": ["occ-jebel-irhoud"]
  },
  {
    "id": "dmanisi-d2282",
    "taxonId": "erectus",
    "siteId": "dmanisi",
    "title": "Dmanisi D2282",
    "kind": "fossil",
    "ageLabel": "~1.77–1.8 Ma",
    "claim": "A Homo skull from Dmanisi documents an early human presence in Eurasia outside Africa.",
    "sourceIds": [
      "si-d2282",
      "quageo-dmanisi-2010"
    ],
    "status": "documented",
    "datingMethod": "40Ar/39Ar of associated volcanic material",
    "claimScope": "Specimen record and site chronology",
    "specimenIds": ["d2282"],
    "occurrenceIds": ["occ-d2282"]
  },
  {
    "id": "migration-evidence",
    "taxonId": "sapiens",
    "siteId": "global",
    "title": "Fossil + archaeology + genetics",
    "kind": "archaeology",
    "ageLabel": "multiple periods",
    "claim": "Migration histories are reconstructed from multiple evidence streams rather than a single route.",
    "sourceIds": [
      "si-human-evidence",
      "si-dispersal-summary"
    ],
    "status": "interpreted",
    "claimScope": "Cross-source synthesis of dispersal evidence"
  },
  {
    "id": "anamensis-knm-kp-29281",
    "taxonId": "anamensis",
    "siteId": "kanapoi",
    "title": "KNM-KP 29281 · Kanapoi",
    "kind": "fossil",
    "ageLabel": "4.2–4.1 Ma",
    "claim": "Kanapoi and Allia Bay fossils define Australopithecus anamensis.",
    "sourceIds": [
      "nature-leakey-1995",
      "nature-haileselassie-2019",
      "si-anamensis-species"
    ],
    "status": "documented",
    "claimScope": "Type material and anamensis–afarensis relationship",
    "specimenIds": [
      "knm-kp-29281"
    ],
    "occurrenceIds": [
      "occ-knm-kp-29281"
    ]
  },
  {
    "id": "naledi-dh1",
    "taxonId": "naledi",
    "siteId": "rising-star",
    "title": "DH1 · Rising Star",
    "kind": "fossil",
    "ageLabel": "335–236 ka",
    "claim": "More than 1,500 hominin elements from the Dinaledi Chamber define Homo naledi.",
    "sourceIds": [
      "elife-berger-2015",
      "elife-dirks-2017",
      "si-naledi-species"
    ],
    "status": "documented",
    "claimScope": "Type material and chronology",
    "specimenIds": [
      "dh1"
    ],
    "occurrenceIds": [
      "occ-dh1"
    ]
  },
  {
    "id": "denisovan-denisova-3",
    "taxonId": "denisovan",
    "siteId": "altai",
    "title": "Denisova 3 · Denisova Cave",
    "kind": "genetics",
    "ageLabel": "~76–52 ka",
    "claim": "DNA from the Denisova 3 finger bone revealed a previously unknown archaic hominin lineage.",
    "sourceIds": [
      "nature-krause-2010",
      "nature-reich-2010"
    ],
    "status": "documented",
    "claimScope": "Genetic identification and admixture",
    "specimenIds": [
      "denisova-3"
    ],
    "occurrenceIds": [
      "occ-denisova-3"
    ]
  },
  {
    "id": "floresiensis-lb1",
    "taxonId": "floresiensis",
    "siteId": "liang-bua",
    "title": "LB1 · Liang Bua",
    "kind": "fossil",
    "ageLabel": "100–60 ka",
    "claim": "LB1 and other Liang Bua remains define Homo floresiensis; revised stratigraphy places the skeletons at ~100–60 ka.",
    "sourceIds": [
      "nature-brown-2004",
      "nature-sutikna-2016",
      "si-floresiensis-species"
    ],
    "status": "documented",
    "claimScope": "Type material and revised chronology",
    "specimenIds": [
      "lb1"
    ],
    "occurrenceIds": [
      "occ-lb1"
    ]
  },
  {
    "id": "afarensis-al-288-1",
    "taxonId": "afarensis",
    "siteId": "hadar",
    "title": "A.L. 288-1 · Hadar",
    "kind": "fossil",
    "ageLabel": "~3.2 Ma",
    "claim": "The Lucy partial skeleton documents bipedal anatomy in A. afarensis.",
    "sourceIds": [
      "nature-johanson-1976"
    ],
    "status": "documented",
    "claimScope": "Key specimen",
    "specimenIds": [
      "al-288-1"
    ],
    "occurrenceIds": [
      "occ-al-288-1"
    ]
  },
  {
    "id": "africanus-taung-1",
    "taxonId": "africanus",
    "siteId": "taung",
    "title": "Taung 1 · Taung",
    "kind": "fossil",
    "ageLabel": "~2.8–2.6 Ma",
    "claim": "The Taung child skull was the basis for naming Australopithecus africanus.",
    "sourceIds": [
      "nature-dart-1925"
    ],
    "status": "documented",
    "claimScope": "Type specimen and history",
    "specimenIds": [
      "taung-1"
    ],
    "occurrenceIds": [
      "occ-taung-1"
    ]
  },
  {
    "id": "ardipithecus-ara-vp-6-500",
    "taxonId": "ardipithecus",
    "siteId": "aramis",
    "title": "ARA-VP-6/500 · Aramis",
    "kind": "fossil",
    "ageLabel": "~4.4 Ma",
    "claim": "The Ardi partial skeleton documents Ar. ramidus anatomy.",
    "sourceIds": [
      "science-white-2009"
    ],
    "status": "documented",
    "claimScope": "Key specimen and locomotion",
    "specimenIds": [
      "ara-vp-6-500"
    ],
    "occurrenceIds": [
      "occ-ara-vp-6-500"
    ]
  },
  {
    "id": "ergaster-knm-wt-15000",
    "taxonId": "ergaster",
    "siteId": "nariokotome",
    "title": "KNM-WT 15000 · Nariokotome",
    "kind": "fossil",
    "ageLabel": "~1.5 Ma",
    "claim": "The Turkana Boy skeleton documents early African Homo erectus / ergaster body form.",
    "sourceIds": [
      "nature-brown-1985"
    ],
    "status": "documented",
    "claimScope": "Key specimen",
    "specimenIds": [
      "knm-wt-15000"
    ],
    "occurrenceIds": [
      "occ-knm-wt-15000"
    ]
  }
] as const
export const evidenceRecords:EvidenceRecord[]=rawEvidence.map(item=>({
  ...item,
  id:asEvidenceId(item.id),
  taxonId:asTaxonId(item.taxonId),
  siteId:asSiteId(item.siteId),
  sourceIds:item.sourceIds.map(asSourceId),
  sourceLinks:item.sourceIds.map(sourceId=>({sourceId:asSourceId(sourceId),role:('datingMethod' in item && item.datingMethod)?'dates' as const:item.status==='documented'?'documents' as const:'contextualizes' as const})),
  specimenIds:'specimenIds' in item ? item.specimenIds.map(asSpecimenId):undefined,
  occurrenceIds:'occurrenceIds' in item ? item.occurrenceIds.map(asOccurrenceId):undefined,
}))
