import {execFileSync,spawnSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

// Network check, run by a person: `npm run check:references [-- pub-id ...]`. Not part of qa:release (no network in CI).
const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-references-'))
let status=1
try{
  execFileSync('tsc',['scripts/check-references-entry.ts','--outDir',out,'--module','commonjs','--target','ES2020','--lib','ES2022,DOM','--esModuleInterop','--skipLibCheck','--strict','--types','node'],{cwd:root,stdio:'inherit'})
  status=spawnSync(process.execPath,[join(out,'scripts/check-references-entry.js'),...process.argv.slice(2)],{cwd:root,stdio:'inherit'}).status??1
}finally{rmSync(out,{recursive:true,force:true})}
process.exit(status)
