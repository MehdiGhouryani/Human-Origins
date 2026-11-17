import {existsSync,readFileSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {describe,expect,it} from 'vitest'

const root=resolve(import.meta.dirname,'..')

describe('public asset manifest',()=>{
  const manifest=JSON.parse(readFileSync(join(root,'public/assets/asset-manifest.json'),'utf8')) as {
    assets:{id:string;path:string;sha256?:string}[]
    rules:Record<string,string>
  }

  it('lists only assets that are part of the current media contract',()=>{
    expect(manifest.assets.some(asset=>asset.id==='hero-evolution')).toBe(false)
    expect(existsSync(join(root,'public/assets/hero-evolution.webp'))).toBe(false)
    expect(manifest.rules.hero).toContain('hero-mobile.webp')
    for(const asset of manifest.assets) expect(existsSync(join(root,'public',asset.path.slice(1))),asset.path).toBe(true)
  })

  it('keeps all viewport-specific hero files available',()=>{
    for(const file of ['hero-mobile.webp','hero-tablet.webp','hero-desktop.webp']){
      expect(existsSync(join(root,'public/assets',file)),file).toBe(true)
    }
  })

  it('keeps retired hero bytes traceable in the migration disposition',()=>{
    const record=readFileSync(join(root,'migrations/v32-to-v33.ts'),'utf8')
    expect(record).toContain('6830afdca25f921614c94126ad98ffedc92479755f1bf26dca3e77dae9b8aa55')
    expect(record).toContain('68230')
  })
})
