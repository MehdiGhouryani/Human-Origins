import {describe,expect,it} from 'vitest'
import nextConfig from '../next.config'
import {existsSync} from 'node:fs'

describe('route hardening',()=>{
  it('routes malformed percent-escapes in /species/:id to the not-found page, and leaves valid ids alone',async()=>{
    const rules=(await nextConfig.rewrites!()) as {beforeFiles:{source:string;destination:string}[]}
    const rule=rules.beforeFiles.find(item=>item.destination==='/species/not-found')!
    expect(rule).toBeDefined()
    // path-to-regexp custom group: ":id(<regex>)"
    const group=new RegExp(`^${rule.source.match(/:id\((.*)\)$/)![1]}$`)
    for(const bad of ['%E0%A4%A','abc%ZZ','%','x%1']) expect(group.test(bad),bad).toBe(true)
    for(const good of ['sapiens','neanderthal','%E0%A4%A4','a%2Fb','not-found']) expect(group.test(good),good).toBe(false)
  })

  it('has no root loading boundary: it would stream a 200 before notFound()/redirect() can set the status',()=>{
    // Regression: with app/loading.tsx, /species/<unknown> answered 200 (soft 404) and /admin/* with a forged cookie answered 200.
    expect(existsSync(new URL('../app/loading.tsx',import.meta.url))).toBe(false)
  })

  it('serves the standalone output only when explicitly requested',()=>{
    expect(process.env.NEXT_OUTPUT==='standalone'?nextConfig.output==='standalone':nextConfig.output===undefined).toBe(true)
  })
})
