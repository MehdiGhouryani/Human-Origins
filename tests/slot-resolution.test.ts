import {describe,expect,it} from 'vitest'
import {MEDIA_SLOTS} from '../content/media-slots.generated'
import {slotGroup,SLOT_GROUP_ORDER} from '../domain/media-slots'
import {resolveSlots,slotsInGroup} from '../features/explorer/slots'
import type {ExplorerMedia} from '../features/explorer/types'
import {asMediaAssetId,asMediaSlotId,asTaxonId} from '../domain/ids'

const media=(slot:string,overrides:Partial<ExplorerMedia>={}):ExplorerMedia=>({
  id:asMediaAssetId(`m-${slot.replace('.','-').toLowerCase()}`),subject:{type:'taxon',id:asTaxonId('afarensis')},roles:['profile-portrait'],kind:'reconstruction',src:'/cms-media/x/card.webp',sourceUrl:'',
  credit:'c',license:'CC BY 4.0',note:'n',alt:'a',publicationStatus:'approved',rightsStatus:'clear',variants:[],slotId:asMediaSlotId(slot),evidenceClass:'D',
  assumptions:'Bone-anchored: face. Convention: skin and hair colour.',generator:{name:'Artist',version:'1',date:'2026-10-06'},review:{reviewer:'R',date:'2026-10-07',decision:'approve'},...overrides,
})
const resolve=(items:ExplorerMedia[],taxonId='afarensis',adminPreview=false,builtIns={})=>resolveSlots({slots:MEDIA_SLOTS,media:items,taxonId,adminPreview,builtIns})
const find=(states:ReturnType<typeof resolve>,code:string)=>states.find(state=>String(state.slot.id)===code)!

describe('slot resolution',()=>{
  it('lists only the applicable slots of the taxon',()=>{
    const afarensis=resolve([])
    expect(afarensis.every(state=>state.slot.applicable)).toBe(true)
    expect(afarensis.some(state=>String(state.slot.id)==='afarensis.L1')).toBe(false)
    const sapiens=resolve([],'sapiens')
    expect(sapiens.some(state=>String(state.slot.id)==='sapiens.L1')).toBe(true)
  })

  it('shows portrait and hero as frames to everyone, other empty slots only to an admin',()=>{
    const publicView=resolve([])
    expect(find(publicView,'afarensis.S02').visibility).toBe('frame')
    expect(find(publicView,'afarensis.S03').visibility).toBe('frame')
    expect(find(publicView,'afarensis.S10').visibility).toBe('hidden')
    expect(find(publicView,'afarensis.S04').visibility).toBe('hidden')
    const admin=resolve([],'afarensis',true)
    expect(find(admin,'afarensis.S10').visibility).toBe('frame')
    expect(find(admin,'afarensis.S04').visibility).toBe('frame')
  })

  it('shows a live image in its slot',()=>{
    const states=resolve([media('afarensis.S02')])
    const portrait=find(states,'afarensis.S02')
    expect(portrait.visibility).toBe('show')
    expect(portrait.source).toBe('cms')
    expect(String(portrait.media?.id)).toBe('m-afarensis-s02')
  })

  it('never fills a slot with an image that breaks the slot rules (defence in depth)',()=>{
    const unreviewed=media('afarensis.S02',{review:undefined})
    expect(find(resolve([unreviewed]),'afarensis.S02').visibility).toBe('frame')
    const wrongClass=media('afarensis.S02',{evidenceClass:'C'})
    expect(find(resolve([wrongClass]),'afarensis.S02').media).toBeNull()
    const otherTaxon=media('afarensis.S02',{subject:{type:'taxon',id:asTaxonId('sapiens')}})
    expect(find(resolve([otherTaxon]),'afarensis.S02').media).toBeNull()
    const unknownSlot=media('afarensis.S02',{slotId:asMediaSlotId('afarensis.S99')})
    expect(resolve([unknownSlot]).every(state=>state.media===null)).toBe(true)
  })

  it('ignores placeholders and images without a slot',()=>{
    expect(find(resolve([media('afarensis.S02',{placeholder:true})]),'afarensis.S02').media).toBeNull()
    expect(find(resolve([media('afarensis.S02',{slotId:undefined})]),'afarensis.S02').media).toBeNull()
  })

  it('lets built-in plates fill the avatar and portrait only',()=>{
    const plate=media('afarensis.S02',{slotId:undefined,placeholder:true})
    const states=resolve([],'afarensis',false,{avatar:plate,portrait:plate})
    expect(find(states,'afarensis.S01').source).toBe('built-in')
    expect(find(states,'afarensis.S02').source).toBe('built-in')
    expect(find(states,'afarensis.S02').visibility).toBe('show')
    expect(find(states,'afarensis.S03').source).toBeNull()
    expect(find(states,'afarensis.S10').source).toBeNull()
  })

  it('hides on-hold slots from the public and locks them for an admin; a live CMS image beats the built-in plate',()=>{
    expect(find(resolve([],'orrin'),'orrin.S02').visibility).toBe('hidden')
    expect(find(resolve([],'orrin',true),'orrin.S02').visibility).toBe('locked')
    const plate=media('afarensis.S02',{slotId:undefined,placeholder:true})
    const states=resolve([media('afarensis.S02')],'afarensis',false,{portrait:plate})
    expect(find(states,'afarensis.S02').source).toBe('cms')
  })

  it('groups slots for display and keeps the catalog order inside a group',()=>{
    const states=resolve([],'sapiens',true)
    expect(slotsInGroup(states,'tools').map(state=>String(state.slot.id))).toEqual(['sapiens.L1','sapiens.L2','sapiens.L3'])
    expect(slotsInGroup(states,'hero').map(state=>String(state.slot.id))).toEqual(['sapiens.S03'])
    expect(slotsInGroup(states,'header').map(state=>String(state.slot.id))).toEqual(['sapiens.S01','sapiens.S02'])
    for(const slot of MEDIA_SLOTS) expect(['header','hero',...SLOT_GROUP_ORDER]).toContain(slotGroup(slot))
    expect(slotGroup({series:'X1',evidenceClass:'D',role:'profile-portrait'})).toBe('scenes')
    expect(slotGroup({series:'X1',evidenceClass:'C',role:'specimen-reference'})).toBe('specimens')
    expect(slotGroup({series:'X1',evidenceClass:'B',role:'anatomy-plate'})).toBe('diagrams')
  })
})
