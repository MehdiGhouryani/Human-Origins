import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'

// Headings and captions a reader sees must not use the data model's vocabulary.
const FILES=['app/species/[id]/page.tsx','components/EvidenceGraph.tsx','components/SourceIntelligence.tsx','app/about/page.tsx','components/ExplorerShell.tsx']
const INTERNAL=['RECORD SIGNAL','Source Intelligence','Source intelligence','CLAIM LEDGER','Evidence rule']

describe('visitor-facing copy',()=>{
  for(const file of FILES) it(`${file} has no internal headings`,()=>{
    const src=readFileSync(file,'utf8')
    for(const word of INTERNAL) expect(src.includes(word),`${word} in ${file}`).toBe(false)
  })
})
