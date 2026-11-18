import type {LithicContext,LithicDiagramKind,TaxonLithicEvidence} from '../../content/lithics'
import styles from './LithicEvidencePanel.module.css'

const statusLabels:Record<TaxonLithicEvidence['status'],string>={
  'no-secure-association':'No secure stone-tool association',
  'unattributed-evidence':'Unattributed archaeological evidence',
  'contextual-association':'Context-level association',
  'strong-contextual-association':'Well-documented population context',
  'disputed-evidence':'Disputed or preliminary evidence',
}
const relationshipLabels:Record<LithicContext['relationship'],string>={
  none:'No archaeological association',
  'unattributed-site-record':'Unattributed site evidence',
  'temporal-overlap':'Chronological overlap; authorship unresolved',
  'site-association':'Site-level association',
  'population-association':'Population-level association',
  disputed:'Disputed claim',
}
const diagramLabels:Record<Exclude<LithicDiagramKind,'none'>,string>={
  'oldowan-core-flake':'Core-and-flake reduction',
  'acheulean-biface':'Bifacial shaping',
  'prepared-core-flake':'Prepared-core flaking',
  'blade-core':'Blade production',
  'expedient-core-flake':'Expedient core-and-flake reduction',
}
const diagramStages:Record<Exclude<LithicDiagramKind,'none'>,readonly [string,string,string]>={
  'oldowan-core-flake':['Select a suitable cobble','Strike the core','Detach usable flakes'],
  'acheulean-biface':['Select a large blank','Shape both faces','Thin and regularise the edge'],
  'prepared-core-flake':['Prepare a convex core','Set the striking platform','Detach a predetermined flake'],
  'blade-core':['Prepare a prismatic core','Remove a long blade','Retouch or use the blade'],
  'expedient-core-flake':['Choose a local cobble','Remove convenient flakes','Use suitable sharp edges'],
}

function DiagramShapes({kind,index}:{kind:Exclude<LithicDiagramKind,'none'>;index:number}){
  if(kind==='acheulean-biface'){
    return index===0
      ? <path d="M115 25 C145 38 164 72 155 112 C149 141 125 165 104 172 C83 164 59 140 53 111 C43 72 67 39 96 25 Z"/>
      : index===1
        ? <><path d="M110 18 C149 37 164 79 150 121 C140 151 120 174 105 180 C85 170 61 146 52 119 C36 72 66 31 110 18 Z"/><path d="M110 18 L105 180 M110 38 L145 82 M105 180 L69 115 M105 180 L140 118" className={styles.scar}/></>
        : <><path d="M110 12 C151 42 158 84 145 124 C135 156 118 177 110 183 C99 174 77 152 67 123 C51 82 66 42 110 12 Z"/><path d="M110 24 L110 174 M110 45 L139 84 M110 45 L82 84 M110 174 L78 122 M110 174 L142 122" className={styles.scar}/></>
  }
  if(kind==='prepared-core-flake'){
    return index===2
      ? <><path d="M52 35 Q112 6 168 35 L145 157 Q109 174 75 157 Z"/><path d="M110 18 L110 161" className={styles.scar}/></>
      : <><path d="M51 48 Q110 7 169 48 L151 143 Q111 175 69 143 Z"/><path d="M60 70 Q110 22 160 70 M66 94 Q110 50 154 94 M75 119 Q110 83 145 119" className={styles.scar}/></>
  }
  if(kind==='blade-core'){
    return index===0
      ? <><path d="M76 28 Q110 8 144 28 L153 150 Q111 174 67 150 Z"/><path d="M76 50 L144 50 M70 82 L150 82 M69 116 L151 116" className={styles.scar}/></>
      : <><path d="M106 15 Q126 50 124 95 Q121 140 110 178 Q99 140 96 95 Q94 50 106 15 Z"/><path d="M106 25 L110 164" className={styles.scar}/></>
  }
  if(kind==='expedient-core-flake'){
    return index===0
      ? <path d="M64 66 Q68 27 110 23 Q156 25 160 70 Q169 116 133 150 Q91 165 64 132 Q43 101 64 66 Z"/>
      : index===1
        ? <><path d="M58 70 Q77 24 114 32 Q160 38 155 91 Q145 145 101 153 Q57 140 58 70 Z"/><path d="M114 32 L158 92 L123 103" className={styles.scar}/></>
        : <><path d="M60 130 L110 20 L151 132 Z"/><path d="M83 146 L125 58 L163 155 Z"/></>
  }
  return index===0
    ? <><path d="M64 65 Q70 28 111 25 Q154 31 158 69 Q164 112 130 148 Q91 163 64 132 Q45 100 64 65 Z"/><path d="M75 69 L117 38 L149 77 M70 105 L111 65" className={styles.scar}/></>
    : index===1
      ? <><path d="M64 65 Q70 28 111 25 Q154 31 158 69 Q164 112 130 148 Q91 163 64 132 Q45 100 64 65 Z"/><path d="M160 62 L194 39 L211 104 L186 111 Z"/><path d="M115 24 L170 48" className={styles.scar}/></>
      : <><path d="M87 22 L156 144 L54 126 Z"/><path d="M115 33 L144 145" className={styles.scar}/></>
}

function ReductionDiagram({context}:{context:LithicContext}){
  if(context.diagram==='none') return null
  const kind=context.diagram
  const title=diagramLabels[kind]
  const stages=diagramStages[kind]
  const svgTitleId='lithic-' + context.id + '-title'
  const svgDescId='lithic-' + context.id + '-desc'
  return <div className={styles.diagram}>
    <div className={styles.diagramHeading}>
      <strong>SVG explanation · {title}</strong>
      <span>Schematic only — not a photograph or traced artefact</span>
    </div>
    <svg viewBox="0 0 720 228" role="img" aria-labelledby={svgTitleId} aria-describedby={svgDescId}>
      <title id={svgTitleId}>{title}</title>
      <desc id={svgDescId}>Three simplified stages illustrate a general reduction concept. They are not a reconstruction of a specific excavated object.</desc>
      {[0,1,2].map(index=><g key={index} transform={'translate(' + (index*240) + ',0)'}>
        <rect x="12" y="8" width="216" height="204" rx="12" className={styles.stage}/>
        <g transform="translate(0,15)" className={styles.toolShape}><DiagramShapes kind={kind} index={index}/></g>
        <text x="120" y="192" textAnchor="middle" className={styles.stageLabel}>{stages[index]}</text>
      </g>)}
      <path d="M221 105 L250 105 M242 97 L250 105 L242 113 M461 105 L490 105 M482 97 L490 105 L482 113" className={styles.arrow}/>
    </svg>
    <p className={styles.diagramNote}>Conceptual sequence for the named technology. Artefact form and reduction choices vary by raw material, site and layer.</p>
  </div>
}

function ContextCard({context,index}:{context:LithicContext;index:number}){
  const hasDiagram=context.diagram!=='none'&&context.relationship!=='unattributed-site-record'&&context.relationship!=='disputed'
  return <article className={styles.context} aria-labelledby={'lithic-context-' + context.id}>
    <header className={styles.contextHeader}>
      <div>
        <span className={styles.contextIndex}>Context {index+1}</span>
        <h3 id={'lithic-context-' + context.id}>{context.site}</h3>
        <p>{context.region} · {context.ageLabel}</p>
      </div>
      <span className={styles.relationship}>{relationshipLabels[context.relationship]}</span>
    </header>
    <p className={styles.technology}>{context.technology}</p>
    <ul className={styles.objects}>{context.objects.map(object=><li key={object}>{object}</li>)}</ul>
    <p className={styles.interpretation}>{context.interpretation}</p>
    <p className={styles.caveat}><strong>Attribution caveat:</strong> {context.caveat}</p>
    {hasDiagram&&<ReductionDiagram context={context}/>}
    {hasDiagram&&<div className={styles.photoBriefs}>
      <article>
        <strong>L1 · Assemblage photograph</strong>
        <p>{context.assemblagePhotoBrief}</p>
        <span>Pending a real collection image, licence and credit check</span>
      </article>
      <article>
        <strong>L2 · Diagnostic artefact photograph</strong>
        <p>{context.artefactPhotoBrief}</p>
        <span>Pending object-level catalogue and rights verification</span>
      </article>
    </div>}
    <div className={styles.sources}>
      <strong>Sources</strong>
      {context.sources.map(source=><a key={source.url} href={source.url} target="_blank" rel="noreferrer">
        {source.label}{source.year?' · ' + source.year:''}
      </a>)}
    </div>
  </article>
}

export default function LithicEvidencePanel({record}:{record:TaxonLithicEvidence}){
  return <section className={styles.panel} id="stone-tools" aria-labelledby="stone-tools-heading">
    <div className={styles.panelHeader}>
      <div>
        <span className={styles.kicker}>ARCHAEOLOGICAL MATERIAL CULTURE</span>
        <h2 id="stone-tools-heading">Stone-tool evidence</h2>
      </div>
      <span className={styles.status}>{statusLabels[record.status]}</span>
    </div>
    <p className={styles.summary}>{record.summary}</p>
    {record.contexts.length
      ? <div className={styles.contextList}>{record.contexts.map((context,index)=><ContextCard key={context.id} context={context} index={index}/>)}</div>
      : <p className={styles.noEvidence}>No securely associated stone-tool assemblage is currently registered for this taxon. The atlas deliberately leaves this section without a fabricated tool image.</p>}
    {record.relatedNonLithicNote&&<p className={styles.related}><strong>Other technology (separate category):</strong> {record.relatedNonLithicNote}</p>}
    <p className={styles.policy}>Photographs in L1 and L2 must show real, documented artefacts. The SVGs explain a general technique and must not be mistaken for photographs or exact replicas of excavated objects.</p>
  </section>
}
