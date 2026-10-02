// Usage: node scripts/bump-version.mjs 0.29.0  — updates every place listed in ARCHITECTURE §9 and regenerates the fingerprint.
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
const next=process.argv[2]
if(!/^\d+\.\d+\.\d+$/.test(next||'')){console.error('usage: node scripts/bump-version.mjs X.Y.Z');process.exit(1)}
const root=process.cwd(),rd=f=>readFileSync(join(root,f),'utf8'),wr=(f,s)=>writeFileSync(join(root,f),s)
const pkg=JSON.parse(rd('package.json'));const prev=pkg.version;pkg.version=next;wr('package.json',JSON.stringify(pkg,null,2)+'\n')
const lock=JSON.parse(rd('package-lock.json'));lock.version=next;if(lock.packages?.['']) lock.packages[''].version=next;wr('package-lock.json',JSON.stringify(lock,null,2)+'\n')
wr('content/catalog.ts',rd('content/catalog.ts').replace(`release:'${prev}'`,`release:'${next}'`))
wr('README.md',rd('README.md').replaceAll(`**${prev}**`,`**${next}**`))
for(const f of ['tests/bootstrap-contract.test.ts','tests/foundation-integrity.test.ts']) wr(f,rd(f).replaceAll(`'${prev}'`,`'${next}'`))
const am=JSON.parse(rd('public/assets/asset-manifest.json'));am.version=next.replace('0.','')
for(const a of am.assets){if(a.path?.startsWith('/assets/')&&a.sha256){try{const b=readFileSync(join(root,'public',a.path));a.sha256=createHash('sha256').update(b).digest('hex');a.bytes=b.length}catch{}}}
wr('public/assets/asset-manifest.json',JSON.stringify(am,null,2)+'\n')
const out=mkdtempSync(join(tmpdir(),'ho-bump-'))
try{
  const tsc=join(root,'node_modules/.bin/tsc')
  execFileSync(tsc,['infrastructure/validation/fingerprint.ts','--outDir',out,'--module','commonjs','--target','ES2020','--esModuleInterop','--skipLibCheck'],{cwd:root,stdio:'inherit'})
  const meta=execFileSync(process.execPath,['-e',`const m=require(${JSON.stringify(join(out,'infrastructure/validation/fingerprint.js'))}).catalogRuntimeMetadata;console.log(JSON.stringify(m))`],{encoding:'utf8'})
  const {release,fingerprint,schemaVersion}=JSON.parse(meta)
  const rm=JSON.parse(rd('public/assets/catalog-runtime-manifest.json'));Object.assign(rm,{release,schemaVersion,fingerprint})
  wr('public/assets/catalog-runtime-manifest.json',JSON.stringify(rm,null,2)+'\n')
  console.log(`bumped ${prev} → ${next} · fingerprint ${fingerprint}`)
}finally{rmSync(out,{recursive:true,force:true})}
