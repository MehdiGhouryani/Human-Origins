import type {EvidenceType,MediaAsset,OccurrenceRecord,SpecimenRecord} from '../../domain/contracts'
import type {TaxonRank} from '../../domain/research-model'

export type ExplorerMedia=Pick<MediaAsset,'id'|'subject'|'roles'|'kind'|'src'|'sourceUrl'|'credit'|'license'|'note'|'alt'|'publicationStatus'|'rightsStatus'|'variants'>

export type ExplorerSpecies={
  id:string
  name:string
  short:string
  group:string
  date:string
  start:number
  end:number
  status:'living'|'extinct'
  description:string
  media:readonly ExplorerMedia[]
  defaultMediaId:string
  /** Resolved avatar for the tree node / species chips (never undefined: falls back to the portrait). */
  treeIconId:string
  facts:readonly (readonly [string,string])[]
  evidence:readonly EvidenceType[]
  sourceIds:readonly string[]
  taxonomy:TaxonomyView
}

export type TaxonomyView={rank:TaxonRank;scientificName:string;taxonomicStatus:'accepted'|'informal'|'provisional'|'debated'}

export type ExplorerSpecimen=Omit<SpecimenRecord,'id'|'taxonId'|'siteId'|'sourceIds'> & {
  id:string
  taxonId:string
  siteId:string
  siteLabel:string
  country:string
  sourceIds:readonly string[]
  sourceUrl:string
  viewerUrl?:string
  viewerLabel?:string
  originalInstitution?:string
  recordId?:string
  metadataUsage?:string
  objectIdentifier?:string
}

export type ExplorerOccurrence=Omit<OccurrenceRecord,'id'|'taxonId'|'siteId'|'specimenId'|'sourceIds'> & {id:string;taxonId:string;siteId:string;specimenId?:string;sourceIds:readonly string[]}
