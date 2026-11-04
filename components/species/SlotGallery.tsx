import MediaImage from '../MediaImage'
import type {ReactNode} from 'react'
import {evidenceClassLabel,SLOT_GROUP_LABEL,SLOT_GROUP_ORDER} from '../../domain/media-slots'
import {resolveMediaSrc} from '../../presentation/mediaDelivery'
import {slotsInGroup,type SlotState} from '../../features/explorer/slots'
import type {ExplorerMedia} from '../../features/explorer/types'

const KIND_LABEL={'specimen-photo':'Specimen photograph','cast-photo':'Cast / museum photograph',reconstruction:'Reconstruction','context-schematic':'Context schematic'} as const
const labelOf=(media:ExplorerMedia)=>media.evidenceClass?evidenceClassLabel(media.evidenceClass):KIND_LABEL[media.kind]
/** The catalog title without the “Taxon:” prefix, for captions. */
const plainTitle=(title:string)=>title.replace(/^[^:]+:\s*/,'')
/**
 * Wording a visitor reads. Internal slot-group names ("dossier hero") never reach the public page; a header slot is
 * simply "Header image". Admin frames keep the internal title on purpose.
 */
export const publicSlotTitle=(slot:{title:string;series:string})=>{
  if(slot.series==='S03') return 'Header image'
  const text=plainTitle(slot.title)
  return text.charAt(0).toUpperCase()+text.slice(1)
}
const ratioStyle=(state:SlotState)=>state.slot.width&&state.slot.height?{aspectRatio:`${state.slot.width} / ${state.slot.height}`}:{aspectRatio:'4 / 3'}

/** One slot: a live image with its evidence caption, or a frame. */
export function SlotFigure({state,sizes}:{state:SlotState;sizes:string}){
  const {slot,media,visibility}=state
  const title=publicSlotTitle(slot)
  if(visibility==='show'&&media){
    return <figure className={`sp-figure sp-figure-${slot.evidenceClass}`} data-slot={String(slot.id)}>
      <div className="sp-figure-frame" style={ratioStyle(state)}><MediaImage src={resolveMediaSrc(media,'card',slot.series==='S03'?1280:640)} alt={media.alt} sizes={sizes} className="dossier-gallery-image" priority={slot.series==='S03'}/></div>
      <figcaption>
        <b className={`sp-class sp-class-${media.evidenceClass??'x'}`}>{labelOf(media)}</b>
        <span className="sp-figure-title">{title}</span>
        {media.specimenRef&&<span className="sp-figure-meta">{media.specimenRef}</span>}
        <span className="sp-figure-meta">{media.credit}{media.license?` · ${media.license}`:''}</span>
        {media.evidenceClass==='D'&&media.assumptions&&<details className="sp-assumptions">
          <summary>Assumptions</summary>
          <p>{media.assumptions}</p>
          {media.generator&&<p className="sp-figure-meta">Made with {media.generator.name}{media.generator.version?` ${media.generator.version}`:''}, {media.generator.date}.{media.review?` Reviewed by ${media.review.reviewer}, ${media.review.date}.`:''}</p>}
        </details>}
      </figcaption>
    </figure>
  }
  if(visibility==='locked') return <div className="sp-frame sp-frame-locked" style={ratioStyle(state)} data-slot={String(slot.id)}>
    <span className="sp-frame-code">{String(slot.id)}</span>
    <span className="sp-frame-text">On hold</span>
    <span className="sp-frame-meta">{slot.holdReason}</span>
  </div>
  // frame: public (portrait/hero) or admin preview (every open slot)
  return <div className="sp-frame" style={ratioStyle(state)} data-slot={String(slot.id)} role="img" aria-label={`Image in preparation: ${title}`}>
    <span className="sp-frame-text">Image in preparation</span>
    <span className="sp-frame-meta">{title}</span>
  </div>
}

/** Admin preview adds the slot code, size and an Upload link to every frame. */
export function AdminSlotFrame({state}:{state:SlotState}){
  const {slot}=state
  return <div className="sp-frame sp-frame-admin" style={ratioStyle(state)} data-slot={String(slot.id)}>
    <span className="sp-frame-code">{String(slot.id)}</span>
    <span className="sp-frame-text">Empty slot · {plainTitle(slot.title)}</span>
    <span className="sp-frame-meta">{slot.ratio} · {slot.width??'—'}{slot.height?`×${slot.height}`:' px wide'} · {evidenceClassLabel(slot.evidenceClass)}</span>
    <a className="sp-frame-upload" href={`/admin/media/slots?slot=${encodeURIComponent(String(slot.id))}`}>Upload</a>
  </div>
}

function Cell({state,adminPreview,sizes}:{state:SlotState;adminPreview:boolean;sizes:string}){
  if(adminPreview&&state.visibility==='frame') return <AdminSlotFrame state={state}/>
  return <SlotFigure state={state} sizes={sizes}/>
}

/** The wide image at the top of the page (slot S03). Empty: a neutral frame for everyone. */
export function SlotHero({states,adminPreview}:{states:readonly SlotState[];adminPreview:boolean}){
  const [state]=slotsInGroup(states,'hero')
  if(!state) return null
  return <div className="sp-hero" id="hero-image"><Cell state={state} adminPreview={adminPreview} sizes="(max-width: 1024px) 100vw, 900px"/></div>
}

/** Images placed inside a narrative section (habitat, behaviour, specimen reconstruction), at reading width. */
export function SceneFigures({states,adminPreview}:{states:readonly SlotState[];adminPreview:boolean}){
  if(!states.length) return null
  return <div className="sp-scenes">{states.map(state=><div key={String(state.slot.id)} className={`sp-scene sp-scene-${state.slot.series}`}><Cell state={state} adminPreview={adminPreview} sizes="(max-width: 900px) 100vw, 760px"/></div>)}</div>
}

/**
 * The wide scene image behind the page header (slot S03). It renders only when live; an empty hero keeps its
 * neutral frame lower on the page, so the header never looks broken.
 */
export function HeroBanner({state}:{state:SlotState|undefined}){
  if(!state||state.visibility!=='show'||!state.media) return null
  const {media,slot}=state
  return <figure className="dossier-banner" data-slot={String(slot.id)}>
    <MediaImage src={resolveMediaSrc(media,'detail',1600)} alt={media.alt} sizes="100vw" priority className="dossier-banner-image"/>
    <figcaption className="dossier-banner-caption">
      <b className={`sp-class sp-class-${media.evidenceClass??'x'}`}>{labelOf(media)}</b>
      <span>{media.credit}</span>
      {media.evidenceClass==='D'&&media.assumptions&&<details className="sp-assumptions">
        <summary>Assumptions</summary>
        <p>{media.assumptions}</p>
        {media.generator&&<p className="sp-figure-meta">Made with {media.generator.name}{media.generator.version?` ${media.generator.version}`:''}, {media.generator.date}.{media.review?` Reviewed by ${media.review.reviewer}, ${media.review.date}.`:''}</p>}
      </details>}
    </figcaption>
  </figure>
}

/** Groups that still have something to show once inline images and the header banner are taken out. */
function galleryGroups(states:readonly SlotState[],exclude:ReadonlySet<string>){
  return SLOT_GROUP_ORDER.map(group=>({group,items:slotsInGroup(states,group).filter(state=>!exclude.has(String(state.slot.id)))})).filter(entry=>entry.items.length>0)
}
export const galleryHasContent=(states:readonly SlotState[],extras:readonly ExplorerMedia[],exclude:ReadonlySet<string>)=>galleryGroups(states,exclude).length>0||extras.length>0

/** Images grouped by what they show; hidden slots render nothing. Legacy images without a slot follow as “More images”. */
export default function SlotGallery({states,extras,adminPreview,exclude=new Set<string>()}:{states:readonly SlotState[];extras:readonly ExplorerMedia[];adminPreview:boolean;exclude?:ReadonlySet<string>}){
  const groups=galleryGroups(states,exclude)
  if(!groups.length&&!extras.length) return null
  return <section className="sp-section sp-gallery" id="images" aria-labelledby="gallery-h">
    <h2 id="gallery-h">Images</h2>
    {groups.map(({group,items})=><div key={group} className="sp-gallery-group">
      <h3>{SLOT_GROUP_LABEL[group]}</h3>
      <div className="sp-gallery-grid">{items.map(state=><Cell key={String(state.slot.id)} state={state} adminPreview={adminPreview} sizes="(max-width: 700px) 100vw, 320px"/>)}</div>
    </div>)}
    {extras.length>0&&<div className="sp-gallery-group">
      <h3>More images</h3>
      <div className="dossier-gallery">{extras.map(media=><figure key={String(media.id)}>
        <div className="dossier-gallery-frame"><MediaImage src={resolveMediaSrc(media,'card',640)} alt={media.alt} sizes="(max-width: 700px) 100vw, 320px" className="dossier-gallery-image"/></div>
        <figcaption><b>{labelOf(media)}</b><span>{media.credit}</span></figcaption>
      </figure>)}</div>
    </div>}
  </section>
}

export type {ReactNode}
