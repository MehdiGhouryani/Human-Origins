// Consistent snapshot of the CMS volume (.cms-data): SQLite via `VACUUM INTO` (safe while the site runs)
// plus a copy of the processed media directory. Usage: npm run backup:cms [-- <target-dir>]
import {DatabaseSync} from 'node:sqlite'
import {cpSync,existsSync,mkdirSync,renameSync,rmSync} from 'node:fs'
import {basename,dirname,join,resolve} from 'node:path'

const dbPath=resolve(process.env.CMS_DB_PATH ?? '.cms-data/cms.sqlite')
const mediaDir=resolve(process.env.CMS_MEDIA_DIR ?? '.cms-data/media')
const stamp=new Date().toISOString().replace(/[:.]/g,'-')
const target=resolve(process.argv[2] ?? join('backups',stamp))

if(!existsSync(dbPath)){console.error(`No CMS database at ${dbPath}; nothing to back up.`);process.exit(1)}
if(existsSync(target)){console.error(`Backup target already exists: ${target}`);process.exit(1)}
mkdirSync(dirname(target),{recursive:true})
const staging=join(dirname(target),`.${basename(target)}.tmp-${process.pid}-${Date.now()}`)
mkdirSync(staging,{recursive:false})
try{
  // Copy files first, then take the SQLite snapshot. An upload created during the copy is
  // detected by the reference check below; a deletion is safe because the DB snapshot follows it.
  if(existsSync(mediaDir)) cpSync(mediaDir,join(staging,'media'),{recursive:true})
  else mkdirSync(join(staging,'media'),{recursive:true})
  const db=new DatabaseSync(dbPath)
  const out=join(staging,'cms.sqlite')
  db.exec(`VACUUM INTO '${out.replace(/'/g,"''")}'`)
  db.close()
  const snapshot=new DatabaseSync(out,{readOnly:true})
  const rows=snapshot.prepare('SELECT id,variants FROM media_assets').all()
  snapshot.close()
  for(const row of rows){
    let variants
    try{variants=JSON.parse(row.variants)}catch{throw new Error(`Invalid media variant metadata in row ${row.id}.`)}
    for(const variant of variants){
      const match=typeof variant.src==='string' && variant.src.match(/^\\/cms-media\\/([a-z0-9-]+)\\/([a-z0-9-]+\\.webp)$/)
      if(!match || match[1]!==row.id || !existsSync(join(staging,'media',match[1],match[2]))){
        throw new Error(`Backup is incomplete: ${row.id} references missing media ${String(variant.src)}.`)
      }
    }
  }
  renameSync(staging,target)
  console.log(`CMS backup written atomically to ${target}`)
}catch(error){
  rmSync(staging,{recursive:true,force:true})
  throw error
}
