export type CopySlot={id:string;label:string;appliesTo:string;defaultValue:string;multiline:boolean}

export const copyRegistry:readonly CopySlot[]=[
  {id:'hero.tagline',label:'Hero tagline',appliesTo:'Homepage hero',defaultValue:'Different branches. One story.',multiline:false},
  {id:'hero.intro',label:'Hero introduction',appliesTo:'Homepage hero',defaultValue:'Explore relationships between human species, their shared history, and the evidence that connects us.',multiline:true},
  {id:'evidence.heading',label:'Evidence tab heading',appliesTo:'Explorer · Evidence mode',defaultValue:'Evidence you can trace.',multiline:false},
  {id:'evidence.intro',label:'Evidence tab introduction',appliesTo:'Explorer · Evidence mode',defaultValue:'Claims are linked to evidence records and then to named sources. Status labels separate documented records from context and disputed interpretation.',multiline:true},
  {id:'migration.heading',label:'Migration tab heading',appliesTo:'Explorer · Migration mode',defaultValue:'Human dispersal, rendered as a living globe.',multiline:false},
] as const

export const copySlotIds=new Set(copyRegistry.map(slot=>slot.id))

const defaultsById=new Map(copyRegistry.map(slot=>[slot.id,slot.defaultValue]))

/** Returns the published CMS text for a slot, or the registry's built-in default when none is published -- the single source of truth for fallback wording. */
export function getCopy(copy:Readonly<Record<string,string>>,slotId:string):string{
  const value=copy[slotId]
  if(value && value.trim()) return value
  const fallback=defaultsById.get(slotId)
  if(fallback===undefined) throw new Error(`Unknown copy slot: ${slotId}`)
  return fallback
}
