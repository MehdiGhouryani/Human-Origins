import 'server-only'
import {getMedia} from '../../../../infrastructure/cms/store'
import {resolveMediaFile,readMediaFile} from '../../../../infrastructure/cms/mediaFiles'
import {hasValidSession} from '../../../../infrastructure/cms/requireSession'

type Params={params:Promise<{id:string;file:string}>}

/**
 * Serves CMS-uploaded images. Published media is public and cached as immutable (ids are unique and files never change
 * after upload). Draft media is only served to a signed-in admin, so unpublished work stays private.
 */
export async function GET(_request:Request,{params}:Params){
  const {id,file}=await params
  const path=resolveMediaFile(id,file)
  const row=path?getMedia(id):undefined
  if(!path || !row) return new Response('Not found',{status:404})
  const published=row.status==='published'
  if(!published && !await hasValidSession()) return new Response('Not found',{status:404})
  return new Response(new Uint8Array(readMediaFile(path)),{headers:{
    'Content-Type':'image/webp',
    'X-Content-Type-Options':'nosniff',
    // CMS publication can be revoked; keep public intermediaries from retaining an image for a year.
    'Cache-Control':published?'public, no-cache, must-revalidate':'private, no-store',
  }})
}
