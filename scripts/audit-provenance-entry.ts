import {contentCatalog} from '../content/catalog'
import {buildResearchGraph} from '../domain/research-graph'
import {resolveClaimProvenance} from '../domain/provenance'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

const failures:string[]=[]
const fail=(message:string)=>failures.push(message)
const graph=buildResearchGraph(contentCatalog,catalogRuntimeMetadata.fingerprint)
const graphEdgeIds=new Set(graph.edges.map(edge=>edge.id))

const evidencePredicate=(role:string)=>({
  supports:'supported-by',
  contextualizes:'contextualized-by',
  challenges:'challenged-by',
  dates:'dated-by',
  derives:'derived-from',
} as Record<string,string>)[role]
const sourcePredicate=(role:string)=>({
  supports:'supported-by',
  documents:'documented-by',
  dates:'dated-by',
  contextualizes:'contextualized-by',
  catalogues:'catalogued-by',
  hosts:'hosted-by',
  illustrates:'illustrated-by',
  interprets:'interpreted-by',
} as Record<string,string>)[role]

for(const claim of contentCatalog.claims){
  if(!claim.epistemicBasis) fail(`claim:${claim.id}: missing epistemic basis`)
  if(!claim.scope.trim()) fail(`claim:${claim.id}: missing scope`)
  if(!claim.sourceLinks.length) fail(`claim:${claim.id}: missing source links`)

  const evidenceIds=new Set(claim.evidenceIds.map(String))
  const evidenceLinkIds=new Set(claim.evidenceLinks.map(link=>String(link.evidenceId)))
  if(evidenceIds.size!==evidenceLinkIds.size || [...evidenceIds].some(id=>!evidenceLinkIds.has(id))) fail(`claim:${claim.id}: evidenceIds/evidenceLinks mismatch`)

  const sourceIds=new Set(claim.sourceIds.map(String))
  const sourceLinkIds=new Set(claim.sourceLinks.map(link=>String(link.sourceId)))
  if(sourceIds.size!==sourceLinkIds.size || [...sourceIds].some(id=>!sourceLinkIds.has(id))) fail(`claim:${claim.id}: sourceIds/sourceLinks mismatch`)

  for(const link of claim.evidenceLinks){
    if(!contentCatalog.evidence.some(item=>String(item.id)===String(link.evidenceId))) fail(`claim:${claim.id}: missing evidence ${String(link.evidenceId)}`)
    const expected=`claim:${String(claim.id)}|${evidencePredicate(link.role)}|evidence:${String(link.evidenceId)}|${String(claim.id)}`
    if(!graphEdgeIds.has(expected)) fail(`claim:${claim.id}: missing graph evidence edge ${expected}`)
  }

  for(const link of claim.sourceLinks){
    if(!contentCatalog.sources.some(item=>String(item.id)===String(link.sourceId))) fail(`claim:${claim.id}: missing source ${String(link.sourceId)}`)
    const expected=`claim:${String(claim.id)}|${sourcePredicate(link.role)}|source:${String(link.sourceId)}|${String(claim.id)}`
    if(!graphEdgeIds.has(expected)) fail(`claim:${claim.id}: missing graph source edge ${expected}`)
  }

  if(claim.status==='verified' && !claim.sourceLinks.some(link=>link.role==='supports' || link.role==='documents')) fail(`claim:${claim.id}: verified claim lacks a support/document source role`)
  if(claim.status==='disputed-interpretation' && !claim.sourceLinks.some(link=>link.role==='interprets')) fail(`claim:${claim.id}: disputed interpretation lacks an interprets source role`)
  if(claim.epistemicBasis==='measurement' && !claim.evidenceLinks.some(link=>link.role==='dates' || link.role==='supports')) fail(`claim:${claim.id}: measurement basis lacks dating/support evidence`)
  if(claim.epistemicBasis==='cross-source-synthesis' && !claim.evidenceLinks.some(link=>link.role==='derives' || link.role==='contextualizes')) fail(`claim:${claim.id}: synthesis basis lacks derived/contextual evidence`)

  const bundle=resolveClaimProvenance(contentCatalog,claim.id)
  if(!bundle) fail(`claim:${claim.id}: provenance bundle could not be resolved`)
  else if(bundle.completeness!=='complete') fail(`claim:${claim.id}: incomplete provenance bundle: ${bundle.missing.join(', ')}`)
}

for(const claim of contentCatalog.claims){
  if(!contentCatalog.taxa.some(taxon=>String(taxon.id)===String(claim.taxonId))) fail(`claim:${String(claim.id)}: missing taxon ${String(claim.taxonId)}`)
}

if(failures.length){
  failures.forEach(failure=>console.error(`FAIL ${failure}`))
  throw new Error(`Provenance audit failed with ${failures.length} issue(s).`)
}

console.log(`Provenance audit passed: ${contentCatalog.claims.length} claims · ${contentCatalog.evidence.length} evidence records · ${contentCatalog.sources.length} sources.`)
