import 'server-only'
import {MEDIA_SLOTS} from '../../../../../content/media-slots.generated'
import {contentCatalog} from '../../../../../content/catalog'
import {featured} from '../../../../../content/featured'
import {slotGroup,slotsForTaxon} from '../../../../../domain/media-slots'
import {listMedia} from '../../../../../infrastructure/cms/store'
import {requireAdminSession} from '../../../../../infrastructure/cms/requireSession'
import SlotMatrix,{type SlotCardData,type SlotMediaData} from './SlotMatrix'
import './slots.css'

export const dynamic='force-dynamic'

export default async function AdminSlotsPage({searchParams}:{searchParams:Promise<{taxon?:string;slot?:string}>}){
  await requireAdminSession()
  const {taxon:taxonParam,slot:slotParam}=await searchParams
  const core=featured.mainPathTaxonIds.map(String)
  const taxa=[...core,...contentCatalog.taxa.map(item=>String(item.id)).filter(id=>!core.includes(id))].map(id=>({id,name:contentCatalog.taxa.find(item=>String(item.id)===id)?.name??id,core:core.includes(id)}))
  const slotTaxon=slotParam?.split('.')[0]
  const taxon=[slotTaxon,taxonParam].find(id=>id&&taxa.some(item=>item.id===id))??core[0]
  const cards:SlotCardData[]=slotsForTaxon(MEDIA_SLOTS,taxon).filter(slot=>slot.applicable).map(slot=>({
    id:String(slot.id),title:slot.title,series:slot.series,group:slotGroup(slot),role:slot.role,evidenceClass:slot.evidenceClass,ratio:slot.ratio,width:slot.width,height:slot.height,
    locked:slot.holdReason!=='',holdReason:slot.holdReason,needsReview:slot.needsReview,
  }))
  const media:SlotMediaData[]=listMedia().filter(item=>item.subjectId===taxon&&item.slotId).map(item=>({
    id:item.id,slotId:item.slotId!,status:item.status==='published'?'published':'draft',alt:item.alt,note:item.note,credit:item.credit,license:item.license,rightsStatus:item.rightsStatus,
    publicationStatus:item.publicationStatus,specimenRef:item.specimenRef,assumptions:item.assumptions,generator:item.generator,review:item.review,
    thumb:item.variants.find(variant=>variant.purpose==='thumbnail')?.src??item.variants[0]?.src??'',
  }))
  const sources=contentCatalog.sources.map(item=>({id:String(item.id),title:item.title}))
  return <>
    <h1>Image slots</h1>
    <p>Each frame is a place on a species page. Fill it from here: the image is cropped to the slot&apos;s ratio, checked against the evidence rules of its class, and goes live only when it passes. <a href="/admin/media">Other images</a></p>
    <SlotMatrix taxa={taxa} taxon={taxon} cards={cards} media={media} sources={sources} initialSlot={slotParam&&cards.some(card=>card.id===slotParam)?slotParam:''}/>
  </>
}
