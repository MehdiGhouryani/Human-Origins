import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs'
import {join,relative} from 'node:path'

const root=process.cwd()
const failures=[]

function walk(dir,visitor){
  if(!existsSync(dir)) return
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry)
    const stat=statSync(full)
    if(stat.isDirectory()){walk(full,visitor);continue}
    if(/\.(ts|tsx)$/.test(full)) visitor(full)
  }
}

for(const dir of ['app','components','features','presentation','domain']){
  walk(join(root,dir),full=>{
    const rel=relative(root,full)
    const text=readFileSync(full,'utf8')
    const isServerOnlyBootstrap=rel==='features/explorer/bootstrap.ts' && /^import ['"]server-only['"]/.test(text.trim())
    if(rel.startsWith('components/') && /from ['"][^'"]*\/infrastructure(?:\/|['"])/.test(text)) failures.push(`${rel}: client component must not import infrastructure runtime code.`)
    if(rel.startsWith('components/') && /from ['"][^'"]*\/content\/catalog['"]/.test(text)) failures.push(`${rel}: client component must not import canonical catalog directly.`)
    if(rel.startsWith('features/explorer/') && !isServerOnlyBootstrap && /from ['"][^'"]*\/infrastructure(?:\/|['"])/.test(text)) failures.push(`${rel}: explorer feature must not import infrastructure runtime code.`)
    if(rel.startsWith('features/explorer/') && !isServerOnlyBootstrap && /from ['"][^'"]*\/content\/catalog['"]/.test(text)) failures.push(`${rel}: client-safe explorer feature must not import canonical catalog directly.`)
    if(rel.startsWith('components/') && /from ['"][^'"]*server-only['"]/.test(text)) failures.push(`${rel}: client component imports server-only runtime.`)
  })
}

const repository=readFileSync(join(root,'infrastructure/repository.ts'),'utf8')
if(!/^import ['"]server-only['"]/.test(repository.trim())) failures.push('infrastructure/repository.ts: must be explicitly server-only.')
const bootstrap=readFileSync(join(root,'features/explorer/bootstrap.ts'),'utf8')
if(!/^import ['"]server-only['"]/.test(bootstrap.trim())) failures.push('features/explorer/bootstrap.ts: server-side canonical assembly must be explicitly server-only.')

if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);process.exit(1)}
console.log('Boundary audit passed: client components consume only serializable explorer bootstrap/query contracts; canonical repository and bootstrap assembly are server-only.')
