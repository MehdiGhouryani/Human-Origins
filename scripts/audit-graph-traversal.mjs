import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-graph-traversal-audit-'))
try{
  execFileSync('tsc',[
    'scripts/audit-graph-traversal-entry.ts',
    'content/catalog.ts','content/collections.ts','content/evidence.ts','content/foundation.ts','content/institutions.ts','content/media.ts','content/occurrences.ts','content/provenance.ts','content/publications.ts','content/relationships.ts','content/sites.ts','content/sources.ts','content/specimens.ts','content/taxa.ts','content/taxon-names.ts',
    'domain/contracts.ts','domain/ids.ts','domain/immutability.ts','domain/research-indexes.ts','domain/research-model.ts','domain/research-graph.ts','domain/graph-traversal.ts','domain/time.ts','infrastructure/validation/fingerprint.ts',
    '--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'
  ],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'scripts/audit-graph-traversal-entry.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
