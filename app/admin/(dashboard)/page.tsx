import 'server-only'
import Link from 'next/link'
import {contentCatalog} from '../../../content/catalog'
import {listMedia,listCopy} from '../../../infrastructure/cms/store'
import {validateCurrentlyPublished} from '../../../infrastructure/cms/validate'
import {getLiveContent} from '../../../infrastructure/cms/live'
import {copyRegistry} from '../../../content/copy-registry'
import {buildExplorerBootstrap} from '../../../features/explorer/bootstrap'
import {buildSpeciesDossier,completenessTierLabel} from '../../../features/explorer/dossier'
import {requireAdminSession} from '../../../infrastructure/cms/requireSession'

export const dynamic='force-dynamic'

export default async function AdminDashboardPage(){
  await requireAdminSession()
  const media=listMedia()
  const copy=listCopy()
  const report=validateCurrentlyPublished()
  const published=media.filter(m=>m.status==='published').length
  const drafts=media.length-published
  const publishedCopy=copy.filter(c=>c.status==='published').length
  const draftCopy=copy.filter(c=>c.status==='draft').length
  // Completeness is computed from the LIVE catalog (built-in + published CMS rows): exactly what visitors see.
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy)
  const perTaxon=contentCatalog.taxa.map(taxon=>{
    const id=String(taxon.id)
    return {
      id,name:taxon.name,
      canonical:taxon.mediaIds.length,
      cms:media.filter(m=>m.subjectId===id),
      completeness:buildSpeciesDossier(bootstrap,id)?.completeness,
    }
  })
  const checkColumns=perTaxon.find(t=>t.completeness)?.completeness?.checks.map(check=>({key:check.key,label:check.label}))??[]
  const tierCounts=[0,1,2].map(tier=>perTaxon.filter(t=>t.completeness?.tier===tier).length)
  return <>
    <h1>Dashboard</h1>
    <section className="admin-stats" aria-label="Summary">
      <div><strong>{published}</strong><span>Published media</span></div>
      <div><strong>{drafts}</strong><span>Draft media</span></div>
      <div><strong>{publishedCopy}/{copyRegistry.length}</strong><span>Copy slots overridden</span></div>
      <div><strong>{draftCopy}</strong><span>Draft copy edits</span></div>
      <div className={report.ok?'admin-ok':'admin-bad'}><strong>{report.ok?'Valid':`${report.errors} error${report.errors===1?'':'s'}`}</strong><span>Live catalog audit ({report.warnings} warning{report.warnings===1?'':'s'})</span></div>
      <div><strong>{tierCounts[0]} · {tierCounts[1]} · {tierCounts[2]}</strong><span>Species at tier 0 · 1 · 2</span></div>
    </section>
    {!report.ok && <ul className="admin-issues">{report.issues.filter(i=>i.severity==='error').map((i,n)=><li key={n}><code>{i.code}</code> {i.path}: {i.message}</li>)}</ul>}
    {live.rejectedMedia.length>0&&<section className="admin-bad" role="alert"><strong>Published content was rejected</strong><p>{live.rejectedMedia.length} published media row(s) failed validation and are omitted from public pages.</p><ul className="admin-issues">{live.rejectedMedia.map(row=><li key={row.id}><code>{row.id}</code>: {row.issues.join(' · ')}</li>)}</ul></section>}
    <h2>Species</h2>
    <table className="admin-table">
      <thead><tr><th scope="col">Species</th><th scope="col">Built-in media</th><th scope="col">CMS media</th><th scope="col">Tier</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{perTaxon.map(t=><tr key={t.id}>
        <th scope="row">{t.name}</th>
        <td>{t.canonical}</td>
        <td>{t.cms.filter(m=>m.status==='published').length} live · {t.cms.filter(m=>m.status==='draft').length} draft</td>
        <td>{t.completeness?completenessTierLabel[t.completeness.tier]:'—'}</td>
        <td><Link href={`/admin/media?taxon=${t.id}`}>Manage media</Link> · <Link href={`/species/${t.id}`}>View page</Link></td>
      </tr>)}</tbody>
    </table>

    <h2 id="completeness-h">Completeness matrix</h2>
    <p>Each column is one check from the species-page completeness model (tier 0 → 2, left to right). Fill a column to move species up a tier; image slots are fixed from <Link href="/admin/media">Media</Link>.</p>
    <div className="admin-matrix-wrap" role="region" aria-labelledby="completeness-h" tabIndex={0}>
      <table className="admin-table admin-matrix">
        <thead><tr><th scope="col">Species</th>{checkColumns.map(column=><th key={column.key} scope="col" title={column.label}><span>{column.label}</span></th>)}</tr></thead>
        <tbody>{perTaxon.map(t=><tr key={t.id}>
          <th scope="row"><Link href={`/admin/media?taxon=${t.id}`}>{t.name}</Link></th>
          {checkColumns.map(column=>{const met=t.completeness?.checks.find(check=>check.key===column.key)?.met
            return <td key={column.key} className={met?'met':'missing'}><span aria-hidden="true">{met?'✓':'·'}</span><span className="sr-only">{met?'Met':'Missing'}: {column.label}</span></td>})}
        </tr>)}</tbody>
      </table>
    </div>
  </>
}
