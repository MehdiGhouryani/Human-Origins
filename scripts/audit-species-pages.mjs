import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-species-pages-'))
try{
  execFileSync('tsc',['scripts/audit-species-pages-entry.ts','--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'scripts/audit-species-pages-entry.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
