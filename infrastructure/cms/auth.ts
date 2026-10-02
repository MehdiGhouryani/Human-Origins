import 'server-only'
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto'
import {getDb} from './db'

export const SESSION_COOKIE='cms_session'
const SESSION_TTL_MS=1000*60*60*24*7 // 7 days

/**
 * Development fallback only. In any real deployment, set CMS_ADMIN_PASSWORD (and ideally
 * front this whole /admin surface with your host's own access control too) -- this default
 * is intentionally documented here rather than hidden, so it is impossible to miss.
 */
const DEV_FALLBACK_PASSWORD='change-me-now'

/** Constant-time compare that also hides the secret's length (both sides are hashed to 32 bytes first). */
function timingSafeStringEqual(a:string,b:string):boolean{
  const digest=(value:string)=>createHash('sha256').update(value,'utf8').digest()
  return timingSafeEqual(digest(a),digest(b))
}

function sessionPasswordVersion():string{
  const password=process.env.CMS_ADMIN_PASSWORD || DEV_FALLBACK_PASSWORD
  return createHash('sha256').update(password,'utf8').digest('hex')
}

/**
 * In production the documented dev fallback is never accepted: without CMS_ADMIN_PASSWORD
 * nobody can sign in (the login route answers 503 and explains why).
 */
export function isAdminLoginConfigured():boolean{
  return Boolean(process.env.CMS_ADMIN_PASSWORD) || process.env.NODE_ENV!=='production'
}

export function verifyPassword(candidate:string):boolean{
  if(!isAdminLoginConfigured()) return false
  const expected=process.env.CMS_ADMIN_PASSWORD || DEV_FALLBACK_PASSWORD
  return timingSafeStringEqual(candidate,expected)
}

export function isUsingDevFallbackPassword():boolean{
  return !process.env.CMS_ADMIN_PASSWORD
}

export function createSession():{token:string;expiresAt:Date}{
  const token=randomBytes(32).toString('hex')
  const tokenHash=createHash('sha256').update(token,'utf8').digest('hex')
  const now=new Date()
  const expiresAt=new Date(now.getTime()+SESSION_TTL_MS)
  getDb().prepare('INSERT INTO admin_sessions(token,created_at,expires_at,password_version) VALUES (?,?,?,?)')
    .run(tokenHash,now.toISOString(),expiresAt.toISOString(),sessionPasswordVersion())
  return {token,expiresAt}
}

export function destroySession(token:string):void{
  getDb().prepare('DELETE FROM admin_sessions WHERE token = ?').run(createHash('sha256').update(token,'utf8').digest('hex'))
}

export function isSessionValid(token:string|undefined):boolean{
  if(!token) return false
  const tokenHash=createHash('sha256').update(token,'utf8').digest('hex')
  const row=getDb().prepare('SELECT expires_at as expiresAt,password_version as passwordVersion FROM admin_sessions WHERE token = ?').get(tokenHash) as {expiresAt:string;passwordVersion:string}|undefined
  if(!row) return false
  return new Date(row.expiresAt).getTime()>Date.now() && row.passwordVersion===sessionPasswordVersion()
}

/** Deletes expired session rows; cheap enough to call opportunistically on login. */
export function pruneExpiredSessions():void{
  getDb().prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(new Date().toISOString())
}
