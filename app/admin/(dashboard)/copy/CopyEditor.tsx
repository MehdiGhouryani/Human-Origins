'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'

type Slot={id:string;label:string;appliesTo:string;defaultValue:string;multiline:boolean;current:string;status:'none'|'draft'|'published'}

export default function CopyEditor({slots}:{slots:Slot[]}){
  const router=useRouter()
  const [state,setState]=useState(slots)
  const [busy,setBusy]=useState<string|null>(null)
  const [message,setMessage]=useState<{kind:'ok'|'error';text:string}|null>(null)

  async function call(slotId:string,payload:{value?:string;status?:'draft'|'published'},okText:string){
    setBusy(slotId); setMessage(null)
    try{
      const res=await fetch('/api/admin/copy',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({slotId,...payload})})
      const body=await res.json().catch(()=>({error:`Server answered ${res.status}`}))
      if(!res.ok){ setMessage({kind:'error',text:body.error??'Request failed.'}); return }
      const rows=body.copy as {slotId:string;value:string;status:'draft'|'published'}[]
      setState(prev=>prev.map(s=>{const r=rows.find(x=>x.slotId===s.id);return r?{...s,current:r.value,status:r.status}:s}))
      setMessage({kind:'ok',text:okText}); router.refresh()
    }catch{
      setMessage({kind:'error',text:'Network error: the server could not be reached. Nothing was changed.'})
    }finally{ setBusy(null) }
  }

  const edit=(id:string,value:string)=>setState(prev=>prev.map(s=>s.id===id?{...s,current:value}:s))

  return <div className="admin-copy">
    {message && <p className={message.kind==='ok'?'admin-ok-msg':'admin-error'} role={message.kind==='ok'?'status':'alert'}>{message.text}</p>}
    <ul className="admin-cards single">{state.map(slot=><li key={slot.id} className="admin-card"><div className="admin-card-body">
      <p><strong>{slot.label}</strong> <span className="admin-badge">{slot.appliesTo}</span> <span className={`admin-badge ${slot.status}`}>{slot.status==='none'?'Built-in':slot.status==='draft'?'Draft':'Live'}</span></p>
      <div className="admin-field"><label htmlFor={`copy-${slot.id}`}>Text</label>
        {slot.multiline
          ? <textarea id={`copy-${slot.id}`} rows={4} value={slot.current} placeholder={slot.defaultValue} onChange={e=>edit(slot.id,e.target.value)}/>
          : <input id={`copy-${slot.id}`} type="text" value={slot.current} placeholder={slot.defaultValue} onChange={e=>edit(slot.id,e.target.value)}/>}
      </div>
      <p className="admin-meta">Built-in wording: “{slot.defaultValue}”</p>
      <div className="admin-actions">
        <button type="button" disabled={busy===slot.id || !slot.current.trim()} onClick={()=>call(slot.id,{value:slot.current},'Saved as a draft.')}>Save draft</button>
        <button type="button" disabled={busy===slot.id || slot.status==='none' || slot.status==='published'} onClick={()=>call(slot.id,{status:'published'},'Published — now live on the site.')}>Publish</button>
        <button type="button" disabled={busy===slot.id || slot.status!=='published'} onClick={()=>call(slot.id,{status:'draft'},'Unpublished — original wording restored.')}>Unpublish</button>
      </div>
    </div></li>)}</ul>
  </div>
}
