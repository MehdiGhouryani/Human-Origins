import 'server-only'
import '../admin.css'
import {redirect} from 'next/navigation'
import {cookies} from 'next/headers'
import Link from 'next/link'
import {isSessionValid,SESSION_COOKIE,isUsingDevFallbackPassword} from '../../../infrastructure/cms/auth'
import AdminLogoutButton from './AdminLogoutButton'

export default async function AdminDashboardLayout({children}:{children:React.ReactNode}){
  const store=await cookies()
  if(!isSessionValid(store.get(SESSION_COOKIE)?.value)) redirect('/admin/login')
  return <div className="admin-shell">
    <aside className="admin-nav">
      <div className="admin-brand">Human Origins <span>CMS</span></div>
      {isUsingDevFallbackPassword() && <p className="admin-warning">CMS_ADMIN_PASSWORD is not set — using the insecure development default. Set it before deploying.</p>}
      <nav>
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/media/slots">Image slots</Link>
        <Link href="/admin/media">Media</Link>
        <Link href="/admin/graph">Graph controls</Link>
        <Link href="/admin/copy">Site copy</Link>
        <Link href="/admin/revisions">History</Link>
      </nav>
      <AdminLogoutButton/>
    </aside>
    <main className="admin-content">{children}</main>
  </div>
}
