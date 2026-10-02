import {describe,expect,it} from 'vitest'
import {asMediaAssetId,asSourceId,asTaxonId,isEntityId} from '../domain/ids'

describe('Identifier contracts',()=>{
  it('creates branded identifiers only from non-empty values',()=>{
    expect(String(asTaxonId('neanderthal'))).toBe('neanderthal')
    expect(String(asSourceId('si-dating'))).toBe('si-dating')
    expect(String(asMediaAssetId('media:neanderthal'))).toBe('media:neanderthal')
    expect(()=>asTaxonId('')).toThrow()
    expect(()=>asTaxonId('bad id')).toThrow()
    expect(()=>asTaxonId('UPPERCASE')).toThrow()
  })
  it('keeps runtime ID recognition intentionally small and deterministic',()=>{
    expect(isEntityId('a')).toBe(true)
    expect(isEntityId('')).toBe(false)
    expect(isEntityId(null)).toBe(false)
  })
})
