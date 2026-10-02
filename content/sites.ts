import type {EvidenceSite} from '../domain/contracts'
import {asSiteId,asSourceId,asTaxonId,asSiteContextId} from '../domain/ids'
import type {SiteContextRecord,SiteRecord} from '../domain/research-model'
import {parseAgeLabel} from '../domain/time'

const rawSites=[
  {
    "id": "sima-los-huesos",
    "datingMethod": "multiple",
    "name": "Sima de los Huesos",
    "lon": -3.52,
    "lat": 42.35,
    "ageKa": 430,
    "ageLabel": "~430 ka",
    "kind": "genetics",
    "relatedTaxonIds": [
      "neanderthal"
    ],
    "note": "Atapuerca site context for hominin remains and ancient-DNA evidence. Marker is a regional/site context, not a specimen coordinate.",
    "sourceId": "si-dna-first-neanderthals",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "vindija",
    "datingMethod": "radiometric",
    "name": "Vindija Cave",
    "lon": 16.35,
    "lat": 46.27,
    "ageKa": 44,
    "ageLabel": "~44 ka",
    "kind": "genetics",
    "relatedTaxonIds": [
      "neanderthal"
    ],
    "note": "Croatian site context associated with Neanderthal material used in ancient-genome studies.",
    "sourceId": "si-neanderthal-dna",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "jebel-irhoud",
    "datingMethod": "trapped-electron",
    "name": "Jebel Irhoud",
    "lon": -8.87,
    "lat": 31.88,
    "ageKa": 315,
    "ageLabel": "315 ± 34 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "sapiens"
    ],
    "note": "Early Homo sapiens fossils from Morocco. Map point is a site-level geographic context.",
    "sourceId": "si-sapiens-300ka",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "dmanisi",
    "datingMethod": "multiple",
    "name": "Dmanisi",
    "lon": 44.35,
    "lat": 41.33,
    "ageKa": 1770,
    "ageLabel": "~1.77 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "erectus"
    ],
    "note": "Early Homo evidence outside Africa. Map point is a site-level geographic context.",
    "sourceId": "si-d2282",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "levant",
    "datingMethod": "multiple",
    "name": "Levant",
    "lon": 35.2,
    "lat": 32.5,
    "ageKa": 100,
    "ageLabel": "~100 ka+",
    "kind": "fossil",
    "relatedTaxonIds": [
      "sapiens",
      "neanderthal"
    ],
    "note": "Repeated occupation by different human populations. This is intentionally a regional context, not one excavation point.",
    "sourceId": "si-dispersal-summary",
    "certainty": "medium",
    "locationPrecision": "regional"
  },
  {
    "id": "mandrin",
    "datingMethod": "multiple",
    "name": "Grotte Mandrin",
    "lon": 5.5,
    "lat": 44.1,
    "ageKa": 54,
    "ageLabel": "~54 ka",
    "kind": "archaeology",
    "relatedTaxonIds": [
      "sapiens",
      "neanderthal"
    ],
    "note": "Early modern human presence in Europe. Map point is a site-level geographic context.",
    "sourceId": "si-dispersal-summary",
    "certainty": "medium",
    "locationPrecision": "site"
  },
  {
    "id": "altai",
    "datingMethod": "genetic",
    "name": "Denisova / Altai",
    "lon": 84.68,
    "lat": 51.4,
    "ageKa": 50,
    "ageLabel": "~50 ka",
    "kind": "genetics",
    "relatedTaxonIds": [
      "neanderthal",
      "denisovan",
      "sapiens"
    ],
    "note": "Genomic evidence reveals complex population contact. This is a regional Altai context.",
    "sourceId": "si-neanderthal-dna",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "tianyuan",
    "datingMethod": "radiometric",
    "name": "Tianyuan Cave",
    "lon": 116.1,
    "lat": 39.7,
    "ageKa": 40,
    "ageLabel": "~40 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "sapiens"
    ],
    "note": "Ancient modern human remains in China. Map point is a site-level geographic context.",
    "sourceId": "si-dispersal-summary",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "sahul",
    "datingMethod": "multiple",
    "name": "Sahul / Australia",
    "lon": 134,
    "lat": -25,
    "ageKa": 50,
    "ageLabel": "~50 ka",
    "kind": "archaeology",
    "relatedTaxonIds": [
      "sapiens"
    ],
    "note": "Occupation of Sahul required sea crossings from Southeast Asia. This is a regional context.",
    "sourceId": "si-dispersal-summary",
    "certainty": "medium",
    "locationPrecision": "regional"
  },
  {
    "id": "white-sands",
    "datingMethod": "multiple",
    "name": "White Sands",
    "lon": -106.5,
    "lat": 32.8,
    "ageKa": 21,
    "ageLabel": "~21 ka",
    "kind": "dating",
    "relatedTaxonIds": [
      "sapiens"
    ],
    "note": "Footprints provide evidence for humans in North America. Map point is a site-level geographic context.",
    "sourceId": "si-dispersal-summary",
    "certainty": "medium",
    "locationPrecision": "site"
  },
  {
    "id": "feldhofer",
    "datingMethod": "radiometric",
    "name": "Feldhofer Cave · Neander Valley",
    "lon": 6.9456,
    "lat": 51.2267,
    "ageKa": 40,
    "ageLabel": "~40 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "neanderthal"
    ],
    "note": "Regional site context for the Feldhofer fossil record. Coordinate is used for visualization only and is not a specimen measurement.",
    "sourceId": "si-feldhofer",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "singa",
    "datingMethod": "unspecified",
    "name": "Singa",
    "lon": 33.93,
    "lat": 13.15,
    "ageKa": 135,
    "ageLabel": "~120–150 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "sapiens"
    ],
    "note": "Regional site context for the Singa fossil record; the marker is intentionally generalized.",
    "sourceId": "si-singa",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "toros-menalla",
    "datingMethod": "relative",
    "name": "Toros-Menalla",
    "lon": 16.28,
    "lat": 16.3,
    "ageKa": 6500,
    "ageLabel": "~7–6 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "sahelanthropus"
    ],
    "note": "Regional site context for Toumaï. The point is intentionally a geographic context, not a precise excavation coordinate.",
    "sourceId": "si-toumai",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "hadar",
    "datingMethod": "radiometric",
    "name": "Hadar",
    "lon": 40.5,
    "lat": 11.1,
    "ageKa": 3000,
    "ageLabel": "~3 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "afarensis"
    ],
    "note": "Regional site context for AL 444-2 and other A. afarensis material.",
    "sourceId": "si-al-444-2",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "sterkfontein",
    "datingMethod": "multiple",
    "name": "Sterkfontein",
    "lon": 27.73,
    "lat": -26.01,
    "ageKa": 2600,
    "ageLabel": "~2.8–2.4 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "africanus"
    ],
    "note": "Regional site context for STS 71 and the broader Sterkfontein fossil record.",
    "sourceId": "si-sts-71-3d",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "olduvai",
    "datingMethod": "radiometric",
    "name": "Olduvai Gorge",
    "lon": 35.34,
    "lat": -2.99,
    "ageKa": 1800,
    "ageLabel": "~1.8 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "habilis",
      "boisei"
    ],
    "note": "Regional site context for OH 16 and OH 5.",
    "sourceId": "si-oh-5",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "drimolen",
    "datingMethod": "multiple",
    "name": "Drimolen Main Quarry",
    "lon": 27.66,
    "lat": -25.92,
    "ageKa": 1995,
    "ageLabel": "~2.04–1.95 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "robustus"
    ],
    "note": "Regional site context for DNH 7.",
    "sourceId": "si-dnh-7-3d",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "eurasia",
    "datingMethod": "genetic",
    "name": "Eurasia · regional context",
    "lon": 55,
    "lat": 45,
    "ageKa": 400,
    "ageLabel": "Middle Pleistocene context (~400 ka)",
    "kind": "genetics",
    "relatedTaxonIds": [
      "neanderthal"
    ],
    "note": "Regional analytical context used for ancient-DNA evidence; not a single excavation coordinate.",
    "sourceId": "si-neanderthal-dna",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "global",
    "datingMethod": "unspecified",
    "name": "Global dispersal · synthesis",
    "lon": 0,
    "lat": 20,
    "ageKa": 0,
    "ageLabel": "Multiple periods",
    "kind": "archaeology",
    "relatedTaxonIds": [
      "sapiens"
    ],
    "note": "Schematic global context for multi-source dispersal synthesis; not a physical excavation site.",
    "sourceId": "si-dispersal-summary",
    "certainty": "medium",
    "locationPrecision": "regional"
  },
  {
    "id": "kanapoi",
    "datingMethod": "radiometric",
    "name": "Kanapoi",
    "lon": 36.07,
    "lat": 2.32,
    "ageKa": 4150,
    "ageLabel": "4.2–4.1 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "anamensis"
    ],
    "note": "Type locality of Australopithecus anamensis, south-west of Lake Turkana, Kenya.",
    "sourceId": "nature-leakey-1995",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "koobi-fora",
    "datingMethod": "radiometric",
    "name": "Koobi Fora",
    "lon": 36.3,
    "lat": 3.95,
    "ageKa": 1900,
    "ageLabel": "~1.9 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "habilis"
    ],
    "note": "East Turkana, Kenya: early-Homo fossils including H. habilis material such as KNM-ER 1813. Regional marker.",
    "sourceId": "nature-leakey-2012",
    "certainty": "medium",
    "locationPrecision": "regional"
  },
  {
    "id": "rising-star",
    "datingMethod": "multiple",
    "name": "Rising Star cave system",
    "lon": 27.73,
    "lat": -26.02,
    "ageKa": 285,
    "ageLabel": "335–236 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "naledi"
    ],
    "note": "Dinaledi and Lesedi chambers, Cradle of Humankind, South Africa.",
    "sourceId": "elife-dirks-2017",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "baishiya",
    "datingMethod": "radiometric",
    "name": "Baishiya Karst Cave · Xiahe",
    "lon": 102.57,
    "lat": 35.45,
    "ageKa": 160,
    "ageLabel": "≥160 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "denisovan"
    ],
    "note": "Tibetan Plateau cave where the Xiahe Denisovan mandible was found; age is a minimum (U-series on carbonate crust).",
    "sourceId": "nature-chen-2019",
    "certainty": "medium",
    "locationPrecision": "site"
  },
  {
    "id": "liang-bua",
    "datingMethod": "multiple",
    "name": "Liang Bua",
    "lon": 120.46,
    "lat": -8.53,
    "ageKa": 80,
    "ageLabel": "100–60 ka",
    "kind": "fossil",
    "relatedTaxonIds": [
      "floresiensis"
    ],
    "note": "Limestone cave on Flores, Indonesia; skeletal remains ~100–60 ka, stone tools ~190–50 ka.",
    "sourceId": "nature-sutikna-2016",
    "certainty": "high",
    "locationPrecision": "site"
  },
  {
    "id": "aramis",
    "datingMethod": "radiometric",
    "name": "Aramis · Middle Awash",
    "lon": 40.45,
    "lat": 10.45,
    "ageKa": 4400,
    "ageLabel": "~4.4 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "ardipithecus"
    ],
    "note": "Aramis, Middle Awash, Ethiopia: source of the ARA-VP-6/500 'Ardi' skeleton. Regional marker.",
    "sourceId": "science-white-2009",
    "certainty": "high",
    "locationPrecision": "regional"
  },
  {
    "id": "taung",
    "datingMethod": "relative",
    "name": "Taung",
    "lon": 24.64,
    "lat": -27.62,
    "ageKa": 2700,
    "ageLabel": "~2.8–2.6 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "africanus"
    ],
    "note": "Lime-works quarry near Taung, South Africa, where the Taung child was found in 1924. Its age is estimated from fauna and is debated.",
    "sourceId": "nature-dart-1925",
    "certainty": "debated",
    "locationPrecision": "site"
  },
  {
    "id": "nariokotome",
    "datingMethod": "radiometric",
    "name": "Nariokotome · West Turkana",
    "lon": 35.85,
    "lat": 4.25,
    "ageKa": 1500,
    "ageLabel": "~1.5 Ma",
    "kind": "fossil",
    "relatedTaxonIds": [
      "ergaster",
      "erectus"
    ],
    "note": "Nariokotome III, West Turkana, Kenya: the KNM-WT 15000 skeleton. Regional marker.",
    "sourceId": "nature-brown-1985",
    "certainty": "high",
    "locationPrecision": "regional"
  }
] as const
export const evidenceSites:EvidenceSite[]=rawSites.map(item=>({
  ...item,
  id:asSiteId(item.id),
  relatedTaxonIds:item.relatedTaxonIds.map(asTaxonId),
  sourceIds:[asSourceId(item.sourceId)],
  locationSource:'Curated atlas site marker; coordinates are for visualization context and are not specimen collection coordinates.',
}))

export const siteRecords:SiteRecord[]=evidenceSites.map(item=>({
  id:item.id,
  name:item.name,
  lon:item.lon,
  lat:item.lat,
  locationPrecision:item.locationPrecision,
  country:item.country,
  region:item.region,
  locationSource:item.locationSource,
  note:item.note,
  sourceIds:item.sourceIds,
  sourceLinks:item.sourceIds.map(sourceId=>({sourceId,role:'contextualizes' as const})),
  identifiers:[],
}))

const datingMethodBySiteId=new Map<string,typeof rawSites[number]['datingMethod']>(rawSites.map(item=>[item.id,item.datingMethod]))

export const siteContextRecords:SiteContextRecord[]=evidenceSites.map(item=>{
  const parsedInterval=parseAgeLabel(item.ageLabel,item.ageKa,item.sourceIds,item.certainty)
  const datingMethod=datingMethodBySiteId.get(String(item.id))
  return {
    id:asSiteContextId(`site-context-${String(item.id)}`),
    siteId:item.id,
    ageLabel:item.ageLabel,
    timeInterval:parsedInterval && datingMethod?{...parsedInterval,datingClass:datingMethod}:parsedInterval,
    kind:item.kind,
    relatedTaxonIds:item.relatedTaxonIds,
    certainty:item.certainty,
    note:item.note,
    sourceIds:item.sourceIds,
    sourceLinks:item.sourceIds.map(sourceId=>({sourceId,role:'dates' as const})),
  }
})

export const siteViews:EvidenceSite[]=evidenceSites.map(item=>({...item,siteContextId:`site-context-${String(item.id)}`}))
