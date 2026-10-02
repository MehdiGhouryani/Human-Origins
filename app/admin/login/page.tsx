'use client'
import './../admin.css'
import {useState} from 'react'
import {useRouter} from 'next/navigation'

export default function AdminLoginPage(){
  const router=useRouter()
  const [password,setPassword]=useState('')
  const [error,setError]=useState<string|null>(null)
  const [busy,setBusy]=useState(false)

  async function submit(event:React.FormEvent){
    event.preventDefault()
    setBusy(true); setError(null)
    try{
      const res=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})})
      if(!res.ok){ const body=await res.json().catch(()=>({error:'Login failed.'})); setError(body.error??'Login failed.'); return }
      router.replace('/admin')
      router.refresh()
    }catch{ setError('Network error. Check your connection and try again.') }finally{ setBusy(false) }
  }

  return <main className="admin-auth">
    <form className="admin-auth-card" onSubmit={submit}>
      <h1>Human Origins CMS</h1>
      <p>Sign in to manage species media and site copy.</p>
      <label htmlFor="admin-password">Admin password</label>
      <input id="admin-password" type="password" name="password" autoComplete="current-password" autoFocus value={password} onChange={e=>setPassword(e.target.value)} required/>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button type="submit" disabled={busy || !password}>{busy?'Signing in…':'Sign in'}</button>
    </form>
  </main>
}
