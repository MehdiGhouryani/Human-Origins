#!/usr/bin/env node
// Read-only computed-style fingerprint for phase 7.4.
// Captures non-graph DOM styles across the main routes and responsive widths so a CSS chunking
// change can be compared byte-for-byte before any stylesheet refactor or dead-class removal.
import {chromium} from '@playwright/test'
import {mkdirSync,writeFileSync} from 'node:fs'
import {dirname} from 'node:path'

const options={base:process.env.CSS_BASE_URL||'http://127.0.0.1:3000',out:'artifacts/css-fingerprint.json'}
for(let i=2;i<process.argv.length;i++){
  const arg=process.argv[i]
  if(arg==='--base') options.base=process.argv[++i]
  else if(arg==='--out') options.out=process.argv[++i]
  else throw new Error(`Unknown argument: ${arg}`)
}

const ROUTES=[
  {id:'home-tree',path:'/'},
  {id:'home-timeline',path:'/?mode=timeline'},
  {id:'home-migration',path:'/?mode=migration'},
  {id:'home-evidence',path:'/?mode=evidence'},
  {id:'home-compare',path:'/?mode=compare&cmp=sapiens,neanderthal'},
  {id:'about',path:'/about'},
  {id:'species-neanderthal',path:'/species/neanderthal'},
]
const VIEWPORTS=[
  {id:'phone',width:390,height:844},
  {id:'tablet',width:768,height:1024},
  {id:'small-desktop',width:1024,height:900},
  {id:'desktop',width:1440,height:900},
]
const EXCLUDED=['[class*="lineage"]','[class*="graph"]']
const PROPERTIES=[
  'display','position','visibility','opacity','box-sizing','width','height','min-width','max-width','min-height','max-height',
  'margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left',
  'color','background-color','font-family','font-size','font-weight','font-style','line-height','letter-spacing','text-align',
  'text-transform','white-space','overflow-x','overflow-y','border-top-width','border-right-width','border-bottom-width',
  'border-left-width','border-top-style','border-right-style','border-bottom-style','border-left-style','border-top-color',
  'border-right-color','border-bottom-color','border-left-color','border-radius','box-shadow','z-index','cursor',
  'align-items','align-content','justify-content','flex-direction','flex-wrap','gap','grid-template-columns','grid-template-rows',
  'object-fit','object-position','transform','outline-style','outline-width','outline-color',
]
const PSEUDO_PROPERTIES=['content','display','position','color','background-color','width','height','border-color','border-width']

const browser=await chromium.launch({executablePath:process.env.PW_CHROMIUM_PATH||undefined,headless:true})
const scenarios={}
try{
  for(const route of ROUTES){
    for(const viewport of VIEWPORTS){
      const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:'reduce'})
      const page=await context.newPage()
      await page.goto(options.base+route.path,{waitUntil:'networkidle',timeout:120000})
      await page.evaluate(async()=>{if(document.fonts?.ready) await document.fonts.ready})
      await page.waitForTimeout(150)
      const result=await page.evaluate(({excluded,properties,pseudoProperties})=>{
        const compactStyle=(style,keys)=>Object.fromEntries(keys.map(property=>[property,style.getPropertyValue(property)]))
        const isExcluded=(element)=>excluded.some(selector=>Boolean(element.closest(selector)))
        const pathOf=(element)=>{
          const parts=[]
          let current=element
          while(current&&current!==document.body){
            let part=current.tagName.toLowerCase()
            if(current.id) part+='#'+current.id
            if(current.classList?.length) part+='.'+[...current.classList].sort().join('.')
            const parent=current.parentElement
            const index=parent?Array.prototype.indexOf.call(parent.children,current):0
            part+=`:nth(${index})`
            parts.unshift(part)
            current=parent
          }
          return 'body>'+parts.join('>')
        }
        const candidates=[...document.querySelectorAll('body *')].filter(element=>
          !isExcluded(element)&&(element.id||element.classList?.length||element.matches('a,button,input,select,textarea,summary,svg,details,h1,h2,h3,main,header,footer,nav,section,article')),
        )
        const nodes=candidates.map(element=>{
          const style=getComputedStyle(element)
          const before=getComputedStyle(element,'::before')
          const after=getComputedStyle(element,'::after')
          return {
            path:pathOf(element),
            tag:element.tagName.toLowerCase(),
            id:element.id||'',
            classes:[...element.classList].sort(),
            style:compactStyle(style,properties),
            before:compactStyle(before,pseudoProperties),
            after:compactStyle(after,pseudoProperties),
          }
        }).sort((a,b)=>a.path.localeCompare(b.path))
        return {title:document.title,nodeCount:nodes.length,nodes}
      },{excluded:EXCLUDED,properties:PROPERTIES,pseudoProperties:PSEUDO_PROPERTIES})
      scenarios[`${route.id}:${viewport.id}`]={route:route.path,viewport,nodes:result.nodeCount,title:result.title,fingerprint:result.nodes}
      console.log(`${route.id.padEnd(20)} ${viewport.id.padEnd(13)} ${result.nodeCount} styled nodes`)
      await context.close()
    }
  }
}finally{
  await browser.close()
}
const report={
  schema:'css-computed-fingerprint/1',
  createdAt:new Date().toISOString(),
  commit:process.env.GITHUB_SHA||'local',
  base:options.base,
  excluded:EXCLUDED,
  properties:PROPERTIES,
  pseudoProperties:PSEUDO_PROPERTIES,
  scenarios,
}
mkdirSync(dirname(options.out),{recursive:true})
writeFileSync(options.out,JSON.stringify(report,null,2)+'\n')
console.log(`written ${options.out}`)
