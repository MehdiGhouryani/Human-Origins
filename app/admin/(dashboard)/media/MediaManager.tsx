'use client'
import {useEffect,useMemo,useState} from 'react'
import {useRouter} from 'next/navigation'

type CmsMedia={id:string;subjectId:string;roles:string[];kind:string;filePath:string;width:number;height:number;credit:string;license:string|null;sourceUrl:string;linkedSourceId:string|null;note:string;alt:string;publicationStatus:string;rightsStatus:string;status:'draft'|'published';isDefault:boolean;updatedAt:string}
type BuiltIn={id:string;taxonId:string;src:string;alt:string;kind:string;publicationStatus:string;credit:string}
type Issue={severity:string;code:string;path:string;message:string}

const ROLES=['tree-thumbnail','profile-portrait','dossier-hero','anatomy-plate','comparative-morphology','specimen-reference','habitat','behavior','scale-reference','gallery','context']
const KINDS=[['specimen-photo','Specimen photo'],['cast-photo','Cast photo'],['reconstruction','Reconstruction (illustration)'],['context-schematic','Context schematic']]
const PUB=[['approved','Approved'],['review-required','Needs review'],['schematic','Schematic']]
const RIGHTS=[['clear','Clear'],['review-required','Review required'],['institutional-terms','Institutional terms'],['unknown','Unknown']]

const emptyForm={roles:['tree-thumbnail','profile-portrait'] as string[],kind:'specimen-photo',alt:'',note:'',credit:'',license:'',sourceUrl:'',linkedSourceId:'',publicationStatus:'review-required',rightsStatus:'unknown',isDefault:false}

export default function MediaManager({initialMedia,taxa,sources,builtIn,initialTaxon}:{initialMedia:CmsMedia[];taxa:{id:string;name:string}[];sources:{id:string;title:string}[];builtIn:BuiltIn[];initialTaxon:string}){
  const router=useRouter()
  const [media,setMedia]=useState(initialMedia)
  const [taxon,setTaxon]=useState(initialTaxon||taxa[0]?.id||'')
  const [form,setForm]=useState(emptyForm)
  const [file,setFile]=useState<File|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState<{kind:'ok'|'error';text:string}|null>(null)
  const [issues,setIssues]=useState<Issue[]>([])
  const [editing,setEditing]=useState<string|null>(null)

  const mine=useMemo(()=>media.filter(m=>m.subjectId===taxon),[media,taxon])
  const builtInForTaxon=useMemo(()=>builtIn.filter(m=>m.taxonId===taxon),[builtIn,taxon])
  const [previewUrl,setPreviewUrl]=useState<string|null>(null)
  // Object URLs pin the file in memory until revoked: release the previous preview whenever the file changes.
  useEffect(()=>{
    if(!file){setPreviewUrl(null);return}
    const url=URL.createObjectURL(file)
    setPreviewUrl(url)
    return ()=>URL.revokeObjectURL(url)
  },[file])
  const liveTreeIcon=mine.find(m=>m.status==='published'&&m.roles.includes('tree-thumbnail'))
  const livePortrait=mine.find(m=>m.status==='published'&&m.isDefault)

  const set=<K extends keyof typeof emptyForm>(key:K,value:(typeof emptyForm)[K])=>setForm(f=>({...f,[key]:value}))
  const toggleRole=(role:string)=>set('roles',form.roles.includes(role)?form.roles.filter(r=>r!==role):[...form.roles,role])

  async function refresh(){
    try{
      const res=await fetch('/api/admin/media')
      if(res.ok) setMedia((await res.json()).media)
      else setMessage({kind:'error',text:'Saved, but the list could not be reloaded. Refresh the page.'})
    }catch{
      setMessage({kind:'error',text:'Saved, but the list could not be reloaded. Refresh the page.'})
    }
    router.refresh()
  }

  /** Reads a JSON error body when there is one; a proxy error page or network failure becomes a readable message. */
  async function readBody(res:Response):Promise<{error?:string;report?:{issues?:Issue[]}}>{
    try{ return await res.json() }catch{ return {error:`Server answered ${res.status} ${res.statusText||''}`.trim()} }
  }
  const networkError=()=>setMessage({kind:'error',text:'Network error: the server could not be reached. Nothing was changed.'})

  async function upload(event:React.FormEvent){
    event.preventDefault()
    if(!file) return
    setBusy(true); setMessage(null); setIssues([])
    try{
      const data=new FormData()
      data.set('file',file); data.set('subjectId',taxon); data.set('roles',form.roles.join(','))
      for(const key of ['kind','alt','note','credit','license','sourceUrl','linkedSourceId','publicationStatus','rightsStatus'] as const) data.set(key,String(form[key]))
      data.set('isDefault',String(form.isDefault))
      const res=await fetch('/api/admin/media',{method:'POST',body:data})
      const body=await readBody(res)
      if(!res.ok){ setMessage({kind:'error',text:body.error??'Upload failed.'}); return }
      setMessage({kind:'ok',text:'Uploaded as a draft. Review it below, then publish (the live image stays until you do).'})
      setFile(null); setForm(emptyForm)
      await refresh()
    }catch{ networkError() }finally{ setBusy(false) }
  }

  async function patch(id:string,payload:Record<string,unknown>,okText:string){
    setBusy(true); setMessage(null); setIssues([])
    try{
      const res=await fetch(`/api/admin/media/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      const body=await readBody(res)
      if(!res.ok){
        setMessage({kind:'error',text:body.error??'Request failed.'})
        if(body.report?.issues) setIssues(body.report.issues.filter(i=>i.severity==='error'))
        return false
      }
      setMessage({kind:'ok',text:okText}); await refresh(); return true
    }catch{ networkError(); return false }finally{ setBusy(false) }
  }

  async function remove(id:string){
    if(!window.confirm('Delete this image permanently? This cannot be undone.')) return
    setBusy(true); setMessage(null)
    try{
      const res=await fetch(`/api/admin/media/${id}`,{method:'DELETE'})
      if(!res.ok){ setMessage({kind:'error',text:(await readBody(res)).error??'Delete failed.'}); return }
      setMessage({kind:'ok',text:'Deleted.'}); await refresh()
    }catch{ networkError() }finally{ setBusy(false) }
  }

  const uploadReady=Boolean(file && form.alt.trim() && form.roles.length)

  return <div className="admin-media">
    <div className="admin-field admin-taxon-picker">
      <label htmlFor="taxon">Species</label>
      <select id="taxon" value={taxon} onChange={e=>setTaxon(e.target.value)}>{taxa.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>
    </div>

    {message && <p className={message.kind==='ok'?'admin-ok-msg':'admin-error'} role={message.kind==='ok'?'status':'alert'}>{message.text}</p>}
    {issues.length>0 && <ul className="admin-issues" aria-label="Audit errors">{issues.map((i,n)=><li key={n}><code>{i.code}</code> {i.message}</li>)}</ul>}

    <section aria-labelledby="upload-h">
      <h2 id="upload-h">Upload new image</h2>
      <form className="admin-form" onSubmit={upload}>
        <div className="admin-field"><label htmlFor="file">Image file (JPEG, PNG, WebP, AVIF, GIF or TIFF — up to 20 MB)</label>
          <input id="file" type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]??null)}/></div>
        {previewUrl && <div className="admin-preview">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob: preview of a not-yet-uploaded file; next/image cannot optimize blob URLs */}
          <img src={previewUrl} alt="Selected file preview"/>
        </div>}
        <div className="admin-field"><label htmlFor="alt">Alt text (required — describe what the image shows)</label>
          <input id="alt" type="text" value={form.alt} onChange={e=>set('alt',e.target.value)} required/></div>
        <div className="admin-row">
          <div className="admin-field"><label htmlFor="kind">Kind</label>
            <select id="kind" value={form.kind} onChange={e=>set('kind',e.target.value)}>{KINDS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          <div className="admin-field"><label htmlFor="pub">Publication status</label>
            <select id="pub" value={form.publicationStatus} onChange={e=>set('publicationStatus',e.target.value)}>{PUB.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
          <div className="admin-field"><label htmlFor="rights">Rights</label>
            <select id="rights" value={form.rightsStatus} onChange={e=>set('rightsStatus',e.target.value)}>{RIGHTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
        </div>
        <fieldset className="admin-roles"><legend>Roles (where this image may appear)</legend>
          {ROLES.map(r=><label key={r}><input type="checkbox" checked={form.roles.includes(r)} onChange={()=>toggleRole(r)}/> {r}</label>)}
        </fieldset>
        <div className="admin-row">
          <div className="admin-field"><label htmlFor="credit">Credit</label><input id="credit" type="text" value={form.credit} onChange={e=>set('credit',e.target.value)}/></div>
          <div className="admin-field"><label htmlFor="license">License</label><input id="license" type="text" value={form.license} onChange={e=>set('license',e.target.value)} placeholder="e.g. CC BY-SA 4.0"/></div>
        </div>
        <div className="admin-field"><label htmlFor="sourceUrl">Source URL (required for “Approved” without a license, and for “Needs review”)</label>
          <input id="sourceUrl" type="url" value={form.sourceUrl} onChange={e=>set('sourceUrl',e.target.value)} placeholder="https://"/></div>
        <div className="admin-field"><label htmlFor="linked">Link to an existing catalog source (optional)</label>
          <select id="linked" value={form.linkedSourceId} onChange={e=>set('linkedSourceId',e.target.value)}><option value="">— none —</option>{sources.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="note">Scientific note (limitations, e.g. “artistic reconstruction, not a fossil photograph”)</label>
          <textarea id="note" rows={3} value={form.note} onChange={e=>set('note',e.target.value)}/></div>
        <label className="admin-check"><input type="checkbox" checked={form.isDefault} onChange={e=>set('isDefault',e.target.checked)}/> Use as this species’ default image once published</label>
        <button type="submit" disabled={busy || !uploadReady}>{busy?'Working…':'Upload as draft'}</button>
      </form>
    </section>

    <section aria-labelledby="slots-h">
      <h2 id="slots-h">Live image slots</h2>
      <p>Tree avatar: <strong>{liveTreeIcon?liveTreeIcon.alt:'built-in image'}</strong> · Portrait: <strong>{livePortrait?livePortrait.alt:'built-in image'}</strong>. Use “Use as tree avatar” / “Use as portrait” on a card below; a draft takes the slot when it is published.</p>
    </section>

    <section aria-labelledby="mine-h">
      <h2 id="mine-h">CMS images for this species ({mine.length})</h2>
      {mine.length===0 && <p>None yet.</p>}
      <ul className="admin-cards">{mine.map(m=><li key={m.id} className={`admin-card ${m.status}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- already a small server-generated WebP thumbnail served from /cms-media */}
        <img src={`${m.filePath}/thumbnail.webp`} alt={m.alt}/>
        <div className="admin-card-body">
          <p><span className={`admin-badge ${m.status}`}>{m.status==='published'?'Live':'Draft'}</span> {m.isDefault && <span className="admin-badge default">Portrait</span>} {m.roles.includes('tree-thumbnail') && <span className="admin-badge slot">Tree avatar</span>} <span className="admin-badge">{m.kind}</span></p>
          {editing===m.id
            ? <EditForm media={m} busy={busy} sources={sources} onCancel={()=>setEditing(null)} onSave={async payload=>{ if(await patch(m.id,payload,'Saved.')) setEditing(null) }}/>
            : <>
              <p className="admin-alt">{m.alt}</p>
              <p className="admin-meta">{m.width}×{m.height} · {m.roles.join(', ')} · rights: {m.rightsStatus}</p>
              <div className="admin-actions">
                {m.status==='draft'
                  ? <button type="button" disabled={busy} onClick={()=>patch(m.id,{status:'published'},'Published — now live on the site.')}>Publish</button>
                  : <button type="button" disabled={busy} onClick={()=>patch(m.id,{status:'draft'},'Unpublished — hidden from the site.')}>Unpublish</button>}
                <button type="button" disabled={busy || m.roles.includes('tree-thumbnail')} onClick={()=>patch(m.id,{slot:'tree-icon'},m.status==='published'?'Now the tree avatar for this species.':'Will become the tree avatar when published.')}>Use as tree avatar</button>
                <button type="button" disabled={busy || m.isDefault} onClick={()=>patch(m.id,{slot:'portrait'},m.status==='published'?'Now the portrait for this species.':'Will become the portrait when published.')}>Use as portrait</button>
                <button type="button" disabled={busy} onClick={()=>setEditing(m.id)}>Edit details</button>
                <button type="button" className="danger" disabled={busy} onClick={()=>remove(m.id)}>Delete</button>
              </div>
            </>}
        </div>
      </li>)}</ul>
    </section>

    <section aria-labelledby="builtin-h">
      <h2 id="builtin-h">Built-in catalog images for this species ({builtInForTaxon.length})</h2>
      <p>These come from the reviewed source catalog and are read-only here.</p>
      <ul className="admin-cards">{builtInForTaxon.map(m=><li key={m.id} className="admin-card builtin">
        <div className="admin-card-body"><p><span className="admin-badge">{m.kind}</span> <span className="admin-badge">{m.publicationStatus}</span></p><p className="admin-alt">{m.alt}</p><p className="admin-meta"><code>{m.src}</code></p></div>
      </li>)}</ul>
    </section>
  </div>
}

function EditForm({media,busy,sources,onCancel,onSave}:{media:CmsMedia;busy:boolean;sources:{id:string;title:string}[];onCancel:()=>void;onSave:(payload:Record<string,unknown>)=>void}){
  const [f,setF]=useState({alt:media.alt,note:media.note,credit:media.credit,license:media.license??'',sourceUrl:media.sourceUrl,linkedSourceId:media.linkedSourceId??'',kind:media.kind,publicationStatus:media.publicationStatus,rightsStatus:media.rightsStatus,isDefault:media.isDefault,roles:media.roles})
  const toggle=(r:string)=>setF(x=>({...x,roles:x.roles.includes(r)?x.roles.filter(v=>v!==r):[...x.roles,r]}))
  return <form className="admin-form compact" onSubmit={e=>{e.preventDefault();onSave({...f,license:f.license||null,linkedSourceId:f.linkedSourceId||null})}}>
    <div className="admin-field"><label htmlFor={`alt-${media.id}`}>Alt text</label><input id={`alt-${media.id}`} type="text" value={f.alt} onChange={e=>setF({...f,alt:e.target.value})} required/></div>
    <div className="admin-row">
      <div className="admin-field"><label htmlFor={`kind-${media.id}`}>Kind</label><select id={`kind-${media.id}`} value={f.kind} onChange={e=>setF({...f,kind:e.target.value})}>{KINDS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      <div className="admin-field"><label htmlFor={`pub-${media.id}`}>Publication</label><select id={`pub-${media.id}`} value={f.publicationStatus} onChange={e=>setF({...f,publicationStatus:e.target.value})}>{PUB.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      <div className="admin-field"><label htmlFor={`rights-${media.id}`}>Rights</label><select id={`rights-${media.id}`} value={f.rightsStatus} onChange={e=>setF({...f,rightsStatus:e.target.value})}>{RIGHTS.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
    </div>
    <fieldset className="admin-roles"><legend>Roles</legend>{ROLES.map(r=><label key={r}><input type="checkbox" checked={f.roles.includes(r)} onChange={()=>toggle(r)}/> {r}</label>)}</fieldset>
    <div className="admin-row">
      <div className="admin-field"><label htmlFor={`credit-${media.id}`}>Credit</label><input id={`credit-${media.id}`} type="text" value={f.credit} onChange={e=>setF({...f,credit:e.target.value})}/></div>
      <div className="admin-field"><label htmlFor={`license-${media.id}`}>License</label><input id={`license-${media.id}`} type="text" value={f.license} onChange={e=>setF({...f,license:e.target.value})}/></div>
    </div>
    <div className="admin-field"><label htmlFor={`url-${media.id}`}>Source URL</label><input id={`url-${media.id}`} type="url" value={f.sourceUrl} onChange={e=>setF({...f,sourceUrl:e.target.value})}/></div>
    <div className="admin-field"><label htmlFor={`linked-${media.id}`}>Linked catalog source</label><select id={`linked-${media.id}`} value={f.linkedSourceId} onChange={e=>setF({...f,linkedSourceId:e.target.value})}><option value="">— none —</option>{sources.map(s=><option key={s.id} value={s.id}>{s.title}</option>)}</select></div>
    <div className="admin-field"><label htmlFor={`note-${media.id}`}>Scientific note</label><textarea id={`note-${media.id}`} rows={3} value={f.note} onChange={e=>setF({...f,note:e.target.value})}/></div>
    <label className="admin-check"><input type="checkbox" checked={f.isDefault} onChange={e=>setF({...f,isDefault:e.target.checked})}/> Default image for this species</label>
    <div className="admin-actions"><button type="submit" disabled={busy}>Save</button><button type="button" disabled={busy} onClick={onCancel}>Cancel</button></div>
  </form>
}
