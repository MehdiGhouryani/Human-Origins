import {contentCatalog,researchIndexes} from '../content/catalog'

const failures:string[]=[]
const fail=(message:string)=>failures.push(message)
const assertIndex=(name:string,indexes:Readonly<Record<string,readonly number[]>>,size:number,expected:(position:number)=>string[])=>{
  for(const [key,positions] of Object.entries(indexes)){
    const actual=[...positions].sort((a,b)=>a-b)
    if(actual.some(position=>position<0||position>=size)) fail(`${name}[${key}] contains an invalid position.`)
    const expectedPositions=Array.from({length:size},(_,position)=>position).filter(position=>expected(position).includes(key)).sort((a,b)=>a-b)
    if(actual.join(',')!==expectedPositions.join(',')) fail(`${name}[${key}] does not match canonical membership.`)
  }
  const expectedKeys=new Set(Array.from({length:size},(_,position)=>expected(position)).flat())
  for(const key of expectedKeys) if(!Object.prototype.hasOwnProperty.call(indexes,key)) fail(`${name} is missing expected key ${key}.`)
}

assertIndex('taxonNamesByTaxonId',researchIndexes.taxonNamesByTaxonId,contentCatalog.taxonNames.length,position=>[String(contentCatalog.taxonNames[position].taxonId)])
assertIndex('materialEntitiesByTaxonId',researchIndexes.materialEntitiesByTaxonId,contentCatalog.materialEntities.length,position=>{const id=contentCatalog.materialEntities[position].taxonId;return id?[String(id)]:[]})
assertIndex('materialEntitiesByInstitutionId',researchIndexes.materialEntitiesByInstitutionId,contentCatalog.materialEntities.length,position=>{const id=contentCatalog.materialEntities[position].institutionId;return id?[String(id)]:[]})
assertIndex('specimensByMaterialEntityId',researchIndexes.specimensByMaterialEntityId,contentCatalog.specimens.length,position=>[String(contentCatalog.specimens[position].materialEntityId)])
assertIndex('specimensByOccurrenceId',researchIndexes.specimensByOccurrenceId,contentCatalog.specimens.length,position=>{const id=contentCatalog.specimens[position].occurrenceId;return id?[String(id)]:[]})
assertIndex('occurrencesBySpecimenId',researchIndexes.occurrencesBySpecimenId,contentCatalog.occurrences.length,position=>{const id=contentCatalog.occurrences[position].specimenId;return id?[String(id)]:[]})
assertIndex('occurrencesBySiteId',researchIndexes.occurrencesBySiteId,contentCatalog.occurrences.length,position=>[String(contentCatalog.occurrences[position].siteId)])
assertIndex('evidenceBySpecimenId',researchIndexes.evidenceBySpecimenId,contentCatalog.evidence.length,position=>(contentCatalog.evidence[position].specimenIds??[]).map(String))
assertIndex('evidenceByOccurrenceId',researchIndexes.evidenceByOccurrenceId,contentCatalog.evidence.length,position=>(contentCatalog.evidence[position].occurrenceIds??[]).map(String))
assertIndex('evidenceBySiteId',researchIndexes.evidenceBySiteId,contentCatalog.evidence.length,position=>[String(contentCatalog.evidence[position].siteId)])
assertIndex('claimsByEvidenceId',researchIndexes.claimsByEvidenceId,contentCatalog.claims.length,position=>contentCatalog.claims[position].evidenceIds.map(String))
assertIndex('claimsBySpecimenId',researchIndexes.claimsBySpecimenId,contentCatalog.claims.length,position=>(contentCatalog.claims[position].specimenIds??[]).map(String))
assertIndex('claimsBySiteId',researchIndexes.claimsBySiteId,contentCatalog.claims.length,position=>(contentCatalog.claims[position].siteIds??[]).map(String))
assertIndex('claimsBySourceId',researchIndexes.claimsBySourceId,contentCatalog.claims.length,position=>contentCatalog.claims[position].sourceIds.map(String))
assertIndex('relationshipsByTaxonId',researchIndexes.relationshipsByTaxonId,contentCatalog.relationships.length,position=>[String(contentCatalog.relationships[position].from),String(contentCatalog.relationships[position].to)])
assertIndex('sourcesByPublicationId',researchIndexes.sourcesByPublicationId,contentCatalog.sources.length,position=>{const id=contentCatalog.sources[position].publicationId;return id?[String(id)]:[]})
assertIndex('sourcesByInstitutionId',researchIndexes.sourcesByInstitutionId,contentCatalog.sources.length,position=>{const id=contentCatalog.sources[position].institutionId;return id?[String(id)]:[]})
assertIndex('siteContextsBySiteId',researchIndexes.siteContextsBySiteId,contentCatalog.siteContexts.length,position=>[String(contentCatalog.siteContexts[position].siteId)])
assertIndex('mediaBySubjectId',researchIndexes.mediaBySubjectId,contentCatalog.media.length,position=>[`$${contentCatalog.media[position].subject.type}:${String(contentCatalog.media[position].subject.id)}`.slice(1)])

if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);throw new Error(`Research-index audit failed with ${failures.length} issue(s).`)}
console.log(`Research-index audit passed: ${Object.keys(researchIndexes).length} inverse index families verified.`)
