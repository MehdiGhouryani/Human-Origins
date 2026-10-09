import {contentCatalog} from '../content/catalog'
import {parseAgeLabel} from '../domain/time'

const failures:string[]=[]
const fail=(message:string)=>failures.push(message)
const key=(id:unknown)=>String(id)

const inspectIdentifiers=(scope:string,identifiers:readonly {scheme:string;value:string;preferred?:boolean}[])=>{
  const seen=new Set<string>()
  const preferred=new Set<string>()
  for(const identifier of identifiers){
    const composite=`${identifier.scheme}:${String(identifier.value).trim().toLowerCase()}`
    if(seen.has(composite)) fail(`${scope}: duplicate identifier ${composite}`)
    seen.add(composite)
    if(identifier.preferred){
      if(preferred.has(identifier.scheme)) fail(`${scope}: multiple preferred identifiers for ${identifier.scheme}`)
      preferred.add(identifier.scheme)
    }
  }
}

const inspectSourceLinks=(scope:string,sourceIds:readonly string[],links:readonly {sourceId:string;role:string}[]|undefined)=>{
  if(!links) return
  const sourceSet=new Set(sourceIds.map(String))
  const linkedSet=new Set<string>()
  const pairs=new Set<string>()
  for(const link of links){
    const pair=`${String(link.sourceId)}:${String(link.role)}`
    if(pairs.has(pair)) fail(`${scope}: duplicate source link role pair ${pair}`)
    pairs.add(pair)
    linkedSet.add(String(link.sourceId))
    if(!sourceSet.has(String(link.sourceId))) fail(`${scope}: link ${String(link.sourceId)} not present in sourceIds`)
  }
  if(linkedSet.size!==sourceSet.size || [...linkedSet].some(id=>!sourceSet.has(id))) fail(`${scope}: sourceIds/sourceLinks parity mismatch`)
}

for(const taxon of contentCatalog.taxa){
  inspectIdentifiers(`taxon:${key(taxon.id)}`,taxon.taxonomy.identifiers)
  const names=contentCatalog.taxonNames.filter(name=>taxon.taxonomy.nameUsageIds.some(id=>key(id)===key(name.id)))
  const accepted=names.filter(name=>name.usage==='accepted')
  if(taxon.taxonomy.rank!=='informal-node' && accepted.length!==1) fail(`taxon:${key(taxon.id)}: expected exactly one accepted name`)
  if(accepted.length===1 && accepted[0].name!==taxon.taxonomy.scientificName) fail(`taxon:${key(taxon.id)}: accepted name mismatch`)
  inspectSourceLinks(`taxon:${key(taxon.id)}`,taxon.sourceIds,taxon.sourceLinks)
}
for(const name of contentCatalog.taxonNames){
  inspectIdentifiers(`taxon-name:${key(name.id)}`,name.identifiers)
  inspectSourceLinks(`taxon-name:${key(name.id)}`,name.sourceIds,name.sourceLinks)
}
for(const site of contentCatalog.sites) inspectSourceLinks(`site:${key(site.id)}`,site.sourceIds,site.sourceLinks)
for(const context of contentCatalog.siteContexts){
  inspectSourceLinks(`site-context:${key(context.id)}`,context.sourceIds,context.sourceLinks)
  if(context.timeInterval && context.timeInterval.label!==context.ageLabel) fail(`site-context:${key(context.id)}: time label mismatch`)
}
for(const material of contentCatalog.materialEntities) inspectSourceLinks(`material:${key(material.id)}`,material.sourceIds,material.sourceLinks)
for(const specimen of contentCatalog.specimens){
  if(!specimen.siteId) fail(`specimen:${key(specimen.id)}: missing site`) 
  inspectSourceLinks(`specimen:${key(specimen.id)}`,specimen.sourceIds,specimen.sourceLinks)
  if(specimen.occurrenceId){
    const occurrence=contentCatalog.occurrences.find(item=>key(item.id)===key(specimen.occurrenceId))
    if(!occurrence) fail(`specimen:${key(specimen.id)}: missing occurrence`)
    else if(key(occurrence.specimenId)!==key(specimen.id)) fail(`specimen:${key(specimen.id)}: occurrence reciprocity broken`)
  }
}
for(const occurrence of contentCatalog.occurrences) inspectSourceLinks(`occurrence:${key(occurrence.id)}`,occurrence.sourceIds,occurrence.sourceLinks)
for(const evidence of contentCatalog.evidence) inspectSourceLinks(`evidence:${key(evidence.id)}`,evidence.sourceIds,evidence.sourceLinks)
for(const claim of contentCatalog.claims) inspectSourceLinks(`claim:${key(claim.id)}`,claim.sourceIds,claim.sourceLinks)
for(const relation of contentCatalog.relationships){
  if(key(relation.from)===key(relation.to)) fail(`relationship:${key(relation.id)}: self-loop`)
  inspectSourceLinks(`relationship:${key(relation.id)}`,relation.sourceIds,relation.sourceLinks)
}

const relationKeys=new Set<string>()
for(const relation of contentCatalog.relationships){
  const relationKey=`${key(relation.from)}>${key(relation.to)}:${relation.type}`
  if(relationKeys.has(relationKey)) fail(`duplicate relationship ${relationKey}`)
  relationKeys.add(relationKey)
}

for(const publication of contentCatalog.publications){
  inspectIdentifiers(`publication:${key(publication.id)}`,publication.identifiers)
  for(const institutionId of publication.institutionIds){
    if(!contentCatalog.institutions.some(item=>key(item.id)===key(institutionId))) fail(`publication:${key(publication.id)}: missing institution ${key(institutionId)}`)
  }
}
for(const institution of contentCatalog.institutions) inspectIdentifiers(`institution:${key(institution.id)}`,institution.identifiers)
for(const collection of contentCatalog.collections) inspectIdentifiers(`collection:${key(collection.id)}`,collection.identifiers)
for(const source of contentCatalog.sources) inspectIdentifiers(`source:${key(source.id)}`,source.identifiers)

const parsedUncertainty=parseAgeLabel('315 ± 34 ka')
if(!parsedUncertainty || parsedUncertainty.uncertaintyMa!==0.034 || parsedUncertainty.olderMa!==0.315 || parsedUncertainty.youngerMa!==0.315) fail('age parser: 315 ± 34 ka did not preserve point estimate + uncertainty')
if(parseAgeLabel('Multiple periods')!==undefined) fail('age parser: Multiple periods should remain open-ended')
if(parseAgeLabel('~100 ka+')!==undefined) fail('age parser: open-ended plus range should remain open-ended')

if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);throw new Error(`Semantic integrity audit failed with ${failures.length} issue(s).`)}
console.log(`Semantic integrity audit passed: ${contentCatalog.taxa.length} taxa · ${contentCatalog.specimens.length} specimens · ${contentCatalog.publications.length} publications · ${contentCatalog.relationships.length} relationships.`)
