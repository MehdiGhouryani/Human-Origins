// Non-destructive restore: validate a backup and materialize it into a new, empty directory.
// Usage: npm run restore:cms -- <backup-dir> [new-target-dir]
import {DatabaseSync} from 'node:sqlite'
import {cpSync,existsSync,mkdirSync,renameSync,rmSync} from 'node:fs'
import {basename,dirname,join,resolve} from 'node:path'

const backup=resolve(process.argv[2]??'')
const target=resolve(process.argv[3]??'')
if(!process.argv[2]||!process.argv[3]){
  console.error('Usage: npm run restore:cms -- <backup-dir> <new-target-dir>')
  process.exit(1)
}
const dbPath=join(backup,'cms.sqlite')
const mediaPath=join(backup,'media')
if(!existsSync(dbPath)||!existsSync(mediaPath)) throw new Error(`Backup must contain cms.sqlite and media/: ${backup}`)
if(existsSync(target)) throw new Error(`Restore target already exists; refusing to overwrite it: ${target}`)

const db=new DatabaseSync(dbPath)
const integrity=db.prepare('PRAGMA integrity_check').get()
if(Object.values(integrity??{})[0]!=='ok') throw new Error('Backup database failed SQLite integrity_check.')
const rows=db.prepare('SELECT id,variants FROM media_assets').all()
db.close()
for(const row of rows){
  const variants=JSON.parse(row.variants)
  for(const variant of variants){
    const match=typeof variant.src==='string'&&variant.src.match(/^\\/cms-media\\/([a-z0-9-]+)\\/([a-z0-9-]+\\.webp)$/)
    if(!match||match[1]!==row.id||!existsSync(join(mediaPath,match[1],match[2]))){
      throw new Error(`Backup is incomplete: ${row.id} references missing media ${String(variant.src)}.`)
    }
  }
}

mkdirSync(dirname(target),{recursive:true})
const staging=join(dirname(target),`.${basename(target)}.restore-${process.pid}-${Date.now()}`)
try{
  mkdirSync(staging,{recursive:false})
  cpSync(dbPath,join(staging,'cms.sqlite'))
  cpSync(mediaPath,join(staging,'media'),{recursive:true})
  renameSync(staging,target)
  console.log(`Validated CMS restore created at ${target}; point CMS_DB_PATH and CMS_MEDIA_DIR there after review.`)
}catch(error){
  rmSync(staging,{recursive:true,force:true})
  throw error
}
