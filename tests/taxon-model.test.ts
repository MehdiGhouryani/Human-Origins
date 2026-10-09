import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {featured} from '../content/featured'
import {adjacentTaxon,groupTaxaByClade,isInferredNode,orderTaxa,taxaAliveAt,taxonKind,taxonPosition,taxonStatusLabel,type TaxonLike} from '../domain/taxon-model'
import {ALLOWED_TYPES,RELATION_LEGEND_ORDER,RELATION_SEMANTICS,impliesDescent} from '../domain/relationship-semantics'
import {FACT_TOPIC_BY_LABEL,factTopic,factsByTopic} from '../domain/facts'
import {computeTreeLayout} from '../presentation/treeLayout'

const view=(t:(typeof contentCatalog.taxa)[number]):TaxonLike=>({id:String(t.id),name:t.name,short:t.short,group:t.group,date:t.date,start:t.start,end:t.end,status:t.status,taxonomy:t.taxonomy,inferred:t.inferred})
const all=contentCatalog.taxa.map(view)

describe('canonical taxon model',()=>{
  it('keeps every catalogue taxon in every derived view (no component-level whitelist)',()=>{
    expect(orderTaxa(all)).toHaveLength(contentCatalog.taxa.length)
    expect(groupTaxaByClade(all).flatMap(g=>g.taxa)).toHaveLength(contentCatalog.taxa.length)
    const layout=computeTreeLayout(all,contentCatalog.relationships.map(r=>({id:String(r.id),from:String(r.from),to:String(r.to),type:r.type,eventAgeMa:r.eventAgeMa})))
    expect(Object.keys(layout.nodes).sort()).toEqual(all.map(t=>t.id).sort())
  })
  it('propagates a newly added taxon to ordering, grouping, position, time queries and layout without other edits',()=>{
    const added:TaxonLike={id:'brand-new',name:'Homo novus',short:'H. novus',group:'Homo',date:'~1.0–0.9 Ma',start:1,end:0.9,status:'extinct',taxonomy:{rank:'species',taxonomicStatus:'accepted'}}
    const next=[...all,added]
    expect(orderTaxa(next).map(t=>t.id)).toContain('brand-new')
    expect(groupTaxaByClade(next).find(g=>g.name==='Homo')!.taxa.map(t=>t.id)).toContain('brand-new')
    expect(taxonPosition(next,'brand-new').total).toBe(all.length+1)
    expect(taxaAliveAt(next,0.95).map(t=>t.id)).toContain('brand-new')
    expect(computeTreeLayout(next).nodes['brand-new']).toBeDefined()
    expect(adjacentTaxon(next,'brand-new',1)).toBeDefined()
  })
  it('orders oldest first and deterministically',()=>{
    const ids=orderTaxa(all).map(t=>t.id);expect(ids).toEqual(orderTaxa([...all].reverse()).map(t=>t.id))
    const starts=orderTaxa(all).map(t=>t.start);expect(starts).toEqual([...starts].sort((a,b)=>b-a))
  })
  it('names at least one clade per group present in the data and orders clades by first appearance',()=>{
    const groups=groupTaxaByClade(all);expect(new Set(groups.map(g=>g.name))).toEqual(new Set(all.map(t=>t.group)))
    const firsts=groups.map(g=>g.firstAppearanceMa);expect(firsts).toEqual([...firsts].sort((a,b)=>b-a))
  })
})

describe('inferred nodes',()=>{
  it('flags only the common-ancestor construct as inferred, not Denisovans (also an informal node)',()=>{
    expect(all.filter(isInferredNode).map(t=>t.id)).toEqual(['common'])
    const denisovan=all.find(t=>t.id==='denisovan')!
    expect(denisovan.taxonomy.rank).toBe('informal-node');expect(isInferredNode(denisovan)).toBe(false)
  })
  it('never labels an inferred node "Extinct"',()=>{
    const common=all.find(t=>t.id==='common')!
    expect(taxonStatusLabel(common)).toBe('Inferred ancestral node');expect(taxonStatusLabel(common)).not.toMatch(/extinct/i);expect(taxonKind(common)).toBe('inferred-node')
  })
  it('labels informal and debated taxa distinctly from accepted species',()=>{
    expect(taxonStatusLabel(all.find(t=>t.id==='denisovan')!)).toMatch(/informal/i)
    expect(taxonStatusLabel(all.find(t=>t.id==='ergaster')!)).toMatch(/debated/i)
    expect(taxonStatusLabel(all.find(t=>t.id==='sapiens')!)).toBe('Living')
    expect(taxonStatusLabel(all.find(t=>t.id==='erectus')!)).toBe('Extinct')
  })
  it('excludes inferred nodes from "alive at" queries',()=>{expect(taxaAliveAt(all,7).map(t=>t.id)).not.toContain('common')})
})

describe('relationship semantics',()=>{
  it('gives every relationship an explicit, valid relation class that agrees with its drawing type',()=>{
    for(const r of contentCatalog.relationships){
      expect(RELATION_SEMANTICS[r.relation],String(r.id)).toBeDefined()
      expect(ALLOWED_TYPES[r.relation],`${String(r.id)}: ${r.relation} under type ${r.type}`).toContain(r.type)
    }
  })
  it('describes what each class does NOT claim and never promises a proven lineage',()=>{
    for(const key of RELATION_LEGEND_ORDER){const s=RELATION_SEMANTICS[key];expect(s.meaning.length).toBeGreaterThan(20);expect(s.doesNotClaim.length).toBeGreaterThan(10);expect(s.meaning).not.toMatch(/\b(proven|definitely|established|certain)\b/i);expect(s.doesNotClaim).toMatch(/^Not\b/)}
    expect(new Set(RELATION_LEGEND_ORDER).size).toBe(Object.keys(RELATION_SEMANTICS).length)
  })
  it('uses a distinct non-colour encoding (dash or marker) for every class that is not plain context',()=>{
    const codes=RELATION_LEGEND_ORDER.map(k=>`${RELATION_SEMANTICS[k].stroke.dash??'solid'}|${RELATION_SEMANTICS[k].stroke.marker}`);expect(new Set(codes).size).toBe(codes.length)
  })
  it('does not treat gene flow, sister lineages or unresolved placements as descent',()=>{
    for(const k of ['gene-flow','sister-lineage','unresolved-placement','debated-origin','branch-context'] as const) expect(impliesDescent({relation:k})).toBe(false)
  })
  it('keeps the existing data distinction: a "likely ancestor" label is no longer collapsed into "possible / debated"',()=>{
    const rel=contentCatalog.relationships.find(r=>String(r.id)==='rel-anamensis-afarensis-4')!;expect(rel.relation).toBe('likely-ancestor')
    const sister=contentCatalog.relationships.find(r=>String(r.to)==='denisovan'&&r.type!=='gene-flow')!;expect(sister.relation).toBe('sister-lineage')
  })
  it('only references taxa that exist and never relates a taxon to itself',()=>{
    const ids=new Set(contentCatalog.taxa.map(t=>String(t.id)))
    for(const r of contentCatalog.relationships){expect(ids.has(String(r.from))).toBe(true);expect(ids.has(String(r.to))).toBe(true);expect(String(r.from)).not.toBe(String(r.to))}
  })
})

describe('fact vocabulary',()=>{
  it('registers every fact label used in the catalogue (an unregistered label fails here instead of vanishing from a tab)',()=>{
    const unknown=new Set<string>();for(const t of contentCatalog.taxa) for(const [label] of t.facts) if(!(label in FACT_TOPIC_BY_LABEL)) unknown.add(label)
    expect([...unknown]).toEqual([])
  })
  it('falls back to "other" for unknown labels and keeps them',()=>{expect(factTopic('Favourite colour')).toBe('other');expect(factsByTopic([['Favourite colour','x'],['Tools','y']],'tools')).toEqual([['Tools','y']])})
})

describe('editorial defaults',()=>{
  it('reference taxa that exist in the catalogue',()=>{
    const ids=new Set(contentCatalog.taxa.map(t=>String(t.id)))
    expect(ids.has(String(featured.defaultTaxonId))).toBe(true)
    for(const id of featured.compareTaxonIds) expect(ids.has(String(id))).toBe(true)
    for(const id of [featured.defaultTaxonId,...featured.compareTaxonIds]) expect(all.find(t=>t.id===String(id))!.inferred).toBeUndefined()
  })
})
