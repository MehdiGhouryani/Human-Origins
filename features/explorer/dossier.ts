import type {EvidenceRecord,EvidenceSite,ProvenanceClaim,RelationClass,RelationshipType,SourceRecord} from '../../domain/contracts'
import type {DatingClass} from '../../domain/time'
import {rangesOverlap} from '../../domain/time'
import type {ExplorerBootstrap} from './bootstrap'
import type {ExplorerMedia,ExplorerSpecies,ExplorerSpecimen} from './types'
import {
  getExplorerClaimsForTaxon,getExplorerEvidenceForTaxon,getExplorerMediaForTaxon,getExplorerRelationships,
  getExplorerSiteContextsForSite,getExplorerSourceById,getExplorerSourcesForTaxon,getExplorerSpecimensForTaxon,
} from './selectors'

/**
 * Species dossier read model (Milestone M2, `/species/[id]`).
 *
 * Pure and client-safe: it only reads the frozen explorer bootstrap. Everything the page shows is derived
 * from canonical records; nothing here invents facts, coordinates or scores. The completeness tier follows
 * the "completeness contract" in docs/IMPLEMENTATION-PLAN.md (section "Completeness contract") and is *computed*, never hand-set.
 */

export type DossierLink={id:string;name:string;short:string;type:RelationshipType;relation:RelationClass;label:string;certainty?:string;note?:string}
export type DossierSite=EvidenceSite & {datingClass?:DatingClass}
export type CompletenessCheck={key:string;label:string;met:boolean}
export type CompletenessTier=0|1|2

export type SpeciesDossier={
  species:ExplorerSpecies
  portrait:ExplorerMedia|undefined
  treeIcon:ExplorerMedia|undefined
  /** Every other taxon-level image, in catalog order (empty for most taxa today). */
  gallery:readonly ExplorerMedia[]
  ancestors:readonly DossierLink[]
  descendants:readonly DossierLink[]
  geneFlow:readonly DossierLink[]
  coexisting:readonly ExplorerSpecies[]
  sites:readonly DossierSite[]
  specimens:readonly ExplorerSpecimen[]
  claims:readonly ProvenanceClaim[]
  evidence:readonly EvidenceRecord[]
  sources:readonly SourceRecord[]
  previous:ExplorerSpecies|undefined
  next:ExplorerSpecies|undefined
  completeness:{tier:CompletenessTier;checks:readonly CompletenessCheck[];missing:readonly string[]}
}

const mediaIn=(media:readonly ExplorerMedia[],id:string):ExplorerMedia|undefined=>media.find(item=>String(item.id)===id)??media[0]
const mediaByRole=(media:readonly ExplorerMedia[],role:'profile-portrait'|'tree-thumbnail',fallbackId:string):ExplorerMedia|undefined=>
  media.find(item=>item.roles.includes(role)&&!item.placeholder) ??
  media.find(item=>item.roles.includes(role)) ??
  mediaIn(media,fallbackId)

export function hasExplorerSpecies(bootstrap:ExplorerBootstrap,id:string):boolean{
  return bootstrap.indexes.speciesById[id]!==undefined
}

function linkFor(bootstrap:ExplorerBootstrap,otherId:string,type:RelationshipType,relation:RelationClass,label:string,certainty?:string,note?:string):DossierLink|undefined{
  const position=bootstrap.indexes.speciesById[otherId]
  if(position===undefined) return undefined
  const other=bootstrap.species[position]
  return {id:other.id,name:other.name,short:other.short,type,relation,label,certainty,note}
}

const defined=<T,>(value:T|undefined):value is T=>value!==undefined

function collectSources(bootstrap:ExplorerBootstrap,species:ExplorerSpecies,claims:readonly ProvenanceClaim[],specimens:readonly ExplorerSpecimen[]):SourceRecord[]{
  const ids=[
    ...species.sourceIds,
    ...claims.flatMap(claim=>claim.sourceIds.map(String)),
    ...specimens.flatMap(record=>record.sourceIds),
  ]
  const byId=new Map<string,SourceRecord>()
  for(const id of ids){const source=getExplorerSourceById(bootstrap,id);if(source&&!byId.has(String(source.id)))byId.set(String(source.id),source)}
  return [...byId.values()]
}

export function computeCompleteness(input:{
  species:ExplorerSpecies
  claims:readonly ProvenanceClaim[]
  specimens:readonly ExplorerSpecimen[]
  sites:readonly DossierSite[]
  gallery:readonly ExplorerMedia[]
  hasRelationship:boolean
}):SpeciesDossier['completeness']{
  const {species,claims,specimens,sites,gallery,hasRelationship}=input
  // "Source-backed" means the claim actually cites at least one source; a bare claim row does not count.
  const backedClaims=claims.filter(claim=>claim.sourceIds.length>0)
  const tier0:CompletenessCheck[]=[
    {key:'identity',label:'Name, time range and taxonomy',met:Boolean(species.name&&species.date&&species.taxonomy.scientificName)},
    {key:'source',label:'At least one registered source',met:species.sourceIds.length>0},
  ]
  const tier1:CompletenessCheck[]=[
    {key:'distinct-avatar',label:'Tree avatar distinct from the portrait',met:species.treeIconId!==species.defaultMediaId},
    {key:'facts',label:'At least three key facts',met:species.facts.length>=3},
    {key:'claim-with-evidence',label:'At least one claim linked to evidence',met:backedClaims.some(claim=>claim.evidenceIds.length>0)},
  ]
  const tier2:CompletenessCheck[]=[
    {key:'specimen',label:'At least one specimen record',met:specimens.length>0},
    {key:'dated-site',label:'At least one site with a declared dating method',met:sites.some(site=>site.datingClass!==undefined&&site.datingClass!=='unspecified')},
    {key:'claims',label:'At least three source-backed claims',met:backedClaims.length>=3},
    {key:'gallery',label:'Images beyond the portrait (anatomy, tools, features)',met:gallery.length>0},
    {key:'relationship',label:'Placed in the tree by a registered relationship',met:hasRelationship},
  ]
  const all=(checks:readonly CompletenessCheck[])=>checks.every(check=>check.met)
  const tier:CompletenessTier=all(tier0)&&all(tier1)&&all(tier2)?2:all(tier0)&&all(tier1)?1:0
  const checks=[...tier0,...tier1,...tier2]
  return {tier,checks,missing:checks.filter(check=>!check.met).map(check=>check.label)}
}

export function buildSpeciesDossier(bootstrap:ExplorerBootstrap,id:string):SpeciesDossier|undefined{
  if(!hasExplorerSpecies(bootstrap,id)) return undefined
  const species=bootstrap.species[bootstrap.indexes.speciesById[id]]
  const portrait=mediaByRole(species.media,'profile-portrait',species.defaultMediaId)
  const treeIcon=mediaByRole(species.media,'tree-thumbnail',species.treeIconId)
  const used=new Set([species.defaultMediaId,species.treeIconId])
  const gallery=getExplorerMediaForTaxon(bootstrap,id).filter(media=>!used.has(String(media.id))&&!media.placeholder)

  const relationships=getExplorerRelationships(bootstrap)
  const ancestors=relationships.filter(rel=>rel.type!=='gene-flow'&&String(rel.to)===id)
    .map(rel=>linkFor(bootstrap,String(rel.from),rel.type,rel.relation,rel.label,rel.certainty,rel.note)).filter(defined)
  const descendants=relationships.filter(rel=>rel.type!=='gene-flow'&&String(rel.from)===id)
    .map(rel=>linkFor(bootstrap,String(rel.to),rel.type,rel.relation,rel.label,rel.certainty,rel.note)).filter(defined)
  const geneFlow=relationships.filter(rel=>rel.type==='gene-flow'&&(String(rel.from)===id||String(rel.to)===id))
    .map(rel=>linkFor(bootstrap,String(rel.from)===id?String(rel.to):String(rel.from),rel.type,rel.relation,rel.label,rel.certainty,rel.note)).filter(defined)

  // Temporal overlap says who coexisted. It never implies ancestry (ARCHITECTURE §3).
  const coexisting=species.inferred?[]:bootstrap.species.filter(other=>other.id!==id&&!other.inferred
    &&rangesOverlap({olderMa:species.start,youngerMa:species.end},{olderMa:other.start,youngerMa:other.end}))

  const sites:DossierSite[]=bootstrap.sites.filter(site=>site.relatedTaxonIds.some(taxonId=>String(taxonId)===id))
    .map(site=>({...site,datingClass:getExplorerSiteContextsForSite(bootstrap,String(site.id))[0]?.timeInterval?.datingClass}))
  const specimens=getExplorerSpecimensForTaxon(bootstrap,id)
  const claims=getExplorerClaimsForTaxon(bootstrap,id)
  const evidence=getExplorerEvidenceForTaxon(bootstrap,id)
  const sources=collectSources(bootstrap,species,claims,specimens)
  // The taxon's own source list is canonical; keep it reachable even if a claim source is missing.
  if(sources.length===0) sources.push(...getExplorerSourcesForTaxon(bootstrap,id))

  const position=bootstrap.indexes.speciesById[id]
  const previous=position>0?bootstrap.species[position-1]:undefined
  const next=position<bootstrap.species.length-1?bootstrap.species[position+1]:undefined

  const completeness=computeCompleteness({species,claims,specimens,sites,gallery,hasRelationship:ancestors.length+descendants.length+geneFlow.length>0})
  return {species,portrait,treeIcon,gallery,ancestors,descendants,geneFlow,coexisting,sites,specimens,claims,evidence,sources,previous,next,completeness}
}

/** Human-readable label for the computed tier, used by the page and the species index. */
export const completenessTierLabel:Record<CompletenessTier,string>={
  0:'Incomplete record',
  1:'Species card',
  2:'Full dossier',
}

/** schema.org/Taxon JSON-LD. Only canonical, already-public fields are emitted. */
export function speciesJsonLd(dossier:SpeciesDossier,pageUrl:string):Record<string,unknown>{
  const {species,ancestors,sources}=dossier
  return {
    '@context':'https://schema.org',
    '@type':'Taxon',
    '@id':pageUrl,
    url:pageUrl,
    name:species.taxonomy.scientificName,
    alternateName:species.short!==species.taxonomy.scientificName?species.short:undefined,
    taxonRank:species.taxonomy.rank,
    description:species.description,
    parentTaxon:ancestors.length===1?{'@type':'Taxon',name:ancestors[0].name}:undefined,
    citation:sources.map(source=>({'@type':'CreativeWork',name:source.title,url:source.url,publisher:source.publisher})),
  }
}
