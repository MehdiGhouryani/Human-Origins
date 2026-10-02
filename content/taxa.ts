import type {TaxonRecord,TaxonRank,TaxonomicStatus} from '../domain/contracts'
import {asTaxonId,asMediaAssetId,asSourceId,asTaxonNameId} from '../domain/ids'

const rawTaxa=[
  {
    "id": "common",
    "name": "Human–Chimpanzee Common Ancestor",
    "short": "Common ancestor",
    "group": "Early hominins",
    "date": "~8–6 Ma",
    "start": 8,
    "end": 6,
    "status": "extinct",
    "description": "The last common ancestor of humans and living chimpanzees has not been identified as a single fossil species. The split is inferred from comparative genetics and the late-Miocene fossil record.",
    "facts": [
      [
        "Time window",
        "~8–6 million years"
      ],
      [
        "Evidence",
        "Comparative + fossil context"
      ],
      [
        "Status",
        "Not directly identified"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:common",
    "mediaIds": [
      "media:common"
    ],
    "certainty": "debated",
    "taxonomicStatus": "informal",
    "rank": "informal-node",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "sahelanthropus",
    "name": "Sahelanthropus tchadensis",
    "short": "Sahelanthropus",
    "group": "Early hominins",
    "date": "~7–6 Ma",
    "start": 7,
    "end": 6,
    "status": "extinct",
    "description": "An early hominin from Chad known from cranial remains. Its anatomy has been central to debates about early hominin locomotion and the timing of the human–ape divergence.",
    "facts": [
      [
        "Time range",
        "~7–6 million years"
      ],
      [
        "Region",
        "West-Central Africa"
      ],
      [
        "Evidence",
        "Fossil"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:sahelanthropus",
    "mediaIds": [
      "media:sahelanthropus"
    ],
    "certainty": "medium",
    "sourceIds": [
      "si-sahelanthropus-species",
      "si-toumai"
    ]
  },
  {
    "id": "orrin",
    "name": "Orrorin tugenensis",
    "short": "Orrorin",
    "group": "Early hominins",
    "date": "~6–5.8 Ma",
    "start": 6,
    "end": 5.8,
    "status": "extinct",
    "description": "A Kenyan hominin represented by several fossils, including femoral material used in interpretations of locomotion.",
    "facts": [
      [
        "Time range",
        "~6–5.8 Ma"
      ],
      [
        "Region",
        "East Africa"
      ],
      [
        "Evidence",
        "Fossil"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:orrin",
    "mediaIds": [
      "media:orrin"
    ],
    "certainty": "medium",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "ardipithecus",
    "name": "Ardipithecus ramidus",
    "short": "Ardipithecus",
    "group": "Early hominins",
    "date": "~4.5–4.3 Ma",
    "start": 4.5,
    "end": 4.3,
    "status": "extinct",
    "description": "An early hominin from the Middle Awash of Ethiopia, best known from the partial skeleton ARA-VP-6/500 (\"Ardi\", ~4.4 Ma). Its anatomy combines features relevant to terrestrial bipedalism with an opposable big toe used in climbing. The older Ardipithecus kadabba (~5.8–5.2 Ma) is a separate species and is not merged into this record.",
    "facts": [
      [
        "Time range",
        "~4.5–4.3 Ma"
      ],
      [
        "Region",
        "East Africa"
      ],
      [
        "Evidence",
        "Fossil"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:ardipithecus",
    "mediaIds": [
      "media:ardipithecus"
    ],
    "certainty": "high",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "afarensis",
    "name": "Australopithecus afarensis",
    "short": "A. afarensis",
    "group": "Australopithecines",
    "date": "~3.9–2.9 Ma",
    "start": 3.9,
    "end": 2.9,
    "status": "extinct",
    "description": "A well-documented australopithecine from eastern Africa, represented by many fossils and evidence for habitual bipedal locomotion.",
    "facts": [
      [
        "Time range",
        "~3.9–2.9 Ma"
      ],
      [
        "Region",
        "East Africa"
      ],
      [
        "Locomotion",
        "Habitual bipedalism"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:afarensis",
    "mediaIds": [
      "media:afarensis"
    ],
    "certainty": "high",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "africanus",
    "name": "Australopithecus africanus",
    "short": "A. africanus",
    "group": "Australopithecines",
    "date": "~3.3–2.1 Ma",
    "start": 3.3,
    "end": 2.1,
    "status": "extinct",
    "description": "A southern African australopithecine represented by important fossil finds.",
    "facts": [
      [
        "Time range",
        "~3.3–2.1 Ma"
      ],
      [
        "Region",
        "Southern Africa"
      ],
      [
        "Evidence",
        "Fossil"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:africanus",
    "mediaIds": [
      "media:africanus"
    ],
    "certainty": "medium",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "boisei",
    "name": "Paranthropus boisei",
    "short": "P. boisei",
    "group": "Paranthropus",
    "date": "~2.3–1.2 Ma",
    "start": 2.3,
    "end": 1.2,
    "status": "extinct",
    "description": "A robust australopith known for powerful chewing anatomy and a substantial eastern African fossil record.",
    "facts": [
      [
        "Time range",
        "~2.3–1.2 Ma"
      ],
      [
        "Region",
        "East Africa"
      ],
      [
        "Anatomy",
        "Robust chewing apparatus"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:boisei",
    "mediaIds": [
      "media:boisei"
    ],
    "certainty": "high",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "robustus",
    "name": "Paranthropus robustus",
    "short": "P. robustus",
    "group": "Paranthropus",
    "date": "~2.0–1.2 Ma",
    "start": 2,
    "end": 1.2,
    "status": "extinct",
    "description": "A robust australopith from southern Africa, known for specialized cranial and dental anatomy.",
    "facts": [
      [
        "Time range",
        "~2.0–1.2 Ma"
      ],
      [
        "Region",
        "Southern Africa"
      ],
      [
        "Anatomy",
        "Robust cranial form"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:robustus",
    "mediaIds": [
      "media:robustus"
    ],
    "certainty": "medium",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "habilis",
    "name": "Homo habilis",
    "short": "H. habilis",
    "group": "Homo",
    "date": "~2.4–1.4 Ma",
    "start": 2.4,
    "end": 1.4,
    "status": "extinct",
    "description": "An early Homo taxon from Africa, associated with changing cranial anatomy and early stone-tool contexts.",
    "facts": [
      [
        "Brain size",
        "~500–700 cc"
      ],
      [
        "Region",
        "Africa"
      ],
      [
        "Tools",
        "Early stone tools"
      ]
    ],
    "evidence": [
      "Fossil",
      "Archaeology",
      "Dating"
    ],
    "defaultMediaId": "media:habilis",
    "mediaIds": [
      "media:habilis"
    ],
    "certainty": "medium",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "ergaster",
    "name": "Homo ergaster",
    "short": "H. ergaster",
    "group": "Homo",
    "date": "~2.0–1.4 Ma",
    "start": 2,
    "end": 1.4,
    "status": "extinct",
    "description": "An African Homo form often discussed alongside early Homo erectus and major changes in body proportions.",
    "facts": [
      [
        "Time range",
        "~2.0–1.4 Ma"
      ],
      [
        "Region",
        "Africa"
      ],
      [
        "Anatomy",
        "More human-like body proportions"
      ]
    ],
    "evidence": [
      "Fossil",
      "Archaeology",
      "Dating"
    ],
    "defaultMediaId": "media:ergaster",
    "mediaIds": [
      "media:ergaster"
    ],
    "certainty": "medium",
    "taxonomicStatus": "debated",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "erectus",
    "name": "Homo erectus",
    "short": "H. erectus",
    "group": "Homo",
    "date": "~1.9 Ma–100 ka",
    "start": 1.9,
    "end": 0.1,
    "status": "extinct",
    "description": "A long-lived Homo lineage associated with major dispersals across Africa and Eurasia and diverse archaeological traditions.",
    "facts": [
      [
        "Time range",
        "~1.9 Ma–100 ka"
      ],
      [
        "Region",
        "Africa + Eurasia"
      ],
      [
        "Tools",
        "Acheulean and other technologies"
      ]
    ],
    "evidence": [
      "Fossil",
      "Archaeology",
      "Dating"
    ],
    "defaultMediaId": "media:erectus",
    "mediaIds": [
      "media:erectus"
    ],
    "certainty": "high",
    "sourceIds": [
      "si-human-species-index"
    ]
  },
  {
    "id": "heidelbergensis",
    "name": "Homo heidelbergensis",
    "short": "H. heidelbergensis",
    "group": "Homo",
    "date": "~700–200 ka",
    "start": 0.7,
    "end": 0.2,
    "status": "extinct",
    "description": "A Middle Pleistocene Homo group frequently discussed in relation to later Neanderthal and modern-human lineages. The exact ancestry model remains an active research topic.",
    "facts": [
      [
        "Time range",
        "~700–200 ka"
      ],
      [
        "Region",
        "Africa + Eurasia"
      ],
      [
        "Relationship",
        "Later Homo diversity"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:heidelbergensis",
    "mediaIds": [
      "media:heidelbergensis"
    ],
    "certainty": "medium",
    "taxonomicStatus": "debated",
    "sourceIds": [
      "si-sapiens-species"
    ]
  },
  {
    "id": "neanderthal",
    "name": "Homo neanderthalensis",
    "short": "Neanderthals",
    "group": "Neanderthals",
    "date": "~430–40 ka",
    "start": 0.43,
    "end": 0.04,
    "status": "extinct",
    "description": "Neanderthals lived across Europe and parts of western Asia. Their fossil, archaeological and genetic record documents a distinct human lineage that interacted and exchanged genes with some modern-human populations.",
    "facts": [
      [
        "Brain size",
        "~1,200–1,750 cc"
      ],
      [
        "Range",
        "Europe + W. Asia"
      ],
      [
        "Tools",
        "Mousterian traditions"
      ],
      [
        "Status",
        "Extinct"
      ]
    ],
    "evidence": [
      "Fossil",
      "Archaeology",
      "Genetics",
      "Dating"
    ],
    "defaultMediaId": "media:neanderthal",
    "mediaIds": [
      "media:neanderthal"
    ],
    "certainty": "high",
    "sourceIds": [
      "si-neanderthal-species",
      "si-neanderthal-dna"
    ]
  },
  {
    "id": "sapiens",
    "name": "Homo sapiens",
    "short": "H. sapiens",
    "group": "Modern humans",
    "date": "~315 ka–Present",
    "start": 0.315,
    "end": 0,
    "status": "living",
    "description": "Our species emerged in Africa and later dispersed around the world. Fossils, archaeology and genetics together reveal a complex history of migration and interaction.",
    "facts": [
      [
        "Origin",
        "Africa"
      ],
      [
        "Time range",
        "~315 ka–present"
      ],
      [
        "Range",
        "Worldwide"
      ],
      [
        "Status",
        "Living"
      ]
    ],
    "evidence": [
      "Fossil",
      "Archaeology",
      "Genetics",
      "Dating"
    ],
    "defaultMediaId": "media:sapiens",
    "mediaIds": [
      "media:sapiens"
    ],
    "certainty": "high",
    "sourceIds": [
      "si-sapiens-species"
    ]
  },
  {
    "id": "anamensis",
    "name": "Australopithecus anamensis",
    "short": "A. anamensis",
    "group": "Australopithecines",
    "date": "~4.2–3.8 Ma",
    "start": 4.2,
    "end": 3.8,
    "status": "extinct",
    "description": "The earliest well-established species of Australopithecus, named in 1995 from Kanapoi and Allia Bay in Kenya. A tibia indicates bipedal walking. The 3.8-million-year-old MRD cranium from Woranso-Mille (Ethiopia) gave the species a face and suggests it overlapped for a time with A. afarensis rather than turning into it in a simple straight line.",
    "facts": [
      [
        "Time range",
        "~4.2–3.8 Ma"
      ],
      [
        "Region",
        "Kenya + Ethiopia"
      ],
      [
        "Locomotion",
        "Bipedal (tibia)"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:anamensis",
    "mediaIds": [
      "media:anamensis"
    ],
    "sourceIds": [
      "si-anamensis-species",
      "nature-leakey-1995",
      "nature-haileselassie-2019"
    ],
    "certainty": "high"
  },
  {
    "id": "naledi",
    "name": "Homo naledi",
    "short": "H. naledi",
    "group": "Homo",
    "date": "~335–236 ka",
    "start": 0.335,
    "end": 0.236,
    "status": "extinct",
    "description": "Known from more than 1,500 fossil elements found in the Rising Star cave system, South Africa, and named in 2015. It pairs a small brain (~465–610 cc) with Homo-like hands and feet. Its young age (~335–236 ka) means that a small-brained hominin survived in Africa while Homo sapiens was emerging. How the remains got into the cave is still under study.",
    "facts": [
      [
        "Time range",
        "~335–236 ka"
      ],
      [
        "Region",
        "Rising Star cave, South Africa"
      ],
      [
        "Brain size",
        "~465–610 cc"
      ]
    ],
    "evidence": [
      "Fossil",
      "Dating"
    ],
    "defaultMediaId": "media:naledi",
    "mediaIds": [
      "media:naledi"
    ],
    "sourceIds": [
      "si-naledi-species",
      "elife-berger-2015",
      "elife-dirks-2017"
    ],
    "certainty": "high"
  },
  {
    "id": "denisovan",
    "name": "Denisovans",
    "short": "Denisovans",
    "group": "Denisovans",
    "date": "~200–50 ka (fossil & DNA record)",
    "start": 0.2,
    "end": 0.05,
    "status": "extinct",
    "description": "An archaic human population first identified in 2010 from the DNA of a finger bone found in Denisova Cave, Siberia, rather than from a named fossil species. Genomes show Denisovans as a sister group of Neanderthals and record gene flow into the ancestors of present-day Melanesians and other populations. The Xiahe mandible from the Tibetan Plateau (≥160 ka) was identified as Denisovan from ancient proteins. Formal naming is still debated.",
    "facts": [
      [
        "Record",
        "~200–50 ka"
      ],
      [
        "Region",
        "Siberia + East Asia"
      ],
      [
        "Evidence",
        "Genomes, proteins, few fossils"
      ],
      [
        "Status",
        "Informal group (not a formally named species)"
      ]
    ],
    "evidence": [
      "Fossil",
      "Genetics",
      "Dating"
    ],
    "defaultMediaId": "media:denisovan",
    "mediaIds": [
      "media:denisovan"
    ],
    "sourceIds": [
      "nature-krause-2010",
      "nature-reich-2010",
      "nature-chen-2019"
    ],
    "certainty": "medium",
    "taxonomicStatus": "informal",
    "rank": "informal-node"
  },
  {
    "id": "floresiensis",
    "name": "Homo floresiensis",
    "short": "H. floresiensis",
    "group": "Homo",
    "date": "~100–60 ka (fossils)",
    "start": 0.1,
    "end": 0.06,
    "status": "extinct",
    "description": "A small-bodied hominin (~1.1 m tall, brain ~426 cc) from Liang Bua cave on Flores, Indonesia, named in 2004 from the LB1 skeleton. Revised dating places the skeletal remains at ~100–60 ka and stone tools at ~190–50 ka. Whether it descends from island-dwarfed Homo erectus or from an earlier small-bodied Homo is debated.",
    "facts": [
      [
        "Fossil age",
        "~100–60 ka"
      ],
      [
        "Region",
        "Flores, Indonesia"
      ],
      [
        "Height",
        "~1.1 m"
      ],
      [
        "Brain size",
        "~426 cc"
      ]
    ],
    "evidence": [
      "Fossil",
      "Archaeology",
      "Dating"
    ],
    "defaultMediaId": "media:floresiensis",
    "mediaIds": [
      "media:floresiensis"
    ],
    "sourceIds": [
      "si-floresiensis-species",
      "nature-brown-2004",
      "nature-sutikna-2016"
    ],
    "certainty": "high"
  }
] as const
type RawTaxon=typeof rawTaxa[number]
const certaintyOf=(item:RawTaxon)=>item.certainty
const taxonomicStatusOf=(item:RawTaxon):TaxonomicStatus=>'taxonomicStatus' in item ? item.taxonomicStatus : 'accepted'
const rankOf=(item:RawTaxon):TaxonRank=>'rank' in item ? item.rank : 'species'

export const taxa:TaxonRecord[]=rawTaxa.map(item=>{
  const rank=rankOf(item)
  const taxonomicStatus=taxonomicStatusOf(item)
  const informal=rank==='informal-node'
  return {
    id:asTaxonId(item.id),
    name:item.name,
    short:item.short,
    group:item.group,
    date:item.date,
    start:item.start,
    end:item.end,
    status:item.status,
    description:item.description,
    defaultMediaId:asMediaAssetId(item.defaultMediaId),
    mediaIds:item.mediaIds.map(asMediaAssetId),
    sourceIds:item.sourceIds.map(asSourceId),
    facts:item.facts.map(([label,value])=>[label,value] as [string,string]),
    evidence:[...item.evidence],
    taxonomy:{
      rank,
      scientificName:item.name,
      taxonomicStatus,
      nomenclaturalCode:informal||taxonomicStatus==='informal'?undefined:'ICZN' as const,
      identifiers:[],
      nameUsageIds:[asTaxonNameId(`taxon-name-${item.id}`)],
      notes:item.id==='common'
        ?'Inferred lineage node; not a formally named fossil species.'
        :taxonomicStatus==='informal'?'Informal population label; not a formally named species under the ICZN.'
        :taxonomicStatus==='debated'?'Species status or boundaries are actively debated; see the competing hypotheses and sources.':undefined,
    },
    // Chronology certainty is curated per taxon (it used to be hard-coded to "high" for every species).
    chronology:{olderMa:item.start,youngerMa:item.end,label:item.date,sourceIds:item.sourceIds.map(asSourceId),estimateKind:item.start===item.end?'point' as const:'interval' as const,certainty:certaintyOf(item)},
    sourceLinks:item.sourceIds.map(sourceId=>({sourceId:asSourceId(String(sourceId)),role:'contextualizes' as const})),
  }
})
