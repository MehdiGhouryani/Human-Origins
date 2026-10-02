import {afterAll,afterEach,describe,expect,it,vi} from 'vitest'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

// The auth module opens the CMS database on import; keep it in a throwaway directory.
const workDir=mkdtempSync(join(tmpdir(),'cms-security-test-'))
process.env.CMS_DB_PATH=join(workDir,'cms.sqlite')
process.env.CMS_MEDIA_DIR=join(workDir,'media')

const {createLoginLimiter,clientKey}=await import('../infrastructure/cms/rateLimit')
const auth=await import('../infrastructure/cms/auth')

describe('Admin login hardening',()=>{
  afterEach(()=>{vi.unstubAllEnvs()})
  afterAll(()=>{rmSync(workDir,{recursive:true,force:true})})

  it('locks a client out after repeated failures and unlocks after the window',()=>{
    const limiter=createLoginLimiter({maxFailures:3,windowMs:60_000})
    const t0=1_000_000
    for(let i=0;i<3;i++){expect(limiter.check('1.2.3.4',t0+i).allowed).toBe(true);limiter.recordFailure('1.2.3.4',t0+i)}
    const blocked=limiter.check('1.2.3.4',t0+10)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0)
    expect(limiter.check('5.6.7.8',t0+10).allowed).toBe(true)
    expect(limiter.check('1.2.3.4',t0+60_001).allowed).toBe(true)
  })

  it('a successful login clears the failure history',()=>{
    const limiter=createLoginLimiter({maxFailures:2,windowMs:60_000})
    limiter.recordFailure('k',1);limiter.recordFailure('k',2)
    expect(limiter.check('k',3).allowed).toBe(false)
    limiter.reset('k')
    expect(limiter.check('k',4).allowed).toBe(true)
  })

  it('ignores forwarding headers unless the reverse proxy is explicitly trusted',()=>{
    vi.stubEnv('TRUST_PROXY','0')
    expect(clientKey(new Request('http://x/',{headers:{'x-forwarded-for':'9.9.9.9, 10.0.0.1'}}))).toBe('untrusted-direct-client')
    vi.stubEnv('TRUST_PROXY','1')
    expect(clientKey(new Request('http://x/',{headers:{'x-forwarded-for':'9.9.9.9, 10.0.0.1'}}))).toBe('9.9.9.9')
    expect(clientKey(new Request('http://x/'))).toBe('unknown')
  })

  it('ignores a client-forged X-Forwarded-For prefix (rate-limit bypass regression)',()=>{
    vi.stubEnv('TRUST_PROXY','1')
    // nginx appends the real peer: whatever the client sent stays on the left and must not become the key.
    expect(clientKey(new Request('http://x/',{headers:{'x-forwarded-for':'1.1.1.1, 203.0.113.7'}}))).toBe('203.0.113.7')
    expect(clientKey(new Request('http://x/',{headers:{'x-forwarded-for':'8.8.8.8, 203.0.113.7, 10.0.0.2'}}))).toBe('203.0.113.7')
  })

  it('never accepts the documented dev password in production',()=>{
    vi.stubEnv('CMS_ADMIN_PASSWORD','')
    vi.stubEnv('NODE_ENV','production')
    expect(auth.isAdminLoginConfigured()).toBe(false)
    expect(auth.verifyPassword('change-me-now')).toBe(false)
    vi.stubEnv('CMS_ADMIN_PASSWORD','a real secret')
    expect(auth.isAdminLoginConfigured()).toBe(true)
    expect(auth.verifyPassword('a real secret')).toBe(true)
    expect(auth.verifyPassword('change-me-now')).toBe(false)
  })
})
