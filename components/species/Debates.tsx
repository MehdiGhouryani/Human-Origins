import type {SpeciesPageContent} from '../../domain/species-page'
import type {ReferenceNumbering} from '../../domain/species-page-render'
import {citationKey} from '../../domain/species-page-render'
import {Cite,RichText} from './Rich'

const formatDate=(iso:string)=>new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB',{year:'numeric',month:'long',timeZone:'UTC'})

/** “What is debated” and “What is not known”. */
export default function Debates({page,numbering}:{page:SpeciesPageContent;numbering:ReferenceNumbering}){
  return <>
    <section className="sp-section sp-debates" id="debated" aria-labelledby="debated-h">
      <h2 id="debated-h">What is debated</h2>
      {page.debates.map(debate=><article key={debate.id} className="sp-debate" aria-labelledby={`debate-${debate.id}-q`}>
        <h3 id={`debate-${debate.id}-q`}>{debate.question}</h3>
        <ol className="sp-positions">{debate.positions.map((position,index)=><li key={index}>
          <strong>{position.label}</strong>
          <p><RichText text={position.summary}/><Cite refs={position.refs} numbering={numbering} where={citationKey.position(debate.id,index)}/></p>
        </li>)}</ol>
        <p className="sp-updated">Updated {formatDate(debate.updated)}</p>
      </article>)}
    </section>
    <section className="sp-section sp-unknowns" id="unknown" aria-labelledby="unknown-h">
      <h2 id="unknown-h">What is not known</h2>
      <ul>{page.unknowns.map((item,index)=><li key={index}><RichText text={item.text}/><Cite refs={item.refs} numbering={numbering} where={citationKey.unknown(index)}/></li>)}</ul>
    </section>
  </>
}
