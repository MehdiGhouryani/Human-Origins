import {execFileSync} from 'node:child_process'
import {tscBin} from './lib/tsc-bin.mjs'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-migration-audit-'))
try{
  execFileSync(process.execPath,[tscBin,'scripts/audit-migration-entry.ts','migrations/v21-to-v23.ts','--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'scripts/audit-migration-entry.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
