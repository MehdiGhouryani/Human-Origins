import {readdirSync,readFileSync,statSync} from 'node:fs'
import {join,relative,extname} from 'node:path'

const roots=['app','components','content','domain','features','infrastructure','presentation','tests']
const extensions=new Set(['.ts','.tsx'])
const failures=[]

function walk(dir,visitor){
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry); const st=statSync(full)
    if(st.isDirectory()){if(entry!=='.next'&&entry!=='node_modules')walk(full,visitor);continue}
    if(extensions.has(extname(full))) visitor(full)
  }
}

for(const root of roots){
  walk(join(process.cwd(),root),full=>{
    const text=readFileSync(full,'utf8'); const rel=relative(process.cwd(),full)
    const source=text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'')
    if(/\bany\b/.test(source)) failures.push(`${rel}: explicit any token remains`)
    if(/@ts-ignore|@ts-expect-error/.test(source)) failures.push(`${rel}: TypeScript suppression directive remains`)
    if(/from ['"][^'"]*\/data(?:\/|['"])/.test(text)) failures.push(`${rel}: legacy data-layer import remains`)
  })
}

function scanComponentsForExternalUrls(dir){
  walk(dir,full=>{
    const text=readFileSync(full,'utf8'); const rel=relative(process.cwd(),full)
    if(/https?:\/\//.test(text)) failures.push(`${rel}: hardcoded external URL remains in component; resolve it through infrastructure/content.`)
  })
}
scanComponentsForExternalUrls(join(process.cwd(),'components'))

const evolutionTree=readFileSync(join(process.cwd(),'components/EvolutionGraph.tsx'),'utf8')
const migrationGlobe=readFileSync(join(process.cwd(),'components/MigrationGlobe.tsx'),'utf8')
if(/<svg[^>]*role="img"/.test(evolutionTree)||/<svg[^>]*role="img"/.test(migrationGlobe)) failures.push('Interactive SVG engines must not expose the outer SVG as role=img; use group semantics with accessible title/description.')
if(!/<title id=/.test(evolutionTree) || !/<desc id=/.test(evolutionTree)) failures.push('EvolutionGraph is missing accessible SVG title/description.')
if(!/<title id=/.test(migrationGlobe) || !/<desc id=/.test(migrationGlobe)) failures.push('MigrationGlobe is missing accessible SVG title/description.')

if(failures.length){for(const failure of failures)console.error('FAIL',failure);process.exit(1)}
console.log(`Architecture audit passed: ${roots.length} canonical source roots checked; legacy data layer absent from production imports.`)
