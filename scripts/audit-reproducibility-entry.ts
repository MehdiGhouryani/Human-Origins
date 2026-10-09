import {contentCatalog} from '../content/catalog'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

if(contentCatalog.metadata.release!==catalogRuntimeMetadata.release) throw new Error('Catalog release mismatch in runtime metadata.')
if(!/^[a-f0-9]{32}$/.test(catalogRuntimeMetadata.fingerprint)) throw new Error('Catalog fingerprint must be a deterministic 128-bit hexadecimal change detector.')
if(!Object.isFrozen(contentCatalog)) throw new Error('Canonical catalog must be frozen at runtime.')
for(const key of ['taxa','relationships','media','sources','publications','institutions','collections','occurrences','evidence','specimens','claims','interpretationSets','interpretationPositions','sites'] as const){
  const value=contentCatalog[key]
  if(!Object.isFrozen(value)) throw new Error(`Canonical collection ${key} must be frozen at runtime.`)
}
console.log(`Reproducibility audit passed: release=${catalogRuntimeMetadata.release} fingerprint=${catalogRuntimeMetadata.fingerprint}`)
