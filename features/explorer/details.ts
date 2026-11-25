import type {EvidenceSite,InstitutionRecord} from '../../domain/contracts'
import type {CanonicalSiteContextRecord} from '../../domain/contracts'
import type {ClientPublicationRecord,ClientSourceRecord,ExplorerBootstrap} from './bootstrap'
import type {ExplorerOccurrence,ExplorerSpecimen} from './types'

/**
 * Data that is needed only after a taxon dossier/evidence panel is opened.
 * It deliberately excludes the large graph, species list, claims and evidence records which remain in the
 * compact bootstrap. Specimen rows already contain their source/site/material display projection.
 */
export type ExplorerTaxonDetails={
  kind:'taxon'
  taxonId:string
  sources:readonly ClientSourceRecord[]
  publications:readonly ClientPublicationRecord[]
  institutions:readonly InstitutionRecord[]
  specimens:readonly ExplorerSpecimen[]
  occurrences:readonly ExplorerOccurrence[]
  sites:readonly EvidenceSite[]
  siteContexts:readonly CanonicalSiteContextRecord[]
}

/** Map-only data, fetched only when the Migration view is mounted. */
export type ExplorerMigrationDetails={
  kind:'migration'
  sources:readonly ClientSourceRecord[]
  sites:readonly EvidenceSite[]
  siteContexts:readonly CanonicalSiteContextRecord[]
}

export type ExplorerDetailBundle=ExplorerTaxonDetails|ExplorerMigrationDetails

const idOf=(value:unknown)=>String(value)
const addIds=(target:Set<string>,values:readonly unknown[]|undefined)=>values?.forEach(value=>target.add(idOf(value)))
const addLinks=(target:Set<string>,links:readonly {sourceId:unknown}[]|undefined)=>links?.forEach(link=>target.add(idOf(link.sourceId)))

function relatedRecords(
  bootstrap:ExplorerBootstrap,
  sourceIds:Set<string>,
){
  const sources=bootstrap.sources.filter(source=>sourceIds.has(idOf(source.id)))
  const publicationIds=new Set<string>()
  const institutionIds=new Set<string>()
  for(const source of sources){
    if(source.publicationId) publicationIds.add(idOf(source.publicationId))
    if(source.institutionId) institutionIds.add(idOf(source.institutionId))
  }
  const publications=bootstrap.publications.filter(publication=>publicationIds.has(idOf(publication.id)))
  for(const publication of publications) addIds(institutionIds,publication.institutionIds)
  const institutions=bootstrap.institutions.filter(institution=>institutionIds.has(idOf(institution.id)))
  return {sources,publications,institutions}
}

/** Builds a taxon-keyed detail response while preserving every linked source and its normalized metadata. */
export function buildExplorerTaxonDetails(bootstrap:ExplorerBootstrap,taxonId:string):ExplorerTaxonDetails|undefined{
  const species=bootstrap.species[bootstrap.indexes.speciesById[taxonId]]
  if(!species) return undefined

  const specimens=bootstrap.specimens.filter(record=>idOf(record.taxonId)===taxonId)
  const occurrences=bootstrap.occurrences.filter(record=>idOf(record.taxonId)===taxonId)
  const evidence=bootstrap.evidence.filter(record=>idOf(record.taxonId)===taxonId)
  const claims=bootstrap.claims.filter(record=>idOf(record.taxonId)===taxonId)
  const siteIds=new Set<string>()
  for(const record of specimens) siteIds.add(idOf(record.siteId))
  for(const record of occurrences) siteIds.add(idOf(record.siteId))
  for(const record of evidence) siteIds.add(idOf(record.siteId))
  for(const claim of claims) addIds(siteIds,claim.siteIds)

  const sites=bootstrap.sites.filter(site=>siteIds.has(idOf(site.id))||site.relatedTaxonIds.some(id=>idOf(id)===taxonId))
  for(const site of sites){
    siteIds.add(idOf(site.id))
  }
  const siteContexts=bootstrap.siteContexts.filter(context=>
    siteIds.has(idOf(context.siteId))||context.relatedTaxonIds.some(id=>idOf(id)===taxonId),
  )

  const sourceIds=new Set<string>()
  addIds(sourceIds,species.sourceIds)
  for(const record of specimens){addIds(sourceIds,record.sourceIds);addLinks(sourceIds,record.sourceLinks)}
  for(const record of occurrences){addIds(sourceIds,record.sourceIds);addLinks(sourceIds,record.sourceLinks)}
  for(const record of evidence){addIds(sourceIds,record.sourceIds);addLinks(sourceIds,record.sourceLinks)}
  for(const claim of claims){addIds(sourceIds,claim.sourceIds);addLinks(sourceIds,claim.sourceLinks)}
  for(const site of sites){addIds(sourceIds,site.sourceIds)}
  for(const context of siteContexts){addIds(sourceIds,context.sourceIds);addLinks(sourceIds,context.sourceLinks)}

  const normalized=relatedRecords(bootstrap,sourceIds)
  return {
    kind:'taxon',
    taxonId,
    sources:normalized.sources,
    publications:normalized.publications,
    institutions:normalized.institutions,
    specimens,
    occurrences,
    sites,
    siteContexts,
  }
}

/** Builds the complete site/source context needed by Migration, without serializing it in the default explorer view. */
export function buildExplorerMigrationDetails(bootstrap:ExplorerBootstrap):ExplorerMigrationDetails{
  const sourceIds=new Set<string>()
  for(const site of bootstrap.sites) addIds(sourceIds,site.sourceIds)
  for(const corridor of bootstrap.migrationCorridors){
    addIds(sourceIds,corridor.sourceIds)
    addLinks(sourceIds,corridor.sourceLinks)
  }
  const normalized=relatedRecords(bootstrap,sourceIds)
  return {
    kind:'migration',
    sources:normalized.sources,
    sites:bootstrap.sites,
    siteContexts:bootstrap.siteContexts,
  }
}

export const getExplorerDetailSourceById=(details:ExplorerDetailBundle,id:string)=>
  details.sources.find(source=>idOf(source.id)===id)

export const getExplorerDetailSiteContextForSite=(details:ExplorerDetailBundle,id:string)=>
  details.siteContexts.find(context=>idOf(context.siteId)===id)

export const getExplorerDetailSpecimensForTaxon=(details:ExplorerTaxonDetails)=>details.specimens

export const getExplorerDetailPublicationForSource=(details:ExplorerTaxonDetails,source:ClientSourceRecord)=>
  source.publicationId
    ?details.publications.find(publication=>idOf(publication.id)===idOf(source.publicationId))
    :undefined

export const getExplorerDetailInstitutionById=(details:ExplorerTaxonDetails,id:string)=>
  details.institutions.find(institution=>idOf(institution.id)===id)
