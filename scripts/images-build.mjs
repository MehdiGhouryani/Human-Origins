import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

// Compiles tools/images/*.ts to a temp dir (same pattern as the audit scripts) and runs the builder.
const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-images-'))
try{
  execFileSync('tsc',['tools/images/build.ts','tools/images/spec.ts','tools/images/taxa.ts','--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict','--types','node'],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'build.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
