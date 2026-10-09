import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {MEDIA_SLOTS} from '../content/media-slots.generated'
import {findSlot,isSlotOpen,slotAspect,slotsForTaxon} from '../domain/media-slots'
import {asMediaSlotId,isMediaSlotId} from '../domain/ids'
import {taxa} from '../content'
import {buildCatalog} from '../tools/images/spec'
import {renderSlotsFile,SLOTS_FILE} from '../tools/images/build'
import {featured} from '../content/featured'

const ROLES=new Set(['tree-thumbnail','profile-portrait','dossier-hero','anatomy-plate','comparative-morphology','specimen-reference','habitat','behavior','scale-reference','gallery','context'])
const KINDS=new Set(['specimen-photo','cast-photo','reconstruction','context-schematic'])

describe('media slot ids',()=>{
  it('accepts catalog codes and rejects anything else',()=>{
    for(const ok of ['afarensis.S02','orrin.X1','sapiens.L3','heidelbergensis.S07a','compare.C03','a-b.S10']) expect(isMediaSlotId(ok),ok).toBe(true)
    for(const bad of ['afarensis','afarensis.s02','Afarensis.S02','afarensis.S','afarensis.S002','x.Y1','',' afarensis.S02','afarensis.S02 ']) expect(isMediaSlotId(bad),bad).toBe(false)
    expect(()=>asMediaSlotId('nope')).toThrow()
  })
})

describe('generated slot definitions',()=>{
  const taxonIds=new Set(taxa.map(taxon=>String(taxon.id)))

  it('has one slot per catalog row (237), unique and valid',()=>{
    expect(MEDIA_SLOTS).toHaveLength(237)
    expect(new Set(MEDIA_SLOTS.map(slot=>String(slot.id))).size).toBe(237)
    expect(buildCatalog().map(row=>row.code)).toEqual(MEDIA_SLOTS.map(slot=>String(slot.id)))
  })

  it('references only known taxa, roles and kinds',()=>{
    for(const slot of MEDIA_SLOTS){
      if(slot.taxonId!==null) expect(taxonIds.has(String(slot.taxonId)),String(slot.id)).toBe(true)
      expect(ROLES.has(slot.role),String(slot.id)).toBe(true)
      expect(KINDS.has(slot.kind),String(slot.id)).toBe(true)
    }
  })

  it('gives every core taxon 15 standard and 3 stone-tool slots, and slotsForTaxon finds them',()=>{
    for(const id of featured.mainPathTaxonIds.map(String)){
      const own=slotsForTaxon(MEDIA_SLOTS,id)
      expect(own.filter(slot=>/^S\d+/.test(slot.series)),id).toHaveLength(15)
      expect(own.filter(slot=>/^L\d/.test(slot.series)),id).toHaveLength(3)
    }
    expect(slotsForTaxon(MEDIA_SLOTS,'compare')).toHaveLength(0)
    expect(MEDIA_SLOTS.filter(slot=>slot.taxonId===null)).toHaveLength(21)
  })

  it('applies decision D-19: only portrait and hero are shown as frames when empty',()=>{
    for(const slot of MEDIA_SLOTS) expect(slot.publicRule,String(slot.id)).toBe(slot.series==='S02'||slot.series==='S03'?'always':'whenFilled')
  })

  it('keeps not-applicable slots closed with a reason, and holds slots of taxa without specimen records',()=>{
    const notApplicable=MEDIA_SLOTS.filter(slot=>!slot.applicable)
    expect(notApplicable).toHaveLength(23)
    for(const slot of notApplicable){
      expect(isSlotOpen(slot),String(slot.id)).toBe(false)
      expect(slot.notApplicableReason.length,String(slot.id)).toBeGreaterThan(20)
    }
    const held=MEDIA_SLOTS.filter(slot=>slot.applicable&&slot.holdReason!=='')
    expect([...new Set(held.map(slot=>String(slot.taxonId)))].sort()).toEqual(['heidelbergensis','orrin'])
    for(const slot of held) expect(isSlotOpen(slot),String(slot.id)).toBe(false)
    expect(MEDIA_SLOTS.filter(isSlotOpen).length).toBe(237-23-held.length)
  })

  it('requires review exactly for class-D reconstructions',()=>{
    for(const slot of MEDIA_SLOTS){
      expect(slot.needsReview,String(slot.id)).toBe(slot.evidenceClass==='D')
      if(slot.evidenceClass==='D') expect(slot.kind,String(slot.id)).toBe('reconstruction')
    }
  })

  it('computes aspect ratios for fixed-size slots only',()=>{
    expect(slotAspect(findSlot(MEDIA_SLOTS,'afarensis.S02')!)).toBeCloseTo(0.8,5)
    expect(slotAspect(findSlot(MEDIA_SLOTS,'afarensis.S03')!)).toBeCloseTo(16/9,3)
    expect(slotAspect(findSlot(MEDIA_SLOTS,'afarensis.S11')!)).toBeCloseTo(4/3,3)
    expect(slotAspect(findSlot(MEDIA_SLOTS,'afarensis.S08')!)).toBeNull()
    expect(findSlot(MEDIA_SLOTS,'nope.S02')).toBeUndefined()
  })

  it('is in sync with the generator (run `npm run images:build` after editing tools/images)',()=>{
    expect(readFileSync(join(process.cwd(),SLOTS_FILE),'utf8')).toBe(renderSlotsFile())
  })
})
