import type {EvidenceRecord,MediaRole,ProvenanceClaim,RelationshipRecord,SearchResult,SourceRecord,EvidenceSite,PublicationRecord,InstitutionRecord,InterpretationSetRecord,InterpretationPositionRecord,RelationshipHypothesisSetRecord,RelationshipHypothesisPositionRecord} from '../../domain/contracts'
import type {ExplorerOccurrence} from './types'
import type {ClaimProvenanceSummary,ExplorerBootstrap} from './bootstrap'
import type {ExplorerMedia,ExplorerSpecies,ExplorerSpecimen} from './types'

const indices=(bootstrap:ExplorerBootstrap)=>bootstrap.indexes

export const getExplorerSpeciesById=(bootstrap:ExplorerBootstrap,id:string):ExplorerSpecies=>{
  const position=indices(bootstrap).speciesById[id]
  if(position===undefined) throw new Error(`Unknown taxon id: ${id}`)
  return bootstrap.species[position]
}
export const getExplorerSpeciesList=(bootstrap:ExplorerBootstrap):readonly ExplorerSpecies[]=>bootstrap.species
export const getExplorerRelationships=(bootstrap:ExplorerBootstrap):readonly RelationshipRecord[]=>bootstrap.relationships
export const getExplorerEvidenceSites=(bootstrap:ExplorerBootstrap):readonly EvidenceSite[]=>bootstrap.sites
export const getExplorerMediaById=(bootstrap:ExplorerBootstrap,id:string):ExplorerMedia|undefined=>{
  const position=indices(bootstrap).mediaById[id]
  return position===undefined?undefined:bootstrap.media[position]
}
export const getExplorerMediaForTaxon=(bootstrap:ExplorerBootstrap,id:string):readonly ExplorerMedia[]=>
  (indices(bootstrap).mediaByTaxonId[id]??[]).map(position=>bootstrap.media[position])
export const getExplorerMediaForTaxonByRole=(bootstrap:ExplorerBootstrap,id:string,role:MediaRole):readonly ExplorerMedia[]=>
  getExplorerMediaForTaxon(bootstrap,id).filter(media=>media.roles.includes(role))
export const getExplorerTaxonNamesForTaxon=(bootstrap:ExplorerBootstrap,id:string)=> (bootstrap.researchIndexes.taxonNamesByTaxonId[id]??[]).map(position=>bootstrap.taxonNames[position])
export const getExplorerSiteContextsForSite=(bootstrap:ExplorerBootstrap,id:string)=> (bootstrap.researchIndexes.siteContextsBySiteId[id]??[]).map(position=>bootstrap.siteContexts[position])
export const getExplorerMaterialEntityById=(bootstrap:ExplorerBootstrap,id:string)=>{ const position=bootstrap.indexes.materialEntitiesById[id]; return position===undefined?undefined:bootstrap.materialEntities[position] }
export const getExplorerPublicationById=(bootstrap:ExplorerBootstrap,id:string):PublicationRecord|undefined=>{
  const position=indices(bootstrap).publicationsById[id]
  return position===undefined?undefined:bootstrap.publications[position]
}
export const getExplorerInstitutionById=(bootstrap:ExplorerBootstrap,id:string):InstitutionRecord|undefined=>{
  const position=indices(bootstrap).institutionsById[id]
  return position===undefined?undefined:bootstrap.institutions[position]
}
export const getExplorerOccurrenceById=(bootstrap:ExplorerBootstrap,id:string):ExplorerOccurrence|undefined=>{
  const position=indices(bootstrap).occurrencesById[id]
  return position===undefined?undefined:bootstrap.occurrences[position]
}
export const getExplorerPublicationForSource=(bootstrap:ExplorerBootstrap,source:SourceRecord):PublicationRecord|undefined=>source.publicationId?getExplorerPublicationById(bootstrap,String(source.publicationId)):undefined
export const getExplorerSourceById=(bootstrap:ExplorerBootstrap,id:string):SourceRecord|undefined=>{
  const position=indices(bootstrap).sourcesById[id]
  return position===undefined?undefined:bootstrap.sources[position]
}
export const getExplorerEvidenceById=(bootstrap:ExplorerBootstrap,id:string):EvidenceRecord|undefined=>{
  const position=indices(bootstrap).evidenceById[id]
  return position===undefined?undefined:bootstrap.evidence[position]
}
export const getExplorerClaimById=(bootstrap:ExplorerBootstrap,id:string):ProvenanceClaim|undefined=>{
  const position=indices(bootstrap).claimsById[id]
  return position===undefined?undefined:bootstrap.claims[position]
}
export const getExplorerSpecimenById=(bootstrap:ExplorerBootstrap,id:string):ExplorerSpecimen|undefined=>{
  const position=indices(bootstrap).specimensById[id]
  return position===undefined?undefined:bootstrap.specimens[position]
}
export const getExplorerClaimsForTaxon=(bootstrap:ExplorerBootstrap,id:string):readonly ProvenanceClaim[]=>(indices(bootstrap).claimsByTaxonId[id]??[]).map(position=>bootstrap.claims[position])
export const getExplorerEvidenceForTaxon=(bootstrap:ExplorerBootstrap,id:string):readonly EvidenceRecord[]=>
  (indices(bootstrap).evidenceByTaxonId[id]??[]).map(position=>bootstrap.evidence[position])
export const getExplorerSpecimensForTaxon=(bootstrap:ExplorerBootstrap,id:string):readonly ExplorerSpecimen[]=>
  (indices(bootstrap).specimensByTaxonId[id]??[]).map(position=>bootstrap.specimens[position])
export const getExplorerOccurrencesForTaxon=(bootstrap:ExplorerBootstrap,id:string):readonly ExplorerOccurrence[] => (indices(bootstrap).occurrencesByTaxonId[id]??[]).map(position=>bootstrap.occurrences[position])
export const getExplorerSourcesForTaxon=(bootstrap:ExplorerBootstrap,id:string):readonly SourceRecord[]=>{
  const species=getExplorerSpeciesById(bootstrap,id)
  return species.sourceIds.map(sourceId=>getExplorerSourceById(bootstrap,sourceId)).filter((source):source is SourceRecord=>source!==undefined)
}
export const getExplorerClaimEvidence=(bootstrap:ExplorerBootstrap,claim:ProvenanceClaim):readonly EvidenceRecord[]=>
  claim.evidenceIds.map(id=>getExplorerEvidenceById(bootstrap,String(id))).filter((record):record is EvidenceRecord=>record!==undefined)
export const getExplorerClaimSources=(bootstrap:ExplorerBootstrap,claim:ProvenanceClaim):readonly SourceRecord[]=>
  claim.sourceIds.map(id=>getExplorerSourceById(bootstrap,String(id))).filter((source):source is SourceRecord=>source!==undefined)
export const getExplorerInterpretationSetsForClaim=(bootstrap:ExplorerBootstrap,claimId:string):readonly InterpretationSetRecord[]=>
  (indices(bootstrap).interpretationSetsByClaimId[claimId]??[]).map(position=>bootstrap.interpretationSets[position])
export const getExplorerInterpretationPositionsForSet=(bootstrap:ExplorerBootstrap,setId:string):readonly InterpretationPositionRecord[]=>
  (indices(bootstrap).interpretationPositionsBySetId[setId]??[]).map(position=>bootstrap.interpretationPositions[position])
export const getExplorerRelationshipHypothesisSets=(bootstrap:ExplorerBootstrap,relationshipId:string):readonly RelationshipHypothesisSetRecord[]=>
  (bootstrap.researchIndexes.relationshipHypothesisSetsByRelationshipId[relationshipId]??[]).map(position=>bootstrap.relationshipHypothesisSets[position])
export const getExplorerRelationshipHypothesisPositions=(bootstrap:ExplorerBootstrap,setId:string):readonly RelationshipHypothesisPositionRecord[]=>
  (bootstrap.researchIndexes.relationshipHypothesisPositionsBySetId[setId]??[]).map(position=>bootstrap.relationshipHypothesisPositions[position])
export const getExplorerProvenanceChainForClaim=(bootstrap:ExplorerBootstrap,claimId:string):ClaimProvenanceSummary|undefined=>
  bootstrap.provenanceChains[claimId]

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

export function searchExplorerCatalog(bootstrap:ExplorerBootstrap,query:string):SearchResult[]{
  const q=query.trim()
  if(!q) return []
  const results:SearchResult[]=[]
  for(const item of bootstrap.species){const score=scoreText(q,item.name,item.short,item.group,item.description,item.date);if(score)results.push({id:item.id,kind:'taxon',title:item.name,subtitle:item.date,score})}
  for(const item of bootstrap.specimens){const score=scoreText(q,item.name,item.objectIdentifier??'',item.siteLabel,item.country,item.significance);if(score)results.push({id:item.id,kind:'specimen',title:item.name,subtitle:item.siteLabel,score:Math.max(.5,score-.18)})}
  for(const item of bootstrap.sites){const score=scoreText(q,item.name,item.ageLabel,item.kind,item.note);if(score)results.push({id:String(item.id),kind:'site',title:item.name,subtitle:item.ageLabel,score:Math.max(.48,score-.22)})}
  for(const item of bootstrap.evidence){const score=scoreText(q,item.title,item.claim,item.kind,item.ageLabel,item.claimScope??'');if(score)results.push({id:String(item.id),kind:'evidence',title:item.title,subtitle:item.ageLabel,score:Math.max(.46,score-.24)})}
  for(const item of bootstrap.sources){const publication=getExplorerPublicationForSource(bootstrap,item);const score=scoreText(q,item.title,item.publisher,item.scope,item.role,publication?.authors.join(' ')??'',publication?.doi??'');if(score)results.push({id:String(item.id),kind:'source',title:item.title,subtitle:item.publisher,score:Math.max(.42,score-.28)})}
  for(const item of bootstrap.publications){const score=scoreText(q,item.title,item.journal??'',item.authors.join(' '),item.doi??'',item.publisher??'');if(score)results.push({id:String(item.id),kind:'publication',title:item.title,subtitle:item.journal??item.publisher,score:Math.max(.44,score-.26)})}
  for(const item of bootstrap.institutions){const score=scoreText(q,item.name,item.type,item.country??'');if(score)results.push({id:String(item.id),kind:'institution',title:item.name,subtitle:item.type,score:Math.max(.38,score-.32)})}
  for(const item of bootstrap.claims){const score=scoreText(q,item.statement,item.scope,item.status);if(score)results.push({id:String(item.id),kind:'claim',title:item.statement,subtitle:item.scope,score:Math.max(.4,score-.3)})}
  return results.sort((a,b)=>b.score-a.score || a.title.localeCompare(b.title)).slice(0,16)
}
