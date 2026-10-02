import {contentCatalog} from '../../content/catalog'
import type {ContentCatalog} from '../../domain/contracts'

/**
 * Deterministic release fingerprint for cache/debug reproducibility.
 * This is deliberately a change detector, not a cryptographic signature.
 */
function stableStringify(value:unknown):string{
  if(value===undefined) return 'null'
  if(value===null || typeof value==='string' || typeof value==='number' || typeof value==='boolean') return JSON.stringify(value)
  if(Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if(typeof value==='object'){
    const entries=Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b))
    return `{${entries.map(([key,item])=>`${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`
  }
  throw new TypeError(`Unsupported value in deterministic serialization: ${typeof value}`)
}

function hash64(input:string,seed:bigint):string{
  const mask=0xffffffffffffffffn
  const prime=0x100000001b3n
  let hash=seed
  for(let index=0;index<input.length;index+=1){
    hash ^= BigInt(input.charCodeAt(index))
    hash=(hash*prime)&mask
  }
  return hash.toString(16).padStart(16,'0')
}

export function createCatalogFingerprint(catalog:ContentCatalog=contentCatalog):string{
  const serialized=stableStringify(catalog)
  return `${hash64(serialized,0xcbf29ce484222325n)}${hash64(serialized,0x84222325cbf29cen)}`
}

export const catalogRuntimeMetadata={
  schemaVersion:contentCatalog.metadata.schemaVersion,
  release:contentCatalog.metadata.release,
  fingerprint:createCatalogFingerprint(),
} as const
