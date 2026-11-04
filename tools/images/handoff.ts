// Pure helpers for importing an image hand-off package (HANDOFF.md + REFERENCE.md + the image files).
// Nothing here touches the CMS, the network or the file system, so it is fully unit-tested.

export type HandoffState='import'|'suspended'|'forbidden'|'missing'|'alternate'

export type HandoffRow={
  /** Slot id as the catalog knows it, e.g. `afarensis.S02`. */
  slotId:string
  taxonId:string
  /** Slot code inside the taxon: S02, S03, S10, S11, X1. */
  code:string
  /** Path relative to the package root. */
  path:string
  width:number|null
  height:number|null
  /** The hand-off's own status text (Persian), kept verbatim for the reviewer. */
  note:string
  state:HandoffState
}

const SLOT_ID=/^([a-z]+)\.((?:S\d{2}|X\d))(\(alt\))?$/
const INVENTORY_HEADING='## موجودی و نقطهٔ شروع هر فایل'

/** Other tables of the hand-off (crop history, checksums) also start with a slot id, so only the inventory section is read. */
function inventorySection(markdown:string):string{
  const start=markdown.indexOf(INVENTORY_HEADING)
  if(start<0) return markdown
  const next=markdown.indexOf('\n## ',start+INVENTORY_HEADING.length)
  return markdown.slice(start,next<0?markdown.length:next)
}

/**
 * Reads the inventory table of HANDOFF.md. Status words decide what may be imported:
 * suspended / forbidden / missing / alternate images are listed but never imported as a slot.
 */
export function parseInventory(markdown:string):HandoffRow[]{
  const rows:HandoffRow[]=[]
  for(const line of inventorySection(markdown).split('\n')){
    const cells=line.split('|').map(cell=>cell.trim())
    if(cells.length<6||cells[0]!=='') continue
    const id=cells[1].replace(/`/g,'')
    const match=SLOT_ID.exec(id)
    if(!match) continue
    const path=cells[2].replace(/`/g,'')
    const dims=/(\d{3,5})\s*[×x]\s*(\d{3,5})/.exec(cells[3])
    const note=cells.slice(4,cells.length-1).join(' | ').trim()
    let state:HandoffState='import'
    if(match[3]) state='alternate'
    else if(!dims) state='missing'
    else if(note.includes('تعلیق')) state='suspended'
    else if(note.includes('انتشار ممنوع')) state='forbidden'
    rows.push({slotId:`${match[1]}.${match[2]}`,taxonId:match[1],code:match[2],path,width:dims?Number(dims[1]):null,height:dims?Number(dims[2]):null,note,state})
  }
  return rows
}

/** Reads the `slot | bytes | sha256` integrity table of HANDOFF.md, keyed by slot id. An `(alt)` row keeps its own key. */
export function parseChecksums(markdown:string):Map<string,{bytes:number|null;sha256:string}>{
  const out=new Map<string,{bytes:number|null;sha256:string}>()
  for(const line of markdown.split('\n')){
    const cells=line.split('|').map(cell=>cell.trim())
    if(cells.length<5||cells[0]!=='') continue
    const id=cells[1].replace(/`/g,'')
    const sha=cells[3].replace(/`/g,'')
    if(!SLOT_ID.test(id)||!/^[a-f0-9]{64}$/.test(sha)) continue
    out.set(id,{bytes:/^\d+$/.test(cells[2])?Number(cells[2]):null,sha256:sha})
  }
  return out
}

/** Splits REFERENCE.md into `slotId -> the fenced prompt text` using its `### slot — title` headings. */
export function parseBriefs(reference:string):Map<string,string>{
  const out=new Map<string,string>()
  const heads=[...reference.matchAll(/^### ([a-z]+\.(?:S\d{2}|X\d))\b.*$/gm)]
  heads.forEach((head,index)=>{
    const end=index+1<heads.length?heads[index+1].index!:reference.length
    const body=reference.slice(head.index!+head[0].length,end)
    const fenced=/```text\n([\s\S]*?)```/.exec(body)
    out.set(head[1],(fenced?fenced[1]:body).trim())
  })
  return out
}

type Field={label:string;detail:string;text:string}
const FIELD_LINE=/^([A-Z][A-Z0-9 \-/,'’]+?)(?: \(([^)]*)\))?:\s*(.*)$/

/** Labelled fields of one prompt block. Bullets belong to a field only when the label line itself carries no text. */
export function parseFields(block:string):Field[]{
  const fields:Field[]=[]
  let open:Field|null=null
  for(const raw of block.split('\n')){
    const line=raw.trimEnd()
    const head=FIELD_LINE.exec(line)
    if(head){
      open={label:head[1].trim(),detail:head[2]??'',text:head[3].trim()}
      fields.push(open)
      if(open.text) open=null
      continue
    }
    if(open&&line.startsWith('- ')){open.text+=(open.text?'; ':'')+line.slice(2).trim();continue}
    if(line.trim()==='') continue
    open=null
  }
  return fields
}

const PICK:{test:RegExp;title:string}[]=[
  {test:/^BASIS$/,title:'Basis'},
  {test:/^TIME AND PLACE$/,title:'Time and place'},
  {test:/^SETTING$/,title:'Setting'},
  {test:/^SCENE$/,title:'Scene'},
  {test:/^BEHAVIOUR$/,title:'Behaviour shown'},
  {test:/^EVIDENCE THIS SCENE RESTS ON$/,title:'Evidence the scene rests on'},
  {test:/^BONE-ANCHORED FEATURES/,title:'Bone-anchored (requested with confidence)'},
  {test:/^SIZE REFERENCE$/,title:'Size reference'},
  {test:/^VEGETATION$/,title:'Vegetation'},
  {test:/^ANIMALS$/,title:'Animals'},
  {test:/^CLIMATE AND SEASON$/,title:'Climate and season'},
  {test:/^OBJECTS AND TOOLS$/,title:'Objects and tools'},
  {test:/^DO NOT INVENT$/,title:'Left unremarkable on purpose (not knowable)'},
  {test:/^CONVENTIONS/,title:'Conventions (not findings)'},
  {test:/^CAUTION$/,title:'Caution'},
]
export const ASSUMPTIONS_PREFIX='Brief given to the image generator. These are the evidence tiers that were requested; they have not been independently verified in the finished image.'
const FIELD_LIMIT=420
const TOTAL_LIMIT=2900

const clip=(text:string,limit:number)=>{
  if(text.length<=limit) return text
  const cut=text.slice(0,limit-1)
  return `${cut.slice(0,Math.max(cut.lastIndexOf(' '),limit-60))}…`
}

/**
 * Turns the tier lists of a prompt block into the "assumptions" sheet the media gate requires (20-3000 characters).
 * Technical instructions (output size, style, forbidden props) are left out; evidence tiers and conventions are kept.
 */
export function buildAssumptions(block:string):string{
  const fields=parseFields(block)
  const parts:string[]=[ASSUMPTIONS_PREFIX]
  for(const pick of PICK){
    const field=fields.find(candidate=>pick.test.test(candidate.label))
    if(!field||!field.text) continue
    parts.push(`${pick.title}: ${clip(field.text,FIELD_LIMIT)}`)
  }
  let text=parts[0]
  for(const part of parts.slice(1)){
    if(text.length+1+part.length>TOTAL_LIMIT) break
    text+=`\n${part}`
  }
  return text
}

const ALT:Record<string,(name:string,specimen:string)=>string>={
  S02:name=>`Facial reconstruction of ${name}, three-quarter portrait`,
  S03:name=>`Reconstructed scene showing ${name} in its environment`,
  S10:name=>`Reconstructed habitat of ${name}`,
  S11:name=>`Reconstructed activity scene of ${name}`,
  X1:(name,specimen)=>`Facial reconstruction of ${name}${specimen?` based on ${specimen}`:''}`,
}
export const altTextFor=(code:string,name:string,specimenRef:string)=>(ALT[code]??((n:string)=>`Reconstruction of ${n}`))(name,specimenRef)

export const CAPTION_NOTE='AI-assisted scientific reconstruction, not a fossil photograph. The assumptions list says what is bone-anchored and what is convention.'

const ratio=(width:number,height:number)=>width/height
/** The importer crops to the slot ratio; this says whether that crop would be larger than the tolerance the pipeline ignores (2%). */
export const needsCrop=(width:number,height:number,slotAspect:number)=>Math.abs(ratio(width,height)-slotAspect)/slotAspect>0.02

/**
 * Only the S02 portrait may become a species' default picture. `X1` slots can also carry the profile-portrait role
 * (for example a reconstruction of one named specimen); publishing one of them must not replace the species portrait.
 */
export const isDefaultPortraitSlot=(code:string)=>code==='S02'
