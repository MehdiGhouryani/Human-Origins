import type {MediaRole} from './contracts'

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
