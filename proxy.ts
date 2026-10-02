import {NextResponse} from 'next/server'
import type {NextRequest} from 'next/server'

// Native SQLite session checks stay inside each Node.js page/API handler; this proxy
// provides early redirects and CSRF defense without trusting cookie presence as auth.
const SESSION_COOKIE='cms_session'
const SAFE_METHODS=new Set(['GET','HEAD','OPTIONS'])

function isSameOriginRequest(request:NextRequest):boolean{
  const host=request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host')
  const origin=request.headers.get('origin') ?? request.headers.get('referer')
  if(!host || !origin) return false
  try{return new URL(origin).host===host}catch{return false}
}

export function proxy(request:NextRequest){
  const {pathname}=request.nextUrl
  if(pathname.startsWith('/api/admin')){
    if(!SAFE_METHODS.has(request.method) && !isSameOriginRequest(request)){
      return NextResponse.json({error:'Cross-origin admin requests are not allowed.'},{status:403})
    }
    return NextResponse.next()
  }
  if(pathname==='/admin/login') return NextResponse.next()
  if(!request.cookies.get(SESSION_COOKIE)?.value){
    return NextResponse.redirect(new URL('/admin/login',request.url))
  }
  return NextResponse.next()
}

export const config={matcher:['/admin/:path*','/api/admin/:path*']}
