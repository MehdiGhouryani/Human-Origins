import 'server-only'
import {NextResponse} from 'next/server'
import {cookies} from 'next/headers'
import {verifyPassword,createSession,pruneExpiredSessions,isAdminLoginConfigured,SESSION_COOKIE} from '../../../../infrastructure/cms/auth'
import {adminLoginLimiter,clientKey} from '../../../../infrastructure/cms/rateLimit'

export async function POST(request:Request){
  if(!isAdminLoginConfigured()) return NextResponse.json({error:'Admin login is disabled: set CMS_ADMIN_PASSWORD on the server.'},{status:503})
  const key=clientKey(request)
  const enforcePerClient=process.env.TRUST_PROXY==='1'
  const gate=enforcePerClient?adminLoginLimiter.check(key):{allowed:true,retryAfterSeconds:0}
  if(!gate.allowed) return NextResponse.json({error:`Too many failed attempts. Try again in ${Math.ceil(gate.retryAfterSeconds/60)} minute(s).`},{status:429,headers:{'Retry-After':String(gate.retryAfterSeconds)}})
  const body=await request.json().catch(()=>null) as {password?:unknown}|null
  if(typeof body?.password!=='string' || !body.password) return NextResponse.json({error:'Password is required.'},{status:400})
  if(!verifyPassword(body.password)){
    // Never let an unauthenticated visitor lock out all administrators globally.
    if(enforcePerClient) adminLoginLimiter.recordFailure(key)
    return NextResponse.json({error:'Incorrect password.'},{status:401})
  }
  if(enforcePerClient) adminLoginLimiter.reset(key)
  pruneExpiredSessions()
  const {token,expiresAt}=createSession()
  const store=await cookies()
  store.set(SESSION_COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',expires:expiresAt})
  return NextResponse.json({ok:true})
}
