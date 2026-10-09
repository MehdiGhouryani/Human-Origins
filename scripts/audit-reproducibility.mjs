import {execFileSync} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readFileSync} from 'node:fs'

const root=process.cwd()
const out=mkdtempSync(join(tmpdir(),'human-origins-reproducibility-'))
try{
  execFileSync('tsc',[
    'scripts/audit-reproducibility-entry.ts',
    'infrastructure/validation/fingerprint.ts',
    'content/catalog.ts','content/collections.ts','content/taxon-names.ts','content/evidence.ts','content/foundation.ts','content/institutions.ts','content/media.ts','content/occurrences.ts','content/interpretations.ts','content/provenance.ts','content/publications.ts','content/relationships.ts','content/sites.ts','content/sources.ts','content/specimens.ts','content/taxa.ts',
    'domain/contracts.ts','domain/ids.ts','domain/research-indexes.ts','domain/immutability.ts','domain/research-model.ts','domain/time.ts',
    '--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck','--strict'
  ],{cwd:root,stdio:'inherit'})
  const output=execFileSync(process.execPath,[join(out,'scripts/audit-reproducibility-entry.js')],{cwd:root,encoding:'utf8'}).trim()
  console.log(output)
  const match=output.match(/release=([^ ]+) fingerprint=([a-f0-9]{32})$/)
  if(!match) throw new Error('Reproducibility entry did not emit the expected release/fingerprint record.')
  const manifest=JSON.parse(readFileSync(join(root,'public/assets/catalog-runtime-manifest.json'),'utf8'))
  if(manifest.release!==match[1] || manifest.fingerprint!==match[2]) throw new Error('Public catalog runtime manifest does not match canonical runtime metadata.')
} finally { rmSync(out,{recursive:true,force:true}) }
