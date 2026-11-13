import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-media-audit-'))
try{
  // TypeScript's own bin/tsc through the current Node binary: `tsc` alone is a shell shim that
  // CreateProcess cannot exec on Windows (spawnSync ENOENT), while this form is platform-independent.
  const tscBin=join(root,'node_modules','typescript','bin','tsc')
  execFileSync(process.execPath,[tscBin,
    'scripts/audit-media-entry.ts','content/catalog.ts','content/media.ts','content/taxa.ts','content/sources.ts',
    'content/foundation.ts','content/evidence.ts','content/provenance.ts','content/specimens.ts','content/sites.ts',
    'content/relationships.ts','domain/contracts.ts','domain/ids.ts','domain/time.ts','domain/immutability.ts',
    '--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'
  ],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'scripts/audit-media-entry.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
