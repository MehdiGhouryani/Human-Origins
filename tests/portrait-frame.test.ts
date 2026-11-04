import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'

// A species portrait is a face. No responsive rule may give it a landscape frame (3:2, 16:9) or top-align its crop.
const css=['app/species/species.css','app/species/species-page.css'].map(f=>readFileSync(f,'utf8')).join('\n')
describe('species portrait frame',()=>{
  it('no portrait rule uses a landscape ratio',()=>{
    const rules=[...css.matchAll(/\.dossier-portrait\s*\{[^}]*\}/g)].map(m=>m[0].replace(/\s+/g,''))
    expect(rules.length).toBeGreaterThan(0)
    expect(rules.filter(r=>/aspect-ratio:(3\/2|16\/9)/.test(r))).toEqual([])
  })
  it('the portrait crop stays on the face, not the top edge',()=>{
    expect(css).not.toMatch(/\.dossier-portrait-image\s*\{[^}]*object-position:\s*center 0%/)
  })
})
