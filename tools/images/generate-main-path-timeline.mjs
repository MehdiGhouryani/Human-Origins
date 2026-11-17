import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {tscBin} from '../../scripts/lib/tsc-bin.mjs'

const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-time-ranges-'))
try{
  execFileSync(process.execPath,[tscBin,'tools/images/generate-main-path-timeline.ts','--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict','--types','node'],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'tools/images/generate-main-path-timeline.js'),...process.argv.slice(2)],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
