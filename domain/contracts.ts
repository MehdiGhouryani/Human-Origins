import type {ClaimId,EvidenceId,MediaAssetId,PublicationId,InstitutionId,OccurrenceId,SiteId,SourceId,SpecimenId,TaxonId,RelationshipId,MaterialEntityId,InterpretationSetId,InterpretationPositionId,RelationshipHypothesisSetId,RelationshipHypothesisPositionId} from './ids'
import type {TimeInterval} from './time'
import type {CollectionRecord,ExternalIdentifier,InstitutionRecord,MaterialContext,MaterialType,OccurrenceBasis,OccurrenceRecord,OccurrenceStatus,PublicationRecord,PublicationType,ResearchModelMetadata,TaxonomicIdentity,TaxonomicStatus,TaxonRank,MaterialEntityRecord,SiteContextRecord,SiteRecord,TaxonNameRecord,ContributorRecord,LocationPrecisionLike} from './research-model'

export type EvidenceType='Fossil'|'Archaeology'|'Genetics'|'Dating'
export type RelationshipType='context'|'possible'|'gene-flow'
export type MediaKind='specimen-photo'|'cast-photo'|'reconstruction'|'context-schematic'
export type MediaRole='tree-thumbnail'|'profile-portrait'|'dossier-hero'|'anatomy-plate'|'comparative-morphology'|'specimen-reference'|'habitat'|'behavior'|'scale-reference'|'gallery'|'context'
export type MediaPublicationStatus='approved'|'review-required'|'schematic'|'legacy'|'retired'
export type MediaRightsStatus='clear'|'review-required'|'institutional-terms'|'unknown'
export type MediaVariantPurpose='thumbnail'|'card'|'detail'|'hero'|'icon'
export type MediaVariant={purpose:MediaVariantPurpose;src:string;width:number;height:number;format:'webp'|'avif'|'jpg'|'png'|'svg'}
export type MediaSubject={type:'taxon';id:TaxonId}|{type:'specimen';id:SpecimenId}|{type:'site';id:SiteId}|{type:'material';id:MaterialEntityId}
export type TaxonStatus='living'|'extinct'
export type EvidenceKind='fossil'|'archaeology'|'genetics'|'dating'
export type EvidenceStatus='documented'|'interpreted'
export type ClaimStatus='verified'|'partially-verified'|'contextual'|'disputed-interpretation'
export type ClaimEpistemicBasis='direct-record'|'measurement'|'derived-analysis'|'cross-source-synthesis'|'relationship-interpretation'
export type ClaimEvidenceRole='supports'|'contextualizes'|'challenges'|'dates'|'derives'
export type ClaimEvidenceLink={evidenceId:EvidenceId;role:ClaimEvidenceRole;note?:string}
export type UncertaintyDimension='chronology'|'taxonomic-assignment'|'relationship'|'geography'|'provenance'|'interpretation'|'scope'
export type UncertaintyState='bounded'|'open'|'contested'|'source-limited'|'unknown'
export type ClaimUncertainty={dimension:UncertaintyDimension;state:UncertaintyState;note:string;sourceIds:readonly SourceId[];evidenceIds:readonly EvidenceId[]}
export type InterpretationSetStatus='open-question'|'multiple-positions'
export type InterpretationPositionKind='documented-interpretation'|'alternative-interpretation'|'methodological-caution'
export type InterpretationSetRecord={id:InterpretationSetId;claimId:ClaimId;question:string;status:InterpretationSetStatus;scope:string;positionIds:readonly InterpretationPositionId[];sourceIds:readonly SourceId[];sourceLinks:readonly SourceLink[];note?:string}
export type InterpretationPositionRecord={id:InterpretationPositionId;setId:InterpretationSetId;label:string;summary:string;kind:InterpretationPositionKind;evidenceIds:readonly EvidenceId[];sourceIds:readonly SourceId[];sourceLinks:readonly SourceLink[];note?:string}
export type RelationshipHypothesisSetRecord={id:RelationshipHypothesisSetId;relationshipId:RelationshipId;question:string;scope:string;positionIds:readonly RelationshipHypothesisPositionId[];sourceIds:readonly SourceId[];sourceLinks:readonly SourceLink[];note?:string}
export type RelationshipHypothesisPositionRecord={id:RelationshipHypothesisPositionId;setId:RelationshipHypothesisSetId;label:string;summary:string;kind:InterpretationPositionKind;sourceIds:readonly SourceId[];sourceLinks:readonly SourceLink[];note?:string}
export type Certainty='high'|'medium'|'debated'
export type LocationPrecision='exact'|'site'|'regional'|'generalized'
export type SourceType='primary-study'|'peer-reviewed-paper'|'institutional-record'|'institutional-synthesis'|'museum-3d'|'educational-synthesis'
export type SpecimenEvidence='Fossil'|'Ancient DNA'|'Archaeology'
export type SourceLinkRole='supports'|'documents'|'dates'|'contextualizes'|'catalogues'|'hosts'|'illustrates'|'interprets'
export type SourceLink={sourceId:SourceId;role:SourceLinkRole;note?:string}
export type SourceLinkKey=`${string}:${SourceLinkRole}`

export type Fact=readonly [label:string,value:string]

/** Canonical media record. A media asset can target more than a taxon; the UI derives taxon-specific views. */
export type MediaAsset={
  id:MediaAssetId
  subject:MediaSubject
  roles:readonly MediaRole[]
  kind:MediaKind
  src:string
  sourceUrl:string
  credit:string
  license?:string
  note:string
  alt:string
  publicationStatus:MediaPublicationStatus
  rightsStatus:MediaRightsStatus
  variants:readonly MediaVariant[]
  sourceLinks:readonly SourceLink[]
}

export type TaxonRecord={
  id:TaxonId
  name:string
  short:string
  group:string
  date:string
  start:number
  end:number
  status:TaxonStatus
  description:string
  facts:readonly Fact[]
  evidence:readonly EvidenceType[]
  /** Portrait shown in the Inspector and species page header. */
  defaultMediaId:MediaAssetId
  /** Avatar drawn inside the tree node. Optional: falls back to the first `tree-thumbnail` media, then the portrait. */
  treeIconMediaId?:MediaAssetId
  mediaIds:readonly MediaAssetId[]
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
  taxonomy:TaxonomicIdentity
  chronology:TimeInterval
}

export type RelationshipRecord={
  id:RelationshipId
  from:TaxonId
  to:TaxonId
  type:RelationshipType
  label:string
  certainty?:Certainty
  sourceIds:readonly SourceId[]
  sourceLinks?:readonly SourceLink[]
  note?:string
  /** Gene-flow only: approximate age (Ma) of the dated admixture signal, used to place the connector on the time axis. */
  eventAgeMa?:number
}

export type SourceRecord={
  id:SourceId
  type:SourceType
  publisher:string
  title:string
  url:string
  role:string
  note:string
  scope:string
  institutionId?:InstitutionId
  publicationId?:PublicationId
  identifiers:readonly ExternalIdentifier[]
  peerReviewed?:boolean
}

/** Canonical site/location record. Dating belongs to site-context records, not the place itself. */
export type CanonicalSiteRecord=SiteRecord
export type CanonicalSiteContextRecord=SiteContextRecord

/** Display projection retained for the current explorer/globe. */
export type EvidenceSite={
  id:SiteId
  name:string
  lon:number
  lat:number
  ageKa:number
  ageLabel:string
  kind:EvidenceKind
  relatedTaxonIds:readonly TaxonId[]
  note:string
  sourceIds:readonly SourceId[]
  certainty:Certainty
  locationPrecision:LocationPrecision
  country?:string
  region?:string
  locationSource?:string
  siteContextId?:string
}

export type EvidenceRecord={
  id:EvidenceId
  taxonId:TaxonId
  siteId:SiteId
  title:string
  kind:EvidenceKind
  ageLabel:string
  claim:string
  sourceIds:readonly SourceId[]
  status:EvidenceStatus
  datingMethod?:string
  claimScope?:string
  specimenIds?:readonly SpecimenId[]
  occurrenceIds?:readonly OccurrenceId[]
  timeInterval?:TimeInterval
  identifiers?:readonly ExternalIdentifier[]
  sourceLinks?:readonly SourceLink[]
}

/** Specimen = taxonomically interpreted material record; physical-object details live on MaterialEntityRecord. */
export type SpecimenRecord={
  id:SpecimenId
  taxonId:TaxonId
  name:string
  siteId:SiteId
  ageLabel:string
  evidence:SpecimenEvidence
  significance:string
  sourceIds:readonly SourceId[]
  occurrenceId?:OccurrenceId
  materialEntityId:MaterialEntityId
  publicationIds?:readonly PublicationId[]
  sourceLinks?:readonly SourceLink[]
  discoveryYear?:string
  imageUrl?:string
  imageAlt?:string
  imageCredit?:string
}

export type ProvenanceClaim={
  id:ClaimId
  taxonId:TaxonId
  statement:string
  status:ClaimStatus
  epistemicBasis:ClaimEpistemicBasis
  statusNote:string
  evidenceIds:readonly EvidenceId[]
  evidenceLinks:readonly ClaimEvidenceLink[]
  sourceIds:readonly SourceId[]
  sourceLinks:readonly SourceLink[]
  scope:string
  specimenIds?:readonly SpecimenId[]
  siteIds?:readonly SiteId[]
  uncertaintyProfile:readonly ClaimUncertainty[]
  interpretationSetIds:readonly InterpretationSetId[]
}

export type CatalogMetadata=ResearchModelMetadata & {purpose:'curated-research-interface'}

export type ContentCatalog={
  metadata:CatalogMetadata
  taxa:readonly TaxonRecord[]
  taxonNames:readonly TaxonNameRecord[]
  relationships:readonly RelationshipRecord[]
  media:readonly MediaAsset[]
  sources:readonly SourceRecord[]
  publications:readonly PublicationRecord[]
  institutions:readonly InstitutionRecord[]
  collections:readonly CollectionRecord[]
  materialEntities:readonly MaterialEntityRecord[]
  occurrences:readonly OccurrenceRecord[]
  evidence:readonly EvidenceRecord[]
  specimens:readonly SpecimenRecord[]
  claims:readonly ProvenanceClaim[]
  interpretationSets:readonly InterpretationSetRecord[]
  interpretationPositions:readonly InterpretationPositionRecord[]
  relationshipHypothesisSets:readonly RelationshipHypothesisSetRecord[]
  relationshipHypothesisPositions:readonly RelationshipHypothesisPositionRecord[]
  sites:readonly CanonicalSiteRecord[]
  siteContexts:readonly CanonicalSiteContextRecord[]
  /** Explorer-ready projections; presentation-only, never a source of truth. */
  siteViews:readonly EvidenceSite[]
}

export type SearchResultKind='taxon'|'specimen'|'site'|'evidence'|'source'|'claim'|'publication'|'institution'
export type SearchResult={id:string;kind:SearchResultKind;title:string;subtitle?:string;score:number}

export type {
  CollectionRecord,
  ExternalIdentifier,
  InstitutionRecord,
  MaterialContext,
  MaterialType,
  MaterialEntityRecord,
  OccurrenceBasis,
  OccurrenceRecord,
  OccurrenceStatus,
  PublicationRecord,
  PublicationType,
  ResearchModelMetadata,
  TaxonomicIdentity,
  TaxonomicStatus,
  TaxonRank,
  TaxonNameRecord,
  ContributorRecord,
  LocationPrecisionLike,
}
