#!/usr/bin/env node
// Phase 7.4 audit: a reproducible count of the CSS debt the plan tracks (BUG-70/BUG-71) and the owner
// decisions still pending on it. Read-only: it changes nothing and deletes nothing.
//
//   npm run audit:css            console report
//   npm run audit:css -- --json out/audit-css.json   also write the machine-readable result
//
// What it measures, all from the stylesheets in app/:
//   lines, media queries, !important, duplicate selector definitions, and classes that no source file
//   references. A class referenced only by tests is reported separately: e2e selectors are load-bearing.
// Graph-lineage classes are flagged rather than recommended for deletion: the graph is frozen by decision.
import {readFileSync, readdirSync, statSync, writeFileSync, mkdirSync} from 'node:fs'
import {join, dirname} from 'node:path'

const root=process.cwd()
const jsonOut=(process.argv.includes('--json'))?process.argv[process.argv.indexOf('--json')+1]:null
const STYLESHEETS=['app/globals.css','app/atlas.css']
const SOURCE_DIRS=['app','components','features','domain','presentation','infrastructure','content','tests','scripts','tools','migrations']
const GRAPH_HINT=/^(graph|lineage|atlas-graph|rel-|family-|taxon-node|tree-)/

const walk=dir=>{
  const out=[]
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry)
    const stat=statSync(full)
    if(stat.isDirectory()) out.push(...walk(full))
    else if(/\.(tsx?|mtsx?|jsx?|csv)$/.test(entry)) out.push(full)
  }
  return out
}

const files=STYLESHEETS.map(relative=>({relative,text:readFileSync(join(root,relative),'utf8')}))
const sourceFiles=SOURCE_DIRS.flatMap(dir=>{
  try{return walk(dir)}catch{return []}
})
const sourceText=sourceFiles.map(f=>readFileSync(f,'utf8'))
const appText=sourceText.filter((_,i)=>!sourceFiles[i].startsWith('tests')).join('\n')
const testText=sourceText.filter((_,i)=>sourceFiles[i].startsWith('tests')).join('\n')

// ── rule parsing: line-wise "selector {" pairs, tracking @media context ──────────────────
const lineRules=[]
for(const file of files){
  const lines=file.text.split('\n')
  let media=null
  const stack=[]
  for(const line of lines){
    const trimmed=line.trim()
    if(/@media/.test(trimmed)){media=trimmed.slice(0,trimmed.indexOf('{')>0?trimmed.indexOf('{'):undefined).trim();stack.push('media');continue}
    if(trimmed.endsWith('{')){
      const sel=trimmed.slice(0,-1).trim()
      if(!/^@(media|supports|keyframes|font-face|layer|container)/.test(sel)&&sel) lineRules.push({file:file.relative,selector:sel.replace(/\s+/g,' '),media})
      stack.push('rule');continue
    }
    if(trimmed==='}'){stack.pop();if(stack.length===0)media=null;else if(stack[stack.length-1]!=='media')media=null}
  }
}

const lines=files.reduce((sum,f)=>sum+f.text.split('\n').length,0)
const important=(files.reduce((sum,f)=>sum+(f.text.match(/!important/g)?.length??0),0))
const mediaQueries=(files.reduce((sum,f)=>sum+(f.text.match(/@media/g)?.length??0),0))

// ── duplicate selectors (same selector text, any media) ───────────────────────────────────
const selectorCount=new Map()
for(const rule of lineRules){
  const key=rule.selector
  selectorCount.set(key,(selectorCount.get(key)??0)+1)
}
const duplicates=[...selectorCount.entries()].filter(([,count])=>count>1).map(([selector,count])=>({selector,count}))
  .sort((a,b)=>b.count-a.count)
const heroDefinitions=duplicates.filter(d=>/hero/i.test(d.selector)).reduce((sum,d)=>sum+d.count,0)
  +lineRules.filter(r=>/\.hero/.test(r.selector)).length

// ── dead classes: defined in CSS, never referenced in any source or test file ─────────────
const cssClasses=new Set()
for(const rule of lineRules){
  for(const match of rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)) cssClasses.add(match[1])
}
const referencedIn=(text,cls)=>text.includes(cls)
const dead=[],deadButTested=[]
for(const cls of cssClasses){
  const inApp=referencedIn(appText,cls)
  const inTests=referencedIn(testText,cls)
  if(!inApp&&!inTests) dead.push(cls)
  else if(!inApp&&inTests) deadButTested.push(cls)
}
const graphDead=[...dead,...deadButTested].filter(cls=>GRAPH_HINT.test(cls))
const plainDead=dead.filter(cls=>!GRAPH_HINT.test(cls)).sort()
const plainDeadButTested=deadButTested.filter(cls=>!GRAPH_HINT.test(cls)).sort()

const report={
  stylesheets:Object.fromEntries(files.map(f=>[f.relative,f.text.split('\n').length])),
  totals:{lines,important,mediaQueries,cssClasses:cssClasses.size},
  duplicateSelectors:duplicates,
  duplicateSelectorCount:duplicates.length,
  heroSelectorMentions:heroDefinitions,
  deadClasses:{sourceAndTests:plainDead,testsOnly:plainDeadButTested,graphFrozen:graphDead.sort()},
  notes:[
    'Dead classes here are referenced by no raw source text. A raw-text scan is conservative: a class used only through a computed name still matches if the name appears verbatim.',
    'Graph-lineage classes are listed separately and are not deletion candidates (owner decision: the graph is frozen).',
    'Deletion itself stays an owner decision (BUG-71 history: the 2026-10-12 purge used a computed-style fingerprint over 50 page×width combinations; repeat that protocol before any removal).',
  ],
}

console.log('── CSS audit (phase 7.4) ──')
for(const [file,lineCount] of Object.entries(report.stylesheets)) console.log(`${file}: ${lineCount} lines`)
console.log(`total lines ${lines} (acceptance target < 2500; deferred by owner decision — CSS tooling + graph)`)
console.log(`!important ${important} · media queries ${mediaQueries} · class names defined ${cssClasses.size}`)
console.log(`duplicate selector definitions ${duplicates.length}; top:`)
for(const d of duplicates.slice(0,10)) console.log(`  ${d.count}×  ${d.selector}`)
console.log(`dead in source and tests: ${plainDead.length}`)
console.log(plainDead.length?`  ${plainDead.join(', ')}`:'')
console.log(`dead in source, referenced by tests (load-bearing selectors): ${plainDeadButTested.length}`)
console.log(plainDeadButTested.length?`  ${plainDeadButTested.join(', ')}`:'')
console.log(`graph-lineage (frozen, not candidates): ${graphDead.length}`)
console.log(graphDead.length?`  ${graphDead.join(', ')}`:'')

if(jsonOut){
  mkdirSync(dirname(join(root,jsonOut)),{recursive:true})
  writeFileSync(join(root,jsonOut),JSON.stringify(report,null,2))
  console.log(`written: ${jsonOut}`)
}
