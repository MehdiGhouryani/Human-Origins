import type {TaxonNameRecord} from '../domain/research-model'
import {asSourceId,asTaxonId,asTaxonNameId} from '../domain/ids'
import {taxa} from './taxa'

export const taxonNames:TaxonNameRecord[]=taxa.map(taxon=>({
  id:asTaxonNameId(`taxon-name-${String(taxon.id)}`),
  taxonId:asTaxonId(String(taxon.id)),
  name:taxon.taxonomy.scientificName,
  usage:taxon.taxonomy.taxonomicStatus==='informal'?'informal' as const:taxon.taxonomy.taxonomicStatus==='provisional'?'provisional' as const:'accepted' as const,
  authorship:taxon.taxonomy.authorship,
  sourceIds:taxon.sourceIds.map(id=>asSourceId(String(id))),
  sourceLinks:taxon.sourceIds.map(sourceId=>({sourceId:asSourceId(String(sourceId)),role:'contextualizes' as const})),
  identifiers:taxon.taxonomy.identifiers,
  note:taxon.taxonomy.notes,
}))

export const taxonNamesById=Object.fromEntries(taxonNames.map(item=>[String(item.id),item])) as Record<string,TaxonNameRecord>
