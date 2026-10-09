import {isSlotOpen,slotGroup,slotsForTaxon,validateSlotMedia,type MediaSlotDefinition,type SlotGroupId} from '../../domain/media-slots'
import type {ExplorerMedia} from './types'

/**
 * Which image fills each named slot of a species page, and how the slot is shown.
 *  - `show`:   an image is live in the slot;
 *  - `frame`:  no image yet, show a neutral frame (portrait and hero for everyone; every open slot for an admin preview);
 *  - `locked`: admin preview only, the slot is on hold (for example no specimen record yet);
 *  - `hidden`: nothing is rendered.
 * Slots that are not applicable never appear in the result. Built-in schematic plates fill only the avatar and portrait.
 */
export type SlotVisibility='show'|'frame'|'locked'|'hidden'
export type SlotState={
  slot:MediaSlotDefinition
  group:SlotGroupId
  media:ExplorerMedia|null
  source:'cms'|'built-in'|null
  visibility:SlotVisibility
}
export type BuiltInPlates={avatar?:ExplorerMedia;portrait?:ExplorerMedia}

export function resolveSlots(input:{slots:readonly MediaSlotDefinition[];media:readonly ExplorerMedia[];taxonId:string;adminPreview:boolean;builtIns?:BuiltInPlates}):SlotState[]{
  const {slots,media,taxonId,adminPreview,builtIns={}}=input
  const bySlot=new Map<string,ExplorerMedia>()
  for(const item of media){
    if(!item.slotId||item.placeholder) continue
    const definition=slots.find(slot=>String(slot.id)===String(item.slotId))
    // Defence in depth: an image that breaks the slot rules never fills the slot, even if it was published.
    if(!definition||validateSlotMedia(item,definition).length>0) continue
    if(!bySlot.has(String(item.slotId))) bySlot.set(String(item.slotId),item)
  }
  return slotsForTaxon(slots,taxonId).filter(slot=>slot.applicable).map(slot=>{
    const group=slotGroup(slot)
    const live=bySlot.get(String(slot.id))
    const builtIn=slot.series==='S01'?builtIns.avatar:slot.series==='S02'?builtIns.portrait:undefined
    const found=live??builtIn??null
    const source:SlotState['source']=live?'cms':builtIn?'built-in':null
    let visibility:SlotVisibility
    if(!isSlotOpen(slot)) visibility=adminPreview?'locked':'hidden'
    else if(found) visibility='show'
    else if(slot.publicRule==='always'||adminPreview) visibility='frame'
    else visibility='hidden'
    return {slot,group,media:found,source,visibility}
  })
}

/** The visible slots of one gallery group, in catalog order. */
export const slotsInGroup=(states:readonly SlotState[],group:SlotGroupId):SlotState[]=>states.filter(state=>state.group===group&&state.visibility!=='hidden')
