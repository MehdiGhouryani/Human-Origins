import {spawnSync} from 'node:child_process'
import {DatabaseSync} from 'node:sqlite'
import {mkdtempSync,mkdirSync,rmSync,symlinkSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {afterEach,describe,expect,it} from 'vitest'

const workDirs:string[]=[]
function fixture(variants:unknown[]){
  const root=mkdtempSync(join(tmpdir(),'cms-media-manifest-'))
  workDirs.push(root)
  const dbPath=join(root,'cms.sqlite')
  const mediaRoot=join(root,'media')
  const id='cms-media-test-123'
  mkdirSync(join(mediaRoot,id),{recursive:true})
  writeFileSync(join(mediaRoot,id,'thumbnail.webp'),Buffer.from('fake-webp-thumbnail'))
  writeFileSync(join(mediaRoot,id,'detail.webp'),Buffer.from('unreferenced'))
  mkdirSync(join(mediaRoot,'cms-media-orphan'),{recursive:true})

  const db=new DatabaseSync(dbPath)
  db.exec(`CREATE TABLE media_assets(
    id TEXT PRIMARY KEY,subject_id TEXT,roles TEXT,kind TEXT,file_path TEXT,width INTEGER,height INTEGER,variants TEXT,
    credit TEXT,license TEXT,source_url TEXT,linked_source_id TEXT,note TEXT,alt TEXT,publication_status TEXT,
    rights_status TEXT,status TEXT,is_default INTEGER,slot_id TEXT,evidence_class TEXT,specimen_ref TEXT,assumptions TEXT,
    created_at TEXT,updated_at TEXT
  )`)
  db.prepare(`INSERT INTO media_assets VALUES(
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )`).run(
    id,'erectus',JSON.stringify(['profile-portrait']),'reconstruction',`/cms-media/${id}`,1000,1250,
    JSON.stringify(variants),'Human Origins','CC BY 4.0','https://example.org/source','source-1',
    'Illustrative reconstruction, not a fossil photograph.','Reconstruction of Homo erectus',
    'review-required','unknown','draft',0,'erectus.S02','D','specimen-1','Assumptions sheet',
    '2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z'
  )
  db.close()
  return {root,dbPath,mediaRoot,id}
}
function runExport(f:{dbPath:string;mediaRoot:string}){
  const result=spawnSync(process.execPath,[resolve('scripts/export-cms-media-manifest.mjs')],{
    cwd:process.cwd(),encoding:'utf8',
    env:{...process.env,CMS_DB_PATH:f.dbPath,CMS_MEDIA_DIR:f.mediaRoot},
  })
  return {result,report:JSON.parse(result.stdout)}
}
afterEach(()=>{for(const dir of workDirs.splice(0))rmSync(dir,{recursive:true,force:true})})

describe('CMS media manifest export',()=>{
  it('exports sanitized slot metadata and finds missing, unreferenced and untracked files',()=>{
    const id='cms-media-test-123'
    const f=fixture([
      {purpose:'thumbnail',src:`/cms-media/${id}/thumbnail.webp`,width:320,height:400,format:'webp'},
      {purpose:'icon',src:`/cms-media/${id}/icon.webp`,width:512,height:512,format:'webp'},
    ])
    const {result,report}=runExport(f)
    expect(result.status).toBe(0)
    expect(report.summary).toMatchObject({mediaRecords:1,variantRecords:2,verifiedVariantFiles:1})
    expect(report.media[0]).toMatchObject({
      id,subjectId:'erectus',slotId:'erectus.S02',status:'draft',
      rightsStatus:'unknown',publicationStatus:'review-required',
    })
    expect(report.issues.missingVariantFiles).toEqual([expect.objectContaining({id,file:'icon.webp'})])
    expect(report.issues.unreferencedFiles).toEqual([expect.objectContaining({id,file:'detail.webp'})])
    expect(report.issues.untrackedDirectories).toContain('cms-media-orphan')
    expect(result.stderr).toContain('No files changed')
    expect(report.media[0]).not.toHaveProperty('review')
    expect(report.media[0]).not.toHaveProperty('generator')
  })

  it('does not traverse a symlinked media directory',()=>{
    const id='cms-media-link-123'
    const f=fixture([
      {purpose:'thumbnail',src:`/cms-media/${id}/thumbnail.webp`,width:320,height:400,format:'webp'},
    ])
    const outside=join(f.root,'outside-media')
    mkdirSync(outside)
    writeFileSync(join(outside,'thumbnail.webp'),Buffer.from('must-not-be-followed'))
    symlinkSync(outside,join(f.mediaRoot,id),'dir')
    const db=new DatabaseSync(f.dbPath)
    db.prepare(`INSERT INTO media_assets VALUES(
      ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
    )`).run(
      id,'afarensis',JSON.stringify(['profile-portrait']),'reconstruction',`/cms-media/${id}`,320,400,
      JSON.stringify([{purpose:'thumbnail',src:`/cms-media/${id}/thumbnail.webp`,width:320,height:400,format:'webp'}]),
      'Human Origins','CC BY 4.0','https://example.org/source','source-2',
      'Draft only.','Symlink test image','review-required','unknown','draft',0,'afarensis.S02','D','specimen-2','Assumptions',
      '2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z'
    )
    db.close()

    const {result,report}=runExport(f)
    expect(result.status).toBe(0)
    expect(report.issues.unsupportedMediaRootEntries).toContainEqual(expect.objectContaining({name:id}))
    expect(report.issues.missingVariantFiles).toContainEqual(expect.objectContaining({id,file:'thumbnail.webp'}))
    expect(report.issues.unreferencedFiles.some((item:{id:string})=>item.id===id)).toBe(false)
  })

  it('rejects variant paths that do not belong to the media record',()=>{
    const id='cms-media-test-123'
    const f=fixture([{purpose:'detail',src:`/cms-media/${id}/../../cms.sqlite`,width:640,height:800,format:'webp'}])
    const {result,report}=runExport(f)
    expect(result.status).toBe(0)
    expect(report.issues.invalidVariantPaths).toEqual([
      expect.objectContaining({id,src:`/cms-media/${id}/../../cms.sqlite`}),
    ])
    expect(report.summary.verifiedVariantFiles).toBe(0)
  })
})
