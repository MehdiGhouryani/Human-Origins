import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs'
import {join,relative} from 'node:path'

const root=process.cwd()
const failures=[]

if(existsSync(join(root,'data'))) failures.push('Production `data/` directory must remain removed.')

const globals=readFileSync(join(root,'app/globals.css'),'utf8')
if(/@import\s+url\(/i.test(globals)) failures.push('Global CSS must not use external @import dependencies; typography is currently local-system-only.')

const manifest=readFileSync(join(root,'public/assets/catalog-runtime-manifest.json'),'utf8')
const packageJson=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
if(!manifest.includes(packageJson.version) || !manifest.includes('fingerprint')) failures.push('Catalog runtime manifest is missing current release/fingerprint metadata.')

const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
if(!pkg.engines?.node || !pkg.packageManager) failures.push('package.json must declare a Node engine and package manager for reproducible foundation setup.')
const page=readFileSync(join(root,'app/page.tsx'),'utf8')
if(/^['"]use client['"]/.test(page.trim())) failures.push('app/page.tsx must remain server-first.')

const explorer=readFileSync(join(root,'components/ExplorerShell.tsx'),'utf8')
for(const token of ["dynamic(()=>import('./EvolutionTree')","dynamic(()=>import('./Inspector')","dynamic(()=>import('./MigrationGlobe')"]){
  if(!explorer.includes(token)) failures.push(`ExplorerShell missing dynamic visualization boundary: ${token}`)
}

const config=readFileSync(join(root,'next.config.ts'),'utf8')
for(const token of ['poweredByHeader:false','X-Content-Type-Options','Referrer-Policy','Permissions-Policy','pathname:\'/wikipedia/commons/**\'']){
  if(!config.includes(token)) failures.push(`next.config.ts missing foundation control: ${token}`)
}

const roots=['app','components','content','domain','features','infrastructure','presentation','tests']
function walk(dir){
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry); const st=statSync(full)
    if(st.isDirectory()){walk(full);continue}
    if(!/\.(ts|tsx|css)$/.test(full)) continue
    const text=readFileSync(full,'utf8')
    const rel=relative(root,full)
    if(/https?:\/\//.test(text)&&rel.startsWith('components/')) failures.push(`${rel}: component-level network URL found.`)
  }
}
for(const rootDir of roots) walk(join(root,rootDir))

if(failures.length){for(const failure of failures) console.error('FAIL',failure);process.exit(1)}
console.log('Foundation architecture audit passed: server shell, dynamic islands, local typography dependency and production security boundaries are present.')
