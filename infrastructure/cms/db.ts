import 'server-only'
import {DatabaseSync} from 'node:sqlite'
import {mkdirSync} from 'node:fs'
import {dirname,join} from 'node:path'

const DB_PATH=process.env.CMS_DB_PATH ?? join(process.cwd(),'.cms-data','cms.sqlite')

let instance:DatabaseSync|undefined

function migrate(db:DatabaseSync){
  db.exec(`
    CREATE TABLE IF NOT EXISTS media_assets(
      id TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      roles TEXT NOT NULL,
      kind TEXT NOT NULL,
      file_path TEXT NOT NULL,
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      variants TEXT NOT NULL DEFAULT '[]',
      credit TEXT NOT NULL DEFAULT '',
      license TEXT,
      source_url TEXT NOT NULL DEFAULT '',
      linked_source_id TEXT,
      note TEXT NOT NULL DEFAULT '',
      alt TEXT NOT NULL DEFAULT '',
      publication_status TEXT NOT NULL DEFAULT 'review-required',
      rights_status TEXT NOT NULL DEFAULT 'unknown',
      status TEXT NOT NULL DEFAULT 'draft',
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS copy_blocks(
      slot_id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      published_value TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS revisions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_sessions(
      token TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      password_version TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS graph_configs(
      id TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      published_value TEXT,
      updated_at TEXT NOT NULL
    );
  `)
  // CREATE TABLE IF NOT EXISTS never alters an existing table, so columns added after the first release need an explicit, idempotent migration.
  const columns=(db.prepare('PRAGMA table_info(media_assets)').all() as {name:string}[]).map(column=>column.name)
  if(!columns.includes('variants')) db.exec("ALTER TABLE media_assets ADD COLUMN variants TEXT NOT NULL DEFAULT '[]'")
  // Scientific-image metadata: slot, evidence class, specimen, assumptions sheet, generator, review.
  const scientificColumns:[string,string][]=[['slot_id','TEXT'],['evidence_class','TEXT'],['specimen_ref',"TEXT NOT NULL DEFAULT ''"],['assumptions',"TEXT NOT NULL DEFAULT ''"],['generator','TEXT'],['reviewed_by','TEXT']]
  for(const [name,type] of scientificColumns) if(!columns.includes(name)) db.exec(`ALTER TABLE media_assets ADD COLUMN ${name} ${type}`)
  db.exec('CREATE INDEX IF NOT EXISTS idx_media_slot ON media_assets(slot_id)')
  const sessionColumns=(db.prepare('PRAGMA table_info(admin_sessions)').all() as {name:string}[]).map(column=>column.name)
  if(!sessionColumns.includes('password_version')) db.exec("ALTER TABLE admin_sessions ADD COLUMN password_version TEXT NOT NULL DEFAULT ''")
  // 0.32: copy and graph keep the LIVE value apart from the working draft. Before this, saving a draft overwrote the
  // single value and reset the status, so editing a live heading or the live graph silently took it off the site.
  // Rows that were published before the migration keep being served: their value is copied into published_value.
  for(const table of ['copy_blocks','graph_configs']){
    const tableColumns=(db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(column=>column.name)
    if(!tableColumns.includes('published_value')){
      db.exec(`ALTER TABLE ${table} ADD COLUMN published_value TEXT`)
      db.exec(`UPDATE ${table} SET published_value=value WHERE status='published'`)
    }
  }
}

/** Opens (creating on first use) the CMS's local SQLite database. A single lazily-created connection is reused for the life of the server process. */
export function getDb():DatabaseSync{
  if(instance) return instance
  mkdirSync(dirname(DB_PATH),{recursive:true})
  const db=new DatabaseSync(DB_PATH)
  db.exec('PRAGMA journal_mode = WAL;')
  migrate(db)
  instance=db
  return db
}

let transactionDepth=0

/**
 * Runs `work` inside one SQLite transaction (row + revision + slot changes commit or roll back together).
 * Nested calls join the outer transaction instead of opening a new one.
 */
export function transaction<T>(work:()=>T):T{
  const db=getDb()
  if(transactionDepth>0) return work()
  db.exec('BEGIN IMMEDIATE')
  transactionDepth+=1
  try{
    const result=work()
    db.exec('COMMIT')
    return result
  }catch(error){
    try{ db.exec('ROLLBACK') }catch{ /* connection already rolled back */ }
    throw error
  }finally{
    transactionDepth-=1
  }
}

export function recordRevision(entityType:string,entityId:string,action:string,summary:string):void{
  getDb().prepare('INSERT INTO revisions(entity_type,entity_id,action,summary,created_at) VALUES (?,?,?,?,?)')
    .run(entityType,entityId,action,summary,new Date().toISOString())
}
