import {describe,expect,it} from 'vitest'
import {mediaByRole} from '../features/explorer/dossier'
import {publicSlotTitle} from '../components/species/SlotGallery'

type M={id:string;roles:string[];slotId?:string;placeholder?:boolean}
const item=(m:M)=>({...m,roles:m.roles as never,subject:undefined,src:'',sourceUrl:'',credit:'',license:null,note:'',alt:'',publicationStatus:'approved',rightsStatus:'clear',variants:[],slotId:m.slotId,evidenceClass:'D'} as never)

describe('species portrait selection (sapiens regression)',()=>{
  // The bug: the specimen reconstruction X1 carries the profile-portrait role and was listed first, so it replaced the
  // designated S02 portrait in the header. Expected: the designated default wins.
  const media=[item({id:'x1',roles:['profile-portrait'],slotId:'sapiens.X1'}),item({id:'s02',roles:['profile-portrait'],slotId:'sapiens.S02'})]
  it('the designated default portrait wins over an earlier profile-portrait role',()=>{
    expect(String(mediaByRole(media,'profile-portrait','s02')?.id)).toBe('s02')
  })
  it('a specimen reconstruction is never the species portrait, even when it is the only candidate',()=>{
    const onlySpecimen=[item({id:'x1',roles:['profile-portrait'],slotId:'sapiens.X1'})]
    const picked=mediaByRole(onlySpecimen,'profile-portrait','builtin-sample')
    expect(String(picked?.id)).not.toBe('x1')
  })
  it('a live portrait still beats a built-in sample when the designated id is absent',()=>{
    const mixed=[item({id:'sample',roles:['profile-portrait'],placeholder:true}),item({id:'live',roles:['profile-portrait'],slotId:'afarensis.S02'})]
    expect(String(mediaByRole(mixed,'profile-portrait','missing')?.id)).toBe('live')
  })
  it('tree avatars keep the designated-id-first rule',()=>{
    const trees=[item({id:'a',roles:['tree-thumbnail']}),item({id:'b',roles:['tree-thumbnail']})]
    expect(String(mediaByRole(trees,'tree-thumbnail','b')?.id)).toBe('b')
  })
})

describe('public wording of slot titles',()=>{
  it('the header slot reads "Header image", never the internal group name',()=>{
    expect(publicSlotTitle({title:'A. afarensis: dossier hero',series:'S03'})).toBe('Header image')
  })
  it('other titles lose the taxon prefix and start with a capital letter',()=>{
    expect(publicSlotTitle({title:'Sahelanthropus: portrait',series:'S02'})).toBe('Portrait')
    expect(publicSlotTitle({title:'H. habilis: habitat',series:'S10'})).toBe('Habitat')
  })
  it('no visitor-facing title for an importable slot contains the internal word "dossier"',async()=>{
    const {readFileSync}=await import('node:fs')
    const gen=readFileSync('content/media-slots.generated.ts','utf8')
    const titles=[...gen.matchAll(/series:"(S0[23]|S10|S11|X1)",title:"([^"]+)"/g)].map(m=>publicSlotTitle({title:m[2],series:m[1]}))
    expect(titles.filter(t=>/dossier/i.test(t))).toEqual([])
    expect(titles.length).toBeGreaterThan(0)
  })
})
