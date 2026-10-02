import 'server-only'
import {contentCatalog,evidenceById,mediaById,sourcesById,specimensById,sitesById,taxaById,publicationsById,institutionsById,occurrencesById,materialEntitiesById,taxonNamesById,siteContextsById,getSourcesByIds,getEvidenceByIds,siteViewsById,researchIndexes} from '../content/catalog'
import type {ProvenanceClaim,SearchResult} from '../domain/contracts'
import {asTaxonId} from '../domain/ids'
import type {TaxonId} from '../domain/ids'

export const getTaxonRecord=(id:TaxonId)=>taxaById[String(id)]
export const getTaxa=()=>contentCatalog.taxa
export const getRelationshipsRecords=()=>contentCatalog.relationships
export const getMediaRecord=(id:string)=>mediaById[id]
const getSourcesByIdsCanonical=(ids:readonly string[])=>getSourcesByIds(ids)
export const getEvidenceRecord=(id:string)=>evidenceById[id]
export const getSpecimenRecord=(id:string)=>specimensById[id]
export const getSiteRecord=(id:string)=>sitesById[id]
export const getSiteView=(id:string)=>siteViewsById[id]
export const getPublicationRecord=(id:string)=>publicationsById[id]
export const getInstitutionRecord=(id:string)=>institutionsById[id]
export const getOccurrenceRecord=(id:string)=>occurrencesById[id]
export const getMaterialEntityRecord=(id:string)=>materialEntitiesById[id]
export const getTaxonNameRecord=(id:string)=>taxonNamesById[id]
export const getSiteContextRecord=(id:string)=>siteContextsById[id]
export const getSpecimensByMaterialEntity=(id:string)=> (researchIndexes.specimensByMaterialEntityId[id]??[]).map(position=>contentCatalog.specimens[position])
export const getOccurrencesBySpecimen=(id:string)=> (researchIndexes.occurrencesBySpecimenId[id]??[]).map(position=>contentCatalog.occurrences[position])
export const getClaimsByTaxon=(id:string)=>contentCatalog.claims.filter(claim=>String(claim.taxonId)===id)
export const getEvidenceByTaxon=(id:string)=>contentCatalog.evidence.filter(item=>String(item.taxonId)===id)
export const getSpecimensByTaxon=(id:string)=>contentCatalog.specimens.filter(item=>String(item.taxonId)===id)
export const getSitesByTaxon=(id:string)=>contentCatalog.siteViews.filter(item=>item.relatedTaxonIds.some(taxonId=>String(taxonId)===id))
export const getClaimEvidence=(claim:ProvenanceClaim)=>getEvidenceByIds(claim.evidenceIds)
export const getClaimSources=(claim:ProvenanceClaim)=>getSourcesByIds(claim.sourceIds)
export const getSourcesForTaxon=(id:string)=>{
  const taxon=getTaxonRecord(asTaxonId(id))
  return taxon?getSourcesByIdsCanonical(taxon.sourceIds):[]
}
export const getEvidenceForTaxon=(id:string)=>getEvidenceByTaxon(id)
export const getClaimsForTaxon=(id:string)=>getClaimsByTaxon(id)
export const getSpecimensForTaxon=(id:string)=>getSpecimensByTaxon(id)
export const getSitesForTaxon=(id:string)=>getSitesByTaxon(id)

const normalize=(value:string)=>value.trim().toLowerCase()
const scoreText=(query:string,...fields:string[]):number=>{
  const q=normalize(query)
  const normalizedFields=fields.map(normalize)
  const hay=normalizedFields.join(' ')
  if(hay===q) return 1
  if(normalizedFields.some(field=>field===q)) return .98
  if(normalizedFields.some(field=>field.startsWith(q))) return .9
  if(hay.includes(q)) return .72
  return 0
}

export function searchCatalog(query:string):SearchResult[]{
  const q=query.trim()
  if(!q) return []
  const results:SearchResult[]=[]
  for(const item of contentCatalog.taxa){const score=scoreText(q,item.name,item.short,item.group,item.description,item.date);if(score)results.push({id:String(item.id),kind:'taxon',title:item.name,subtitle:item.date,score})}
  for(const item of contentCatalog.specimens){const material=contentCatalog.materialEntities.find(material=>String(material.id)===String(item.materialEntityId));const site=item.siteId?contentCatalog.sites.find(site=>String(site.id)===String(item.siteId)):undefined;const score=scoreText(q,item.name,material?.objectIdentifier??'',site?.name??'',site?.country??'',item.significance);if(score)results.push({id:String(item.id),kind:'specimen',title:item.name,subtitle:site?.name??'Site context',score:Math.max(.5,score-.18)})}
  for(const item of contentCatalog.siteViews){const score=scoreText(q,item.name,item.ageLabel,item.kind,item.note);if(score)results.push({id:String(item.id),kind:'site',title:item.name,subtitle:item.ageLabel,score:Math.max(.48,score-.22)})}
  for(const item of contentCatalog.evidence){const score=scoreText(q,item.title,item.claim,item.kind,item.ageLabel,item.claimScope??'');if(score)results.push({id:String(item.id),kind:'evidence',title:item.title,subtitle:item.ageLabel,score:Math.max(.46,score-.24)})}
  for(const item of contentCatalog.sources){const publication=item.publicationId?publicationsById[String(item.publicationId)]:undefined;const score=scoreText(q,item.title,item.publisher,item.scope,item.role,publication?.authors.join(' ')??'',publication?.doi??'');if(score)results.push({id:String(item.id),kind:'source',title:item.title,subtitle:item.publisher,score:Math.max(.42,score-.28)})}
  for(const item of contentCatalog.claims){const score=scoreText(q,item.statement,item.scope,item.status);if(score)results.push({id:String(item.id),kind:'claim',title:item.statement,subtitle:item.scope,score:Math.max(.4,score-.3)})}
  for(const item of contentCatalog.publications){const score=scoreText(q,item.title,item.journal??'',item.authors.join(' '),item.doi??'',item.publisher??'');if(score)results.push({id:String(item.id),kind:'publication',title:item.title,subtitle:item.journal??item.publisher,score:Math.max(.44,score-.26)})}
  for(const item of contentCatalog.institutions){const score=scoreText(q,item.name,item.type,item.country??'');if(score)results.push({id:String(item.id),kind:'institution',title:item.name,subtitle:item.type,score:Math.max(.38,score-.32)})}
  return results.sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title)).slice(0,16)
}

export const getSourceById=(id:string)=>sourcesById[id]
export const getEvidenceSites=()=>contentCatalog.siteViews
