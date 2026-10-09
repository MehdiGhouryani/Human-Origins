import type {ClaimEpistemicBasis,ClaimEvidenceRole,ClaimStatus,ProvenanceClaim,SourceLinkRole} from '../domain/contracts'
import {asClaimId,asTaxonId,asEvidenceId,asSourceId,asSpecimenId,asSiteId,asInterpretationSetId} from '../domain/ids'

/**
 * Claim records intentionally encode the relationship to evidence and sources
 * explicitly. Compact ID arrays are derived from these role-aware links so the
 * canonical claim cannot silently drift from its provenance edges.
 */
type RawClaim={
  id:string
  taxonId:string
  statement:string
  status:ClaimStatus
  epistemicBasis:ClaimEpistemicBasis
  statusNote:string
  scope:string
  evidenceLinks:readonly {evidenceId:string;role:ClaimEvidenceRole;note?:string}[]
  sourceLinks:readonly {sourceId:string;role:SourceLinkRole;note?:string}[]
  specimenIds?:readonly string[]
  siteIds?:readonly string[]
  uncertaintyProfile?:readonly {dimension:ProvenanceClaim['uncertaintyProfile'][number]['dimension'];state:ProvenanceClaim['uncertaintyProfile'][number]['state'];note:string;sourceIds:readonly string[];evidenceIds:readonly string[]}[]
  interpretationSetIds?:readonly string[]
}

const rawClaims:readonly RawClaim[]=[
  {
    id:'claim-neanderthal-type',
    uncertaintyProfile:[{dimension:'provenance',state:'bounded',note:'Institutional specimen documentation directly identifies the specimen and its historical classification record.',sourceIds:['si-feldhofer','si-neanderthal-species'],evidenceIds:['neanderthal-1']}],
    taxonId:'neanderthal',
    statement:'Neanderthal 1 from Feldhofer was discovered in 1856 and became the type specimen for Homo neanderthalensis.',
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Direct institutional specimen record.',
    scope:'Specimen identity and historical classification',
    evidenceLinks:[{evidenceId:'neanderthal-1',role:'supports'}],
    sourceLinks:[
      {sourceId:'si-feldhofer',role:'documents'},
      {sourceId:'si-feldhofer-3d',role:'hosts'},
      {sourceId:'si-neanderthal-species',role:'contextualizes'},
    ],
  },
  {
    id:'claim-sima-mtdna',
    uncertaintyProfile:[{dimension:'relationship',state:'open',note:'The mitochondrial phylogenetic signal is informative, but it does not by itself resolve the full population history or later nuclear-genome relationships.',sourceIds:['nature-meyer-2014','si-neanderthal-dna'],evidenceIds:['sima-dna']}],
    taxonId:'neanderthal',
    statement:'Mitochondrial DNA from Sima de los Huesos contributes evidence about Middle Pleistocene hominin relationships and early Neanderthal-lineage history.',
    status:'verified',
    epistemicBasis:'derived-analysis',
    statusNote:'Primary ancient-DNA study plus institutional synthesis.',
    scope:'Ancient DNA and phylogenetic context',
    evidenceLinks:[{evidenceId:'sima-dna',role:'supports'}],
    sourceLinks:[
      {sourceId:'nature-meyer-2014',role:'supports'},
      {sourceId:'si-neanderthal-dna',role:'contextualizes'},
    ],
  },
  {
    id:'claim-neanderthal-gene-flow',
    uncertaintyProfile:[{dimension:'scope',state:'open',note:'The existence of gene flow is supported, while its timing, directionality and population structure require a more detailed evidence layer than a single interface claim.',sourceIds:['science-green-2010','si-neanderthal-dna'],evidenceIds:['neanderthal-dna']}],
    taxonId:'neanderthal',
    statement:'Neanderthal genomes provide evidence that Neanderthal and modern-human populations were genetically distinct yet exchanged genes.',
    status:'verified',
    epistemicBasis:'derived-analysis',
    statusNote:'Genome study documents admixture signals; population history remains more detailed than a single event.',
    scope:'Nuclear genome comparison and gene flow',
    evidenceLinks:[{evidenceId:'neanderthal-dna',role:'supports'}],
    sourceLinks:[
      {sourceId:'science-green-2010',role:'supports'},
      {sourceId:'si-neanderthal-dna',role:'contextualizes'},
    ],
  },
  {
    id:'claim-neanderthal-heidelbergensis',
    uncertaintyProfile:[{dimension:'relationship',state:'contested',note:'The available high-level synthesis does not justify treating this edge as a settled parent–offspring sequence.',sourceIds:['si-human-species-index'],evidenceIds:[]}],
    interpretationSetIds:['interp-heidelbergensis-neanderthal'],
    taxonId:'neanderthal',
    statement:'The relationship between Homo heidelbergensis and later Neanderthals is presented here as a proposed relationship rather than a settled direct ancestor link.',
    status:'disputed-interpretation',
    epistemicBasis:'relationship-interpretation',
    statusNote:'The visualization encodes a research discussion, not a proven parent–offspring sequence.',
    scope:'Evolutionary relationship model',
    evidenceLinks:[],
    sourceLinks:[{sourceId:'si-human-species-index',role:'interprets'}],
  },
  {
    id:'claim-jebel-fossils',
    uncertaintyProfile:[{dimension:'scope',state:'open',note:'The fossil assignment is documented; broader implications for how Homo sapiens emerged across Africa remain an interpretive question.',sourceIds:['nature-hublin-2017','si-sapiens-300ka'],evidenceIds:['jebel-irhoud']}],
    taxonId:'sapiens',
    statement:'Jebel Irhoud preserves human fossils assigned to early Homo sapiens together with Middle Stone Age material.',
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary fossil report and Smithsonian research summary.',
    scope:'Fossil attribution',
    evidenceLinks:[{evidenceId:'jebel-irhoud',role:'supports'}],
    sourceLinks:[
      {sourceId:'nature-hublin-2017',role:'supports'},
      {sourceId:'si-sapiens-300ka',role:'contextualizes'},
    ],
  },
  {
    id:'claim-jebel-age',
    uncertaintyProfile:[{dimension:'chronology',state:'bounded',note:'The published age estimate is explicitly reported with uncertainty rather than as a single exact age.',sourceIds:['nature-richter-2017','nature-richter-correction'],evidenceIds:['jebel-irhoud']}],
    taxonId:'sapiens',
    statement:'Jebel Irhoud fossils and associated Middle Stone Age material are dated to about 315 ± 34 thousand years in the primary dating study.',
    status:'verified',
    epistemicBasis:'measurement',
    statusNote:'Age estimate is reported with an uncertainty interval and supported by multiple dating approaches.',
    scope:'Chronology and dating uncertainty',
    evidenceLinks:[{evidenceId:'jebel-irhoud',role:'dates'}],
    sourceLinks:[
      {sourceId:'nature-richter-2017',role:'supports'},
      {sourceId:'nature-richter-correction',role:'contextualizes'},
    ],
  },
  {
    id:'claim-dmanisi-eurasia',
    uncertaintyProfile:[{dimension:'chronology',state:'bounded',note:'The chronology is anchored by radiometric dating of associated volcanic material; exact biological implications remain separate from the dated horizon.',sourceIds:['quageo-dmanisi-2010','si-d2282'],evidenceIds:['dmanisi-d2282']}],
    taxonId:'erectus',
    statement:'Dmanisi preserves an early Homo presence in Eurasia outside Africa, with volcanic material dated using 40Ar/39Ar methods.',
    status:'verified',
    epistemicBasis:'derived-analysis',
    statusNote:'Institutional specimen record linked to a primary geochronology study.',
    scope:'Early Eurasian Homo and site chronology',
    evidenceLinks:[{evidenceId:'dmanisi-d2282',role:'supports'}],
    sourceLinks:[
      {sourceId:'si-d2282',role:'documents'},
      {sourceId:'quageo-dmanisi-2010',role:'dates'},
    ],
  },
  {
    id:'claim-sapiens-dispersal',
    uncertaintyProfile:[{dimension:'geography',state:'open',note:'The interface intentionally avoids representing a single exact route where multiple dispersals and evidence streams are documented.',sourceIds:['si-human-evidence','si-dispersal-summary'],evidenceIds:['migration-evidence']}],
    interpretationSetIds:['interp-sapiens-dispersal'],
    taxonId:'sapiens',
    statement:'Homo sapiens dispersal histories are reconstructed from multiple fossil, archaeological and genetic evidence streams rather than a single universal route.',
    status:'contextual',
    epistemicBasis:'cross-source-synthesis',
    statusNote:'This is a cross-source synthesis used to frame the interface, not a single primary observation.',
    scope:'Migration synthesis',
    evidenceLinks:[{evidenceId:'migration-evidence',role:'derives'}],
    sourceLinks:[
      {sourceId:'si-human-evidence',role:'contextualizes'},
      {sourceId:'si-dispersal-summary',role:'contextualizes'},
    ],
  },
  {
    id:'claim-anamensis-knm-kp-29281',
    uncertaintyProfile:[{dimension:'relationship',state:'contested',note:"Whether A. anamensis evolved into A. afarensis by a simple straight-line change is debated after the MRD cranium.",sourceIds:["nature-leakey-1995", "nature-haileselassie-2019", "si-anamensis-species"],evidenceIds:['anamensis-knm-kp-29281']}],
    taxonId:'anamensis',
    statement:"Australopithecus anamensis was named in 1995 from Kanapoi and Allia Bay, Kenya; the 3.8 Ma MRD cranium suggests it overlapped in time with A. afarensis.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description plus institutional synthesis.',
    scope:"Type material and anamensis\u2013afarensis relationship",
    evidenceLinks:[{evidenceId:'anamensis-knm-kp-29281',role:'supports'}],
    sourceLinks:[{sourceId:'nature-leakey-1995',role:'documents'}, {sourceId:'nature-haileselassie-2019',role:'documents'}, {sourceId:'si-anamensis-species',role:'contextualizes'}],
    specimenIds:['knm-kp-29281'],
    siteIds:['kanapoi'],
  },
  {
    id:'claim-naledi-dh1',
    uncertaintyProfile:[{dimension:'chronology',state:'bounded',note:"Combined U-series, ESR and palaeomagnetic results constrain the age range.",sourceIds:["elife-berger-2015", "elife-dirks-2017", "si-naledi-species"],evidenceIds:['naledi-dh1']}],
    taxonId:'naledi',
    statement:"Homo naledi remains from the Rising Star cave system are dated to between about 335 and 236 thousand years ago.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description plus institutional synthesis.',
    scope:"Type material and chronology",
    evidenceLinks:[{evidenceId:'naledi-dh1',role:'supports'}],
    sourceLinks:[{sourceId:'elife-berger-2015',role:'documents'}, {sourceId:'elife-dirks-2017',role:'documents'}, {sourceId:'si-naledi-species',role:'contextualizes'}],
    specimenIds:['dh1'],
    siteIds:['rising-star'],
  },
  {
    id:'claim-denisovan-denisova-3',
    uncertaintyProfile:[{dimension:'taxonomic-assignment',state:'open',note:"Denisovans are a genetically defined population; a formal species name and full fossil anatomy are not established.",sourceIds:["nature-krause-2010", "nature-reich-2010"],evidenceIds:['denisovan-denisova-3']}],
    taxonId:'denisovan',
    statement:"Denisovans were first identified in 2010 from the DNA of a finger bone from Denisova Cave, and their genome shows gene flow into the ancestors of present-day Melanesians.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description.',
    scope:"Genetic identification and admixture",
    evidenceLinks:[{evidenceId:'denisovan-denisova-3',role:'supports'}],
    sourceLinks:[{sourceId:'nature-krause-2010',role:'documents'}, {sourceId:'nature-reich-2010',role:'documents'}],
    specimenIds:['denisova-3'],
    siteIds:['altai'],
  },
  {
    id:'claim-floresiensis-lb1',
    uncertaintyProfile:[{dimension:'relationship',state:'contested',note:"Descent from island-dwarfed H. erectus versus an earlier small-bodied Homo is unresolved.",sourceIds:["nature-brown-2004", "nature-sutikna-2016", "si-floresiensis-species"],evidenceIds:['floresiensis-lb1']}],
    taxonId:'floresiensis',
    statement:"Homo floresiensis remains from Liang Bua, Flores, are dated to about 100–60 thousand years ago, with stone tools from about 190–50 thousand years ago.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description plus institutional synthesis.',
    scope:"Type material and revised chronology",
    evidenceLinks:[{evidenceId:'floresiensis-lb1',role:'supports'}],
    sourceLinks:[{sourceId:'nature-brown-2004',role:'documents'}, {sourceId:'nature-sutikna-2016',role:'documents'}, {sourceId:'si-floresiensis-species',role:'contextualizes'}],
    specimenIds:['lb1'],
    siteIds:['liang-bua'],
  },
  {
    id:'claim-afarensis-al-288-1',
    uncertaintyProfile:[{dimension:'chronology',state:'bounded',note:"Hadar deposits are bracketed by dated volcanic tuffs.",sourceIds:["nature-johanson-1976"],evidenceIds:['afarensis-al-288-1']}],
    taxonId:'afarensis',
    statement:"The A.L. 288-1 'Lucy' partial skeleton from Hadar, Ethiopia (~3.2 Ma), is about 40% complete and shows that A. afarensis walked upright.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description.',
    scope:"Key specimen",
    evidenceLinks:[{evidenceId:'afarensis-al-288-1',role:'supports'}],
    sourceLinks:[{sourceId:'nature-johanson-1976',role:'documents'}],
    specimenIds:['al-288-1'],
    siteIds:['hadar'],
  },
  {
    id:'claim-africanus-taung-1',
    uncertaintyProfile:[{dimension:'chronology',state:'contested',note:"The Taung deposit is dated mainly from fauna and its age remains uncertain.",sourceIds:["nature-dart-1925"],evidenceIds:['africanus-taung-1']}],
    taxonId:'africanus',
    statement:"Raymond Dart named Australopithecus africanus in 1925 from the Taung child skull, the first australopith fossil recognized.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description.',
    scope:"Type specimen and history",
    evidenceLinks:[{evidenceId:'africanus-taung-1',role:'supports'}],
    sourceLinks:[{sourceId:'nature-dart-1925',role:'documents'}],
    specimenIds:['taung-1'],
    siteIds:['taung'],
  },
  {
    id:'claim-ardipithecus-ara-vp-6-500',
    uncertaintyProfile:[{dimension:'interpretation',state:'contested',note:"How bipedal Ar. ramidus was, and how its anatomy should be read, is debated.",sourceIds:["science-white-2009"],evidenceIds:['ardipithecus-ara-vp-6-500']}],
    taxonId:'ardipithecus',
    statement:"The ARA-VP-6/500 'Ardi' partial skeleton (~4.4 Ma) combines features linked to upright walking with a grasping big toe.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description.',
    scope:"Key specimen and locomotion",
    evidenceLinks:[{evidenceId:'ardipithecus-ara-vp-6-500',role:'supports'}],
    sourceLinks:[{sourceId:'science-white-2009',role:'documents'}],
    specimenIds:['ara-vp-6-500'],
    siteIds:['aramis'],
  },
  {
    id:'claim-ergaster-knm-wt-15000',
    uncertaintyProfile:[{dimension:'taxonomic-assignment',state:'contested',note:"It is assigned to H. ergaster or to early African H. erectus depending on taxonomic practice.",sourceIds:["nature-brown-1985"],evidenceIds:['ergaster-knm-wt-15000']}],
    taxonId:'ergaster',
    statement:"The KNM-WT 15000 'Turkana Boy' skeleton (~1.5 Ma) from Nariokotome, Kenya, is the most complete early Homo skeleton known.",
    status:'verified',
    epistemicBasis:'direct-record',
    statusNote:'Primary peer-reviewed description.',
    scope:"Key specimen",
    evidenceLinks:[{evidenceId:'ergaster-knm-wt-15000',role:'supports'}],
    sourceLinks:[{sourceId:'nature-brown-1985',role:'documents'}],
    specimenIds:['knm-wt-15000'],
    siteIds:['nariokotome'],
  }
]

const uniqueStrings=(values:readonly string[])=>[...new Set(values.map(String))]

export const provenanceClaims:ProvenanceClaim[]=rawClaims.map(item=>{
  const evidenceIds=uniqueStrings(item.evidenceLinks.map(link=>link.evidenceId)).map(asEvidenceId)
  const sourceIds=uniqueStrings(item.sourceLinks.map(link=>link.sourceId)).map(asSourceId)
  return {
    id:asClaimId(item.id),
    taxonId:asTaxonId(item.taxonId),
    statement:item.statement,
    status:item.status,
    epistemicBasis:item.epistemicBasis,
    statusNote:item.statusNote,
    evidenceIds,
    evidenceLinks:item.evidenceLinks.map(link=>({evidenceId:asEvidenceId(link.evidenceId),role:link.role,note:link.note})),
    sourceIds,
    sourceLinks:item.sourceLinks.map(link=>({sourceId:asSourceId(link.sourceId),role:link.role,note:link.note})),
    scope:item.scope,
    specimenIds:item.specimenIds?.map(asSpecimenId),
    siteIds:item.siteIds?.map(asSiteId),
    uncertaintyProfile:(item.uncertaintyProfile??[]).map(item=>({dimension:item.dimension,state:item.state,note:item.note,sourceIds:item.sourceIds.map(asSourceId),evidenceIds:item.evidenceIds.map(asEvidenceId)})),
    interpretationSetIds:(item.interpretationSetIds??[]).map(asInterpretationSetId),
  }
})

export const claimsBySpecies=provenanceClaims.reduce<Record<string,ProvenanceClaim[]>>((acc,claim)=>{;(acc[String(claim.taxonId)] ||= []).push(claim);return acc}, {})
