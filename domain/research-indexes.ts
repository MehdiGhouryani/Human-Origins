import type {ContentCatalog} from './contracts'

export type ResearchIndexes={
  taxonNamesByTaxonId:Readonly<Record<string,readonly number[]>>
  materialEntitiesByTaxonId:Readonly<Record<string,readonly number[]>>
  materialEntitiesByInstitutionId:Readonly<Record<string,readonly number[]>>
  specimensByMaterialEntityId:Readonly<Record<string,readonly number[]>>
  specimensByOccurrenceId:Readonly<Record<string,readonly number[]>>
  occurrencesBySpecimenId:Readonly<Record<string,readonly number[]>>
  occurrencesBySiteId:Readonly<Record<string,readonly number[]>>
  evidenceBySpecimenId:Readonly<Record<string,readonly number[]>>
  evidenceByOccurrenceId:Readonly<Record<string,readonly number[]>>
  evidenceBySiteId:Readonly<Record<string,readonly number[]>>
  claimsByEvidenceId:Readonly<Record<string,readonly number[]>>
  claimsBySpecimenId:Readonly<Record<string,readonly number[]>>
  claimsBySiteId:Readonly<Record<string,readonly number[]>>
  claimsBySourceId:Readonly<Record<string,readonly number[]>>
  relationshipsByTaxonId:Readonly<Record<string,readonly number[]>>
  sourcesByPublicationId:Readonly<Record<string,readonly number[]>>
  sourcesByInstitutionId:Readonly<Record<string,readonly number[]>>
  siteContextsBySiteId:Readonly<Record<string,readonly number[]>>
  mediaBySubjectId:Readonly<Record<string,readonly number[]>>
  interpretationSetsByClaimId:Readonly<Record<string,readonly number[]>>
  interpretationPositionsBySetId:Readonly<Record<string,readonly number[]>>
  relationshipHypothesisSetsByRelationshipId:Readonly<Record<string,readonly number[]>>
  relationshipHypothesisPositionsBySetId:Readonly<Record<string,readonly number[]>>
}

const add=(target:Record<string,number[]>,key:string,index:number)=>{(target[key]??=[]).push(index)}
const freezeMulti=(value:Record<string,number[]>)=>Object.freeze(Object.fromEntries(Object.entries(value).map(([key,indices])=>[key,Object.freeze([...indices])])) )

export function buildResearchIndexes(catalog:ContentCatalog):ResearchIndexes{
  const taxonNamesByTaxonId:Record<string,number[]>={}
  const materialEntitiesByTaxonId:Record<string,number[]>={}
  const materialEntitiesByInstitutionId:Record<string,number[]>={}
  const specimensByMaterialEntityId:Record<string,number[]>={}
  const specimensByOccurrenceId:Record<string,number[]>={}
  const occurrencesBySpecimenId:Record<string,number[]>={}
  const occurrencesBySiteId:Record<string,number[]>={}
  const evidenceBySpecimenId:Record<string,number[]>={}
  const evidenceByOccurrenceId:Record<string,number[]>={}
  const evidenceBySiteId:Record<string,number[]>={}
  const claimsByEvidenceId:Record<string,number[]>={}
  const claimsBySpecimenId:Record<string,number[]>={}
  const claimsBySiteId:Record<string,number[]>={}
  const claimsBySourceId:Record<string,number[]>={}
  const relationshipsByTaxonId:Record<string,number[]>={}
  const sourcesByPublicationId:Record<string,number[]>={}
  const sourcesByInstitutionId:Record<string,number[]>={}
  const siteContextsBySiteId:Record<string,number[]>={}
  const mediaBySubjectId:Record<string,number[]>={}
  const interpretationSetsByClaimId:Record<string,number[]>={}
  const interpretationPositionsBySetId:Record<string,number[]>={}
  const relationshipHypothesisSetsByRelationshipId:Record<string,number[]>={}
  const relationshipHypothesisPositionsBySetId:Record<string,number[]>={}

  catalog.taxonNames.forEach((item,index)=>add(taxonNamesByTaxonId,String(item.taxonId),index))
  catalog.materialEntities.forEach((item,index)=>{
    if(item.taxonId) add(materialEntitiesByTaxonId,String(item.taxonId),index)
    if(item.institutionId) add(materialEntitiesByInstitutionId,String(item.institutionId),index)
  })
  catalog.specimens.forEach((item,index)=>{
    add(specimensByMaterialEntityId,String(item.materialEntityId),index)
    if(item.occurrenceId) add(specimensByOccurrenceId,String(item.occurrenceId),index)
  })
  catalog.occurrences.forEach((item,index)=>{
    if(item.specimenId) add(occurrencesBySpecimenId,String(item.specimenId),index)
    add(occurrencesBySiteId,String(item.siteId),index)
  })
  catalog.evidence.forEach((item,index)=>{
    for(const specimenId of item.specimenIds??[]) add(evidenceBySpecimenId,String(specimenId),index)
    for(const occurrenceId of item.occurrenceIds??[]) add(evidenceByOccurrenceId,String(occurrenceId),index)
    add(evidenceBySiteId,String(item.siteId),index)
  })
  catalog.claims.forEach((item,index)=>{
    for(const evidenceId of item.evidenceIds) add(claimsByEvidenceId,String(evidenceId),index)
    for(const specimenId of item.specimenIds??[]) add(claimsBySpecimenId,String(specimenId),index)
    for(const siteId of item.siteIds??[]) add(claimsBySiteId,String(siteId),index)
    for(const sourceId of item.sourceIds) add(claimsBySourceId,String(sourceId),index)
  })
  catalog.relationships.forEach((item,index)=>{
    add(relationshipsByTaxonId,String(item.from),index)
    add(relationshipsByTaxonId,String(item.to),index)
  })
  catalog.sources.forEach((item,index)=>{
    if(item.publicationId) add(sourcesByPublicationId,String(item.publicationId),index)
    if(item.institutionId) add(sourcesByInstitutionId,String(item.institutionId),index)
  })
  catalog.siteContexts.forEach((item,index)=>add(siteContextsBySiteId,String(item.siteId),index))
  catalog.media.forEach((item,index)=>add(mediaBySubjectId,`${item.subject.type}:${String(item.subject.id)}`,index))
  catalog.interpretationSets.forEach((item,index)=>add(interpretationSetsByClaimId,String(item.claimId),index))
  catalog.interpretationPositions.forEach((item,index)=>add(interpretationPositionsBySetId,String(item.setId),index))
  catalog.relationshipHypothesisSets.forEach((item,index)=>add(relationshipHypothesisSetsByRelationshipId,String(item.relationshipId),index))
  catalog.relationshipHypothesisPositions.forEach((item,index)=>add(relationshipHypothesisPositionsBySetId,String(item.setId),index))

  return Object.freeze({
    taxonNamesByTaxonId:freezeMulti(taxonNamesByTaxonId),
    materialEntitiesByTaxonId:freezeMulti(materialEntitiesByTaxonId),
    materialEntitiesByInstitutionId:freezeMulti(materialEntitiesByInstitutionId),
    specimensByMaterialEntityId:freezeMulti(specimensByMaterialEntityId),
    specimensByOccurrenceId:freezeMulti(specimensByOccurrenceId),
    occurrencesBySpecimenId:freezeMulti(occurrencesBySpecimenId),
    occurrencesBySiteId:freezeMulti(occurrencesBySiteId),
    evidenceBySpecimenId:freezeMulti(evidenceBySpecimenId),
    evidenceByOccurrenceId:freezeMulti(evidenceByOccurrenceId),
    evidenceBySiteId:freezeMulti(evidenceBySiteId),
    claimsByEvidenceId:freezeMulti(claimsByEvidenceId),
    claimsBySpecimenId:freezeMulti(claimsBySpecimenId),
    claimsBySiteId:freezeMulti(claimsBySiteId),
    claimsBySourceId:freezeMulti(claimsBySourceId),
    relationshipsByTaxonId:freezeMulti(relationshipsByTaxonId),
    sourcesByPublicationId:freezeMulti(sourcesByPublicationId),
    sourcesByInstitutionId:freezeMulti(sourcesByInstitutionId),
    siteContextsBySiteId:freezeMulti(siteContextsBySiteId),
    mediaBySubjectId:freezeMulti(mediaBySubjectId),
    interpretationSetsByClaimId:freezeMulti(interpretationSetsByClaimId),
    interpretationPositionsBySetId:freezeMulti(interpretationPositionsBySetId),
    relationshipHypothesisSetsByRelationshipId:freezeMulti(relationshipHypothesisSetsByRelationshipId),
    relationshipHypothesisPositionsBySetId:freezeMulti(relationshipHypothesisPositionsBySetId),
  })
}
