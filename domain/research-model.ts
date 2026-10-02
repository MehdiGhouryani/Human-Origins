import type {
  CollectionId,
  InstitutionId,
  OccurrenceId,
  PublicationId,
  SiteId,
  SourceId,
  SpecimenId,
  TaxonId,
  MaterialEntityId,
  SiteContextId,
  TaxonNameId,
} from './ids'
import type {TimeInterval} from './time'
import type {SourceLink} from './contracts'

/**
 * Interoperability-oriented concepts used by the canonical research model.
 * These are intentionally app-native contracts inspired by established standards,
 * not a direct reimplementation of an external ontology.
 */
export type IdentifierScheme=
  | 'doi'
  | 'orcid'
  | 'ror'
  | 'wikidata'
  | 'gbif-taxonomy'
  | 'ncbi-taxonomy'
  | 'catalog-number'
  | 'institution-record'
  | 'collection-record'
  | 'specimen-record'
  | 'site-record'
  | 'uri'

export type IdentifierVerification='verified'|'asserted'|'unverified'|'deprecated'
export type IdentifierOrigin='institutional-record'|'publisher'|'registry'|'curatorial'|'internal'

export type ExternalIdentifier={
  scheme:IdentifierScheme
  value:string
  uri?:string
  label?:string
  preferred?:boolean
  verification?:IdentifierVerification
  origin?:IdentifierOrigin
}

export type TaxonRank='informal-node'|'species'|'subspecies'|'genus'|'family'|'other'
export type TaxonomicStatus='accepted'|'informal'|'provisional'|'debated'
export type NomenclaturalCode='ICZN'|'informal'

export type TaxonNameUsage='accepted'|'synonym'|'historical'|'provisional'|'informal'

export type TaxonNameRecord={
  id:TaxonNameId
  taxonId:TaxonId
  name:string
  usage:TaxonNameUsage
  authorship?:string
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
  identifiers:readonly ExternalIdentifier[]
  note?:string
}

export type TaxonomicIdentity={
  rank:TaxonRank
  scientificName:string
  authorship?:string
  taxonomicStatus:TaxonomicStatus
  nomenclaturalCode?:NomenclaturalCode
  identifiers:readonly ExternalIdentifier[]
  nameUsageIds:readonly TaxonNameId[]
  notes?:string
}

export type InstitutionType='museum'|'research-institute'|'university'|'government'|'publisher'|'archive'|'other'

export type InstitutionRecord={
  id:InstitutionId
  name:string
  type:InstitutionType
  country?:string
  website?:string
  identifiers:readonly ExternalIdentifier[]
  note?:string
}

export type PublicationType='journal-article'|'correction'|'book'|'book-chapter'|'dataset'|'web-publication'|'other'

export type ContributorRole='author'|'editor'|'contributor'
export type ContributorRecord={
  name:string
  role:ContributorRole
  orcid?:string
  institutionIds:readonly InstitutionId[]
  displayOnly?:boolean
}

export type PublicationRecord={
  id:PublicationId
  type:PublicationType
  title:string
  authors:readonly string[]
  contributors?:readonly ContributorRecord[]
  journal?:string
  volume?:string
  issue?:string
  pages?:string
  year?:number
  doi?:string
  url:string
  publisher?:string
  institutionIds:readonly InstitutionId[]
  identifiers:readonly ExternalIdentifier[]
  note?:string
}

export type CollectionRecord={
  id:CollectionId
  institutionId:InstitutionId
  name:string
  code?:string
  website?:string
  identifiers:readonly ExternalIdentifier[]
  note?:string
}

export type OccurrenceBasis='LivingSpecimen'|'PreservedSpecimen'|'FossilSpecimen'|'MaterialCitation'|'HumanObservation'|'MachineObservation'
export type OccurrenceStatus='detected'|'inferred'|'notDetected'

export type SiteRecord={
  id:SiteId
  name:string
  lon:number
  lat:number
  locationPrecision:LocationPrecisionLike
  country?:string
  region?:string
  locationSource?:string
  note:string
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
  identifiers:readonly ExternalIdentifier[]
}

export type SiteContextRecord={
  id:SiteContextId
  siteId:SiteId
  ageLabel:string
  timeInterval?:TimeInterval
  kind:string
  relatedTaxonIds:readonly TaxonId[]
  certainty:'high'|'medium'|'debated'
  note:string
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
}

export type LocationPrecisionLike='exact'|'site'|'regional'|'generalized'

export type MetadataUsage='CC0'|'Usage conditions apply'|'Not stated'

export type MaterialEntityRecord={
  id:MaterialEntityId
  materialType:MaterialType
  taxonId?:TaxonId
  objectIdentifier?:string
  institutionId?:InstitutionId
  collectionId?:CollectionId
  catalogNumber?:string
  objectType?:string
  basisOfRecord?:OccurrenceBasis
  viewerUrl?:string
  viewerLabel?:string
  originalInstitution?:string
  discoveryYear?:string
  recordId?:string
  metadataUsage?:MetadataUsage
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
  identifiers:readonly ExternalIdentifier[]
}

export type OccurrenceRecord={
  id:OccurrenceId
  taxonId:TaxonId
  siteId:SiteId
  specimenId?:SpecimenId
  basisOfRecord:OccurrenceBasis
  occurrenceStatus:OccurrenceStatus
  timeInterval?:TimeInterval
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
  identifiers:readonly ExternalIdentifier[]
  note?:string
}

export type MaterialType='fossil'|'cast'|'scan'|'artifact'|'sample'|'other'

export type MaterialContext={
  institutionId?:InstitutionId
  collectionId?:CollectionId
  catalogNumber?:string
  objectType?:string
}

export type ResearchModelMetadata={
  schemaVersion:string
  modelVersion:string
  conceptualStandards:readonly string[]
  release:string
  generatedAt?:string
  snapshotKind?:'curated'|'preview'|'imported'
}
