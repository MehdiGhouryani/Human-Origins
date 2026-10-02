import {describe,expect,it} from 'vitest'
import {migrationPolicy,v21ToV23MigrationRules} from '../migrations/v21-to-v23'

describe('v21 → v23 migration policy',()=>{
  it('is append-only and explicit',()=>{
    expect(migrationPolicy.strategy).toBe('append-only-normalization')
    expect(v21ToV23MigrationRules.length).toBeGreaterThanOrEqual(20)
    expect(new Set(v21ToV23MigrationRules.map(rule=>rule.disposition))).toEqual(new Set(['preserve','transform','quarantine','defer']))
  })
  it('keeps geometry outside the scientific model',()=>{
    const geometryRules=v21ToV23MigrationRules.filter(rule=>rule.sourcePath==='species.x'||rule.sourcePath==='species.y')
    expect(geometryRules.every(rule=>rule.disposition==='quarantine' && rule.targetPath==='presentation/treeLayout')).toBe(true)
  })
})
