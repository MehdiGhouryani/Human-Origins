import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'

// Visitor-facing copy must not carry internal vocabulary. These words are QA or data-model terms, not reader language.
const INTERNAL=[/tree avatar/i,/dossier/i,/\bslot\b/i,/evidence rule/i,/publication linked/i,/source intelligence/i,/record signal/i]

describe('visitor-facing wording (species page sources)',()=>{
  it('the completeness checklist speaks plainly',()=>{
    const src=readFileSync('features/explorer/dossier.ts','utf8')
    const labels=[...src.matchAll(/label:'([^']+)'/g)].map(m=>m[1])
    expect(labels.length).toBeGreaterThan(5)
    for(const label of labels) for(const pattern of INTERNAL) expect(label,label).not.toMatch(pattern)
  })
  it('the header slot title is public wording',()=>{
    const src=readFileSync('components/species/SlotGallery.tsx','utf8')
    expect(src).toMatch(/return 'Header image'/)
  })
})
