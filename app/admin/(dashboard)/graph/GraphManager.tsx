'use client'

import {useMemo,useState} from 'react'
import {useRouter} from 'next/navigation'
import {projectGraph,type GraphConfig} from '../../../../domain/graph-visibility'
import type {RelationshipRecord} from '../../../../domain/contracts'

type Taxon={id:string;name:string;short:string;group:string;start:number;end:number;date:string;inferred?:true}
type Link=RelationshipRecord
type Status='draft'|'published'|'built-in'
type Snapshot={config:GraphConfig;status:Status;live:boolean;publishedConfig:GraphConfig|null}

const sameConfig=(a:GraphConfig|null|undefined,b:GraphConfig|null|undefined)=>{
  if(!a||!b) return a===b
  const norm=(c:GraphConfig)=>JSON.stringify({shown:[...c.shown].sort(),off:[...c.off].sort(),d:c.defaultTaxonId??''})
  return norm(a)===norm(b)
}

export default function GraphManager({initialConfig,defaultConfig,taxa,relationships,initialStatus,initialLive}:{initialConfig:GraphConfig;defaultConfig:GraphConfig;taxa:Taxon[];relationships:readonly Link[];initialStatus:Status;initialLive:boolean}){
  const router=useRouter()
  // `saved` mirrors the server; `config` is what the editor is changing right now.
  const [saved,setSaved]=useState<Snapshot>({config:initialConfig,status:initialStatus,live:initialLive,publishedConfig:null})
  const [config,setConfig]=useState<GraphConfig>(initialConfig)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState<{kind:'ok'|'error';text:string}|null>(null)
  const projection=useMemo(()=>projectGraph(taxa,relationships,config),[taxa,relationships,config])
  const byId=useMemo(()=>new Map(taxa.map(taxon=>[taxon.id,taxon])),[taxa])
  const dirty=!sameConfig(config,saved.config)
  const blocking=projection.issues.filter(issue=>issue.severity==='error')
  const hiddenBy=useMemo(()=>{
    const out=new Map<string,number>()
    for(const blockers of Object.values(projection.dependents)) for(const id of blockers) out.set(id,(out.get(id)??0)+1)
    return out
  },[projection])

  const setMode=(id:string,mode:'shown'|'bridge'|'off')=>{
    setConfig(previous=>{
      const shown=previous.shown.filter(item=>item!==id)
      const off=previous.off.filter(item=>item!==id)
      return {...previous,shown:mode==='shown'?[...shown,id]:shown,off:mode==='off'?[...off,id]:off,defaultTaxonId:previous.defaultTaxonId===id&&mode!=='shown'?undefined:previous.defaultTaxonId}
    })
  }
  const setDefault=(id:string)=>setConfig(previous=>{
    const next={...previous};if(id) next.defaultTaxonId=id;else delete next.defaultTaxonId;return next
  })

  async function request(method:'PATCH'|'DELETE',payload:Record<string,unknown>|undefined,okText:string){
    setBusy(true);setMessage(null)
    try{
      const response=await fetch('/api/admin/graph',{method,headers:payload?{'Content-Type':'application/json'}:undefined,body:payload?JSON.stringify(payload):undefined})
      const body=await response.json().catch(()=>({error:`Server answered ${response.status}`}))
      if(!response.ok){
        const detail=Array.isArray(body.issues)&&body.issues.length?` ${body.issues.map((issue:{message:string})=>issue.message).join(' ')}`:''
        setMessage({kind:'error',text:(body.error??'Graph update failed.')+detail});return
      }
      const next:Snapshot={config:body.config,status:body.status,live:Boolean(body.live),publishedConfig:body.publishedConfig??null}
      setSaved(next);setConfig(next.config)
      setMessage({kind:'ok',text:okText});router.refresh()
    }catch{setMessage({kind:'error',text:'Network error. Nothing was changed.'})}finally{setBusy(false)}
  }
  const publish=()=>request('PATCH',{config,status:'published'},'Published. The public graph now uses this configuration.')
  const saveDraft=()=>request('PATCH',{config},saved.live?'Draft saved. Visitors still see the published graph until you publish.':'Draft saved.')
  const unpublish=()=>request('PATCH',{status:'draft'},'Unpublished. Visitors now see the built-in graph; your draft is kept.')
  const reset=()=>{
    if(!window.confirm('Discard the stored draft and live configuration and go back to the built-in graph?')) return
    void request('DELETE',undefined,'Reset. The built-in graph is live again.')
  }

  const badge=saved.status==='built-in'?'Built-in default':saved.status==='published'?'Live':saved.live?'Live · unpublished changes':'Draft (not live)'
  const visible=projection.taxonIds.length
  return <div className="graph-admin">
    {message&&<p className={message.kind==='ok'?'admin-ok-msg':'admin-error'} role={message.kind==='ok'?'status':'alert'}>{message.text}</p>}
    <section className="graph-admin-summary" aria-label="Graph summary">
      <div><strong>{visible}</strong><span>shown on graph</span></div>
      <div><strong>{config.off.length}</strong><span>switched off</span></div>
      <div><strong>{Object.keys(projection.dependents).length}</strong><span>dependents hidden</span></div>
      <div className={blocking.length?'admin-bad':'admin-ok'}><strong>{blocking.length}</strong><span>blocking issues</span></div>
    </section>
    {projection.issues.length>0&&<ul className="admin-issues">{projection.issues.map((issue,index)=><li key={`${issue.code}-${index}`} className={issue.severity==='error'?'is-error':'is-warning'}><code>{issue.code}</code> {issue.message}</li>)}</ul>}

    <div className="graph-admin-default">
      <label htmlFor="graph-default-taxon">Taxon selected when the explorer opens</label>
      <select id="graph-default-taxon" value={config.defaultTaxonId??''} onChange={event=>setDefault(event.target.value)}>
        <option value="">Automatic (youngest visible: {byId.get(projection.defaultTaxonId)?.short??'none'})</option>
        {projection.taxonIds.map(id=><option key={id} value={id}>{byId.get(id)?.name??id}</option>)}
      </select>
    </div>

    <div className="graph-admin-actions">
      <button type="button" onClick={publish} disabled={busy||blocking.length>0||(!dirty&&saved.status==='published')}>Publish graph</button>
      <button type="button" onClick={saveDraft} disabled={busy||!dirty}>Save draft</button>
      <button type="button" onClick={()=>setConfig(saved.config)} disabled={busy||!dirty} className="secondary">Discard edits</button>
      <button type="button" onClick={()=>setConfig(defaultConfig)} disabled={busy||sameConfig(config,defaultConfig)} className="secondary">Load built-in default</button>
      <button type="button" onClick={unpublish} disabled={busy||!saved.live} className="secondary">Unpublish</button>
      <button type="button" onClick={reset} disabled={busy||saved.status==='built-in'} className="secondary danger">Reset everything</button>
      <span className="admin-badge" aria-live="polite">{badge}{dirty?' · editing':''}</span>
    </div>

    <div className="graph-admin-table-wrap"><table className="admin-table graph-admin-table">
      <thead><tr><th scope="col">Taxon</th><th scope="col">State</th><th scope="col">Graph impact</th><th scope="col">Set state</th></tr></thead>
      <tbody>{taxa.map(taxon=>{
        const state=projection.states[taxon.id]??'bridged'
        const dependent=projection.dependents[taxon.id]
        const hides=hiddenBy.get(taxon.id)??0
        return <tr key={taxon.id}>
          <th scope="row"><strong>{taxon.name}</strong><small>{taxon.group} · {taxon.date}{taxon.inferred?' · inferred node':''}</small></th>
          <td><span className={`graph-state ${state}`}>{state==='dependent'?'Hidden dependent':state==='off'?'Off':state==='shown'?'Shown':'Bridge'}</span></td>
          <td>{state==='off'
            ?<span className="graph-impact">Hides {hides} downstream taxon{hides===1?'':'s'}</span>
            :dependent?<span className="graph-impact">Blocked by {dependent.map(id=>byId.get(id)?.short??id).join(', ')}</span>
            :<span className="graph-muted">{state==='shown'?'Drawn as a node':'Not drawn, path may contract through it'}</span>}</td>
          <td><div className="graph-state-actions" role="group" aria-label={`State of ${taxon.short}`}>
            <button type="button" onClick={()=>setMode(taxon.id,'shown')} className={state==='shown'?'selected':''} aria-pressed={state==='shown'}>Shown</button>
            <button type="button" onClick={()=>setMode(taxon.id,'bridge')} className={state==='bridged'?'selected':''} aria-pressed={state==='bridged'}>Bridge</button>
            <button type="button" onClick={()=>setMode(taxon.id,'off')} className={state==='off'?'selected danger':''} aria-pressed={state==='off'}>Off</button>
          </div></td>
        </tr>
      })}</tbody>
    </table></div>
  </div>
}
