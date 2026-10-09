import type {
  ClaimEvidenceRole,
  ContentCatalog,
  ProvenanceClaim,
  SourceLinkRole,
} from './contracts'
import type {
  ClaimId,
  EvidenceId,
  InstitutionId,
  PublicationId,
  SiteId,
  SourceId,
  SpecimenId,
} from './ids'
import type {InterpretationPositionRecord,InterpretationSetRecord} from './contracts'

export type ProvenanceTraceNodeKind='claim'|'evidence'|'source'|'publication'|'institution'|'specimen'|'site'

export type ProvenanceTraceEdge={
  from:string
  to:string
  predicate:string
  role?:string
}

export type ClaimProvenanceBundle={
  claim:ProvenanceClaim
  evidence:readonly {
    id:EvidenceId
    role:ClaimEvidenceRole
    title:string
    taxonId:string
    siteId:string
    sourceIds:readonly SourceId[]
    specimenIds:readonly SpecimenId[]
  }[]
  sources:readonly {
    id:SourceId
    role:SourceLinkRole
    title:string
    type:string
    publicationId?:PublicationId
    institutionId?:InstitutionId
  }[]
  publications:readonly {id:PublicationId;title:string;doi?:string}[]
  institutions:readonly {id:InstitutionId;name:string}[]
  specimens:readonly {id:SpecimenId;name:string;siteId:SiteId}[]
  sites:readonly {id:SiteId;name:string}[]
  uncertainty:ProvenanceClaim['uncertaintyProfile']
  interpretationSets:readonly InterpretationSetRecord[]
  interpretationPositions:readonly InterpretationPositionRecord[]
  trace:readonly ProvenanceTraceEdge[]
  completeness:'complete'|'partial'
  missing:string[]
}

const sourcePredicate=(role:SourceLinkRole)=>({
  supports:'supported-by',
  documents:'documented-by',
  dates:'dated-by',
  contextualizes:'contextualized-by',
  catalogues:'catalogued-by',
  hosts:'hosted-by',
  illustrates:'illustrated-by',
  interprets:'interpreted-by',
} as const)[role]

const evidencePredicate=(role:ClaimEvidenceRole)=>({
  supports:'supported-by',
  contextualizes:'contextualized-by',
  challenges:'challenged-by',
  dates:'dated-by',
  derives:'derived-from',
} as const)[role]

const find=<T extends {id:string}>(values:readonly T[],id:string)=>values.find(item=>String(item.id)===id)

export function resolveClaimProvenance(catalog:ContentCatalog,claimId:ClaimId):ClaimProvenanceBundle|undefined{
  const claim=find(catalog.claims,claimId)
  if(!claim) return undefined

  const missing:string[]=[]
  const evidence=claim.evidenceLinks.map(link=>{
    const item=find(catalog.evidence,link.evidenceId)
    if(!item){missing.push(`evidence:${String(link.evidenceId)}`);return undefined}
    return {
      id:item.id,
      role:link.role,
      title:item.title,
      taxonId:String(item.taxonId),
      siteId:item.siteId,
      sourceIds:item.sourceIds,
      specimenIds:item.specimenIds??[],
    }
  }).filter(Boolean) as ClaimProvenanceBundle['evidence']

  const sources=claim.sourceLinks.map(link=>{
    const item=find(catalog.sources,link.sourceId)
    if(!item){missing.push(`source:${String(link.sourceId)}`);return undefined}
    return {
      id:item.id,
      role:link.role,
      title:item.title,
      type:item.type,
      publicationId:item.publicationId,
      institutionId:item.institutionId,
    }
  }).filter(Boolean) as ClaimProvenanceBundle['sources']

  const publicationIds=[...new Set(sources.flatMap(item=>item.publicationId?[String(item.publicationId)]:[]))]
  const institutionIds=[...new Set(sources.flatMap(item=>item.institutionId?[String(item.institutionId)]:[]))]
  const specimenIds=[...new Set([
    ...claim.specimenIds?.map(String)??[],
    ...evidence.flatMap(item=>item.specimenIds.map(String)),
  ])]
  const siteIds=[...new Set([
    ...claim.siteIds?.map(String)??[],
    ...evidence.map(item=>String(item.siteId)),
  ])]

  const publications=publicationIds.map(id=>{
    const item=find(catalog.publications,id)
    if(!item){missing.push(`publication:${id}`);return undefined}
    return {id:item.id,title:item.title,doi:item.doi}
  }).filter(Boolean) as ClaimProvenanceBundle['publications']
  const institutions=institutionIds.map(id=>{
    const item=find(catalog.institutions,id)
    if(!item){missing.push(`institution:${id}`);return undefined}
    return {id:item.id,name:item.name}
  }).filter(Boolean) as ClaimProvenanceBundle['institutions']
  const specimens=specimenIds.map(id=>{
    const item=find(catalog.specimens,id)
    if(!item){missing.push(`specimen:${id}`);return undefined}
    return {id:item.id,name:item.name,siteId:item.siteId}
  }).filter(Boolean) as ClaimProvenanceBundle['specimens']
  const sites=siteIds.map(id=>{
    const item=find(catalog.sites,id)
    if(!item){missing.push(`site:${id}`);return undefined}
    return {id:item.id,name:item.name}
  }).filter(Boolean) as ClaimProvenanceBundle['sites']

  const interpretationSets=catalog.interpretationSets.filter(item=>claim.interpretationSetIds.some(id=>String(id)===String(item.id)))
  const interpretationPositions=catalog.interpretationPositions.filter(item=>interpretationSets.some(set=>String(set.id)===String(item.setId)))
  for(const set of interpretationSets){
    if(String(set.claimId)!==String(claim.id)) missing.push(`interpretation-set-claim:${String(set.id)}`)
  }

  const trace:ProvenanceTraceEdge[]=[]
  for(const link of claim.evidenceLinks) trace.push({from:`claim:${String(claim.id)}`,to:`evidence:${String(link.evidenceId)}`,predicate:evidencePredicate(link.role),role:link.role})
  for(const link of claim.sourceLinks) trace.push({from:`claim:${String(claim.id)}`,to:`source:${String(link.sourceId)}`,predicate:sourcePredicate(link.role),role:link.role})
  for(const item of evidence){
    for(const sourceId of item.sourceIds) trace.push({from:`evidence:${String(item.id)}`,to:`source:${String(sourceId)}`,predicate:'documented-by'})
    for(const specimenId of item.specimenIds) trace.push({from:`evidence:${String(item.id)}`,to:`specimen:${String(specimenId)}`,predicate:'about-specimen'})
    trace.push({from:`evidence:${String(item.id)}`,to:`site:${String(item.siteId)}`,predicate:'at-site'})
  }
  for(const source of sources){
    if(source.publicationId) trace.push({from:`source:${String(source.id)}`,to:`publication:${String(source.publicationId)}`,predicate:'published-as'})
    if(source.institutionId) trace.push({from:`source:${String(source.id)}`,to:`institution:${String(source.institutionId)}`,predicate:'affiliated-with'})
  }
  for(const item of claim.uncertaintyProfile){
    const uncertaintyId=`uncertainty:${String(claim.id)}:${item.dimension}`
    trace.push({from:`claim:${String(claim.id)}`,to:uncertaintyId,predicate:'has-uncertainty'})
    for(const sourceId of item.sourceIds) trace.push({from:uncertaintyId,to:`source:${String(sourceId)}`,predicate:'documented-by'})
    for(const evidenceId of item.evidenceIds) trace.push({from:uncertaintyId,to:`evidence:${String(evidenceId)}`,predicate:'derived-from'})
  }
  for(const set of interpretationSets){
    trace.push({from:`claim:${String(claim.id)}`,to:`interpretation-set:${String(set.id)}`,predicate:'has-interpretation-set'})
    for(const positionId of set.positionIds) trace.push({from:`interpretation-set:${String(set.id)}`,to:`interpretation-position:${String(positionId)}`,predicate:'has-position'})
  }

  return {
    claim,
    evidence,
    sources,
    publications,
    institutions,
    specimens,
    sites,
    uncertainty:claim.uncertaintyProfile,
    interpretationSets,
    interpretationPositions,
    trace:trace.sort((a,b)=>`${a.from}|${a.predicate}|${a.to}`.localeCompare(`${b.from}|${b.predicate}|${b.to}`)),
    completeness:missing.length?'partial':'complete',
    missing,
  }
}
