import 'server-only'
import {listRevisions} from '../../../../infrastructure/cms/store'
import {requireAdminSession} from '../../../../infrastructure/cms/requireSession'

export const dynamic='force-dynamic'

export default async function AdminRevisionsPage(){
  await requireAdminSession()
  const revisions=listRevisions(200)
  return <>
    <h1>History</h1>
    <p>Every upload, edit, publish and deletion is recorded here, newest first.</p>
    {revisions.length===0?<p>No changes recorded yet.</p>:<table className="admin-table">
      <thead><tr><th scope="col">When</th><th scope="col">Type</th><th scope="col">Item</th><th scope="col">Action</th><th scope="col">Detail</th></tr></thead>
      <tbody>{revisions.map(r=><tr key={r.id}><td>{new Date(r.createdAt).toLocaleString()}</td><td>{r.entityType}</td><td><code>{r.entityId}</code></td><td>{r.action}</td><td>{r.summary}</td></tr>)}</tbody>
    </table>}
  </>
}
