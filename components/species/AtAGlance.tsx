import type {Certainty,SpeciesPageContent} from '../../domain/species-page'
import type {ReferenceNumbering} from '../../domain/species-page-render'
import {citationKey} from '../../domain/species-page-render'
import {Cite,RichText} from './Rich'

export const CERTAINTY_LABEL:Record<Certainty,string>={established:'Established',estimated:'Estimated',debated:'Debated',unknown:'Unknown'}
const CERTAINTY_HINT:Record<Certainty,string>={
  established:'Supported by several independent lines of evidence.',
  estimated:'An estimate with stated uncertainty.',
  debated:'Researchers disagree; see “What is debated”.',
  unknown:'Not known from the evidence available.',
}

export function CertaintyBadge({certainty}:{certainty:Certainty}){
  return <span className={`sp-badge sp-badge-${certainty}`} title={CERTAINTY_HINT[certainty]}>{CERTAINTY_LABEL[certainty]}</span>
}

/** The “At a glance” table: one row per fact with its certainty and citations. */
export default function AtAGlance({page,numbering}:{page:SpeciesPageContent;numbering:ReferenceNumbering}){
  return <section className="sp-card" id="at-a-glance" aria-labelledby="at-a-glance-h">
    <h2 id="at-a-glance-h">At a glance</h2>
    <dl className="sp-facts">
      {page.facts.map(fact=><div key={fact.label} className="sp-fact">
        <dt>{fact.label}</dt>
        <dd>
          <span className="sp-fact-value"><RichText text={fact.value}/><Cite refs={fact.refs} numbering={numbering} where={citationKey.fact(fact.label)}/></span>
          <CertaintyBadge certainty={fact.certainty}/>
        </dd>
      </div>)}
    </dl>
  </section>
}
