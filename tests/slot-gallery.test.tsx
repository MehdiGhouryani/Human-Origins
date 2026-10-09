import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import SlotGallery,{SlotHero} from '../components/species/SlotGallery'
import {MEDIA_SLOTS} from '../content/media-slots.generated'
import {resolveSlots} from '../features/explorer/slots'
import type {ExplorerMedia} from '../features/explorer/types'
import {asMediaAssetId,asMediaSlotId,asTaxonId} from '../domain/ids'

const live=(slot:string,overrides:Partial<ExplorerMedia>={}):ExplorerMedia=>({
  id:asMediaAssetId(`m-${slot.replace('.','-').toLowerCase()}`),subject:{type:'taxon',id:asTaxonId('afarensis')},roles:['profile-portrait'],kind:'reconstruction',src:'/cms-media/x/card.webp',sourceUrl:'',
  credit:'Test Artist',license:'CC BY 4.0',note:'n',alt:'A reconstruction',publicationStatus:'approved',rightsStatus:'clear',variants:[],slotId:asMediaSlotId(slot),evidenceClass:'D',
  assumptions:'Bone-anchored: brow and jaw. Convention: skin and hair colour.',generator:{name:'Artist',version:'',date:'2026-10-06'},review:{reviewer:'Dr Example',date:'2026-10-07',decision:'approve'},...overrides,
})
const states=(media:ExplorerMedia[],adminPreview=false,taxonId='afarensis')=>resolveSlots({slots:MEDIA_SLOTS,media,taxonId,adminPreview})
const html=(node:React.ReactElement)=>renderToStaticMarkup(node)

describe('slot gallery (public)',()=>{
  it('shows a neutral frame for the hero and nothing else when the page has no images',()=>{
    const s=states([])
    const hero=html(<SlotHero states={s} adminPreview={false}/>)
    expect(hero).toContain('Image in preparation')
    expect(hero).toContain('id="hero-image"')
    expect(hero).not.toContain('Upload')
    expect(hero).not.toContain('/admin')
    expect(html(<SlotGallery states={s} extras={[]} adminPreview={false}/>)).toBe('')
  })

  it('shows a live image with its evidence class, credit, licence and assumptions',()=>{
    const s=states([live('afarensis.S10',{roles:['habitat']})])
    const markup=html(<SlotGallery states={s} extras={[]} adminPreview={false}/>)
    expect(markup).toContain('Reconstructions and habitat')
    expect(markup).toContain('>Reconstruction<')
    expect(markup).toContain('Test Artist · CC BY 4.0')
    expect(markup).toContain('<summary>Assumptions</summary>')
    expect(markup).toContain('Bone-anchored')
    expect(markup).toContain('Reviewed by Dr Example')
    expect(markup).toContain('data-slot="afarensis.S10"')
    expect(markup).not.toContain('Image in preparation')
  })

  it('labels specimen photographs and shows the specimen reference, without an assumptions box',()=>{
    const photo=live('afarensis.S04',{roles:['specimen-reference'],kind:'specimen-photo',evidenceClass:'C',specimenRef:'AL 444-2 cranium, lateral view',assumptions:undefined,generator:undefined,review:undefined})
    const markup=html(<SlotGallery states={states([photo])} extras={[]} adminPreview={false}/>)
    expect(markup).toContain('>Specimen photograph<')
    expect(markup).toContain('AL 444-2 cranium, lateral view')
    expect(markup).toContain('Specimens')
    expect(markup).not.toContain('Assumptions')
  })

  it('keeps legacy images without a slot under “More images”',()=>{
    const legacy=live('afarensis.S10',{slotId:undefined,evidenceClass:undefined,kind:'specimen-photo'})
    const markup=html(<SlotGallery states={states([])} extras={[legacy]} adminPreview={false}/>)
    expect(markup).toContain('More images')
    expect(markup).toContain('Specimen photograph')
  })

  it('orders groups: reconstructions, specimens, diagrams, stone tools, sites',()=>{
    const photo=live('sapiens.S04',{subject:{type:'taxon',id:asTaxonId('sapiens')},roles:['specimen-reference'],kind:'specimen-photo',evidenceClass:'C',specimenRef:'Qafzeh 6',assumptions:undefined,generator:undefined,review:undefined})
    const tool=live('sapiens.L1',{subject:{type:'taxon',id:asTaxonId('sapiens')},roles:['behavior'],kind:'specimen-photo',evidenceClass:'C',specimenRef:'Still Bay point',assumptions:undefined,generator:undefined,review:undefined})
    const scene=live('sapiens.S10',{subject:{type:'taxon',id:asTaxonId('sapiens')},roles:['habitat']})
    const markup=html(<SlotGallery states={states([tool,photo,scene],false,'sapiens')} extras={[]} adminPreview={false}/>)
    const order=['Reconstructions and habitat','Specimens','Stone tools'].map(label=>markup.indexOf(label))
    expect(order.every(index=>index>=0)).toBe(true)
    expect([...order].sort((a,b)=>a-b)).toEqual(order)
  })
})

describe('slot gallery (admin preview)',()=>{
  it('shows every open empty slot as a frame with its code, size, class and an Upload link',()=>{
    const s=states([],true)
    const markup=html(<SlotGallery states={s} extras={[]} adminPreview={true}/>)
    expect(markup).toContain('href="/admin/media/slots?slot=afarensis.S10"')
    expect(markup).toContain('afarensis.S04')
    expect(markup).toContain('16:9 · 1920×1080 · Reconstruction')
    expect(markup).toContain('Empty slot')
    expect(markup).not.toContain('afarensis.L1')
    const hero=html(<SlotHero states={s} adminPreview={true}/>)
    expect(hero).toContain('href="/admin/media/slots?slot=afarensis.S03"')
  })

  it('shows on-hold slots as locked with the reason, and never offers an upload for them',()=>{
    const s=states([],true,'orrin')
    const markup=html(<SlotGallery states={s} extras={[]} adminPreview={true}/>)
    expect(markup).toContain('On hold')
    expect(markup).toContain('specimen record')
    expect(markup).not.toContain('/admin/media/slots?slot=orrin')
  })
})
