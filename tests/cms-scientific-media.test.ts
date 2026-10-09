import {afterAll,describe,expect,it} from 'vitest'
import type {MediaAsset} from '../domain/contracts'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

// Must be set before the db module is first imported.
const workDir=mkdtempSync(join(tmpdir(),'cms-sci-test-'))
process.env.CMS_DB_PATH=join(workDir,'cms.sqlite')
process.env.CMS_MEDIA_DIR=join(workDir,'media')

const store=await import('../infrastructure/cms/store')
const {validateWithPendingMedia}=await import('../infrastructure/cms/validate')
const {getLiveContent}=await import('../infrastructure/cms/live')
const input=await import('../infrastructure/cms/mediaInput')
const {MEDIA_SLOTS}=await import('../content/media-slots.generated')
const {findSlot,validateSlotMedia,evidenceClassLabel}=await import('../domain/media-slots')
const {asMediaAssetId,asMediaSlotId,asTaxonId}=await import('../domain/ids')

const base=(id:string,overrides:Record<string,unknown>={})=>({
  id,subjectId:'afarensis',roles:['gallery'] as never,kind:'specimen-photo' as const,filePath:`/cms-media/${id}`,width:1000,height:1250,
  variants:[{purpose:'thumbnail' as const,src:`/cms-media/${id}/thumbnail.webp`,width:320,height:400}] as never,
  credit:'Test credit',license:'CC BY 4.0',sourceUrl:'',linkedSourceId:null,note:'Reconstruction based on AL 444-2; hair and skin colour are convention.',alt:'Reconstruction of an adult male Australopithecus afarensis',
  publicationStatus:'approved' as const,rightsStatus:'clear' as const,isDefault:false,...overrides,
})
const draftD={assumptions:'Bone-anchored: brow, jaw, face projection. Convention: skin, hair, eye colour.',generator:{name:'ChatGPT image generation',version:'2026-10',date:'2026-10-06'}}
const approve={reviewer:'Dr Example',date:'2026-10-07',decision:'approve' as const}

const asset=(overrides:Partial<MediaAsset>):MediaAsset=>({
  id:asMediaAssetId('x-media'),subject:{type:'taxon',id:asTaxonId('afarensis')},roles:['profile-portrait'],kind:'reconstruction',src:'/cms-media/x/card.webp',sourceUrl:'',
  credit:'c',license:'CC BY 4.0',note:'Reconstruction.',alt:'a',publicationStatus:'approved',rightsStatus:'clear',variants:[],sourceLinks:[],
  slotId:asMediaSlotId('afarensis.S02'),evidenceClass:'D',assumptions:draftD.assumptions,generator:draftD.generator,review:approve,...overrides,
})

describe('slot input parsing',()=>{
  it('accepts open slots and clears on empty',()=>{
    expect(input.parseSlotId('afarensis.S02')).toBe('afarensis.S02')
    expect(input.parseSlotId('')).toBeNull()
    expect(input.parseSlotId(null)).toBeNull()
  })
  it('rejects unknown, not-applicable and on-hold slots with a reason',()=>{
    expect(()=>input.parseSlotId('nope.S02')).toThrow(/Unknown image slot/)
    expect(()=>input.parseSlotId('sahelanthropus.L1')).toThrow(/not applicable/)
    expect(()=>input.parseSlotId('orrin.S02')).toThrow(/on hold/)
    expect(()=>input.parseSlotId('heidelbergensis.S04')).toThrow(/on hold/)
    expect(()=>input.parseSlotId(5)).toThrow()
  })
  it('parses generator and review strictly',()=>{
    expect(input.parseGenerator(null)).toBeNull()
    expect(input.parseGenerator(JSON.stringify(draftD.generator))).toEqual(draftD.generator)
    expect(()=>input.parseGenerator({name:'',version:'1',date:'2026-10-06'})).toThrow(/name/)
    expect(()=>input.parseGenerator({name:'x',version:'1',date:'06/10/2026'})).toThrow(/date/)
    expect(()=>input.parseGenerator({name:'x',version:'1',date:'2026-02-31'})).toThrow(/date/)
    expect(()=>input.parseGenerator('{broken')).toThrow(/JSON/)
    expect(input.parseReview(approve)).toEqual(approve)
    expect(()=>input.parseReview({...approve,decision:'maybe'})).toThrow(/decision/)
    expect(()=>input.parseReview({...approve,reviewer:''})).toThrow(/Reviewer/)
    expect(()=>input.parseAssumptions('x'.repeat(3001))).toThrow(/too long/)
  })
  it('resolves a slot assignment: adds the role, fixes the class, repairs the kind, refuses another taxon',()=>{
    const a=input.resolveSlotAssignment('afarensis.S02','afarensis',['gallery'],'specimen-photo')
    expect(a.roles).toEqual(['gallery','profile-portrait'])
    expect(a.kind).toBe('reconstruction')
    expect(a.evidenceClass).toBe('D')
    expect(input.resolveSlotAssignment('afarensis.S04','afarensis',[],'cast-photo').kind).toBe('cast-photo')
    expect(()=>input.resolveSlotAssignment('afarensis.S02','sapiens',[],undefined)).toThrow(/belongs to afarensis/)
    expect(()=>input.resolveSlotAssignment('orrin.S02','orrin',[],undefined)).toThrow(/cannot be filled/)
  })
  it('lets a patch assign a slot and clearing it clears the class',()=>{
    const patch=input.parseMediaPatch({slotId:'afarensis.S02',specimenRef:'AL 444-2'},new Set(['afarensis']),new Set())
    expect(patch.slotId).toBe('afarensis.S02')
    expect(patch.specimenRef).toBe('AL 444-2')
    expect(input.parseMediaPatch({slotId:null},new Set(),new Set()).evidenceClass).toBeNull()
  })
})

describe('slot publishing rules',()=>{
  const slot=(code:string)=>findSlot(MEDIA_SLOTS,code)
  const codes=(media:MediaAsset)=>validateSlotMedia(media,slot(String(media.slotId))).map(v=>v.code)

  it('accepts a complete, reviewed class-D reconstruction',()=>{
    expect(codes(asset({}))).toEqual([])
  })
  it('refuses class D without assumptions, generator or an approving review',()=>{
    expect(codes(asset({assumptions:''}))).toContain('SLOT_D_ASSUMPTIONS')
    expect(codes(asset({generator:undefined}))).toContain('SLOT_D_GENERATOR')
    expect(codes(asset({review:undefined}))).toContain('SLOT_D_UNREVIEWED')
    expect(codes(asset({review:{...approve,decision:'revise'}}))).toContain('SLOT_D_UNREVIEWED')
    expect(codes(asset({review:{...approve,decision:'reject'}}))).toContain('SLOT_D_UNREVIEWED')
  })
  it('keeps class and kind tied to the slot',()=>{
    expect(codes(asset({evidenceClass:'C'}))).toContain('SLOT_CLASS_MISMATCH')
    expect(codes(asset({kind:'specimen-photo'}))).toContain('SLOT_KIND_MISMATCH')
    expect(codes(asset({roles:['gallery']}))).toContain('SLOT_ROLE_MISSING')
    expect(codes(asset({subject:{type:'taxon',id:asTaxonId('sapiens')}}))).toContain('SLOT_SUBJECT_MISMATCH')
  })
  it('requires specimen, licence, credit and clear rights for class C',()=>{
    const c=asset({slotId:asMediaSlotId('afarensis.S04'),evidenceClass:'C',kind:'specimen-photo',roles:['specimen-reference'],specimenRef:'AL 444-2 cranium, lateral view',assumptions:undefined,generator:undefined,review:undefined})
    expect(codes(c)).toEqual([])
    expect(codes({...c,specimenRef:''})).toContain('SLOT_C_SPECIMEN_REF')
    expect(codes({...c,license:undefined})).toContain('SLOT_C_LICENSE')
    expect(codes({...c,credit:''})).toContain('SLOT_C_CREDIT')
    expect(codes({...c,rightsStatus:'unknown'})).toContain('SLOT_C_RIGHTS')
    expect(codes({...c,rightsStatus:'review-required'})).toContain('SLOT_C_RIGHTS')
  })
  it('requires the input licence for class B and nothing extra for class A',()=>{
    const b=asset({slotId:asMediaSlotId('afarensis.S08'),evidenceClass:'B',kind:'context-schematic',roles:['anatomy-plate'],assumptions:undefined,generator:undefined,review:undefined})
    expect(codes(b)).toEqual([])
    expect(codes({...b,license:undefined})).toContain('SLOT_B_LICENSE')
    const a=asset({slotId:asMediaSlotId('afarensis.S09'),evidenceClass:'A',kind:'context-schematic',roles:['scale-reference'],license:undefined,assumptions:undefined,generator:undefined,review:undefined})
    expect(codes(a)).toEqual([])
  })
  it('refuses closed slots and unknown slots',()=>{
    expect(validateSlotMedia(asset({slotId:asMediaSlotId('sahelanthropus.L1')}),slot('sahelanthropus.L1')).map(v=>v.code)).toContain('SLOT_NOT_APPLICABLE')
    expect(validateSlotMedia(asset({slotId:asMediaSlotId('orrin.S02'),subject:{type:'taxon',id:asTaxonId('orrin')}}),slot('orrin.S02')).map(v=>v.code)).toContain('SLOT_ON_HOLD')
    expect(validateSlotMedia(asset({}),undefined).map(v=>v.code)).toEqual(['SLOT_UNKNOWN'])
  })
  it('labels evidence classes for the public page',()=>{
    expect(evidenceClassLabel('D')).toBe('Reconstruction')
    expect(evidenceClassLabel('C')).toBe('Specimen photograph')
  })
})

describe('CMS: slots end to end (store + release audit)',()=>{
  afterAll(()=>{ rmSync(workDir,{recursive:true,force:true}) })

  const portrait=(id:string,overrides:Record<string,unknown>={})=>base(id,{slotId:'afarensis.S02',roles:['profile-portrait'],kind:'reconstruction',evidenceClass:'D',...draftD,...overrides})

  it('refuses to publish an unreviewed class-D image, and publishes it once approved',()=>{
    store.createMedia(portrait('cms-media-d-1'))
    const unreviewed=validateWithPendingMedia([{...store.getMedia('cms-media-d-1')!,status:'published'}])
    expect(unreviewed.ok).toBe(false)
    expect(unreviewed.issues.map(i=>i.code)).toContain('SLOT_D_UNREVIEWED')

    store.updateMedia('cms-media-d-1',{review:approve})
    const reviewed=validateWithPendingMedia([{...store.getMedia('cms-media-d-1')!,status:'published'}])
    expect(reviewed.issues.filter(i=>i.severity==='error')).toEqual([])
    store.setMediaStatus('cms-media-d-1','published')

    const live=getLiveContent()
    const media=live.catalog.media.find(item=>String(item.id)==='cms-media-d-1')!
    expect(String(media.slotId)).toBe('afarensis.S02')
    expect(media.evidenceClass).toBe('D')
    expect(media.review?.decision).toBe('approve')
    expect(media.generator?.name).toBe('ChatGPT image generation')
    expect(media.assumptions).toContain('Bone-anchored')
  })

  it('keeps at most one live image per slot: publishing a replacement demotes the previous one',()=>{
    store.createMedia(portrait('cms-media-d-2',{review:approve}))
    expect(store.getMedia('cms-media-d-1')!.status).toBe('published')
    store.setMediaStatus('cms-media-d-2','published')
    expect(store.getMedia('cms-media-d-2')!.status).toBe('published')
    expect(store.getMedia('cms-media-d-1')!.status).toBe('draft')
    const live=getLiveContent().catalog.media.filter(item=>String(item.slotId??'')==='afarensis.S02')
    expect(live.map(item=>String(item.id))).toEqual(['cms-media-d-2'])
  })

  it('does not let a draft displace a live slot occupant',()=>{
    store.createMedia(portrait('cms-media-d-3',{review:approve}))
    expect(store.getMedia('cms-media-d-2')!.status).toBe('published')
    expect(store.getMedia('cms-media-d-3')!.status).toBe('draft')
  })

  it('does not need a textual label on a slot reconstruction (the page labels it by class), but keeps the rule for free images',()=>{
    store.createMedia(portrait('cms-media-label-slot',{review:approve,note:'Habitat plate.',alt:'Habitat'}))
    const slotReport=validateWithPendingMedia([{...store.getMedia('cms-media-label-slot')!,status:'published'}])
    expect(slotReport.issues.map(i=>i.code)).not.toContain('UNLABELED_RECONSTRUCTION')
    store.createMedia(base('cms-media-label-free',{kind:'reconstruction',note:'Plain note.',alt:'Plain alt.',roles:['gallery']}))
    const freeReport=validateWithPendingMedia([{...store.getMedia('cms-media-label-free')!,status:'published'}])
    expect(freeReport.issues.map(i=>i.code)).toContain('UNLABELED_RECONSTRUCTION')
  })

  it('stores nothing for free-standing images and keeps legacy rows valid',()=>{
    store.createMedia(base('cms-media-free-1',{roles:['gallery'],kind:'specimen-photo'}))
    const row=store.getMedia('cms-media-free-1')!
    expect(row.slotId).toBeNull()
    expect(row.evidenceClass).toBeNull()
    expect(row.generator).toBeNull()
    expect(row.review).toBeNull()
    expect(validateWithPendingMedia([{...row,status:'published'}]).ok).toBe(true)
  })

  it('rejects an evidence class on an image without a slot',()=>{
    store.createMedia(base('cms-media-free-2',{evidenceClass:'C'}))
    const report=validateWithPendingMedia([{...store.getMedia('cms-media-free-2')!,status:'published'}])
    expect(report.ok).toBe(false)
    expect(report.issues.map(i=>i.code)).toContain('EVIDENCE_CLASS_WITHOUT_SLOT')
  })

  it('rejects a published image in a slot that belongs to another taxon',()=>{
    store.createMedia(portrait('cms-media-wrong-taxon',{subjectId:'sapiens',review:approve}))
    const report=validateWithPendingMedia([{...store.getMedia('cms-media-wrong-taxon')!,status:'published'}])
    expect(report.ok).toBe(false)
    expect(report.issues.map(i=>i.code)).toContain('SLOT_SUBJECT_MISMATCH')
  })

  it('migrates an older database: the new columns are added without losing rows',async()=>{
    const {getDb}=await import('../infrastructure/cms/db')
    const names=(getDb().prepare('PRAGMA table_info(media_assets)').all() as {name:string}[]).map(column=>column.name)
    for(const column of ['slot_id','evidence_class','specimen_ref','assumptions','generator','reviewed_by']) expect(names).toContain(column)
  })
})
