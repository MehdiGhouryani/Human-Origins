import {describe,expect,it} from 'vitest'
import {placeSceneSlots,sectionPreference} from '../features/explorer/slotPlacement'
import type {SlotState} from '../features/explorer/slots'
import type {SectionId} from '../domain/species-page'

const ALL:SectionId[]=['discovery','anatomy','locomotion','brain-behaviour','stone-tools','environment-diet','where-when','place-in-tree']
const state=(taxon:string,series:string,visibility:SlotState['visibility']):SlotState=>({slot:{id:`${taxon}.${series}`,series} as never,group:'scenes' as never,media:visibility==='show'?{} as never:null,source:'none' as never,visibility})

describe('where a scene image sits on the page',()=>{
  it('puts habitat in Environment, specimen reconstructions in Discovery',()=>{
    expect(sectionPreference('S10','afarensis')[0]).toBe('environment-diet')
    expect(sectionPreference('X1','sapiens')[0]).toBe('discovery')
  })
  it('puts a behaviour scene next to the text it illustrates',()=>{
    expect(sectionPreference('S11','afarensis')[0]).toBe('locomotion')
    for(const taxon of ['habilis','erectus','heidelbergensis','neanderthal']) expect(sectionPreference('S11',taxon)[0]).toBe('stone-tools')
    expect(sectionPreference('S11','sapiens')[0]).toBe('brain-behaviour')
  })
})

describe('placeSceneSlots',()=>{
  const states=[state('habilis','S03','show'),state('habilis','S10','show'),state('habilis','S11','show'),state('habilis','S02','show')]
  it('places only scene series, in their sections, and reports what it placed',()=>{
    const result=placeSceneSlots({taxonId:'habilis',states,sectionIds:ALL,adminPreview:false})
    expect(result.bySection.get('environment-diet')?.map(item=>String(item.slot.id))).toEqual(['habilis.S10'])
    expect(result.bySection.get('stone-tools')?.map(item=>String(item.slot.id))).toEqual(['habilis.S11'])
    expect([...result.placedIds].sort()).toEqual(['habilis.S10','habilis.S11'])
  })
  it('falls back to the next preferred section when the page does not have the first',()=>{
    const result=placeSceneSlots({taxonId:'habilis',states,sectionIds:ALL.filter(id=>id!=='stone-tools'),adminPreview:false})
    expect(result.bySection.get('brain-behaviour')?.map(item=>String(item.slot.id))).toEqual(['habilis.S11'])
  })
  it('leaves the image in the gallery when no preferred section exists',()=>{
    const result=placeSceneSlots({taxonId:'habilis',states,sectionIds:['anatomy'],adminPreview:false})
    expect(result.placedIds.size).toBe(0)
  })
  it('shows empty frames inline only to a signed-in editor, and never places held slots',()=>{
    const empty=[state('afarensis','S10','frame'),state('afarensis','S11','locked')]
    expect(placeSceneSlots({taxonId:'afarensis',states:empty,sectionIds:ALL,adminPreview:false}).placedIds.size).toBe(0)
    const admin=placeSceneSlots({taxonId:'afarensis',states:empty,sectionIds:ALL,adminPreview:true})
    expect([...admin.placedIds]).toEqual(['afarensis.S10'])
  })
  it('orders several images in one section: habitat before behaviour before specimen',()=>{
    const result=placeSceneSlots({taxonId:'sapiens',states:[state('sapiens','X1','show'),state('sapiens','S11','show')],sectionIds:['discovery','brain-behaviour'],adminPreview:false})
    expect(result.bySection.get('discovery')?.map(item=>String(item.slot.id))).toEqual(['sapiens.X1'])
    expect(result.bySection.get('brain-behaviour')?.map(item=>String(item.slot.id))).toEqual(['sapiens.S11'])
  })
})
