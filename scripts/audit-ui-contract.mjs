import {readdirSync,readFileSync,statSync} from 'node:fs'
import {join,relative,extname} from 'node:path'

const roots=['app','components']
const failures=[]
const files=[]

function walk(dir){
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry)
    const st=statSync(full)
    if(st.isDirectory()) walk(full)
    else if(['.tsx','.ts'].includes(extname(full))) files.push(full)
  }
}
for(const root of roots) walk(root)

for(const full of files){
  const text=readFileSync(full,'utf8')
  const rel=relative(process.cwd(),full)
  if(/href\s*=\s*["']#["']/.test(text)) failures.push(`${rel}: dead hash link detected`)
  if(/>☰</.test(text)) failures.push(`${rel}: decorative menu glyph detected; use a real control`)
  for(const match of text.matchAll(/<button\b([^>]*)>/g)){
    const attrs=match[1]
    const line=text.slice(0,match.index).split('\n').length
    if(!/\btype\s*=/.test(attrs)) failures.push(`${rel}:${line}: button must declare an explicit type`)
    // A type="submit" button is handled by its form: it is only exempt when this file actually wires an onSubmit handler,
    // so a submit button with nothing behind it still fails. Every other button must declare its own handler.
    const isHandledSubmit=/\btype\s*=\s*["']submit["']/.test(attrs) && /\bonSubmit\s*=/.test(text)
    if(!isHandledSubmit && !/\bonClick\s*=|\bonKeyDown\s*=/.test(attrs)) failures.push(`${rel}:${line}: interactive button has no event handler`)
  }
  if(/“We are not a single line|“Science brings us closer/.test(text)) failures.push(`${rel}: pseudo-quotation remains in interface copy`)
}

for(const interactiveSvg of ['components/EvolutionGraph.tsx','components/MigrationGlobe.tsx']){
  const svgText=readFileSync(join(process.cwd(),interactiveSvg),'utf8')
  if(/<svg[^>]*role=\"img\"/.test(svgText)) failures.push(`${interactiveSvg}: interactive SVG must expose group semantics, not role=img`)
  if(!/<title id=/.test(svgText) || !/<desc id=/.test(svgText)) failures.push(`${interactiveSvg}: interactive SVG must include an accessible title and description`)
}


const header=readFileSync(join(process.cwd(),'components/SiteHeader.tsx'),'utf8')
if(/#about/.test(header) && !/hashchange/.test(header)) failures.push('components/SiteHeader.tsx: hash navigation must synchronize active navigation state on hashchange.')
const explorerShell=readFileSync(join(process.cwd(),'components/ExplorerShell.tsx'),'utf8')
if(!/aria-live="polite"/.test(explorerShell)) failures.push('components/ExplorerShell.tsx: explorer state changes should expose a polite live status for assistive technology.')

const page=readFileSync(join(process.cwd(),'app/page.tsx'),'utf8')
if(/^['"]use client['"]/.test(page.trim())) failures.push('app/page.tsx: route shell must remain server-first')

if(failures.length){
  for(const failure of failures) console.error('FAIL',failure)
  process.exit(1)
}
console.log(`UI contract audit passed: ${files.length} app/component source files checked.`)
