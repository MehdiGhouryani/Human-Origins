import {afterAll,describe,expect,it} from 'vitest'
import {mkdtempSync,rmSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import sharp from 'sharp'

// Must be set before the db module is first imported: it reads CMS_DB_PATH at load time.
const workDir=mkdtempSync(join(tmpdir(),'cms-test-'))
process.env.CMS_DB_PATH=join(workDir,'cms.sqlite')
process.env.CMS_MEDIA_DIR=join(workDir,'media')

const {contentCatalog}=await import('../content/catalog')
const store=await import('../infrastructure/cms/store')
const {validateWithPendingMedia,validateCurrentlyPublished}=await import('../infrastructure/cms/validate')
const {processUploadedImage,InvalidImageError,deleteProcessedImage,CMS_MEDIA_DIR}=await import('../infrastructure/cms/assets')
const {resolveMediaFile}=await import('../infrastructure/cms/mediaFiles')
const {getLiveContent}=await import('../infrastructure/cms/live')
const auth=await import('../infrastructure/cms/auth')
const {getDb}=await import('../infrastructure/cms/db')
const {buildExplorerBootstrap}=await import('../features/explorer/bootstrap')
const {copyRegistry,getCopy}=await import('../content/copy-registry')

const validInput=(id:string,overrides:Record<string,unknown>={})=>({
  id,subjectId:'sapiens',roles:['gallery'] as never,kind:'specimen-photo' as const,filePath:`/cms-media/${id}`,width:800,height:600,variants:[{purpose:'thumbnail' as const,src:`/cms-media/${id}/thumbnail.webp`,width:320,height:240,format:'webp' as const}],
  credit:'Test photographer',license:'CC BY 4.0',sourceUrl:'',linkedSourceId:null,note:'Test photograph of a cast.',alt:'A cast of a skull on a table',
  publicationStatus:'approved' as const,rightsStatus:'clear' as const,isDefault:false,...overrides,
})

describe('CMS',()=>{
  const uploadedIds:string[]=[]
  afterAll(()=>{ for(const id of uploadedIds) deleteProcessedImage(id); rmSync(workDir,{recursive:true,force:true}) })

  it('starts with no published CMS content and serves the built-in catalog untouched',()=>{
    const live=getLiveContent()
    expect(live.source).toBe('built-in')
    expect(live.catalog).toBe(contentCatalog)
    expect(validateCurrentlyPublished().ok).toBe(true)
  })

  it('keeps drafts invisible: a draft row never reaches the live catalog',()=>{
    store.createMedia(validInput('cms-media-draft-a'))
    expect(store.getMedia('cms-media-draft-a')?.status).toBe('draft')
    expect(getLiveContent().source).toBe('built-in')
  })

  it('publishes a valid item into the live catalog and taxon, and marks it default when asked',()=>{
    store.createMedia(validInput('cms-media-pub-a',{isDefault:true}))
    expect(validateWithPendingMedia([{...store.getMedia('cms-media-pub-a')!,status:'published'}]).ok).toBe(true)
    store.setMediaStatus('cms-media-pub-a','published')
    const live=getLiveContent()
    expect(live.source).toBe('cms')
    const taxon=live.catalog.taxa.find(t=>String(t.id)==='sapiens')!
    expect(taxon.mediaIds.map(String)).toContain('cms-media-pub-a')
    expect(String(taxon.defaultMediaId)).toBe('cms-media-pub-a')
    expect(live.catalog.media.some(m=>String(m.id)==='cms-media-pub-a')).toBe(true)
    // the built-in base catalog object must not have been mutated by the merge
    expect(contentCatalog.taxa.find(t=>String(t.id)==='sapiens')!.mediaIds.map(String)).not.toContain('cms-media-pub-a')
  })

  it('flows published media all the way through the explorer bootstrap',()=>{
    const live=getLiveContent()
    const bootstrap=buildExplorerBootstrap(live.catalog,live.copy)
    const sapiens=bootstrap.species.find(s=>s.id==='sapiens')!
    expect(sapiens.media.some(m=>String(m.id)==='cms-media-pub-a')).toBe(true)
    expect(sapiens.defaultMediaId).toBe('cms-media-pub-a')
  })

  it('rejects publishing an item the project audit considers invalid, with specific reasons',()=>{
    store.createMedia(validInput('cms-media-bad-a',{alt:'   ',note:'',publicationStatus:'approved',license:null,sourceUrl:''}))
    const report=validateWithPendingMedia([{...store.getMedia('cms-media-bad-a')!,status:'published'}])
    expect(report.ok).toBe(false)
    const codes=report.issues.filter(i=>i.severity==='error').map(i=>i.code)
    expect(codes.length).toBeGreaterThan(0)
  })

  it('rejects a reconstruction that does not disclose it is a reconstruction',()=>{
    store.createMedia(validInput('cms-media-recon-a',{kind:'reconstruction',alt:'A face',note:'Nice picture.'}))
    const report=validateWithPendingMedia([{...store.getMedia('cms-media-recon-a')!,status:'published'}])
    expect(report.ok).toBe(false)
  })

  it('omits only the invalid published row, keeps valid published content live, and reports the rejection (defense in depth)',()=>{
    // Simulate a hand-edited database: force an invalid row straight to published, bypassing the API gate.
    store.createMedia(validInput('cms-media-tamper-a',{alt:'   ',license:null}))
    store.setMediaStatus('cms-media-tamper-a','published')
    const live=getLiveContent()
    // Valid published media (cms-media-pub-a) must survive; the tampered row alone is dropped.
    expect(live.source).toBe('cms')
    expect(live.catalog.media.some(m=>String(m.id)==='cms-media-pub-a')).toBe(true)
    expect(live.catalog.media.some(m=>String(m.id)==='cms-media-tamper-a')).toBe(false)
    expect(live.rejectedMedia.map(r=>r.id)).toContain('cms-media-tamper-a')
    expect(live.rejectedMedia.find(r=>r.id==='cms-media-tamper-a')!.issues.length).toBeGreaterThan(0)
    store.setMediaStatus('cms-media-tamper-a','draft')
    const after=getLiveContent()
    expect(after.source).toBe('cms')
    expect(after.rejectedMedia.map(r=>r.id)).not.toContain('cms-media-tamper-a')
  })

  it('applies published copy and restores the built-in wording when unpublished',()=>{
    store.upsertCopy('hero.tagline','A brand new tagline')
    expect(getCopy(getLiveContent().copy,'hero.tagline')).toBe(copyRegistry.find(s=>s.id==='hero.tagline')!.defaultValue)
    store.setCopyStatus('hero.tagline','published')
    expect(getCopy(getLiveContent().copy,'hero.tagline')).toBe('A brand new tagline')
    store.setCopyStatus('hero.tagline','draft')
    expect(getCopy(getLiveContent().copy,'hero.tagline')).toBe(copyRegistry.find(s=>s.id==='hero.tagline')!.defaultValue)
  })

  it('getCopy throws on an unknown slot so typos cannot silently render nothing',()=>{
    expect(()=>getCopy({},'nope.slot')).toThrow()
  })

  it('records every change in the revision history',()=>{
    const actions=store.listRevisions().map(r=>`${r.entityType}:${r.action}`)
    expect(actions).toContain('media:created')
    expect(actions).toContain('media:published')
    expect(actions).toContain('copy:updated')
  })

  it('processes a real uploaded image into web-served WebP variants and strips unsafe input',async()=>{
    const png=await sharp({create:{width:1000,height:700,channels:3,background:{r:40,g:120,b:90}}}).png().toBuffer()
    const id='cms-media-img-test'; uploadedIds.push(id)
    const result=await processUploadedImage(id,png)
    expect(result.width).toBe(1000); expect(result.height).toBe(700)
    expect(result.variants.length).toBeGreaterThanOrEqual(2)
    for(const v of result.variants){
      expect(v.format).toBe('webp'); expect(v.src.startsWith('/cms-media/')).toBe(true)
      expect(existsSync(join(CMS_MEDIA_DIR,v.src.replace('/cms-media/','')))).toBe(true)
    }
    await expect(processUploadedImage('cms-media-junk',Buffer.from('this is not an image'))).rejects.toBeInstanceOf(InvalidImageError)
    await expect(processUploadedImage('cms-media-empty',Buffer.alloc(0))).rejects.toBeInstanceOf(InvalidImageError)
  })

  it('declares only variants that exist on disk, with real dimensions (regression: small uploads skip the largest size)',async()=>{
    const small=await sharp({create:{width:900,height:600,channels:3,background:{r:200,g:120,b:40}}}).jpeg().toBuffer() // narrower than the 1400px detail size
    const id='cms-media-small-variants'; uploadedIds.push(id)
    const processed=await processUploadedImage(id,small)
    expect(processed.variants.map(v=>v.purpose)).not.toContain('detail')
    store.createMedia(validInput(id,{width:processed.width,height:processed.height,variants:processed.variants,filePath:`/cms-media/${id}`}))
    store.setMediaStatus(id,'published')
    const live=getLiveContent()
    const asset=live.catalog.media.find(m=>String(m.id)===id)!
    expect(asset.variants.length).toBe(processed.variants.length)
    for(const variant of asset.variants){
      expect(existsSync(join(CMS_MEDIA_DIR,variant.src.replace('/cms-media/','')))).toBe(true)
      const meta=await sharp(join(CMS_MEDIA_DIR,variant.src.replace('/cms-media/',''))).metadata()
      expect(variant.width).toBe(meta.width); expect(variant.height).toBe(meta.height)
    }
    expect(existsSync(join(CMS_MEDIA_DIR,asset.src.replace('/cms-media/','')))).toBe(true)
    store.deleteMedia(id)
  })

  it('stores upright dimensions for EXIF-rotated portrait photos',async()=>{
    const oriented=await sharp({create:{width:300,height:500,channels:3,background:{r:100,g:80,b:20}}}).jpeg().withMetadata({orientation:6}).toBuffer()
    const id='cms-media-exif-orientation';uploadedIds.push(id)
    const processed=await processUploadedImage(id,oriented)
    expect(processed.width).toBe(500)
    expect(processed.height).toBe(300)
    const thumb=processed.variants.find(variant=>variant.purpose==='thumbnail')
    expect(thumb?.width).toBe(320)
    expect(thumb?.height).toBe(192)
  })

  it('resolves media files only for valid ids/names and never escapes the media directory',async()=>{
    const id='cms-media-resolve-test'; uploadedIds.push(id)
    await processUploadedImage(id,await sharp({create:{width:700,height:500,channels:3,background:{r:9,g:99,b:99}}}).png().toBuffer())
    expect(resolveMediaFile(id,'thumbnail.webp')).toBeDefined()
    expect(resolveMediaFile(id,'card.webp')).toBeDefined()
    for(const [badId,badFile] of [['..','thumbnail.webp'],[id,'../cms.sqlite'],[id,'..%2Fcms.sqlite'],[id,'/etc/passwd'],[id,'thumbnail.png'],['cms-media-missing','card.webp'],['cms-media-../x','card.webp'],[id,'']] as const){
      expect(resolveMediaFile(badId,badFile)).toBeUndefined()
    }
  })

  it('authenticates with timing-safe password compare and expiring sessions',()=>{
    const previous=process.env.CMS_ADMIN_PASSWORD
    process.env.CMS_ADMIN_PASSWORD='correct horse battery staple'
    try{
      expect(auth.verifyPassword('wrong')).toBe(false)
      expect(auth.verifyPassword('correct horse battery staple')).toBe(true)
      const {token}=auth.createSession()
      expect(auth.isSessionValid(token)).toBe(true)
      const tokenHash=createHash('sha256').update(token,'utf8').digest('hex')
      const stored=getDb().prepare('SELECT token FROM admin_sessions WHERE token=?').get(tokenHash) as {token:string}|undefined
      expect(stored?.token).toBe(tokenHash)
      process.env.CMS_ADMIN_PASSWORD='a different secret'
      expect(auth.isSessionValid(token)).toBe(false)
      process.env.CMS_ADMIN_PASSWORD='correct horse battery staple'
      expect(auth.isSessionValid('deadbeef')).toBe(false)
      expect(auth.isSessionValid(undefined)).toBe(false)
      auth.destroySession(token)
      expect(auth.isSessionValid(token)).toBe(false)
    }finally{ if(previous===undefined) delete process.env.CMS_ADMIN_PASSWORD; else process.env.CMS_ADMIN_PASSWORD=previous }
  })

  it('deleting media removes it from the live catalog',()=>{
    store.deleteMedia('cms-media-pub-a')
    const live=getLiveContent()
    expect(live.catalog.media.some(m=>String(m.id)==='cms-media-pub-a')).toBe(false)
  })
})
