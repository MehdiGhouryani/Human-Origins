import {expect,test} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

// Phase 7.5 of the plan (v2): a repeatable axe check outside the graph. The lineage and evidence graph containers
// (and the graph-adjacent notes, class names containing "graph") are frozen by the owner's decision and are excluded
// here; their findings are tracked on the graph track, not hidden.
const AXE_SOURCE=readFileSync(join(process.cwd(),'node_modules','axe-core','axe.min.js'),'utf8')
const GRAPH_EXCLUDE=['[class*="lineage"]','[class*="graph"]']
const ROUTES=[
  {name:'about',path:'/about'},
  {name:'compare',path:'/?mode=compare&cmp=sapiens,neanderthal'},
  {name:'evidence',path:'/?mode=evidence'},
  {name:'migration',path:'/?mode=migration'},
  {name:'species',path:'/species/neanderthal'},
]

type AxeViolation={id:string,impact?:string|null,nodes:{target:string[]}[]}
type AxeWindow={axe:{run:(context:unknown,options:unknown)=>Promise<{violations:AxeViolation[]}>}}

for(const route of ROUTES){
  test(`${route.name}: no serious or critical axe violations outside the graph`,async({page})=>{
    await page.goto(route.path)
    await page.waitForLoadState('networkidle')
    await page.addScriptTag({content:AXE_SOURCE})
    const blocking=await page.evaluate(async(exclude:string[])=>{
      const axe=(window as unknown as AxeWindow).axe
      const context={include:[['body']],exclude:exclude.map(selector=>[selector])}
      const result=await axe.run(context,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}})
      return result.violations
        .filter(violation=>violation.impact==='serious'||violation.impact==='critical')
        .map(violation=>({id:violation.id,impact:violation.impact,targets:violation.nodes.map(node=>node.target.join(' '))}))
    },GRAPH_EXCLUDE)
    expect(blocking,JSON.stringify(blocking)).toEqual([])
  })
}
