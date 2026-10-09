import 'server-only'

/**
 * Small in-memory limiter for failed admin logins (per client key, usually the IP).
 * Good enough for a single Node process (VPS / container). Behind several instances,
 * move this to the shared store; the API stays the same.
 */
export type LoginLimiter={
  check:(key:string,now?:number)=>{allowed:boolean;retryAfterSeconds:number}
  recordFailure:(key:string,now?:number)=>void
  reset:(key:string)=>void
}

export function createLoginLimiter({maxFailures=5,windowMs=15*60*1000,maxKeys=5000}:{maxFailures?:number;windowMs?:number;maxKeys?:number}={}):LoginLimiter{
  const failures=new Map<string,number[]>()
  const recent=(key:string,now:number)=>{
    const kept=(failures.get(key)??[]).filter(at=>now-at<windowMs)
    if(kept.length) failures.set(key,kept); else failures.delete(key)
    return kept
  }
  return {
    check(key,now=Date.now()){
      const kept=recent(key,now)
      if(kept.length<maxFailures) return {allowed:true,retryAfterSeconds:0}
      return {allowed:false,retryAfterSeconds:Math.max(1,Math.ceil((kept[0]+windowMs-now)/1000))}
    },
    recordFailure(key,now=Date.now()){
      if(!failures.has(key) && failures.size>=maxKeys){const oldest=failures.keys().next().value;if(oldest!==undefined)failures.delete(oldest)}
      failures.set(key,[...recent(key,now),now])
    },
    reset(key){failures.delete(key)},
  }
}

/** Process-wide limiter used by the login route (per client). */
export const adminLoginLimiter=createLoginLimiter()

/**
 * Process-wide backstop shared by every client: even if a client key can be forged (e.g. the app is reachable
 * without a proxy that rewrites X-Forwarded-For), total password guesses stay bounded.
 */
export const adminLoginGlobalLimiter=createLoginLimiter({maxFailures:50,windowMs:15*60*1000,maxKeys:1})
export const GLOBAL_LOGIN_KEY='*'

const PRIVATE_V4=[/^10\./,/^127\./,/^192\.168\./,/^172\.(1[6-9]|2\d|3[01])\./,/^169\.254\./,/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./]
function isPrivateAddress(address:string):boolean{
  const ip=address.replace(/^::ffff:/i,'')
  if(ip==='::1' || /^f[cd][0-9a-f]{2}:/i.test(ip) || /^fe80:/i.test(ip)) return true
  return PRIVATE_V4.some(pattern=>pattern.test(ip))
}

/**
 * Client identity for rate limiting. X-Forwarded-For is appended to by each proxy, so anything a client sends
 * ends up on the LEFT. We therefore walk from the right and take the first public address, skipping the
 * private hops of our own proxies/load balancers; a client-forged prefix can no longer mint a fresh key per request.
 */
export function clientKey(request:Request):string{
  // Forwarding headers are client-controlled unless the deployment explicitly trusts its proxy.
  if(process.env.TRUST_PROXY!=='1') return 'untrusted-direct-client'
  const hops=(request.headers.get('x-forwarded-for')??'').split(',').map(part=>part.trim()).filter(Boolean)
  for(let index=hops.length-1;index>=0;index-=1){
    if(!isPrivateAddress(hops[index])) return hops[index]
  }
  return hops[0] || request.headers.get('x-real-ip')?.trim() || 'unknown'
}
