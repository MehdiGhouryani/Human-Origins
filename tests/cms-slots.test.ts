import {afterAll,describe,expect,it} from 'vitest'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

// Must be set before the db module is first imported: it reads CMS_DB_PATH at load time.
const workDir=mkdtempSync(join(tmpdir(),'cms-slots-test-'))
process.env.CMS_DB_PATH=join(workDir,'cms.sqlite')
process.env.CMS_MEDIA_DIR=join(workDir,'media')

const store=await import('../infrastructure/cms/store')
const {getLiveContent}=await import('../infrastructure/cms/live')
const {MediaInputError,parseMediaPatch,parseRoles,parseSlot,parseStatus,parseSourceUrl}=await import('../infrastructure/cms/mediaInput')

const row=(id:string,overrides:Record<string,unknown>={})=>({
  id,subjectId:'erectus',roles:['gallery'] as never,kind:'cast-photo' as const,filePath:`/cms-media/${id}`,width:800,height:800,
  variants:[{purpose:'thumbnail' as const,src:`/cms-media/${id}/thumbnail.webp`,width:320,height:320,format:'webp' as const}],
  credit:'Test',license:'CC BY 4.0',sourceUrl:'',linkedSourceId:null,note:'Photograph of a museum cast.',alt:'Cast of a Homo erectus skull',
  publicationStatus:'approved' as const,rightsStatus:'clear' as const,isDefault:false,...overrides,
})
const erectus=()=>getLiveContent().catalog.taxa.find(t=>String(t.id)==='erectus')!

describe('CMS media slots',()=>{
  afterAll(()=>rmSync(workDir,{recursive:true,force:true}))

  it('a draft replacement never takes the live portrait / tree avatar off the site',()=>{
    store.createMedia(row('slot-live',{isDefault:true,roles:['profile-portrait','tree-thumbnail']}))
    store.setMediaStatus('slot-live','published')
    expect(String(erectus().defaultMediaId)).toBe('slot-live')
    expect(String(erectus().treeIconMediaId)).toBe('slot-live')

    store.createMedia(row('slot-draft',{isDefault:true,roles:['profile-portrait','tree-thumbnail']}))
    store.updateMedia('slot-draft',{alt:'Edited draft alt text'})
    const live=store.getMedia('slot-live')!
    expect(live.isDefault).toBe(true)
    expect(live.roles).toContain('tree-thumbnail')
    expect(String(erectus().defaultMediaId)).toBe('slot-live')
  })

  it('publishing the replacement moves both slots to it and records the hand-over',()=>{
    store.setMediaStatus('slot-draft','published')
    expect(store.getMedia('slot-live')!.isDefault).toBe(false)
    expect(store.getMedia('slot-live')!.roles).not.toContain('tree-thumbnail')
    expect(String(erectus().defaultMediaId)).toBe('slot-draft')
    expect(String(erectus().treeIconMediaId)).toBe('slot-draft')
    expect(store.listRevisions().some(r=>r.summary.includes('replaced by slot-draft'))).toBe(true)
  })

  it('assignMediaSlot on a live row takes the slot immediately (one-click avatar swap)',()=>{
    store.assignMediaSlot('slot-live','tree-icon')
    expect(String(erectus().treeIconMediaId)).toBe('slot-live')
    expect(store.getMedia('slot-draft')!.roles).not.toContain('tree-thumbnail')
    expect(String(erectus().defaultMediaId)).toBe('slot-draft')
  })

  it('rolls back the whole change when a step fails',()=>{
    expect(()=>store.assignMediaSlot('does-not-exist','portrait')).toThrow()
    expect(store.getMedia('does-not-exist')).toBeUndefined()
  })
})

describe('CMS request validation',()=>{
  const taxa=new Set(['erectus']),sources=new Set(['si-human-species-index'])
  it('rejects unknown enum values instead of persisting them',()=>{
    expect(()=>parseRoles('gallery,banana')).toThrow(MediaInputError)
    expect(()=>parseStatus('live')).toThrow(MediaInputError)
    expect(()=>parseSlot('hero')).toThrow(MediaInputError)
    expect(()=>parseMediaPatch({kind:'selfie'},taxa,sources)).toThrow(MediaInputError)
    expect(()=>parseMediaPatch({publicationStatus:'legacy'},taxa,sources)).toThrow(MediaInputError)
    expect(()=>parseMediaPatch({subjectId:'unicorn'},taxa,sources)).toThrow(MediaInputError)
    expect(()=>parseMediaPatch({linkedSourceId:'nope'},taxa,sources)).toThrow(MediaInputError)
    expect(()=>parseMediaPatch({isDefault:'yes'},taxa,sources)).toThrow(MediaInputError)
    expect(()=>parseSourceUrl('javascript:alert(1)')).toThrow(MediaInputError)
  })
  it('accepts a valid partial patch and keeps only the provided keys',()=>{
    const patch=parseMediaPatch({alt:'  A cast  ',roles:['gallery','gallery','context'],license:''},taxa,sources)
    expect(patch).toEqual({alt:'A cast',roles:['gallery','context'],license:null})
    expect(parseStatus(undefined)).toBeUndefined()
  })
})
