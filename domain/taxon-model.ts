/**
 * Canonical, pure queries over the taxon catalogue. Every view (tree, navigator, timeline, search, journey, compare)
 * derives its taxa from here; no component may keep its own list of taxon ids.
 */
export type TaxonLike={
  id:string
  name:string
  short:string
  group:string
  date:string
  start:number
  end:number
  status:'living'|'extinct'
  taxonomy:{rank:string;taxonomicStatus:string}
  inferred?:true
}

/** An inferred node (e.g. a common ancestor) is a model construct, not a named fossil taxon. */
export const isInferredNode=(taxon:Pick<TaxonLike,'inferred'>):boolean=>taxon.inferred===true
export const isInformalTaxon=(taxon:Pick<TaxonLike,'taxonomy'>):boolean=>taxon.taxonomy.taxonomicStatus==='informal'

export type TaxonKind='inferred-node'|'informal-population'|'debated-species'|'species'
export function taxonKind(taxon:Pick<TaxonLike,'taxonomy'|'inferred'>):TaxonKind{
  if(isInferredNode(taxon)) return 'inferred-node'
  if(taxon.taxonomy.taxonomicStatus==='informal') return 'informal-population'
  if(taxon.taxonomy.taxonomicStatus==='debated') return 'debated-species'
  return 'species'
}

/** Status wording derived from the model. An inferred node is never labelled "Extinct" because it is not a recorded taxon. */
export function taxonStatusLabel(taxon:Pick<TaxonLike,'status'|'taxonomy'|'inferred'>):string{
  const kind=taxonKind(taxon)
  if(kind==='inferred-node') return 'Inferred ancestral node'
  const life=taxon.status==='living'?'Living':'Extinct'
  if(kind==='informal-population') return `${life} · informal population`
  if(kind==='debated-species') return `${life} · species status debated`
  return life
}

/** Oldest first; ties broken by end then id so ordering is fully deterministic. */
export const compareTaxaChronologically=(a:Pick<TaxonLike,'id'|'start'|'end'>,b:Pick<TaxonLike,'id'|'start'|'end'>)=>b.start-a.start||b.end-a.end||a.id.localeCompare(b.id)
export const orderTaxa=<T extends Pick<TaxonLike,'id'|'start'|'end'>>(taxa:readonly T[]):T[]=>[...taxa].sort(compareTaxaChronologically)

export type TaxonGroup<T>={name:string;firstAppearanceMa:number;taxa:T[]}
/** Clades ordered by first appearance. Group names and order come from the data, never from a fixed list. */
export function groupTaxaByClade<T extends Pick<TaxonLike,'id'|'start'|'end'|'group'>>(taxa:readonly T[]):TaxonGroup<T>[]{
  const groups=new Map<string,TaxonGroup<T>>()
  for(const taxon of orderTaxa(taxa)){
    const group=groups.get(taxon.group)??{name:taxon.group,firstAppearanceMa:taxon.start,taxa:[]}
    group.taxa.push(taxon); group.firstAppearanceMa=Math.max(group.firstAppearanceMa,taxon.start); groups.set(taxon.group,group)
  }
  return [...groups.values()].sort((a,b)=>b.firstAppearanceMa-a.firstAppearanceMa||a.name.localeCompare(b.name))
}

/** Taxa whose documented range contains `ageMa` (Ma). Inferred nodes are excluded: they have no recorded range of their own. */
export const taxaAliveAt=<T extends TaxonLike>(taxa:readonly T[],ageMa:number):T[]=>taxa.filter(t=>!isInferredNode(t)&&ageMa<=t.start&&ageMa>=t.end)

/** Position (1-based) and total in the canonical chronological order, for "7 of 18" indicators. */
export function taxonPosition<T extends Pick<TaxonLike,'id'|'start'|'end'>>(taxa:readonly T[],id:string):{index:number;total:number}{
  const ordered=orderTaxa(taxa); return {index:ordered.findIndex(t=>t.id===id)+1,total:ordered.length}
}
/** Previous/next taxon in the canonical order (wraps nowhere: undefined at the ends). */
export function adjacentTaxon<T extends Pick<TaxonLike,'id'|'start'|'end'>>(taxa:readonly T[],id:string,step:1|-1):T|undefined{
  const ordered=orderTaxa(taxa); const i=ordered.findIndex(t=>t.id===id); return i<0?undefined:ordered[i+step]
}
