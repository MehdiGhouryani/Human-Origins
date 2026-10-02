import 'server-only'
import {copyRegistry} from '../../../../content/copy-registry'
import {listCopy} from '../../../../infrastructure/cms/store'
import CopyEditor from './CopyEditor'
import {requireAdminSession} from '../../../../infrastructure/cms/requireSession'

export const dynamic='force-dynamic'

export default async function AdminCopyPage(){
  await requireAdminSession()
  const stored=new Map(listCopy().map(c=>[c.slotId,c]))
  const slots=copyRegistry.map(slot=>({...slot,current:stored.get(slot.id)?.value??'',status:(stored.get(slot.id)?.status??'none') as 'none'|'draft'|'published'}))
  return <>
    <h1>Site copy</h1>
    <p>Edit the headings and introductions shown on the public site. Publishing a slot replaces the built-in text; unpublishing (or clearing) restores the original wording, so the site is never left with an empty heading.</p>
    <CopyEditor slots={slots}/>
  </>
}
