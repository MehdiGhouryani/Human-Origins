import {describe,expect,it} from 'vitest'
import {ASSUMPTIONS_PREFIX,altTextFor,isDefaultPortraitSlot,buildAssumptions,needsCrop,parseBriefs,parseChecksums,parseFields,parseInventory} from '../tools/images/handoff'

const INVENTORY=`
| شناسه | مسیر تصویر | ابعاد موجود | وضعیت و ادامه |
|---|---|---|---|
| \`sahelanthropus.S02\` | \`01_Sahelanthropus_tchadensis/S02_01_portrait.webp\` | 1000×1250 | نسخهٔ پیشنهادی، فنی/فشرده‌سازی انجام شد؛ کنترل کامل باقی است. |
| \`orrin.S03\` | \`02_Orrorin_tugenensis/S03_02_dossier-hero.webp\` | 1536×1024 | تعلیق، بدون تغییر و منتشر نشود. |
| \`erectus.S11\` | \`08_Homo_erectus/S11_04_activity.webp\` | 1600×1200 | ایراد پوشش. انتشار ممنوع تا اصلاح محتوا. |
| \`sapiens.S10(alt)\` | \`11_Homo_sapiens_early_AMH/S10_03_habitat_alt.webp\` | 1920×1080 | زیستگاه جایگزین، بدون تغییر. |
| \`sapiens.S03\` | \`11_Homo_sapiens_early_AMH/S03_02_dossier-hero.webp\` | مفقود | باید تولید شود. |
| \`sapiens.X1\` | \`11_Homo_sapiens_early_AMH/X1_05_jebel-irhoud-1.webp\` | 1000×1250 | فنی انجام شد. |
`
const SHA='8ee7f6d82611bc4c3e495041c494978d1d0fffcbdbf14794f2875ef93f5b3256'
const CHECKSUMS=`| شناسه | حجم فایل بایت | SHA-256 |\n|---|---|---|\n| \`sahelanthropus.S02\` | 154878 | \`${SHA}\` |\n| \`sapiens.S10(alt)\` | 111 | \`${SHA}\` |\n`

const BLOCK=`Create ONE scientific paleoart portrait of Sahelanthropus tchadensis.
OUTPUT: single image, portrait 4:5, 1000×1250 px.
SUBJECT: one adult.
BASIS: cranium TM 266-01-060-1 (“Toumaï”); also consulted: mandibular and dental fragments.
BONE-ANCHORED FEATURES (render with confidence):
- long, low, narrow braincase
- massive, continuous brow ridge
SIZE REFERENCE: braincase about 360–370 cc.
DO NOT INVENT (leave unremarkable):
- whether it walked upright (disputed)
- skin colour, hair distribution
CONVENTIONS FOR THIS TAXON (not findings): dark skin; short dark hair. Clothing — none.
- EVIDENCE TIERS. BONE-ANCHORED = directly constrained by the fossils.
- EYES: dark brown irises.
STYLE: photorealistic.
MUST NOT include: text overlays.`

describe('parseInventory',()=>{
  it('reads only the inventory section, not the other tables that start with a slot id',()=>{
    const doc=`# x\n\n## موجودی و نقطهٔ شروع هر فایل\n${INVENTORY}\n## تاریخچهٔ برش و resize مرحلهٔ فنی\n| \`sapiens.S02\` | crop | a | b | c |\n`
    expect(parseInventory(doc).filter(row=>row.slotId==='sapiens.S02')).toHaveLength(0)
    expect(parseInventory(doc)).toHaveLength(6)
  })
  const rows=parseInventory(INVENTORY)
  const by=Object.fromEntries(rows.map(row=>[row.slotId+(row.state==='alternate'?'(alt)':''),row]))
  it('reads id, taxon, code, path and size',()=>{
    expect(by['sahelanthropus.S02']).toMatchObject({taxonId:'sahelanthropus',code:'S02',width:1000,height:1250,state:'import',path:'01_Sahelanthropus_tchadensis/S02_01_portrait.webp'})
    expect(by['sapiens.X1']).toMatchObject({code:'X1',state:'import'})
  })
  it('never lets a suspended, forbidden, missing or alternate image through as importable',()=>{
    expect(by['orrin.S03'].state).toBe('suspended')
    expect(by['erectus.S11'].state).toBe('forbidden')
    expect(by['sapiens.S03'].state).toBe('missing')
    expect(by['sapiens.S10(alt)'].state).toBe('alternate')
  })
  it('keeps the hand-off note verbatim for the reviewer',()=>{
    expect(by['erectus.S11'].note).toContain('انتشار ممنوع')
  })
})

describe('parseChecksums',()=>{
  it('keys by slot id and keeps an alternate row apart from the real slot (it once overwrote it)',()=>{
    const map=parseChecksums(`${CHECKSUMS}| \`sapiens.S10\` | 222 | \`${'a'.repeat(64)}\` |\n`)
    expect(map.get('sahelanthropus.S02')).toEqual({bytes:154878,sha256:SHA})
    expect(map.get('sapiens.S10')?.sha256).toBe('a'.repeat(64))
    expect(map.get('sapiens.S10(alt)')?.sha256).toBe(SHA)
  })
})

describe('briefs and assumptions',()=>{
  const reference=`# Ref\n\n### sahelanthropus.S02 — portrait\n\n\`\`\`text\n${BLOCK}\n\`\`\`\n\n### sahelanthropus.S03 — hero\n\n\`\`\`text\nSCENE: a scene\n\`\`\`\n`
  const briefs=parseBriefs(reference)
  it('splits the reference into one block per slot',()=>{
    expect([...briefs.keys()]).toEqual(['sahelanthropus.S02','sahelanthropus.S03'])
    expect(briefs.get('sahelanthropus.S03')).toBe('SCENE: a scene')
  })
  it('only absorbs bullets that follow a label with no inline text',()=>{
    const fields=parseFields(BLOCK)
    expect(fields.find(field=>field.label.startsWith('BONE-ANCHORED'))?.text).toBe('long, low, narrow braincase; massive, continuous brow ridge')
    expect(fields.find(field=>field.label==='CONVENTIONS FOR THIS TAXON')?.text).not.toContain('EVIDENCE TIERS')
  })
  it('keeps evidence tiers and conventions, drops technical instructions',()=>{
    const text=buildAssumptions(briefs.get('sahelanthropus.S02')!)
    expect(text.startsWith(ASSUMPTIONS_PREFIX)).toBe(true)
    expect(text).toContain('Bone-anchored (requested with confidence): long, low, narrow braincase')
    expect(text).toContain('Left unremarkable on purpose')
    expect(text).toContain('Conventions (not findings)')
    expect(text).not.toMatch(/OUTPUT|STYLE|photorealistic|MUST NOT/)
  })
  it('fits the 20-3000 character gate even for a long block',()=>{
    const long=`BASIS: ${'x '.repeat(5000)}\nBONE-ANCHORED FEATURES (a):\n${Array.from({length:60},(_,i)=>`- feature number ${i} ${'y'.repeat(40)}`).join('\n')}`
    const text=buildAssumptions(long)
    expect(text.length).toBeGreaterThanOrEqual(20)
    expect(text.length).toBeLessThanOrEqual(3000)
  })
})

describe('alt text and crop rule',()=>{
  it('describes the picture type, not just the species',()=>{
    expect(altTextFor('S02','Homo erectus','')).toMatch(/^Facial reconstruction of Homo erectus/)
    expect(altTextFor('S10','Homo erectus','')).toMatch(/habitat/)
    expect(altTextFor('X1','Homo sapiens','Jebel Irhoud 1')).toContain('based on Jebel Irhoud 1')
  })
  it('flags an image only when the crop to the slot ratio is larger than 2%',()=>{
    expect(needsCrop(1000,1250,4/5)).toBe(false)
    expect(needsCrop(1920,1080,16/9)).toBe(false)
    expect(needsCrop(1024,1536,4/5)).toBe(true)
  })
})

describe('default portrait',()=>{
  it('is only ever the S02 portrait, never an X1 specimen reconstruction',()=>{
    expect(isDefaultPortraitSlot('S02')).toBe(true)
    for(const code of ['X1','S03','S10','S11']) expect(isDefaultPortraitSlot(code)).toBe(false)
  })
})
