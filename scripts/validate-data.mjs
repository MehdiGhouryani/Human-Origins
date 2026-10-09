import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-data-audit-'))
try{
  execFileSync('tsc',[
    'scripts/audit-data-entry.ts','infrastructure/validation/audit.ts','content/catalog.ts','content/foundation.ts',
    'content/collections.ts','content/taxon-names.ts','content/evidence.ts','content/institutions.ts','content/media.ts','content/occurrences.ts','content/provenance.ts','content/publications.ts','content/relationships.ts','content/sites.ts',
    'content/sources.ts','content/specimens.ts','content/taxa.ts','domain/contracts.ts','domain/ids.ts','domain/research-indexes.ts','domain/immutability.ts','domain/research-model.ts','domain/time.ts',
    '--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'
  ],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'scripts/audit-data-entry.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
