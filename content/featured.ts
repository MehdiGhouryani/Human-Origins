import {asTaxonId} from '../domain/ids'
import type {TaxonId} from '../domain/ids'

/** The home-page graph shows exactly this many taxa: the main route of human evolution. */
export const MAIN_PATH_SIZE=11

/**
 * Editorial defaults. These are the only places a taxon id is named outside the catalogue itself, and the tests and
 * the catalogue audit fail if any of them stops existing, so they cannot drift silently.
 *
 * `mainPathTaxonIds` is the curated main route of human evolution drawn on the home-page graph. Side branches
 * (Paranthropus, H. ergaster, H. naledi, H. floresiensis, Denisovans) and the inferred common-ancestor node stay in the
 * catalogue and keep their own species pages; they are simply not drawn in the 11-species view. The audit
 * (`MAIN_PATH_*` codes) guarantees the selection forms one connected, acyclic, chronological graph.
 */
export const featured:{readonly defaultTaxonId:TaxonId;readonly compareTaxonIds:readonly TaxonId[];readonly mainPathTaxonIds:readonly TaxonId[]}={
  defaultTaxonId:asTaxonId('neanderthal'),
  compareTaxonIds:[asTaxonId('sapiens'),asTaxonId('neanderthal'),asTaxonId('erectus')],
  mainPathTaxonIds:[
    'sahelanthropus','orrin','ardipithecus','anamensis','afarensis','africanus',
    'habilis','erectus','heidelbergensis','neanderthal','sapiens',
  ].map(asTaxonId),
}
