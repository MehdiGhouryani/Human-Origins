import 'server-only'
import {readFileSync,existsSync} from 'node:fs'
import {join,resolve,sep} from 'node:path'
import {CMS_MEDIA_DIR} from './assets'

const ID_PATTERN=/^cms-media-[a-z0-9-]+$/
const FILE_NAMES=new Set(['thumbnail.webp','card.webp','detail.webp','icon.webp'])

/**
 * Maps a requested (id, file) pair to an absolute path inside the CMS media directory, or undefined.
 * Both parts are validated against strict allow-lists BEFORE touching the filesystem, and the resolved
 * path is re-checked to be inside the media root, so '..', absolute paths and unknown names cannot escape it.
 */
export function resolveMediaFile(id:string,file:string):string|undefined{
  if(!ID_PATTERN.test(id) || !FILE_NAMES.has(file)) return undefined
  const root=resolve(CMS_MEDIA_DIR)
  const target=resolve(join(root,id,file))
  if(!target.startsWith(root+sep)) return undefined
  return existsSync(target)?target:undefined
}

export function readMediaFile(path:string):Buffer{
  return readFileSync(path)
}
