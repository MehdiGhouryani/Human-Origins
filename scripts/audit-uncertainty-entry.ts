import {contentCatalog} from '../content/catalog'
import {buildResearchGraph} from '../domain/research-graph'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

const graph=buildResearchGraph(contentCatalog,catalogRuntimeMetadata.fingerprint)
const graphEdgeIds=new Set(graph.edges.map(edge=>edge.id))
const failures:string[]=[]
const fail=(message:string)=>failures.push(message)
const uncertaintyDimensions=new Set(contentCatalog.claims.flatMap(claim=>claim.uncertaintyProfile.map(item=>item.dimension)))
const allowedStates=new Set(['bounded','open','contested','source-limited','unknown'])

for(const claim of contentCatalog.claims){
  const seenDimensions=new Set<string>()
  for(const item of claim.uncertaintyProfile){
    if(seenDimensions.has(item.dimension)) fail(`claim:${String(claim.id)}: duplicate uncertainty dimension ${item.dimension}`)
    seenDimensions.add(item.dimension)
    if(!allowedStates.has(item.state)) fail(`claim:${String(claim.id)}: invalid uncertainty state ${item.state}`)
    if(!item.note.trim()) fail(`claim:${String(claim.id)}: uncertainty ${item.dimension} has no note`)
    if(item.sourceIds.length===0 && item.evidenceIds.length===0) fail(`claim:${String(claim.id)}: uncertainty ${item.dimension} is unsupported by source/evidence`)
    for(const sourceId of item.sourceIds){
      if(!contentCatalog.sources.some(source=>String(source.id)===String(sourceId))) fail(`claim:${String(claim.id)}: uncertainty references missing source ${String(sourceId)}`)
      const expected=`uncertainty:${String(claim.id)}:${item.dimension}|documented-by|source:${String(sourceId)}|${String(claim.id)}:${item.dimension}:${String(sourceId)}`
      if(!graphEdgeIds.has(expected)) fail(`claim:${String(claim.id)}: missing uncertainty graph edge ${expected}`)
    }
    for(const evidenceId of item.evidenceIds){
      if(!contentCatalog.evidence.some(evidence=>String(evidence.id)===String(evidenceId))) fail(`claim:${String(claim.id)}: uncertainty references missing evidence ${String(evidenceId)}`)
    }
  }

  for(const setId of claim.interpretationSetIds){
    const set=contentCatalog.interpretationSets.find(item=>String(item.id)===String(setId))
    if(!set) fail(`claim:${String(claim.id)}: missing interpretation set ${String(setId)}`)
    else{
      const expected=`claim:${String(claim.id)}|has-interpretation-set|interpretation-set:${String(set.id)}|${String(claim.id)}:${String(set.id)}`
      if(!graphEdgeIds.has(expected)) fail(`claim:${String(claim.id)}: missing interpretation-set edge ${expected}`)
      if(String(set.claimId)!==String(claim.id)) fail(`interpretation-set:${String(set.id)}: claim mismatch`)
      if(set.positionIds.length<2 && set.status==='multiple-positions') fail(`interpretation-set:${String(set.id)}: multiple-positions requires at least two positions`)
      if(set.sourceIds.length===0) fail(`interpretation-set:${String(set.id)}: requires source provenance`)
      const uniquePositions=new Set(set.positionIds.map(String))
      if(uniquePositions.size!==set.positionIds.length) fail(`interpretation-set:${String(set.id)}: duplicate position ids`)
      for(const positionId of set.positionIds){
        const position=contentCatalog.interpretationPositions.find(item=>String(item.id)===String(positionId))
        if(!position) fail(`interpretation-set:${String(set.id)}: missing position ${String(positionId)}`)
      }
    }
  }
}

for(const position of contentCatalog.interpretationPositions){
  const set=contentCatalog.interpretationSets.find(item=>String(item.id)===String(position.setId))
  if(!set) fail(`interpretation-position:${String(position.id)}: missing set ${String(position.setId)}`)
  if(!position.summary.trim()) fail(`interpretation-position:${String(position.id)}: missing summary`)
  if(position.sourceIds.length===0) fail(`interpretation-position:${String(position.id)}: missing source provenance`)
  for(const sourceId of position.sourceIds){
    if(!contentCatalog.sources.some(source=>String(source.id)===String(sourceId))) fail(`interpretation-position:${String(position.id)}: missing source ${String(sourceId)}`)
  }
  for(const evidenceId of position.evidenceIds){
    if(!contentCatalog.evidence.some(evidence=>String(evidence.id)===String(evidenceId))) fail(`interpretation-position:${String(position.id)}: missing evidence ${String(evidenceId)}`)
  }
}

if(uncertaintyDimensions.size===0) fail('No uncertainty dimensions are represented in the catalog.')
if(contentCatalog.interpretationSets.length===0) fail('No interpretation sets are represented in the catalog.')
if(failures.length){failures.forEach(failure=>console.error(`FAIL ${failure}`));throw new Error(`Uncertainty/interpretation audit failed with ${failures.length} issue(s).`)}
console.log(`Uncertainty/interpretation audit passed: ${contentCatalog.claims.filter(claim=>claim.uncertaintyProfile.length>0).length}/${contentCatalog.claims.length} claims with uncertainty · ${contentCatalog.interpretationSets.length} interpretation sets · ${contentCatalog.interpretationPositions.length} positions.`)
