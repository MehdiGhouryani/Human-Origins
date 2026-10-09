import type {OccurrenceRecord} from '../domain/contracts'
import {asOccurrenceId} from '../domain/ids'
import {specimenRecords} from './specimens'
import {siteContextRecords} from './sites'
import {materialEntityRecords} from './specimens'

/**
 * Occurrence is intentionally separate from the physical material record.
 * It describes the documented presence of the taxon at a research site; the
 * specimen remains the material entity that can be accessioned, imaged or scanned.
 */
export const occurrenceRecords:OccurrenceRecord[]=specimenRecords.map(specimen=>({
  id:asOccurrenceId(`occ-${String(specimen.id)}`),
  taxonId:specimen.taxonId,
  siteId:specimen.siteId!,
  specimenId:specimen.id,
  basisOfRecord:materialEntityRecords.find(item=>String(item.id)===String(specimen.materialEntityId))?.basisOfRecord ?? 'FossilSpecimen',
  occurrenceStatus:'detected',
  timeInterval:siteContextRecords.find(context=>String(context.siteId)===String(specimen.siteId))?.timeInterval,
  sourceIds:specimen.sourceIds,
  sourceLinks:specimen.sourceIds.map(sourceId=>({sourceId,role:'documents' as const})),
  identifiers:[{scheme:'specimen-record' as const,value:String(specimen.id),label:'Internal material/occurrence linkage',verification:'asserted' as const,origin:'internal' as const}],
  note:'Occurrence is a normalized research record linking a taxon to a documented site/material context; it is not an exact specimen-coordinate claim.',
}))

export const occurrencesById=Object.fromEntries(occurrenceRecords.map(item=>[String(item.id),item])) as Record<string,OccurrenceRecord>
