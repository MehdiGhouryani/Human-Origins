import {describe,expect,it} from 'vitest'
import {relationships} from '../content/relationships'
import {v27ToV28RetiredRelationshipIds} from '../migrations/v27-to-v28'
describe('relationship ids',()=>{
  it('are unique and never reuse a retired id',()=>{
    const ids=relationships.map(r=>String(r.id))
    expect(new Set(ids).size).toBe(ids.length)
    for(const id of ids) expect((v27ToV28RetiredRelationshipIds as readonly string[]).includes(id)).toBe(false)
  })
  it('every non-root taxon has exactly one descent parent',()=>{
    const parents=new Map<string,number>()
    for(const r of relationships) if(r.type!=='gene-flow') parents.set(String(r.to),(parents.get(String(r.to))??0)+1)
    for(const n of parents.values()) expect(n).toBe(1)
  })
})
