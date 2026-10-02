import type {
  ContentCatalog,
  EvidenceRecord,
  ProvenanceClaim,
  SourceRecord,
  SourceLinkRole,
  ClaimEvidenceRole,
} from './contracts'

export type ResearchGraphNodeKind=
  | 'taxon'
  | 'taxon-name'
  | 'media'
  | 'source'
  | 'publication'
  | 'institution'
  | 'collection'
  | 'material'
  | 'specimen'
  | 'occurrence'
  | 'site'
  | 'site-context'
  | 'evidence'
  | 'claim'
  | 'uncertainty'
  | 'interpretation-set'
  | 'interpretation-position'

export type ResearchGraphEdgePredicate=
  | 'has-name'
  | 'has-media'
  | 'has-material'
  | 'has-specimen'
  | 'has-occurrence'
  | 'has-evidence'
  | 'has-claim'
  | 'has-context'
  | 'at-site'
  | 'materialized-by'
  | 'instance-of'
  | 'supports'
  | 'supported-by'
  | 'documented-by'
  | 'dated-by'
  | 'contextualized-by'
  | 'catalogued-by'
  | 'hosted-by'
  | 'illustrated-by'
  | 'interpreted-by'
  | 'published-as'
  | 'affiliated-with'
  | 'held-by'
  | 'uses-media'
  | 'asserts-about'
  | 'about-specimen'
  | 'about-site'
  | 'challenged-by'
  | 'derived-from'
  | 'has-uncertainty'
  | 'has-interpretation-set'
  | 'has-position'
  | 'possible'
  | 'context'
  | 'gene-flow'

export type ResearchGraphNode={
  id:string
  kind:ResearchGraphNodeKind
  entityId:string
  label:string
}

export type ResearchGraphEdge={
  id:string
  from:string
  to:string
  predicate:ResearchGraphEdgePredicate
  sourceIds:readonly string[]
  recordId?:string
}

export type ResearchGraphSnapshot={
  schemaVersion:'1.2'
  modelVersion:string
  release:string
  sourceFingerprint:string
  nodes:readonly ResearchGraphNode[]
  edges:readonly ResearchGraphEdge[]
  counts:Readonly<Record<ResearchGraphNodeKind,number>>
}

const nodeId=(kind:ResearchGraphNodeKind,id:string)=>`${kind}:${id}`
const edgeId=(from:string,predicate:ResearchGraphEdgePredicate,to:string,recordId?:string)=>`${from}|${predicate}|${to}${recordId?`|${recordId}`:''}`

const sourceLinkPredicate=(role:SourceLinkRole):ResearchGraphEdgePredicate=>({
  supports:'supported-by',
  documents:'documented-by',
  dates:'dated-by',
  contextualizes:'contextualized-by',
  catalogues:'catalogued-by',
  hosts:'hosted-by',
  illustrates:'illustrated-by',
  interprets:'interpreted-by',
} as const)[role]

const claimEvidencePredicate=(role:ClaimEvidenceRole):ResearchGraphEdgePredicate=>({
  supports:'supported-by',
  contextualizes:'contextualized-by',
  challenges:'challenged-by',
  dates:'dated-by',
  derives:'derived-from',
} as const)[role]

const addNode=(nodes:Map<string,ResearchGraphNode>,kind:ResearchGraphNodeKind,id:string,label:string)=>{
  const node={id:nodeId(kind,id),kind,entityId:id,label}
  const existing=nodes.get(node.id)
  if(existing && existing.label!==label) throw new Error(`Conflicting graph node ${node.id}.`)
  nodes.set(node.id,node)
}

const addEdge=(edges:Map<string,ResearchGraphEdge>,from:ResearchGraphNodeKind,fromId:string,predicate:ResearchGraphEdgePredicate,to:ResearchGraphNodeKind,toId:string,sourceIds:readonly string[]=[],recordId?:string)=>{
  const fromNode=nodeId(from,fromId)
  const toNode=nodeId(to,toId)
  if(fromNode===toNode) throw new Error(`Graph self-loop is not permitted: ${fromNode}.`)
  const id=edgeId(fromNode,predicate,toNode,recordId)
  const edge={id,from:fromNode,to:toNode,predicate,sourceIds:[...new Set(sourceIds.map(String))].sort(),recordId}
  const existing=edges.get(id)
  if(existing && JSON.stringify(existing)!==JSON.stringify(edge)) throw new Error(`Conflicting graph edge ${id}.`)
  edges.set(id,edge)
}

const addSourceLinks=(edges:Map<string,ResearchGraphEdge>,fromKind:ResearchGraphNodeKind,fromId:string,links:readonly {sourceId:string;role:SourceLinkRole}[]|undefined,recordId?:string)=>{
  for(const link of links??[]) addEdge(edges,fromKind,fromId,sourceLinkPredicate(link.role),'source',String(link.sourceId),[],recordId)
}

const addSourceMetadataEdges=(edges:Map<string,ResearchGraphEdge>,source:SourceRecord)=>{
  if(source.publicationId) addEdge(edges,'source',String(source.id),'published-as','publication',String(source.publicationId),[],String(source.id))
  if(source.institutionId) addEdge(edges,'source',String(source.id),'affiliated-with','institution',String(source.institutionId),[],String(source.id))
}

const labelForEvidence=(item:EvidenceRecord)=>item.title
const labelForClaim=(item:ProvenanceClaim)=>item.statement

export function buildResearchGraph(catalog:ContentCatalog,sourceFingerprint:string=''):ResearchGraphSnapshot{
  const nodes=new Map<string,ResearchGraphNode>()
  const edges=new Map<string,ResearchGraphEdge>()

  for(const item of catalog.taxa) addNode(nodes,'taxon',String(item.id),item.name)
  for(const item of catalog.taxonNames) addNode(nodes,'taxon-name',String(item.id),item.name)
  for(const item of catalog.media) addNode(nodes,'media',String(item.id),item.alt)
  for(const item of catalog.sources) addNode(nodes,'source',String(item.id),item.title)
  for(const item of catalog.publications) addNode(nodes,'publication',String(item.id),item.title)
  for(const item of catalog.institutions) addNode(nodes,'institution',String(item.id),item.name)
  for(const item of catalog.collections) addNode(nodes,'collection',String(item.id),item.name)
  for(const item of catalog.materialEntities) addNode(nodes,'material',String(item.id),item.objectIdentifier??item.recordId??String(item.id))
  for(const item of catalog.specimens) addNode(nodes,'specimen',String(item.id),item.name)
  for(const item of catalog.occurrences) addNode(nodes,'occurrence',String(item.id),String(item.id))
  for(const item of catalog.sites) addNode(nodes,'site',String(item.id),item.name)
  for(const item of catalog.siteContexts) addNode(nodes,'site-context',String(item.id),item.ageLabel)
  for(const item of catalog.evidence) addNode(nodes,'evidence',String(item.id),labelForEvidence(item))
  for(const item of catalog.claims) addNode(nodes,'claim',String(item.id),labelForClaim(item))
  for(const item of catalog.interpretationSets) addNode(nodes,'interpretation-set',String(item.id),item.question)
  for(const item of catalog.interpretationPositions) addNode(nodes,'interpretation-position',String(item.id),item.label)

  for(const item of catalog.taxonNames){
    addEdge(edges,'taxon-name',String(item.id),'instance-of','taxon',String(item.taxonId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'taxon-name',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.media){
    const subjectKind=item.subject.type as ResearchGraphNodeKind
    addEdge(edges,'media',String(item.id),'uses-media',subjectKind,String(item.subject.id),item.sourceLinks.map(link=>String(link.sourceId)),String(item.id))
    addSourceLinks(edges,'media',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.sources) addSourceMetadataEdges(edges,item)
  for(const item of catalog.publications){
    for(const institutionId of item.institutionIds) addEdge(edges,'publication',String(item.id),'affiliated-with','institution',String(institutionId),[],String(item.id))
    for(const contributor of item.contributors??[]) for(const institutionId of contributor.institutionIds) addEdge(edges,'publication',String(item.id),'affiliated-with','institution',String(institutionId),[],String(item.id))
  }

  for(const item of catalog.collections) addEdge(edges,'collection',String(item.id),'held-by','institution',String(item.institutionId),[],String(item.id))

  for(const item of catalog.materialEntities){
    if(item.taxonId) addEdge(edges,'material',String(item.id),'instance-of','taxon',String(item.taxonId),item.sourceIds,String(item.id))
    if(item.institutionId) addEdge(edges,'material',String(item.id),'held-by','institution',String(item.institutionId),item.sourceIds,String(item.id))
    if(item.collectionId) addEdge(edges,'material',String(item.id),'held-by','collection',String(item.collectionId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'material',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.specimens){
    addEdge(edges,'specimen',String(item.id),'materialized-by','material',String(item.materialEntityId),item.sourceIds,String(item.id))
    addEdge(edges,'specimen',String(item.id),'at-site','site',String(item.siteId),item.sourceIds,String(item.id))
    addEdge(edges,'specimen',String(item.id),'instance-of','taxon',String(item.taxonId),item.sourceIds,String(item.id))
    if(item.occurrenceId) addEdge(edges,'specimen',String(item.id),'has-occurrence','occurrence',String(item.occurrenceId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'specimen',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.occurrences){
    addEdge(edges,'occurrence',String(item.id),'instance-of','taxon',String(item.taxonId),item.sourceIds,String(item.id))
    addEdge(edges,'occurrence',String(item.id),'at-site','site',String(item.siteId),item.sourceIds,String(item.id))
    if(item.specimenId) addEdge(edges,'occurrence',String(item.id),'has-specimen','specimen',String(item.specimenId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'occurrence',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.siteContexts){
    addEdge(edges,'site-context',String(item.id),'has-context','site',String(item.siteId),item.sourceIds,String(item.id))
    for(const taxonId of item.relatedTaxonIds) addEdge(edges,'site-context',String(item.id),'context','taxon',String(taxonId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'site-context',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.evidence){
    addEdge(edges,'evidence',String(item.id),'supports','taxon',String(item.taxonId),item.sourceIds,String(item.id))
    addEdge(edges,'evidence',String(item.id),'at-site','site',String(item.siteId),item.sourceIds,String(item.id))
    for(const specimenId of item.specimenIds??[]) addEdge(edges,'evidence',String(item.id),'has-specimen','specimen',String(specimenId),item.sourceIds,String(item.id))
    for(const occurrenceId of item.occurrenceIds??[]) addEdge(edges,'evidence',String(item.id),'has-occurrence','occurrence',String(occurrenceId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'evidence',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.claims){
    addEdge(edges,'claim',String(item.id),'asserts-about','taxon',String(item.taxonId),item.sourceIds,String(item.id))
    for(const link of item.evidenceLinks) addEdge(edges,'claim',String(item.id),claimEvidencePredicate(link.role),'evidence',String(link.evidenceId),item.sourceIds,String(item.id))
    for(const specimenId of item.specimenIds??[]) addEdge(edges,'claim',String(item.id),'about-specimen','specimen',String(specimenId),item.sourceIds,String(item.id))
    for(const siteId of item.siteIds??[]) addEdge(edges,'claim',String(item.id),'about-site','site',String(siteId),item.sourceIds,String(item.id))
    addSourceLinks(edges,'claim',String(item.id),item.sourceLinks,item.id)
  }

  for(const item of catalog.claims){
    for(const uncertainty of item.uncertaintyProfile){
      const uncertaintyId=`${String(item.id)}:${uncertainty.dimension}`
      addNode(nodes,'uncertainty',uncertaintyId,`${uncertainty.dimension}: ${uncertainty.state}`)
      addEdge(edges,'claim',String(item.id),'has-uncertainty','uncertainty',uncertaintyId,[...uncertainty.sourceIds.map(String)],`${String(item.id)}:${uncertainty.dimension}`)
      for(const sourceId of uncertainty.sourceIds) addEdge(edges,'uncertainty',uncertaintyId,'documented-by','source',String(sourceId),uncertainty.sourceIds.map(String),`${uncertaintyId}:${String(sourceId)}`)
      for(const evidenceId of uncertainty.evidenceIds) addEdge(edges,'uncertainty',uncertaintyId,'derived-from','evidence',String(evidenceId),uncertainty.sourceIds.map(String),`${uncertaintyId}:${String(evidenceId)}`)
    }
    for(const interpretationSetId of item.interpretationSetIds) addEdge(edges,'claim',String(item.id),'has-interpretation-set','interpretation-set',String(interpretationSetId),item.sourceIds.map(String),`${String(item.id)}:${String(interpretationSetId)}`)
  }

  for(const set of catalog.interpretationSets){
    for(const positionId of set.positionIds) addEdge(edges,'interpretation-set',String(set.id),'has-position','interpretation-position',String(positionId),set.sourceIds.map(String),`${String(set.id)}:${String(positionId)}`)
    for(const sourceLink of set.sourceLinks??[]) addEdge(edges,'interpretation-set',String(set.id),sourceLinkPredicate(sourceLink.role),'source',String(sourceLink.sourceId),[],`${String(set.id)}:${String(sourceLink.sourceId)}`)
  }

  for(const position of catalog.interpretationPositions){
    for(const evidenceId of position.evidenceIds) addEdge(edges,'interpretation-position',String(position.id),'derived-from','evidence',String(evidenceId),position.sourceIds.map(String),`${String(position.id)}:${String(evidenceId)}`)
    addSourceLinks(edges,'interpretation-position',String(position.id),position.sourceLinks,position.id)
  }

  for(const item of catalog.relationships){
    addEdge(edges,'taxon',String(item.from),item.type,'taxon',String(item.to),item.sourceIds,String(item.id))
  }

  const nodeArray=[...nodes.values()].sort((a,b)=>a.id.localeCompare(b.id))
  const edgeArray=[...edges.values()].sort((a,b)=>a.id.localeCompare(b.id))
  const counts=Object.fromEntries((['taxon','taxon-name','media','source','publication','institution','collection','material','specimen','occurrence','site','site-context','evidence','claim','uncertainty','interpretation-set','interpretation-position'] as const).map(kind=>[kind,nodeArray.filter(node=>node.kind===kind).length])) as Record<ResearchGraphNodeKind,number>

  return {
    schemaVersion:'1.2',
    modelVersion:catalog.metadata.modelVersion,
    release:catalog.metadata.release,
    sourceFingerprint,
    nodes:nodeArray,
    edges:edgeArray,
    counts,
  }
}
