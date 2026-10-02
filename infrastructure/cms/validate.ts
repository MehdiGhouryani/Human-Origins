import 'server-only'
import {contentCatalog} from '../../content/catalog'
import {validateCatalog,type ValidationReport} from '../validation/audit'
import {listMedia,listCopy,mergeCmsIntoCatalog,type CmsMediaRecord} from './store'

/**
 * Validates the catalog that WOULD result if the given media rows were applied on top of
 * the currently-published set (replacing any existing row with the same id, e.g. for an
 * edit to an already-published item). Does not touch the database -- purely a dry run.
 */
export function validateWithPendingMedia(pending:readonly CmsMediaRecord[]):ValidationReport{
  const currentlyPublished=listMedia().filter(row=>row.status==='published')
  const pendingIds=new Set(pending.map(row=>row.id))
  const effective=[...currentlyPublished.filter(row=>!pendingIds.has(row.id)),...pending]
  const {catalog}=mergeCmsIntoCatalog(contentCatalog,effective,listCopy().filter(row=>row.status==='published'))
  return validateCatalog(catalog)
}

export function validateCurrentlyPublished():ValidationReport{
  const {catalog}=mergeCmsIntoCatalog(contentCatalog,listMedia().filter(row=>row.status==='published'),listCopy().filter(row=>row.status==='published'))
  return validateCatalog(catalog)
}
