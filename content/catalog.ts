import {taxa} from './taxa'
import {taxonNames} from './taxon-names'
import {relationships} from './relationships'
import {media} from './media'
import {sourceRecords} from './sources'
import {evidenceRecords} from './evidence'
import {specimenRecords,materialEntityRecords} from './specimens'
import {provenanceClaims} from './provenance'
import {siteRecords,siteContextRecords,siteViews} from './sites'
import {publicationRecords} from './publications'
import {institutionRecords} from './institutions'
import {collectionRecords} from './collections'
import {occurrenceRecords} from './occurrences'
import {interpretationSets,interpretationPositions} from './interpretations'
import {relationshipHypothesisSets,relationshipHypothesisPositions} from './relationship-hypotheses'
import type {ContentCatalog,MediaAsset,TaxonRecord,CanonicalSiteRecord,CanonicalSiteContextRecord,MaterialEntityRecord,TaxonNameRecord,EvidenceSite,MediaRole} from '../domain/contracts'
import type {TaxonId,SiteId} from '../domain/ids'
import {deepFreeze} from '../domain/immutability'
import {buildResearchIndexes} from '../domain/research-indexes'

export const contentCatalog:ContentCatalog=deepFreeze({
  metadata:{
    schemaVersion:'4.2.0',
    modelVersion:'4.2.0',
    release:'0.30.0',
    purpose:'curated-research-interface',
    conceptualStandards:['Darwin Core','CIDOC CRM','W3C PROV-O'],
    snapshotKind:'curated',
  },
  taxa,
  taxonNames,
  relationships,
  media,
  sources:sourceRecords,
  publications:publicationRecords,
  institutions:institutionRecords,
  collections:collectionRecords,
  materialEntities:materialEntityRecords,
  occurrences:occurrenceRecords,
  evidence:evidenceRecords,
  specimens:specimenRecords,
  claims:provenanceClaims,
  interpretationSets,
  interpretationPositions,
  relationshipHypothesisSets,
  relationshipHypothesisPositions,
  sites:siteRecords,
  siteContexts:siteContextRecords,
  siteViews,
})

export const researchIndexes=buildResearchIndexes(contentCatalog)

export const taxaById=Object.freeze(Object.fromEntries(taxa.map(item=>[String(item.id),item]))) as Record<string,TaxonRecord>
export const taxonNamesById=Object.freeze(Object.fromEntries(taxonNames.map(item=>[String(item.id),item]))) as Record<string,TaxonNameRecord>
export const mediaById=Object.freeze(Object.fromEntries(media.map(item=>[String(item.id),item]))) as Record<string,MediaAsset>
export const sourcesById=Object.freeze(Object.fromEntries(sourceRecords.map(item=>[String(item.id),item])))
export const publicationsById=Object.freeze(Object.fromEntries(publicationRecords.map(item=>[String(item.id),item])))
export const institutionsById=Object.freeze(Object.fromEntries(institutionRecords.map(item=>[String(item.id),item])))
export const occurrencesById=Object.freeze(Object.fromEntries(occurrenceRecords.map(item=>[String(item.id),item])))
export const evidenceById=Object.freeze(Object.fromEntries(evidenceRecords.map(item=>[String(item.id),item])))
export const specimensById=Object.freeze(Object.fromEntries(specimenRecords.map(item=>[String(item.id),item])))
export const materialEntitiesById=Object.freeze(Object.fromEntries(materialEntityRecords.map(item=>[String(item.id),item]))) as Record<string,MaterialEntityRecord>
export const claimsById=Object.freeze(Object.fromEntries(provenanceClaims.map(item=>[String(item.id),item])))
export const sitesById=Object.freeze(Object.fromEntries(siteRecords.map(item=>[String(item.id),item]))) as Record<string,CanonicalSiteRecord>
export const siteContextsById=Object.freeze(Object.fromEntries(siteContextRecords.map(item=>[String(item.id),item]))) as Record<string,CanonicalSiteContextRecord>
export const siteViewsById=Object.freeze(Object.fromEntries(siteViews.map(item=>[String(item.id),item]))) as Record<string,EvidenceSite>

export const getTaxonRecord=(id:TaxonId)=>taxaById[String(id)]
export const getDefaultMedia=(taxon:TaxonRecord)=>mediaById[String(taxon.defaultMediaId)]
export const getMediaForTaxon=(taxon:TaxonRecord)=>taxon.mediaIds.map(id=>mediaById[String(id)]).filter(Boolean)
export const getMediaForTaxonByRole=(taxon:TaxonRecord,role:MediaRole)=>getMediaForTaxon(taxon).filter(item=>item.roles.includes(role))
export const getSourcesByIds=(ids:readonly string[])=>ids.map(id=>sourcesById[id]).filter(Boolean)
export const getEvidenceByIds=(ids:readonly string[])=>ids.map(id=>evidenceById[id]).filter(Boolean)
export const getSiteView=(id:SiteId)=>siteViewsById[String(id)]

export * from './taxa'
export * from './taxon-names'
export * from './media'
export * from './relationships'
export * from './sources'
export * from './sites'
export * from './evidence'
export * from './specimens'
export * from './provenance'
export * from './interpretations'
export * from './foundation'
