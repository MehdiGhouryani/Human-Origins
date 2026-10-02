import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-research-index-audit-'))
try{
  execFileSync('tsc',[
    'scripts/audit-research-indexes-entry.ts','content/catalog.ts','content/taxon-names.ts','content/taxa.ts','content/relationships.ts','content/media.ts','content/sources.ts','content/evidence.ts','content/specimens.ts','content/provenance.ts','content/sites.ts','content/publications.ts','content/institutions.ts','content/collections.ts','content/occurrences.ts','domain/contracts.ts','domain/ids.ts','domain/immutability.ts','domain/research-indexes.ts','domain/research-model.ts','domain/time.ts',
    '--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'
  ],{cwd:root,stdio:'inherit'})
  execFileSync(process.execPath,[join(out,'scripts/audit-research-indexes-entry.js')],{cwd:root,stdio:'inherit'})
}finally{rmSync(out,{recursive:true,force:true})}
