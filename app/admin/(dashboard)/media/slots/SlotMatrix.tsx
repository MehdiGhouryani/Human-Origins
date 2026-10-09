'use client'
import {useEffect,useMemo,useState} from 'react'
import {useRouter} from 'next/navigation'

export type SlotCardData={id:string;title:string;series:string;group:string;role:string;evidenceClass:'A'|'B'|'C'|'D';ratio:string;width:number|null;height:number|null;locked:boolean;holdReason:string;needsReview:boolean}
export type SlotMediaData={
  id:string;slotId:string;status:'draft'|'published';alt:string;note:string;credit:string;license:string|null;rightsStatus:string;publicationStatus:string
  specimenRef:string;assumptions:string;generator:{name:string;version:string;date:string}|null;review:{reviewer:string;date:string;decision:string}|null;thumb:string
}
type Issue={severity:string;code:string;path:string;message:string}
type Mode={kind:'upload'}|{kind:'edit';mediaId:string}

const GROUP_LABEL:Record<string,string>={header:'Page header',hero:'Hero image',scenes:'Reconstructions and habitat',specimens:'Specimens',diagrams:'Anatomy and diagrams',tools:'Stone tools',places:'Sites and maps'}
const GROUP_ORDER=['header','hero','scenes','specimens','diagrams','tools','places']
const CLASS_LABEL={A:'Data-derived diagram',B:'Diagram from a licensed scan',C:'Specimen photograph',D:'Reconstruction'} as const
const RIGHTS=[['unknown','Unknown'],['review-required','Review required'],['institutional-terms','Institutional terms'],['clear','Clear']]
const PUB=[['review-required','Needs review'],['approved','Approved for publication']]
const today=()=>new Date().toISOString().slice(0,10)

const emptyForm=()=>({alt:'',note:'',credit:'',license:'',rightsStatus:'unknown',publicationStatus:'review-required',linkedSourceId:'',specimenRef:'',assumptions:'',genName:'',genVersion:'',genDate:today(),revName:'',revDate:today(),revDecision:''})
type Form=ReturnType<typeof emptyForm>
const formFrom=(media:SlotMediaData):Form=>({alt:media.alt,note:media.note,credit:media.credit,license:media.license??'',rightsStatus:media.rightsStatus,publicationStatus:media.publicationStatus,linkedSourceId:'',specimenRef:media.specimenRef,assumptions:media.assumptions,
  genName:media.generator?.name??'',genVersion:media.generator?.version??'',genDate:media.generator?.date??today(),revName:media.review?.reviewer??'',revDate:media.review?.date??today(),revDecision:media.review?.decision??''})

export default function SlotMatrix({taxa,taxon,cards,media,sources,initialSlot}:{taxa:{id:string;name:string;core:boolean}[];taxon:string;cards:SlotCardData[];media:SlotMediaData[];sources:{id:string;title:string}[];initialSlot:string}){
  const router=useRouter()
  const [selected,setSelected]=useState(initialSlot)
  const [mode,setMode]=useState<Mode>({kind:'upload'})
  const [form,setForm]=useState<Form>(emptyForm())
  const [file,setFile]=useState<File|null>(null)
  const [previewUrl,setPreviewUrl]=useState<string|null>(null)
  const [naturalWidth,setNaturalWidth]=useState<number|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState<{kind:'ok'|'error';text:string}|null>(null)
  const [issues,setIssues]=useState<Issue[]>([])

  const card=cards.find(item=>item.id===selected)
  const mediaOf=(slotId:string)=>media.filter(item=>item.slotId===slotId)
  const liveOf=(slotId:string)=>mediaOf(slotId).find(item=>item.status==='published')
  const draftOf=(slotId:string)=>mediaOf(slotId).find(item=>item.status==='draft')

  useEffect(()=>()=>{if(previewUrl) URL.revokeObjectURL(previewUrl)},[previewUrl])
  const set=<K extends keyof Form>(key:K,value:Form[K])=>setForm(current=>({...current,[key]:value}))

  const open=(slotId:string,next:Mode)=>{
    setSelected(slotId); setMode(next); setMessage(null); setIssues([]); chooseFile(null)
    if(next.kind==='edit'){ const target=media.find(item=>item.id===next.mediaId); setForm(target?formFrom(target):emptyForm()) } else setForm(emptyForm())
    window.scrollTo({top:0,behavior:'smooth'})
  }
  function chooseFile(next:File|null){
    if(previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(next); setNaturalWidth(null); setPreviewUrl(next?URL.createObjectURL(next):null)
  }

  const progress=useMemo(()=>{
    const open=cards.filter(item=>!item.locked)
    return {live:open.filter(item=>liveOf(item.id)).length,total:open.length}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[cards,media])

  async function readBody(res:Response):Promise<{error?:string;report?:{issues?:Issue[]}}>{
    try{return await res.json()}catch{return {error:`Server answered ${res.status} ${res.statusText||''}`.trim()}}
  }
  const generatorPayload=()=>form.genName.trim()?{name:form.genName.trim(),version:form.genVersion.trim(),date:form.genDate}:null
  const reviewPayload=()=>form.revName.trim()&&form.revDecision?{reviewer:form.revName.trim(),date:form.revDate,decision:form.revDecision}:null

  async function submit(event:React.FormEvent){
    event.preventDefault()
    if(!card) return
    setBusy(true); setMessage(null); setIssues([])
    try{
      if(mode.kind==='upload'){
        if(!file){ setMessage({kind:'error',text:'Choose an image file.'}); return }
        const data=new FormData()
        data.set('file',file); data.set('subjectId',taxon); data.set('slotId',card.id)
        for(const key of ['alt','note','credit','license','publicationStatus','rightsStatus','linkedSourceId','specimenRef','assumptions'] as const) data.set(key,form[key])
        const generator=generatorPayload(); if(generator) data.set('generator',JSON.stringify(generator))
        const review=reviewPayload(); if(review) data.set('review',JSON.stringify(review))
        const res=await fetch('/api/admin/media',{method:'POST',body:data}); const body=await readBody(res)
        if(!res.ok){ setMessage({kind:'error',text:body.error??'Upload failed.'}); return }
        setMessage({kind:'ok',text:'Uploaded as a draft. Publish it from the slot card when it is ready; the live image stays until you do.'}); chooseFile(null); setForm(emptyForm())
      }else{
        const payload={alt:form.alt,note:form.note,credit:form.credit,license:form.license,rightsStatus:form.rightsStatus,publicationStatus:form.publicationStatus,specimenRef:form.specimenRef,assumptions:form.assumptions,generator:generatorPayload(),review:reviewPayload()}
        const res=await fetch(`/api/admin/media/${mode.mediaId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); const body=await readBody(res)
        if(!res.ok){ setMessage({kind:'error',text:body.error??'Save failed.'}); if(body.report?.issues) setIssues(body.report.issues.filter(item=>item.severity==='error')); return }
        setMessage({kind:'ok',text:'Saved.'})
      }
      router.refresh()
    }catch{ setMessage({kind:'error',text:'Network error: nothing was changed.'}) }finally{ setBusy(false) }
  }

  async function setStatus(mediaId:string,status:'published'|'draft'){
    setBusy(true); setMessage(null); setIssues([])
    try{
      const res=await fetch(`/api/admin/media/${mediaId}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})}); const body=await readBody(res)
      if(!res.ok){ setMessage({kind:'error',text:body.error??'Request failed.'}); if(body.report?.issues) setIssues(body.report.issues.filter(item=>item.severity==='error')); return }
      setMessage({kind:'ok',text:status==='published'?'Published. It replaces the earlier image in this slot.':'Unpublished: the slot is empty again.'}); router.refresh()
    }catch{ setMessage({kind:'error',text:'Network error: nothing was changed.'}) }finally{ setBusy(false) }
  }
  async function remove(mediaId:string){
    if(!window.confirm('Delete this image permanently? This cannot be undone.')) return
    setBusy(true); setMessage(null)
    try{
      const res=await fetch(`/api/admin/media/${mediaId}`,{method:'DELETE'})
      if(!res.ok){ setMessage({kind:'error',text:(await readBody(res)).error??'Delete failed.'}); return }
      setMessage({kind:'ok',text:'Deleted.'}); router.refresh()
    }catch{ setMessage({kind:'error',text:'Network error: nothing was changed.'}) }finally{ setBusy(false) }
  }

  const aspect=card?.width&&card.height?card.width/card.height:4/3
  const cls=card?.evidenceClass
  const tooSmall=!!(naturalWidth&&card?.width&&naturalWidth<card.width*0.75)

  return <div className="slot-matrix">
    <div className="slot-toolbar">
      <div className="admin-field">
        <label htmlFor="slot-taxon">Species</label>
        <select id="slot-taxon" value={taxon} onChange={event=>router.push(`/admin/media/slots?taxon=${event.target.value}`)}>
          {taxa.map(item=><option key={item.id} value={item.id}>{item.name}{item.core?'':' (not on the home graph)'}</option>)}
        </select>
      </div>
      <div className="slot-progress" role="status">
        <span>{progress.live} of {progress.total} open slots live</span>
        <progress max={Math.max(progress.total,1)} value={progress.live} aria-label="Slots filled"/>
      </div>
    </div>

    {message&&<p className={message.kind==='ok'?'admin-ok-msg':'admin-error'} role={message.kind==='ok'?'status':'alert'}>{message.text}</p>}
    {issues.length>0&&<ul className="admin-issues" aria-label="Audit errors">{issues.map((item,index)=><li key={index}><code>{item.code}</code> {item.message}</li>)}</ul>}

    {card&&<form className="slot-editor admin-form" onSubmit={submit} aria-labelledby="slot-editor-h">
      <h2 id="slot-editor-h">{mode.kind==='upload'?'Upload to':'Edit'} {card.id}</h2>
      <p className="slot-note">{card.title} · {CLASS_LABEL[card.evidenceClass]} · {card.ratio}{card.width?` · ${card.width}${card.height?`×${card.height}`:' px wide'}`:''}{card.needsReview?' · needs reviewer approval before it can go live':''}</p>
      {mode.kind==='upload'&&<>
        <div className="admin-field"><label htmlFor="slot-file">Image file (JPEG, PNG, WebP, AVIF, GIF or TIFF, up to 20 MB)</label>
          <input id="slot-file" type="file" accept="image/*" onChange={event=>chooseFile(event.target.files?.[0]??null)}/></div>
        {previewUrl&&<>
          <div className="slot-preview" style={{aspectRatio:String(aspect)}}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview of a not-yet-uploaded file */}
            <img src={previewUrl} alt="Preview of the centre crop that will be saved" onLoad={event=>setNaturalWidth(event.currentTarget.naturalWidth)}/>
          </div>
          <p className="slot-note">This is the centre crop that will be saved{card.height?` (${card.ratio})`:''}.</p>
          {tooSmall&&<p className="slot-warning">The image is narrower than the slot ({card.width}px); it will look soft. Use a larger file if you can.</p>}
        </>}
      </>}
      <div className="admin-field"><label htmlFor="slot-alt">Alt text (required: what the image shows)</label>
        <input id="slot-alt" type="text" value={form.alt} onChange={event=>set('alt',event.target.value)} required/></div>
      <div className="admin-field"><label htmlFor="slot-note">Note (what the image is and how it was made)</label>
        <textarea id="slot-note" value={form.note} onChange={event=>set('note',event.target.value)} rows={3} required/></div>
      <div className="admin-row">
        <div className="admin-field"><label htmlFor="slot-credit">Credit</label><input id="slot-credit" type="text" value={form.credit} onChange={event=>set('credit',event.target.value)} required/></div>
        <div className="admin-field"><label htmlFor="slot-license">Licence{cls==='C'||cls==='B'?' (required)':''}</label><input id="slot-license" type="text" value={form.license} onChange={event=>set('license',event.target.value)}/></div>
      </div>
      <div className="admin-row">
        <div className="admin-field"><label htmlFor="slot-rights">Rights</label>
          <select id="slot-rights" value={form.rightsStatus} onChange={event=>set('rightsStatus',event.target.value)}>{RIGHTS.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="slot-pub">Publication status</label>
          <select id="slot-pub" value={form.publicationStatus} onChange={event=>set('publicationStatus',event.target.value)}>{PUB.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div>
      </div>
      {mode.kind==='upload'&&<div className="admin-field"><label htmlFor="slot-source">Linked source (optional)</label>
        <select id="slot-source" value={form.linkedSourceId} onChange={event=>set('linkedSourceId',event.target.value)}><option value="">None</option>{sources.map(item=><option key={item.id} value={item.id}>{item.title}</option>)}</select></div>}
      {(cls==='C'||cls==='D')&&<div className="admin-field"><label htmlFor="slot-specimen">{cls==='C'?'Specimen, site or artefact shown (required)':'Specimen the reconstruction is based on'}</label>
        <input id="slot-specimen" type="text" value={form.specimenRef} onChange={event=>set('specimenRef',event.target.value)} placeholder="e.g. A.L. 444-2, lateral view"/></div>}
      {cls==='D'&&<fieldset className="slot-class-fields"><legend>Reconstruction: assumptions, maker and review</legend>
        <div className="admin-field"><label htmlFor="slot-assumptions">Assumptions sheet (bone-anchored features, inferred features, conventions)</label>
          <textarea id="slot-assumptions" rows={5} value={form.assumptions} onChange={event=>set('assumptions',event.target.value)}/></div>
        <div className="admin-row">
          <div className="admin-field"><label htmlFor="gen-name">Made with (generator or artist)</label><input id="gen-name" type="text" value={form.genName} onChange={event=>set('genName',event.target.value)}/></div>
          <div className="admin-field"><label htmlFor="gen-version">Version</label><input id="gen-version" type="text" value={form.genVersion} onChange={event=>set('genVersion',event.target.value)}/></div>
          <div className="admin-field"><label htmlFor="gen-date">Date</label><input id="gen-date" type="date" value={form.genDate} onChange={event=>set('genDate',event.target.value)}/></div>
        </div>
        <div className="admin-row">
          <div className="admin-field"><label htmlFor="rev-name">Reviewer</label><input id="rev-name" type="text" value={form.revName} onChange={event=>set('revName',event.target.value)}/></div>
          <div className="admin-field"><label htmlFor="rev-date">Review date</label><input id="rev-date" type="date" value={form.revDate} onChange={event=>set('revDate',event.target.value)}/></div>
          <div className="admin-field"><label htmlFor="rev-decision">Decision</label>
            <select id="rev-decision" value={form.revDecision} onChange={event=>set('revDecision',event.target.value)}><option value="">Not reviewed</option><option value="approve">Approve</option><option value="revise">Revise</option><option value="reject">Reject</option></select></div>
        </div>
      </fieldset>}
      <div className="slot-actions">
        <button type="submit" disabled={busy||(mode.kind==='upload'&&!file)||!form.alt.trim()}>{busy?'Working…':mode.kind==='upload'?'Upload as draft':'Save changes'}</button>
        <button type="button" onClick={()=>{setSelected('');chooseFile(null)}} disabled={busy}>Close</button>
      </div>
    </form>}

    {GROUP_ORDER.map(group=>{
      const items=cards.filter(item=>item.group===group)
      if(!items.length) return null
      return <section key={group} className="slot-group" aria-labelledby={`group-${group}`}>
        <h2 id={`group-${group}`}>{GROUP_LABEL[group]}</h2>
        <div className="slot-grid">{items.map(item=>{
          const live=liveOf(item.id)
          const draft=draftOf(item.id)
          const shown=live??draft
          const unreviewed=item.needsReview&&draft&&draft.review?.decision!=='approve'
          const chip=item.locked?['locked','On hold']:live?['live','Live']:unreviewed?['review','Draft: needs review']:draft?['draft','Draft']:['empty','Empty']
          return <article key={item.id} className="slot-card" data-selected={selected===item.id}>
            <header><div><span className="slot-code">{item.id}</span><h3 className="slot-title">{item.title.replace(/^[^:]+:\s*/,'')}</h3></div><span className={`slot-chip slot-chip-${chip[0]}`}>{chip[1]}</span></header>
            <p className="slot-meta">{CLASS_LABEL[item.evidenceClass]} · {item.ratio}{item.width?` · ${item.width}${item.height?`×${item.height}`:' px'}`:''}</p>
            {shown?.thumb?(
              // eslint-disable-next-line @next/next/no-img-element -- CMS thumbnail served from /cms-media
              <img className="slot-thumb" src={shown.thumb} alt={shown.alt} style={{aspectRatio:item.width&&item.height?`${item.width} / ${item.height}`:'4 / 3'}}/>
            ):<div className="slot-empty" style={{aspectRatio:item.width&&item.height?`${item.width} / ${item.height}`:'4 / 3'}}>{item.locked?item.holdReason:'No image yet'}</div>}
            {!item.locked&&<div className="slot-actions">
              {!shown&&<button type="button" onClick={()=>open(item.id,{kind:'upload'})} disabled={busy}>Upload</button>}
              {shown&&<button type="button" onClick={()=>open(item.id,{kind:'edit',mediaId:shown.id})} disabled={busy}>Edit{item.needsReview?' / review':''}</button>}
              {draft&&<button type="button" onClick={()=>setStatus(draft.id,'published')} disabled={busy}>Publish</button>}
              {live&&<button type="button" onClick={()=>setStatus(live.id,'draft')} disabled={busy}>Unpublish</button>}
              {shown&&<button type="button" onClick={()=>open(item.id,{kind:'upload'})} disabled={busy}>Replace</button>}
              {draft&&<button type="button" onClick={()=>remove(draft.id)} disabled={busy}>Delete draft</button>}
            </div>}
          </article>
        })}</div>
      </section>
    })}
  </div>
}
