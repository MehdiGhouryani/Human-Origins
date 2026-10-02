import 'server-only'
import {contentCatalog as baseCatalog,researchIndexes as baseResearchIndexes} from '../../content/catalog'
import {catalogRuntimeMetadata,createCatalogFingerprint} from '../../infrastructure/validation/fingerprint'
import {buildResearchIndexes} from '../../domain/research-indexes'
import {buildResearchGraph} from '../../domain/research-graph'
import {buildAdjacencyIndex,provenanceChainForClaim} from '../../domain/graph-traversal'
import type {ContentCatalog,EvidenceRecord,MediaAsset,ProvenanceClaim,RelationshipRecord,SourceRecord,TaxonRecord,EvidenceSite,PublicationRecord,InstitutionRecord,CollectionRecord,MaterialEntityRecord,TaxonNameRecord,CanonicalSiteContextRecord,InterpretationSetRecord,InterpretationPositionRecord,RelationshipHypothesisSetRecord,RelationshipHypothesisPositionRecord} from '../../domain/contracts'
import type {ResearchIndexes} from '../../domain/research-indexes'
import type {ExplorerMedia,ExplorerSpecies,ExplorerSpecimen,ExplorerOccurrence} from './types'
import {asClaimId,asEvidenceId,asMediaAssetId,asSiteId,asSourceId,asSpecimenId,asTaxonId,asOccurrenceId,asMaterialEntityId,asInterpretationSetId} from '../../domain/ids'
import {deepFreeze} from '../../domain/immutability'
import {resolveTreeIconId} from '../../domain/media-slots'

export type ExplorerBootstrapIndexes={
  speciesById:Readonly<Record<string,number>>
  mediaById:Readonly<Record<string,number>>
  sourcesById:Readonly<Record<string,number>>
  publicationsById:Readonly<Record<string,number>>
  institutionsById:Readonly<Record<string,number>>
  collectionsById:Readonly<Record<string,number>>
  materialEntitiesById:Readonly<Record<string,number>>
  taxonNamesById:Readonly<Record<string,number>>
  siteContextsById:Readonly<Record<string,number>>
  occurrencesById:Readonly<Record<string,number>>
  sitesById:Readonly<Record<string,number>>
  evidenceById:Readonly<Record<string,number>>
  claimsById:Readonly<Record<string,number>>
  specimensById:Readonly<Record<string,number>>
  claimsByTaxonId:Readonly<Record<string,readonly number[]>>
  evidenceByTaxonId:Readonly<Record<string,readonly number[]>>
  specimensByTaxonId:Readonly<Record<string,readonly number[]>>
  occurrencesByTaxonId:Readonly<Record<string,readonly number[]>>
  mediaByTaxonId:Readonly<Record<string,readonly number[]>>
  interpretationSetsByClaimId:Readonly<Record<string,readonly number[]>>
  interpretationPositionsBySetId:Readonly<Record<string,readonly number[]>>
}

export type ClaimProvenanceSummary={
  evidenceIds:readonly string[]
  specimenIds:readonly string[]
  siteIds:readonly string[]
  sourceIds:readonly string[]
  reachedSource:boolean
}

export type ExplorerBootstrap={
  release:string
  schemaVersion:string
  fingerprint:string
  species:readonly ExplorerSpecies[]
  relationships:readonly RelationshipRecord[]
  taxonNames:readonly TaxonNameRecord[]
  siteContexts:readonly CanonicalSiteContextRecord[]
  media:readonly ExplorerMedia[]
  sites:readonly EvidenceSite[]
  evidence:readonly EvidenceRecord[]
  claims:readonly ProvenanceClaim[]
  specimens:readonly ExplorerSpecimen[]
  occurrences:readonly ExplorerOccurrence[]
  sources:readonly SourceRecord[]
  publications:readonly PublicationRecord[]
  institutions:readonly InstitutionRecord[]
  collections:readonly CollectionRecord[]
  materialEntities:readonly MaterialEntityRecord[]
  interpretationSets:readonly InterpretationSetRecord[]
  interpretationPositions:readonly InterpretationPositionRecord[]
  relationshipHypothesisSets:readonly RelationshipHypothesisSetRecord[]
  relationshipHypothesisPositions:readonly RelationshipHypothesisPositionRecord[]
  researchIndexes:ResearchIndexes
  copy:Readonly<Record<string,string>>
  indexes:ExplorerBootstrapIndexes
  provenanceChains:Readonly<Record<string,ClaimProvenanceSummary>>
}

function toExplorerMedia(media:MediaAsset):ExplorerMedia{
  const subject=media.subject.type==='taxon'
    ? {type:'taxon' as const,id:asTaxonId(String(media.subject.id))}
    : media.subject.type==='specimen'
      ? {type:'specimen' as const,id:asSpecimenId(String(media.subject.id))}
      : media.subject.type==='site'
        ? {type:'site' as const,id:asSiteId(String(media.subject.id))}
        : {type:'material' as const,id:asMaterialEntityId(String(media.subject.id))}
  return {
    id:asMediaAssetId(String(media.id)),
    subject,
    roles:media.roles,
    kind:media.kind,
    src:media.src,
    sourceUrl:media.sourceUrl,
    credit:media.credit,
    license:media.license,
    note:media.note,
    alt:media.alt,
    publicationStatus:media.publicationStatus,
    rightsStatus:media.rightsStatus,
    variants:media.variants,
  }
}

function toExplorerSpecies(taxon:TaxonRecord,catalog:ContentCatalog):ExplorerSpecies{
  const mediaLookup=new Map(catalog.media.map(item=>[String(item.id),item]))
  const sourceLookup=new Map(catalog.sources.map(item=>[String(item.id),item]))
  const allMedia=taxon.mediaIds.map(id=>mediaLookup.get(String(id))).filter((item):item is MediaAsset=>item!==undefined)
  const defaultMedia=mediaLookup.get(String(taxon.defaultMediaId))
  if(!defaultMedia) throw new Error(`Missing default media for taxon ${String(taxon.id)}`)
  const sources=taxon.sourceIds.map(id=>sourceLookup.get(String(id))).filter((item):item is SourceRecord=>item!==undefined)
  return {
    id:String(taxon.id),
    name:taxon.name,
    short:taxon.short,
    group:taxon.group,
    date:taxon.date,
    start:taxon.start,
    end:taxon.end,
    status:taxon.status,
    description:taxon.description,
    media:allMedia.map(toExplorerMedia),
    defaultMediaId:String(taxon.defaultMediaId),
    treeIconId:resolveTreeIconId({defaultMediaId:String(taxon.defaultMediaId),treeIconMediaId:taxon.treeIconMediaId?String(taxon.treeIconMediaId):undefined,mediaIds:taxon.mediaIds.map(String)},new Map(allMedia.map(item=>[String(item.id),{id:String(item.id),roles:item.roles}]))),
    facts:taxon.facts.map(([label,value])=>[label,value]),
    evidence:[...taxon.evidence],
    sourceIds:sources.map(source=>String(source.id)),
    taxonomy:{rank:taxon.taxonomy.rank,scientificName:taxon.taxonomy.scientificName,taxonomicStatus:taxon.taxonomy.taxonomicStatus},
  }
}

function buildIndexes(
  species:readonly ExplorerSpecies[],
  media:readonly ExplorerMedia[],
  sources:readonly SourceRecord[],
  publications:readonly PublicationRecord[],
  institutions:readonly InstitutionRecord[],
  collections:readonly CollectionRecord[],
  materialEntities:readonly MaterialEntityRecord[],
  taxonNames:readonly TaxonNameRecord[],
  siteContexts:readonly CanonicalSiteContextRecord[],
  occurrences:readonly ExplorerOccurrence[],
  sites:readonly EvidenceSite[],
  claims:readonly ProvenanceClaim[],
  evidence:readonly EvidenceRecord[],
  specimens:readonly ExplorerSpecimen[],
  interpretationSets:readonly InterpretationSetRecord[],
  interpretationPositions:readonly InterpretationPositionRecord[],
):ExplorerBootstrapIndexes{
  const speciesById:Record<string,number>={}
  const mediaById:Record<string,number>={}
  const sourcesById:Record<string,number>={}
  const publicationsById:Record<string,number>={}
  const institutionsById:Record<string,number>={}
  const collectionsById:Record<string,number>={}
  const materialEntitiesById:Record<string,number>={}
  const taxonNamesById:Record<string,number>={}
  const siteContextsById:Record<string,number>={}
  const occurrencesById:Record<string,number>={}
  const sitesById:Record<string,number>={}
  const evidenceById:Record<string,number>={}
  const claimsById:Record<string,number>={}
  const specimensById:Record<string,number>={}
  const claimsByTaxonId:Record<string,number[]>={}
  const evidenceByTaxonId:Record<string,number[]>={}
  const specimensByTaxonId:Record<string,number[]>={}
  const occurrencesByTaxonId:Record<string,number[]>={}
  const mediaByTaxonId:Record<string,number[]>={}
  const interpretationSetsByClaimId:Record<string,number[]>={}
  const interpretationPositionsBySetId:Record<string,number[]>={}

  species.forEach((item,index)=>{speciesById[item.id]=index})
  media.forEach((item,index)=>{mediaById[String(item.id)]=index; const key=item.subject.type==='taxon'?String(item.subject.id):undefined;if(key)(mediaByTaxonId[key]??=[]).push(index)})
  sources.forEach((item,index)=>{sourcesById[String(item.id)]=index})
  publications.forEach((item,index)=>{publicationsById[String(item.id)]=index})
  institutions.forEach((item,index)=>{institutionsById[String(item.id)]=index})
  collections.forEach((item,index)=>{collectionsById[String(item.id)]=index})
  materialEntities.forEach((item,index)=>{materialEntitiesById[String(item.id)]=index})
  taxonNames.forEach((item,index)=>{taxonNamesById[String(item.id)]=index})
  siteContexts.forEach((item,index)=>{siteContextsById[String(item.id)]=index})
  occurrences.forEach((item,index)=>{occurrencesById[String(item.id)]=index; const key=item.taxonId;(occurrencesByTaxonId[key]??=[]).push(index)})
  sites.forEach((item,index)=>{sitesById[String(item.id)]=index})
  evidence.forEach((item,index)=>{evidenceById[String(item.id)]=index; const key=String(item.taxonId);(evidenceByTaxonId[key]??=[]).push(index)})
  claims.forEach((item,index)=>{claimsById[String(item.id)]=index; const key=String(item.taxonId);(claimsByTaxonId[key]??=[]).push(index)})
  specimens.forEach((item,index)=>{specimensById[String(item.id)]=index; const key=item.taxonId;(specimensByTaxonId[key]??=[]).push(index)})
  interpretationSets.forEach((item,index)=>{const key=String(item.claimId);(interpretationSetsByClaimId[key]??=[]).push(index)})
  interpretationPositions.forEach((item,index)=>{const key=String(item.setId);(interpretationPositionsBySetId[key]??=[]).push(index)})

  const freezeIndex=(value:Record<string,number>)=>Object.freeze(value)
  const freezeMulti=(value:Record<string,number[]>)=>Object.freeze(Object.fromEntries(Object.entries(value).map(([key,indices])=>[key,Object.freeze([...indices])])) )

  return Object.freeze({
    speciesById:freezeIndex(speciesById),
    mediaById:freezeIndex(mediaById),
    sourcesById:freezeIndex(sourcesById),
    publicationsById:freezeIndex(publicationsById),
    institutionsById:freezeIndex(institutionsById),
    collectionsById:freezeIndex(collectionsById),
    materialEntitiesById:freezeIndex(materialEntitiesById),
    taxonNamesById:freezeIndex(taxonNamesById),
    siteContextsById:freezeIndex(siteContextsById),
    occurrencesById:freezeIndex(occurrencesById),
    sitesById:freezeIndex(sitesById),
    evidenceById:freezeIndex(evidenceById),
    claimsById:freezeIndex(claimsById),
    specimensById:freezeIndex(specimensById),
    claimsByTaxonId:freezeMulti(claimsByTaxonId),
    evidenceByTaxonId:freezeMulti(evidenceByTaxonId),
    specimensByTaxonId:freezeMulti(specimensByTaxonId),
    occurrencesByTaxonId:freezeMulti(occurrencesByTaxonId),
    mediaByTaxonId:freezeMulti(mediaByTaxonId),
    interpretationSetsByClaimId:freezeMulti(interpretationSetsByClaimId),
    interpretationPositionsBySetId:freezeMulti(interpretationPositionsBySetId),
  })
}

export function buildExplorerBootstrap(contentCatalog:ContentCatalog=baseCatalog,copy:Readonly<Record<string,string>>={}):ExplorerBootstrap{
  const isBase=contentCatalog===baseCatalog
  // Oldest first everywhere (deck, species index, previous/next), regardless of the order taxa were added to the catalog.
  const species=contentCatalog.taxa.map(taxon=>toExplorerSpecies(taxon,contentCatalog)).sort((a,b)=>b.start-a.start||a.end-b.end||a.id.localeCompare(b.id))
  const media:ExplorerMedia[]=contentCatalog.media.map(toExplorerMedia)
  const sources=contentCatalog.sources
  const publications=contentCatalog.publications
  const institutions=contentCatalog.institutions
  const collections=contentCatalog.collections
  const specimens:ExplorerSpecimen[]=contentCatalog.specimens.map(record=>{
    const source=contentCatalog.sources.find(item=>record.sourceIds.some(sourceId=>String(sourceId)===String(item.id)))
    const site=contentCatalog.sites.find(item=>String(item.id)===String(record.siteId))
    const material=contentCatalog.materialEntities.find(item=>String(item.id)===String(record.materialEntityId))
    return {
      ...record,
      id:String(asSpecimenId(String(record.id))),
      taxonId:String(asTaxonId(String(record.taxonId))),
      siteId:String(asSiteId(String(record.siteId))),
      sourceIds:record.sourceIds.map(id=>String(asSourceId(String(id)))),
      sourceUrl:source?.url ?? '',
      siteLabel:site?.name ?? 'Site context not registered',
      country:site?.country ?? '',
      viewerUrl:material?.viewerUrl,
      viewerLabel:material?.viewerLabel,
      originalInstitution:material?.originalInstitution,
      recordId:material?.recordId,
      metadataUsage:material?.metadataUsage,
      objectIdentifier:material?.objectIdentifier,
    }
  })
  const occurrences:ExplorerOccurrence[]=contentCatalog.occurrences.map(record=>({
    ...record,
    id:String(asOccurrenceId(String(record.id))),
    taxonId:String(asTaxonId(String(record.taxonId))),
    siteId:String(asSiteId(String(record.siteId))),
    specimenId:record.specimenId?String(asSpecimenId(String(record.specimenId))):undefined,
    sourceIds:record.sourceIds.map(id=>String(asSourceId(String(id)))),
  }))
  const relationships=contentCatalog.relationships.map(item=>({...item,from:asTaxonId(String(item.from)),to:asTaxonId(String(item.to)),sourceIds:item.sourceIds.map(id=>asSourceId(String(id)))}))
  const sites=contentCatalog.siteViews.map(item=>({...item,id:asSiteId(String(item.id)),sourceIds:item.sourceIds.map(id=>asSourceId(String(id))),relatedTaxonIds:item.relatedTaxonIds.map(id=>asTaxonId(String(id)))}))
  const evidence=contentCatalog.evidence.map(item=>({...item,id:asEvidenceId(String(item.id)),taxonId:asTaxonId(String(item.taxonId)),siteId:asSiteId(String(item.siteId)),sourceIds:item.sourceIds.map(id=>asSourceId(String(id)))}))
  const claims=contentCatalog.claims.map(item=>({...item,id:asClaimId(String(item.id)),taxonId:asTaxonId(String(item.taxonId)),evidenceIds:item.evidenceIds.map(id=>asEvidenceId(String(id))),sourceIds:item.sourceIds.map(id=>asSourceId(String(id))),interpretationSetIds:item.interpretationSetIds.map(id=>asInterpretationSetId(String(id)))}))
  const interpretationSets=contentCatalog.interpretationSets
  const interpretationPositions=contentCatalog.interpretationPositions
  const relationshipHypothesisSets=contentCatalog.relationshipHypothesisSets
  const relationshipHypothesisPositions=contentCatalog.relationshipHypothesisPositions
  const researchGraph=buildResearchGraph(contentCatalog,isBase?catalogRuntimeMetadata.fingerprint:createCatalogFingerprint(contentCatalog))
  const researchGraphIndex=buildAdjacencyIndex(researchGraph)
  const provenanceChains:Record<string,ClaimProvenanceSummary>=Object.fromEntries(contentCatalog.claims.map(claim=>{
    const chain=provenanceChainForClaim(researchGraph,researchGraphIndex,String(claim.id))
    return [String(claim.id),{
      evidenceIds:chain.evidence.map(node=>node.entityId),
      specimenIds:chain.specimens.map(node=>node.entityId),
      siteIds:chain.sites.map(node=>node.entityId),
      sourceIds:chain.sources.map(node=>node.entityId),
      reachedSource:chain.reachedSource,
    }]
  }))
  const normalized:ExplorerBootstrap={
    release:catalogRuntimeMetadata.release,
    schemaVersion:catalogRuntimeMetadata.schemaVersion,
    fingerprint:isBase?catalogRuntimeMetadata.fingerprint:createCatalogFingerprint(contentCatalog),
    species,
    relationships,
    media,
    sites,
    evidence,
    claims,
    specimens,
    occurrences,
    sources,
    publications,
    institutions,
    collections,
    materialEntities:contentCatalog.materialEntities,
    interpretationSets,
    interpretationPositions,
    relationshipHypothesisSets,
    relationshipHypothesisPositions,
    taxonNames:contentCatalog.taxonNames,
    siteContexts:contentCatalog.siteContexts,
    researchIndexes:isBase?baseResearchIndexes:buildResearchIndexes(contentCatalog),
    copy,
    indexes:buildIndexes(species,media,sources,publications,institutions,collections,contentCatalog.materialEntities,contentCatalog.taxonNames,contentCatalog.siteContexts,occurrences,sites,claims,evidence,specimens,interpretationSets,interpretationPositions),
    provenanceChains,
  }
  return deepFreeze(normalized)
}
