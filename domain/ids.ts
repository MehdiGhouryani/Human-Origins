/** Branded identifiers make illegal cross-domain references harder to express. */
export type EntityId<Kind extends string>=string & {readonly __entityKind:Kind}
export type TaxonId=EntityId<'taxon'>
export type SpecimenId=EntityId<'specimen'>
export type SiteId=EntityId<'site'>
export type EvidenceId=EntityId<'evidence'>
export type ClaimId=EntityId<'claim'>
export type SourceId=EntityId<'source'>
export type MediaAssetId=EntityId<'media'>
export type PublicationId=EntityId<'publication'>
export type InstitutionId=EntityId<'institution'>
export type CollectionId=EntityId<'collection'>
export type OccurrenceId=EntityId<'occurrence'>
export type RelationshipId=EntityId<'relationship'>
export type MaterialEntityId=EntityId<'material'>
export type SiteContextId=EntityId<'site-context'>
export type TaxonNameId=EntityId<'taxon-name'>
export type InterpretationSetId=EntityId<'interpretation-set'>
export type InterpretationPositionId=EntityId<'interpretation-position'>
export type RelationshipHypothesisSetId=EntityId<'relationship-hypothesis-set'>
export type RelationshipHypothesisPositionId=EntityId<'relationship-hypothesis-position'>

const ID_PATTERN=/^[a-z0-9]+(?:[-:][a-z0-9]+)*$/

const assertId=(value:string,kind:string):void=>{
  if(typeof value!=='string') throw new Error(`Invalid ${kind} id.`)
  const normalized=value.trim()
  if(!normalized || normalized.length>120 || !ID_PATTERN.test(normalized)) throw new Error(`Invalid ${kind} id: ${value}`)
}

export const asTaxonId=(value:string)=>{assertId(value,'taxon');return value.trim() as TaxonId}
export const asSpecimenId=(value:string)=>{assertId(value,'specimen');return value.trim() as SpecimenId}
export const asSiteId=(value:string)=>{assertId(value,'site');return value.trim() as SiteId}
export const asEvidenceId=(value:string)=>{assertId(value,'evidence');return value.trim() as EvidenceId}
export const asClaimId=(value:string)=>{assertId(value,'claim');return value.trim() as ClaimId}
export const asSourceId=(value:string)=>{assertId(value,'source');return value.trim() as SourceId}
export const asMediaAssetId=(value:string)=>{assertId(value,'media');return value.trim() as MediaAssetId}
export const asPublicationId=(value:string)=>{assertId(value,'publication');return value.trim() as PublicationId}
export const asInstitutionId=(value:string)=>{assertId(value,'institution');return value.trim() as InstitutionId}
export const asCollectionId=(value:string)=>{assertId(value,'collection');return value.trim() as CollectionId}
export const asOccurrenceId=(value:string)=>{assertId(value,'occurrence');return value.trim() as OccurrenceId}
export const asRelationshipId=(value:string)=>{assertId(value,'relationship');return value.trim() as RelationshipId}
export const asMaterialEntityId=(value:string)=>{assertId(value,'material');return value.trim() as MaterialEntityId}
export const asSiteContextId=(value:string)=>{assertId(value,'site-context');return value.trim() as SiteContextId}
export const asTaxonNameId=(value:string)=>{assertId(value,'taxon-name');return value.trim() as TaxonNameId}
export const asInterpretationSetId=(value:string)=>{assertId(value,'interpretation-set');return value.trim() as InterpretationSetId}
export const asInterpretationPositionId=(value:string)=>{assertId(value,'interpretation-position');return value.trim() as InterpretationPositionId}
export const asRelationshipHypothesisSetId=(value:string)=>{assertId(value,'relationship-hypothesis-set');return value.trim() as RelationshipHypothesisSetId}
export const asRelationshipHypothesisPositionId=(value:string)=>{assertId(value,'relationship-hypothesis-position');return value.trim() as RelationshipHypothesisPositionId}

export const isEntityId=(value:unknown):value is string=>typeof value==='string' && ID_PATTERN.test(value.trim()) && value.trim().length<=120
