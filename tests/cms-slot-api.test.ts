import {afterAll,describe,expect,it,vi} from 'vitest'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import sharp from 'sharp'

const workDir=mkdtempSync(join(tmpdir(),'cms-slot-api-'))
process.env.CMS_DB_PATH=join(workDir,'cms.sqlite')
process.env.CMS_MEDIA_DIR=join(workDir,'media')

const session=vi.hoisted(()=>({valid:true}))
vi.mock('../infrastructure/cms/requireSession',()=>({hasValidSession:async()=>session.valid,requireAdminSession:async()=>undefined}))

const {POST}=await import('../app/api/admin/media/route')
const {PATCH}=await import('../app/api/admin/media/[id]/route')
const store=await import('../infrastructure/cms/store')
const {getLiveContent}=await import('../infrastructure/cms/live')
const {resolveSlots}=await import('../features/explorer/slots')
const {MEDIA_SLOTS}=await import('../content/media-slots.generated')
const {buildExplorerBootstrap}=await import('../features/explorer/bootstrap')
const {getExplorerMediaForTaxon}=await import('../features/explorer/selectors')

const picture=async(width:number,height:number)=>sharp({create:{width,height,channels:3,background:'#8a7a6a'}}).jpeg().toBuffer()
const D_FIELDS={
  alt:'Reconstruction of an adult male Australopithecus afarensis',note:'Reconstruction from AL 444-2; hair and skin colour are convention.',credit:'Test Artist',license:'CC BY 4.0',
  publicationStatus:'approved',rightsStatus:'clear',specimenRef:'AL 444-2',assumptions:'Bone-anchored: brow, jaw, face projection. Convention: skin, hair, eye colour.',
  generator:JSON.stringify({name:'Test Artist',version:'',date:'2026-10-06'}),
}
async function upload(slotId:string,subjectId:string,fields:Record<string,string>,size:[number,number]=[1200,800]){
  const form=new FormData()
  form.set('file',new File([new Uint8Array(await picture(...size))],'upload.jpg',{type:'image/jpeg'}))
  form.set('subjectId',subjectId); form.set('slotId',slotId)
  for(const [key,value] of Object.entries(fields)) form.set(key,value)
  return POST(new Request('http://localhost/api/admin/media',{method:'POST',body:form}))
}
const patch=(id:string,body:unknown)=>PATCH(new Request(`http://localhost/api/admin/media/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),{params:Promise.resolve({id})})

describe('admin API: uploading to a named slot',()=>{
  afterAll(()=>{ rmSync(workDir,{recursive:true,force:true}) })

  it('rejects uploads without a session',async()=>{
    session.valid=false
    expect((await upload('afarensis.S02','afarensis',D_FIELDS)).status).toBe(401)
    session.valid=true
  })

  it('crops to the slot ratio, derives role, kind and class from the slot, and stores the scientific fields',async()=>{
    const res=await upload('afarensis.S02','afarensis',D_FIELDS)
    expect(res.status).toBe(201)
    const {media}=await res.json() as {media:{id:string;width:number;height:number;roles:string[];kind:string;evidenceClass:string;slotId:string;status:string;generator:{name:string}}}
    // 1200×800 landscape cropped to 4:5 → 640×800
    expect(media.width).toBe(640)
    expect(media.height).toBe(800)
    expect(media.roles).toContain('profile-portrait')
    expect(media.kind).toBe('reconstruction')
    expect(media.evidenceClass).toBe('D')
    expect(media.slotId).toBe('afarensis.S02')
    expect(media.status).toBe('draft')
    expect(media.generator.name).toBe('Test Artist')
  })

  it('does not crop vector slots and leaves matching ratios alone',async()=>{
    const diagram=await upload('afarensis.S08','afarensis',{...D_FIELDS,assumptions:'',generator:'',specimenRef:'',license:'CC BY 4.0'},[900,500])
    expect(diagram.status).toBe(201)
    const {media}=await diagram.json() as {media:{width:number;height:number;evidenceClass:string}}
    expect([media.width,media.height]).toEqual([900,500])
    expect(media.evidenceClass).toBe('B')
    const exact=await upload('afarensis.S03','afarensis',D_FIELDS,[1600,900])
    const exactMedia=(await exact.json() as {media:{width:number;height:number}}).media
    expect([exactMedia.width,exactMedia.height]).toEqual([1600,900])
  })

  it('refuses closed, unknown and foreign slots',async()=>{
    expect((await upload('orrin.S02','orrin',D_FIELDS)).status).toBe(400)            // on hold
    expect((await upload('sahelanthropus.L1','sahelanthropus',D_FIELDS)).status).toBe(400) // not applicable
    expect((await upload('nope.S02','afarensis',D_FIELDS)).status).toBe(400)           // unknown
    expect((await upload('afarensis.S02','sapiens',D_FIELDS)).status).toBe(400)        // another taxon
  })

  it('publishes a reconstruction only after a reviewer approved it, then shows it in the slot',async()=>{
    const created=await upload('afarensis.S10','afarensis',{...D_FIELDS,alt:'Habitat of Australopithecus afarensis'},[1920,1080])
    const {media}=await created.json() as {media:{id:string}}
    const blocked=await patch(media.id,{status:'published'})
    expect(blocked.status).toBe(422)
    const report=(await blocked.json() as {report:{issues:{code:string}[]}}).report
    expect(report.issues.map(issue=>issue.code)).toContain('SLOT_D_UNREVIEWED')
    expect(store.getMedia(media.id)!.status).toBe('draft')

    const reviewed=await patch(media.id,{review:{reviewer:'Dr Example',date:'2026-10-07',decision:'approve'}})
    expect(reviewed.status).toBe(200)
    const published=await patch(media.id,{status:'published'})
    expect(published.status).toBe(200)

    const live=getLiveContent()
    const bootstrap=buildExplorerBootstrap(live.catalog,live.copy,live.graphConfig)
    const states=resolveSlots({slots:MEDIA_SLOTS,media:getExplorerMediaForTaxon(bootstrap,'afarensis'),taxonId:'afarensis',adminPreview:false})
    expect(live.catalog.media.some(item=>String(item.id)===media.id)).toBe(true)
    const habitat=states.find(state=>String(state.slot.id)==='afarensis.S10')!
    expect(habitat.visibility).toBe('show')
    expect(habitat.source).toBe('cms')
  })

  it('takes the previous image offline when a replacement is published',async()=>{
    const first=(await (await upload('afarensis.S10','afarensis',D_FIELDS,[1920,1080])).json() as {media:{id:string}}).media.id
    await patch(first,{review:{reviewer:'Dr Example',date:'2026-10-07',decision:'approve'},alt:'Second habitat'})
    expect((await patch(first,{status:'published'})).status).toBe(200)
    expect(store.getMedia(first)!.status).toBe('published')
    const previous=store.listMedia().filter(item=>item.slotId==='afarensis.S10'&&item.id!==first&&item.status==='published')
    expect(previous).toHaveLength(0)
  })

  it('validates generator and review input',async()=>{
    const bad=await upload('afarensis.S11','afarensis',{...D_FIELDS,generator:JSON.stringify({name:'x',version:'',date:'06/10/2026'})},[1600,1200])
    expect(bad.status).toBe(400)
  })
})
