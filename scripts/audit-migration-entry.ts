import {migrationPolicy,v21ToV23MigrationRules} from '../migrations/v21-to-v23'
const failures:string[]=[]
const requiredPaths=['species.id','species.name','species.short','species.group','species.date/start/end','species.status','species.description','species.facts','species.evidence','species.x','species.y','species.image','species.imageKind','species.imageCredit','species.sources[]','species relationships[]','relationships[].sourceIds','specimen records','site.ageKa/ageLabel','site.lon/site.lat','specimen.viewerUrl','source/claim cards','implicit content arrays']
const covered=new Set(v21ToV23MigrationRules.map(rule=>rule.sourcePath))
for(const path of requiredPaths) if(!covered.has(path)) failures.push(`Missing migration policy for ${path}.`)
for(const rule of v21ToV23MigrationRules){
  if(!rule.id || !rule.sourcePath || !rule.targetPath || !rule.note) failures.push(`Incomplete migration rule ${rule.id||'<unknown>'}.`)
  if(rule.disposition==='quarantine' && !rule.note.toLowerCase().includes('never')) failures.push(`Quarantine rule ${rule.id} must explain the safety boundary.`)
}
const dispositions=new Set(v21ToV23MigrationRules.map(rule=>rule.disposition))
if(!dispositions.has('preserve')||!dispositions.has('transform')||!dispositions.has('quarantine')) failures.push('Migration policy must include preserve, transform and quarantine dispositions.')
if(migrationPolicy.strategy!=='append-only-normalization') failures.push('Unexpected migration strategy.')
if(failures.length){for(const failure of failures) console.error(`FAIL ${failure}`);throw new Error(`Migration strategy audit failed with ${failures.length} issue(s).`)}
console.log(`Migration strategy audit passed: ${v21ToV23MigrationRules.length} explicit migration rules / ${dispositions.size} dispositions.`)
