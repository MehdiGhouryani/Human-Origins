import type {MediaAsset,MediaRightsStatus,MediaRole} from '../domain/contracts'
import {asTaxonId,asMediaAssetId,asSourceId} from '../domain/ids'
import {sourceRecords} from './sources'

const rawMedia=[
  {
    "id": "media:common",
    "subjectId": "common",
    "kind": "context-schematic",
    "src": "/assets/species/common-context.svg",
    "sourceUrl": "",
    "credit": "Human Origins interface · original schematic",
    "note": "Schematic only: the human–chimpanzee last common ancestor has not been identified as a single fossil species.",
    "alt": "Schematic context for the inferred human–chimpanzee common-ancestor relationship",
    "publicationStatus": "schematic"
  },
  {
    "id": "media:sahelanthropus",
    "subjectId": "sahelanthropus",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Sahelanthropus_tchadensis_-_TM_266-01-060-1.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Sahelanthropus_tchadensis_-_TM_266-01-060-1.jpg",
    "credit": "Didier Descouens / Wikimedia Commons",
    "license": "CC BY-SA 4.0",
    "note": "Cast of holotype cranium TM 266-01-060-1 (Toumaï).",
    "alt": "Cast of the Sahelanthropus tchadensis holotype cranium TM 266-01-060-1",
    "publicationStatus": "approved"
  },
  {
    "id": "media:orrin",
    "subjectId": "orrin",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/0/04/Orrorin_NMNH.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Orrorin_NMNH.jpg",
    "credit": "Jonathan Chen / Wikimedia Commons",
    "license": "CC BY-SA 4.0",
    "note": "Orrorin tugenensis femur cast (BAR 1002'00), Smithsonian National Museum of Natural History.",
    "alt": "Cast of the Orrorin tugenensis femur specimen BAR 1002'00",
    "publicationStatus": "approved"
  },
  {
    "id": "media:ardipithecus",
    "subjectId": "ardipithecus",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/7/72/Ardipithecus_Ramidus-MGL_96730-P5030040-black.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Ardipithecus_Ramidus-MGL_96730-P5030040-black.jpg",
    "credit": "Rama / Wikimedia Commons",
    "license": "CC BY-SA 3.0 FR",
    "note": "Ardipithecus ramidus cranium cast, MGL 96730.",
    "alt": "Cast of an Ardipithecus ramidus cranium",
    "publicationStatus": "approved"
  },
  {
    "id": "media:afarensis",
    "subjectId": "afarensis",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/1/10/Australopithecus_afarensis_skull.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Australopithecus_afarensis_skull.jpg",
    "credit": "Tiia Monto / Wikimedia Commons",
    "license": "CC BY-SA 3.0",
    "note": "Australopithecus afarensis skull cast photographed at Naturmuseum Augsburg.",
    "alt": "Australopithecus afarensis skull cast",
    "publicationStatus": "approved"
  },
  {
    "id": "media:africanus",
    "subjectId": "africanus",
    "kind": "specimen-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/3/32/Australopithecus_africanus_skull_-_Naturmuseum_Senckenberg_-_DSC02100.JPG",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Australopithecus_africanus_skull_-_Naturmuseum_Senckenberg_-_DSC02100.JPG",
    "credit": "Daderot / Wikimedia Commons",
    "license": "CC0 1.0",
    "note": "Australopithecus africanus skull exhibit at Naturmuseum Senckenberg.",
    "alt": "Australopithecus africanus skull specimen on museum display",
    "publicationStatus": "approved"
  },
  {
    "id": "media:boisei",
    "subjectId": "boisei",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Paranthropus_boisei_skull.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Paranthropus_boisei_skull.jpg",
    "credit": "Durova / Wikimedia Commons",
    "license": "CC BY-SA 3.0",
    "note": "Paranthropus boisei replica skull and mandible; Olduvai Gorge material.",
    "alt": "Paranthropus boisei replica skull and mandible",
    "publicationStatus": "approved"
  },
  {
    "id": "media:robustus",
    "subjectId": "robustus",
    "kind": "specimen-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/1/16/Paranthropus_robustus_skull.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Paranthropus_robustus_skull.jpg",
    "credit": "Tiia Monto / Wikimedia Commons",
    "license": "CC BY-SA 3.0",
    "note": "Paranthropus robustus skull photographed at Naturmuseum Augsburg.",
    "alt": "Paranthropus robustus skull specimen",
    "publicationStatus": "approved"
  },
  {
    "id": "media:habilis",
    "subjectId": "habilis",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/4/45/Homo_habilis-KNM_ER_1813.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Homo_habilis-KNM_ER_1813.jpg",
    "credit": "José-Manuel Benito Álvarez / Wikimedia Commons",
    "license": "Public domain",
    "note": "Homo habilis KNM-ER 1813 replica from Koobi Fora.",
    "alt": "Homo habilis KNM-ER 1813 replica cranium",
    "publicationStatus": "approved"
  },
  {
    "id": "media:ergaster",
    "subjectId": "ergaster",
    "kind": "specimen-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/7/70/Homo_ergaster.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Homo_ergaster.jpg",
    "credit": "Luna04 / Wikimedia Commons",
    "license": "CC BY-SA 3.0",
    "note": "KNM-ER 3733 skull associated with Homo ergaster / Homo erectus terminology.",
    "alt": "KNM-ER 3733 skull associated with Homo ergaster or Homo erectus",
    "publicationStatus": "approved"
  },
  {
    "id": "media:erectus",
    "subjectId": "erectus",
    "kind": "specimen-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/2/27/Homo_erectus_KNM_ER_3733.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Homo_erectus_KNM_ER_3733.jpg",
    "credit": "Akrasia25 / Wikimedia Commons",
    "license": "CC BY-SA 4.0",
    "note": "KNM-ER 3733 actual skull photographed at the Nairobi museum.",
    "alt": "KNM-ER 3733 Homo erectus skull specimen",
    "publicationStatus": "approved"
  },
  {
    "id": "media:heidelbergensis",
    "subjectId": "heidelbergensis",
    "kind": "cast-photo",
    "src": "https://upload.wikimedia.org/wikipedia/commons/f/fd/Maba._Homo_heidelbergensis.jpg",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Maba._Homo_heidelbergensis.jpg",
    "credit": "Ryan Somma / Wikimedia Commons",
    "license": "CC BY-SA 2.0",
    "note": "Maba Homo heidelbergensis cast photographed at the Smithsonian National Museum of Natural History.",
    "alt": "Cast of the Maba Homo heidelbergensis cranium",
    "publicationStatus": "approved"
  },
  {
    "id": "media:neanderthal",
    "subjectId": "neanderthal",
    "kind": "reconstruction",
    "src": "/assets/neanderthal.webp",
    "sourceUrl": "https://humanorigins.si.edu/evidence/human-fossils/species/homo-neanderthalensis",
    "credit": "John Gurche reconstruction · Smithsonian Institution",
    "note": "Artistic scientific reconstruction; not a fossil photograph.",
    "alt": "Scientific reconstruction of Homo neanderthalensis based on fossil evidence",
    "publicationStatus": "review-required"
  },
  {
    "id": "media:sapiens",
    "subjectId": "sapiens",
    "kind": "reconstruction",
    "src": "https://upload.wikimedia.org/wikipedia/commons/e/e2/Oldest_Homo_sapiens_skull.webp",
    "sourceUrl": "https://commons.wikimedia.org/wiki/File:Oldest_Homo_sapiens_skull.webp",
    "credit": "Philipp Gunz / MPI EVA Leipzig via Wikimedia Commons",
    "license": "CC BY-SA 3.0",
    "note": "Virtual reconstruction of early Homo sapiens material from Jebel Irhoud; shown as a reconstruction, not a photograph of the fossil.",
    "alt": "Virtual reconstruction of early Homo sapiens material from Jebel Irhoud",
    "publicationStatus": "approved"
  },
  {
    "id": "media:anamensis",
    "subjectId": "anamensis",
    "kind": "context-schematic",
    "src": "/assets/species/anamensis-schematic.svg",
    "sourceUrl": "",
    "credit": "Human Origins interface · original schematic",
    "note": "Schematic placeholder only: no approved image of Australopithecus anamensis has been added yet. It does not depict the fossils or the appearance of this taxon.",
    "alt": "Schematic record plate for Australopithecus anamensis (~4.2–3.8 Ma); not a depiction of the fossils",
    "publicationStatus": "schematic"
  },
  {
    "id": "media:naledi",
    "subjectId": "naledi",
    "kind": "context-schematic",
    "src": "/assets/species/naledi-schematic.svg",
    "sourceUrl": "",
    "credit": "Human Origins interface · original schematic",
    "note": "Schematic placeholder only: no approved image of Homo naledi has been added yet. It does not depict the fossils or the appearance of this taxon.",
    "alt": "Schematic record plate for Homo naledi (~335–236 ka); not a depiction of the fossils",
    "publicationStatus": "schematic"
  },
  {
    "id": "media:denisovan",
    "subjectId": "denisovan",
    "kind": "context-schematic",
    "src": "/assets/species/denisovan-schematic.svg",
    "sourceUrl": "",
    "credit": "Human Origins interface · original schematic",
    "note": "Schematic placeholder only: no approved image of Denisovans has been added yet. It does not depict the fossils or the appearance of this taxon.",
    "alt": "Schematic record plate for Denisovans (~200–50 ka (fossil & DNA record)); not a depiction of the fossils",
    "publicationStatus": "schematic"
  },
  {
    "id": "media:floresiensis",
    "subjectId": "floresiensis",
    "kind": "context-schematic",
    "src": "/assets/species/floresiensis-schematic.svg",
    "sourceUrl": "",
    "credit": "Human Origins interface · original schematic",
    "note": "Schematic placeholder only: no approved image of Homo floresiensis has been added yet. It does not depict the fossils or the appearance of this taxon.",
    "alt": "Schematic record plate for Homo floresiensis (~100–60 ka (fossils)); not a depiction of the fossils",
    "publicationStatus": "schematic"
  }
] as const
const resolveRoles=(item:typeof rawMedia[number]):readonly MediaRole[]=>{
  if(item.kind==='context-schematic') return ['context']
  if(item.kind==='reconstruction') return ['tree-thumbnail','profile-portrait']
  return ['tree-thumbnail','specimen-reference']
}
const resolveRights=(item:typeof rawMedia[number]):MediaRightsStatus=>{
  return item.publicationStatus==='review-required' ? 'review-required' : ('license' in item && item.license) ? 'clear' : 'unknown'
}
export const media:MediaAsset[]=rawMedia.map(item=>({
  id:asMediaAssetId(item.id),
  subject:{type:'taxon' as const,id:asTaxonId(item.subjectId)},
  roles:resolveRoles(item),
  kind:item.kind,
  src:item.src,
  sourceUrl:item.sourceUrl,
  credit:item.credit,
  license:'license' in item ? item.license : undefined,
  note:item.note,
  alt:item.alt,
  publicationStatus:item.publicationStatus,
  rightsStatus:resolveRights(item),
  variants:[],
  sourceLinks:sourceRecords.filter(source=>source.url===item.sourceUrl).map(source=>({sourceId:asSourceId(String(source.id)),role:'illustrates' as const})),
}))
