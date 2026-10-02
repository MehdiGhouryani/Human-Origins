import 'server-only'
import {cookies} from 'next/headers'
import {isSessionValid,SESSION_COOKIE} from './auth'
import {redirect} from 'next/navigation'

export async function hasValidSession():Promise<boolean>{
  const store=await cookies()
  return isSessionValid(store.get(SESSION_COOKIE)?.value)
}

/** Page-level authorization is required even when the shared layout has already checked a session. */
export async function requireAdminSession():Promise<void>{
  if(!await hasValidSession()) redirect('/admin/login')
}
