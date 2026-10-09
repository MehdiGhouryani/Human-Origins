import 'server-only'
import {contentCatalog} from '../../content/catalog'
import {validateCatalog,type ValidationReport} from '../validation/audit'
import {listMedia,listPublishedCopy,mergeCmsIntoCatalog,type CmsMediaRecord} from './store'

/**
 * Validates the catalog that WOULD result if the given media rows were applied on top of
 * the currently-published set (replacing any existing row with the same id, e.g. for an
 * edit to an already-published item). Does not touch the database -- purely a dry run.
 */
export function validateWithPendingMedia(pending:readonly CmsMediaRecord[]):ValidationReport{
  const currentlyPublished=listMedia().filter(row=>row.status==='published')
  const pendingIds=new Set(pending.map(row=>row.id))
  // A slot holds one live image: publishing a replacement takes the previous occupant offline (see the store), so
  // the dry run must not count it. Pending rows that are not being published do not take a slot.
  const slotsTaken=new Set(pending.filter(row=>row.status==='published'&&row.slotId).map(row=>row.slotId as string))
  const effective=[...currentlyPublished.filter(row=>!pendingIds.has(row.id)&&!(row.slotId&&slotsTaken.has(row.slotId))),...pending]
  const {catalog}=mergeCmsIntoCatalog(contentCatalog,effective,listPublishedCopy())
  return validateCatalog(catalog)
}

export function validateCurrentlyPublished():ValidationReport{
  const {catalog}=mergeCmsIntoCatalog(contentCatalog,listMedia().filter(row=>row.status==='published'),listPublishedCopy())
  return validateCatalog(catalog)
}
