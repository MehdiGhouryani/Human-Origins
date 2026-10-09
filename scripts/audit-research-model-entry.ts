import {contentCatalog} from '../content/catalog'

const failures:string[]=[]
const fail=(message:string)=>failures.push(message)

if(contentCatalog.metadata.schemaVersion!=='4.2.0') fail(`unexpected schemaVersion ${contentCatalog.metadata.schemaVersion}`)
if(contentCatalog.metadata.modelVersion!=='4.2.0') fail(`unexpected modelVersion ${contentCatalog.metadata.modelVersion}`)
for(const standard of ['Darwin Core','CIDOC CRM','W3C PROV-O']) if(!contentCatalog.metadata.conceptualStandards.includes(standard)) fail(`missing declared standard: ${standard}`)

const sets={
  taxonNames:new Set(contentCatalog.taxonNames.map(item=>String(item.id))),
  material:new Set(contentCatalog.materialEntities.map(item=>String(item.id))),
  siteContexts:new Set(contentCatalog.siteContexts.map(item=>String(item.id))),
  sites:new Set(contentCatalog.sites.map(item=>String(item.id))),
  publications:new Set(contentCatalog.publications.map(item=>String(item.id))),
  institutions:new Set(contentCatalog.institutions.map(item=>String(item.id))),
  specimens:new Set(contentCatalog.specimens.map(item=>String(item.id))),
  occurrences:new Set(contentCatalog.occurrences.map(item=>String(item.id))),
}

for(const taxon of contentCatalog.taxa){
  for(const nameId of taxon.taxonomy.nameUsageIds) if(!sets.taxonNames.has(String(nameId))) fail(`taxon ${taxon.id} points to missing taxon name ${nameId}`)
}
for(const name of contentCatalog.taxonNames){
  if(!String(name.name).trim()) fail(`empty taxon name ${name.id}`)
  if(!contentCatalog.taxa.some(t=>String(t.id)===String(name.taxonId))) fail(`taxon name ${name.id} points to missing taxon`)
}
for(const specimen of contentCatalog.specimens){
  if(!sets.material.has(String(specimen.materialEntityId))) fail(`specimen ${specimen.id} points to missing material entity ${specimen.materialEntityId}`)
  if(!sets.sites.has(String(specimen.siteId??''))) fail(`specimen ${specimen.id} has no site link`)
  if(specimen.sourceIds.length===0) fail(`specimen ${specimen.id} has no sourceIds`)
}
for(const material of contentCatalog.materialEntities){
  if(!material.sourceIds.length) fail(`material ${material.id} has no sourceIds`)
  if(material.institutionId && !sets.institutions.has(String(material.institutionId))) fail(`material ${material.id} points to missing institution`)
  if(material.collectionId && !contentCatalog.collections.some(item=>String(item.id)===String(material.collectionId))) fail(`material ${material.id} points to missing collection`)
}
for(const occurrence of contentCatalog.occurrences){
  if(occurrence.timeInterval && occurrence.timeInterval.youngerMa>occurrence.timeInterval.olderMa) fail(`occurrence ${occurrence.id} has reversed time interval`)
  if(!sets.sites.has(String(occurrence.siteId))) fail(`occurrence ${occurrence.id} points to missing site`)
  if(occurrence.specimenId && !sets.specimens.has(String(occurrence.specimenId))) fail(`occurrence ${occurrence.id} points to missing specimen`)
  if(occurrence.timeInterval && occurrence.timeInterval.sourceIds?.some(id=>!contentCatalog.sources.some(source=>String(source.id)===String(id)))) fail(`occurrence ${occurrence.id} has a broken time source reference`)
}
for(const context of contentCatalog.siteContexts){
  if(context.timeInterval && context.timeInterval.youngerMa>context.timeInterval.olderMa) fail(`site context ${context.id} has reversed time interval`)
  if(!sets.sites.has(String(context.siteId))) fail(`site context ${context.id} points to missing site`)
  for(const taxonId of context.relatedTaxonIds) if(!contentCatalog.taxa.some(t=>String(t.id)===String(taxonId))) fail(`site context ${context.id} points to missing taxon ${taxonId}`)
}
for(const site of contentCatalog.sites){
  for(const sourceId of site.sourceIds) if(!contentCatalog.sources.some(source=>String(source.id)===String(sourceId))) fail(`site ${site.id} points to missing source ${sourceId}`)
}
for(const publication of contentCatalog.publications){
  if(publication.doi && !/^10\.\d{4,9}\/\S+$/.test(publication.doi)) fail(`invalid DOI ${publication.doi}`)
  for(const contributor of publication.contributors??[]) for(const institutionId of contributor.institutionIds) if(!sets.institutions.has(String(institutionId))) fail(`publication ${publication.id} contributor points to missing institution`)
}
for(const source of contentCatalog.sources){
  if(source.publicationId && !sets.publications.has(String(source.publicationId))) fail(`source ${source.id} points to missing publication ${source.publicationId}`)
  if(source.institutionId && !sets.institutions.has(String(source.institutionId))) fail(`source ${source.id} points to missing institution ${source.institutionId}`)
}
const relationshipIds=new Set(contentCatalog.relationships.map(item=>String(item.id)))
if(relationshipIds.size!==contentCatalog.relationships.length) fail('relationship IDs are not unique')
for(const relationship of contentCatalog.relationships){
  if(!contentCatalog.taxa.some(t=>String(t.id)===String(relationship.from)) || !contentCatalog.taxa.some(t=>String(t.id)===String(relationship.to))) fail(`relationship ${relationship.id} references an unknown taxon`)
  for(const sourceId of relationship.sourceIds) if(!contentCatalog.sources.some(source=>String(source.id)===String(sourceId))) fail(`relationship ${relationship.id} points to missing source`)
}

if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);throw new Error(`Research-model audit failed with ${failures.length} issue(s).`)}
console.log(`Research-model audit passed: ${contentCatalog.taxa.length} taxa · ${contentCatalog.taxonNames.length} taxon names · ${contentCatalog.specimens.length} specimens · ${contentCatalog.materialEntities.length} material entities · ${contentCatalog.occurrences.length} occurrences · ${contentCatalog.sites.length} sites · ${contentCatalog.siteContexts.length} site contexts · ${contentCatalog.publications.length} publications · ${contentCatalog.institutions.length} institutions.`)
