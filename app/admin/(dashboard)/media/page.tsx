import 'server-only'
import {contentCatalog} from '../../../../content/catalog'
import {listMedia} from '../../../../infrastructure/cms/store'
import MediaManager from './MediaManager'
import {requireAdminSession} from '../../../../infrastructure/cms/requireSession'

export const dynamic='force-dynamic'

export default async function AdminMediaPage({searchParams}:{searchParams:Promise<{taxon?:string}>}){
  await requireAdminSession()
  const {taxon}=await searchParams
  const taxa=contentCatalog.taxa.map(t=>({id:String(t.id),name:t.name}))
  const sources=contentCatalog.sources.map(s=>({id:String(s.id),title:s.title}))
  const builtIn=contentCatalog.media.map(m=>({
    id:String(m.id),taxonId:m.subject.type==='taxon'?String(m.subject.id):'',src:m.src,alt:m.alt,kind:m.kind,
    publicationStatus:m.publicationStatus,credit:m.credit,roles:[...m.roles],placeholder:m.placeholder,
  })).filter(m=>m.taxonId)
  return <>
    <h1>Media</h1>
    <p>Upload images for each species, describe them accurately, and publish. Every publish is checked against the same data audit that guards the built-in catalog — an invalid item is rejected with the exact reasons and nothing goes live.</p>
    <MediaManager initialMedia={listMedia().map(m=>({...m,roles:[...m.roles]}))} taxa={taxa} sources={sources} builtIn={builtIn} initialTaxon={taxon??''}/>
  </>
}
