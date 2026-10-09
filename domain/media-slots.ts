import type {MediaAsset,MediaEvidenceClass,MediaKind,MediaRole} from './contracts'
import type {MediaSlotId,TaxonId} from './ids'

/** Minimal shape both canonical taxa and explorer projections satisfy. */
type SlotTaxon={defaultMediaId:string;treeIconMediaId?:string;mediaIds:readonly string[]}
type SlotMedia={id:string;roles:readonly MediaRole[]}

/**
 * Tree-avatar fallback chain: explicit treeIconMediaId → first media carrying the `tree-thumbnail` role → portrait.
 * Returns an id that is guaranteed to be one of the taxon's media ids (or the default media id).
 */
export function resolveTreeIconId(taxon:SlotTaxon,mediaById:ReadonlyMap<string,SlotMedia>):string{
  const explicit=taxon.treeIconMediaId
  if(explicit && taxon.mediaIds.includes(explicit) && mediaById.has(explicit)) return explicit
  const byRole=taxon.mediaIds.find(id=>mediaById.get(id)?.roles.includes('tree-thumbnail'))
  return byRole ?? taxon.defaultMediaId
}

export function resolvePortraitId(taxon:SlotTaxon):string{return taxon.defaultMediaId}

/** Built-in sample media follow a fixed id convention so taxa and media never drift apart. */
export const samplePortraitId=(taxonId:string)=>`media:${taxonId}`
export const sampleIconId=(taxonId:string)=>`media:${taxonId}-icon`


/* ------------------------------------------------------------------------------------------------
 * Named image slots (generated from tools/images by `npm run images:build` into
 * content/media-slots.generated.ts). A slot is one place on a species page that an admin fills with
 * an image; the same ids are the codes of the image production catalog.
 * ---------------------------------------------------------------------------------------------- */

export type SlotEvidenceClass=MediaEvidenceClass
/** `always`: the public page shows a frame even when empty (decision D-19); `whenFilled`: hidden until an image is live. */
export type SlotPublicRule='always'|'whenFilled'

export type MediaSlotDefinition={
  id:MediaSlotId
  /** Null for site-wide comparative slots (`compare.C01`). */
  taxonId:TaxonId|null
  series:string
  title:string
  role:MediaRole
  kind:MediaKind
  evidenceClass:SlotEvidenceClass
  /** Human-readable ratio from the catalog (`4:5`, `16:9`, `free (SVG)`). */
  ratio:string
  /** Target pixel size; `height` is null for vector slots, which only fix a fallback width. */
  width:number|null
  height:number|null
  /** False when the evidence does not exist (for example stone tools for Sahelanthropus): the slot never renders. */
  applicable:boolean
  notApplicableReason:string
  publicRule:SlotPublicRule
  /** Class-D reconstructions must be reviewed before they can go live. */
  needsReview:boolean
  /** Non-empty while the slot must not be published (for example a taxon without a specimen record). */
  holdReason:string
}

/** width / height for fixed-ratio slots, null for free (vector) slots. */
export const slotAspect=(slot:Pick<MediaSlotDefinition,'width'|'height'>):number|null=>
  slot.width&&slot.height?slot.width/slot.height:null

export const slotsForTaxon=(slots:readonly MediaSlotDefinition[],taxonId:string):MediaSlotDefinition[]=>
  slots.filter(slot=>slot.taxonId!==null&&String(slot.taxonId)===taxonId)

/** Slots that can ever be filled: applicable and not on hold. */
export const isSlotOpen=(slot:MediaSlotDefinition):boolean=>slot.applicable&&slot.holdReason===''

export const findSlot=(slots:readonly MediaSlotDefinition[],id:string):MediaSlotDefinition|undefined=>
  slots.find(slot=>String(slot.id)===id)

export type SlotRuleViolation={code:string;message:string}

const KINDS_BY_CLASS:Record<MediaEvidenceClass,readonly MediaKind[]>={
  A:['context-schematic'],B:['context-schematic'],C:['specimen-photo','cast-photo'],D:['reconstruction'],
}
const CLASS_NAME:Record<MediaEvidenceClass,string>={A:'Data-derived diagram',B:'Diagram from a licensed scan',C:'Specimen photograph',D:'Reconstruction'}
export const evidenceClassLabel=(value:MediaEvidenceClass):string=>CLASS_NAME[value]

/**
 * Rules a media asset must satisfy to fill a slot and go live. Shared by the content audit and the CMS API, so the
 * CMS cannot publish what the release audit would reject.
 */
/** The fields of an image that the slot rules look at (a `MediaAsset` and an `ExplorerMedia` both qualify). */
export type SlotRuleSubject=Pick<MediaAsset,'subject'|'roles'|'kind'|'credit'|'license'|'rightsStatus'|'slotId'|'evidenceClass'|'specimenRef'|'assumptions'|'generator'|'review'>

export function validateSlotMedia(media:SlotRuleSubject,slot:MediaSlotDefinition|undefined):SlotRuleViolation[]{
  if(!slot) return [{code:'SLOT_UNKNOWN',message:`Slot ${String(media.slotId)} does not exist.`}]
  const out:SlotRuleViolation[]=[]
  const add=(code:string,message:string)=>out.push({code,message})
  if(!slot.applicable) add('SLOT_NOT_APPLICABLE',`Slot ${String(slot.id)} is not applicable: ${slot.notApplicableReason}`)
  if(slot.holdReason) add('SLOT_ON_HOLD',`Slot ${String(slot.id)} is on hold: ${slot.holdReason}`)
  if(slot.taxonId!==null && !(media.subject.type==='taxon'&&String(media.subject.id)===String(slot.taxonId))) add('SLOT_SUBJECT_MISMATCH',`Slot ${String(slot.id)} belongs to taxon ${String(slot.taxonId)}.`)
  if(!media.roles.includes(slot.role)) add('SLOT_ROLE_MISSING',`Slot ${String(slot.id)} needs the role ${slot.role}.`)
  if(media.evidenceClass!==slot.evidenceClass) add('SLOT_CLASS_MISMATCH',`Slot ${String(slot.id)} requires evidence class ${slot.evidenceClass}.`)
  if(!KINDS_BY_CLASS[slot.evidenceClass].includes(media.kind)) add('SLOT_KIND_MISMATCH',`Evidence class ${slot.evidenceClass} requires kind ${KINDS_BY_CLASS[slot.evidenceClass].join(' or ')}.`)
  if(slot.evidenceClass==='C'){
    if(!(media.specimenRef??'').trim()) add('SLOT_C_SPECIMEN_REF','A specimen photograph must name the specimen, site or artefact it shows.')
    if(!(media.license??'').trim()) add('SLOT_C_LICENSE','A specimen photograph needs a licence.')
    if(!media.credit.trim()) add('SLOT_C_CREDIT','A specimen photograph needs a credit line.')
    if(media.rightsStatus==='review-required'||media.rightsStatus==='unknown') add('SLOT_C_RIGHTS',`Rights status "${media.rightsStatus}" does not allow publication.`)
  }
  if(slot.evidenceClass==='B' && !(media.license??'').trim()) add('SLOT_B_LICENSE','A diagram built from a scan or template needs the licence of that input.')
  if(slot.evidenceClass==='D'){
    const assumptions=(media.assumptions??'').trim()
    if(assumptions.length<20) add('SLOT_D_ASSUMPTIONS','A reconstruction needs its assumptions sheet (at least 20 characters).')
    if(assumptions.length>3000) add('SLOT_D_ASSUMPTIONS_LONG','The assumptions sheet is longer than 3,000 characters.')
    if(!media.generator||!media.generator.name.trim()||!media.generator.date.trim()) add('SLOT_D_GENERATOR','A reconstruction needs the generator (or artist) name and date.')
    if(!media.review||media.review.decision!=='approve'||!media.review.reviewer.trim()||!media.review.date.trim()) add('SLOT_D_UNREVIEWED','A reconstruction can only go live after a reviewer approved it (name, date, decision “approve”).')
  }
  return out
}

/** Where a slot is shown on a species page. `header` slots live in the page header, not in the gallery. */
export type SlotGroupId='header'|'hero'|'scenes'|'specimens'|'diagrams'|'tools'|'places'
export const SLOT_GROUP_LABEL:Record<Exclude<SlotGroupId,'header'|'hero'>,string>={
  scenes:'Reconstructions and habitat',
  specimens:'Specimens',
  diagrams:'Anatomy and diagrams',
  tools:'Stone tools',
  places:'Sites and maps',
}
export const SLOT_GROUP_ORDER:readonly Exclude<SlotGroupId,'header'|'hero'>[]=['scenes','specimens','diagrams','tools','places']

export function slotGroup(slot:Pick<MediaSlotDefinition,'series'|'evidenceClass'|'role'>):SlotGroupId{
  const {series}=slot
  if(series==='S01'||series==='S02') return 'header'
  if(series==='S03') return 'hero'
  if(/^L\d/.test(series)) return 'tools'
  if(series==='S10'||series==='S11') return 'scenes'
  if(series==='S12'||series==='S13') return 'places'
  if(slot.evidenceClass==='D') return 'scenes'
  if(slot.evidenceClass==='C') return 'specimens'
  return 'diagrams'
}
