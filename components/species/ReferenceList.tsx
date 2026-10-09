import type {PublicationRecord} from '../../domain/research-model'
import {citationParts,formatCitation} from '../../domain/references'
import type {ReferenceNumbering} from '../../domain/species-page-render'
import ResponsiveDetails from './ResponsiveDetails'
import CopyCitation from './CopyCitation'

const KIND_LABEL={primary:'Primary',review:'Review',dataset:'Dataset',institutional:'Institutional'} as const

/** Compact numbered list of the references a page cites, in order of first citation. */
export default function ReferenceList({numbering,publications}:{numbering:ReferenceNumbering;publications:Readonly<Record<string,PublicationRecord>>}){
  const entries=numbering.order.map(ref=>({ref,n:numbering.numbers.get(ref)!,pub:publications[ref]})).filter(entry=>!!entry.pub)
  if(!entries.length) return null
  return <section className="sp-references" id="sources" aria-labelledby="sources-h">
    <ResponsiveDetails summary={<h2 id="sources-h">Sources ({entries.length})</h2>}>
      <ol className="sp-reflist">{entries.map(({ref,n,pub})=>{
        const parts=citationParts(pub)
        return <li key={ref} id={`ref-${n}`} value={n}>
          <span className="sp-ref-text">
            {parts.authors}{parts.year?` (${parts.year}). `:'. '}{parts.title}. <em>{parts.venue}</em>{parts.locator?` ${parts.locator}`:''}.
            {' '}<a href={parts.href} target="_blank" rel="noopener noreferrer">{parts.doi?`doi:${parts.doi}`:'Link'}</a>
          </span>
          <span className="sp-ref-meta">
            {pub.kind&&<span className="sp-ref-kind">{KIND_LABEL[pub.kind]}</span>}
            <a className="sp-ref-back" href={`#cite-${n}`} aria-label={`Back to the text that cites reference ${n}`}>↑</a>
            <CopyCitation text={formatCitation(pub)}/>
          </span>
        </li>
      })}</ol>
    </ResponsiveDetails>
  </section>
}
