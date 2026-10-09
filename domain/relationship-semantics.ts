import type {RelationClass,RelationshipRecord,RelationshipType} from './contracts'

/** How the line is drawn. Never rely on colour alone: every class has a distinct dash pattern and an end marker. */
export type RelationStroke={dash:string|undefined;marker:'none'|'arrow'|'open-arrow'|'double-arrow'|'question'}

export type RelationSemantics={
  relation:RelationClass
  /** Short name used in legends, tooltips and tables. */
  label:string
  /** One plain-language sentence answering "what does this line mean?". */
  meaning:string
  /** What this line does NOT claim. Shown beside the meaning so uncertainty is never lost. */
  doesNotClaim:string
  /** True when the line is read as ancestor→descendant movement through time. */
  directional:boolean
  /** Whether the line speaks about descent at all (gene flow and sister lineages do not). */
  descent:boolean
  /** Position on the established → unresolved scale, for sorting and badges. */
  strength:'contextual'|'proposed'|'likely'|'debated'|'unresolved'|'genetic'
  stroke:RelationStroke
}

export const RELATION_SEMANTICS:Readonly<Record<RelationClass,RelationSemantics>>={
  'branch-context':{relation:'branch-context',label:'Group context',meaning:'Places a taxon inside a broader group (for example Paranthropus within the australopith radiation).',doesNotClaim:'Not a claim that the parent taxon is the direct ancestor.',directional:true,descent:false,strength:'contextual',stroke:{dash:undefined,marker:'none'}},
  'proposed-descent':{relation:'proposed-descent',label:'Proposed descent',meaning:'One reading of the record places the later taxon downstream of the earlier one.',doesNotClaim:'Not an established ancestor–descendant link; other placements are possible.',directional:true,descent:true,strength:'proposed',stroke:{dash:'6 5',marker:'open-arrow'}},
  'likely-ancestor':{relation:'likely-ancestor',label:'Likely ancestor',meaning:'The cited source treats the earlier taxon as the probable ancestor of the later one.',doesNotClaim:'Not proof of a straight-line transition; the two may have overlapped in time.',directional:true,descent:true,strength:'likely',stroke:{dash:'10 3',marker:'arrow'}},
  'sister-lineage':{relation:'sister-lineage',label:'Sister lineage',meaning:'The taxon is drawn from this node as a sister branch alongside a neighbouring lineage in the cited source.',doesNotClaim:'Not a claim that the node is the direct ancestor, and not ancestry between the sister branches.',directional:false,descent:false,strength:'proposed',stroke:{dash:'2 4',marker:'none'}},
  'unresolved-placement':{relation:'unresolved-placement',label:'Unresolved placement',meaning:'Where this taxon belongs on the tree is not settled; the line shows one candidate attachment point.',doesNotClaim:'Not a claim of ancestry or of closeness to the attachment point.',directional:false,descent:false,strength:'unresolved',stroke:{dash:'1 5',marker:'question'}},
  'debated-origin':{relation:'debated-origin',label:'Debated origin',meaning:'Competing published hypotheses give different origins for this taxon; the line shows one of them.',doesNotClaim:'Not a consensus; see the competing hypotheses for the alternatives.',directional:false,descent:false,strength:'debated',stroke:{dash:'4 4 1 4',marker:'question'}},
  'gene-flow':{relation:'gene-flow',label:'Gene flow',meaning:'Genetic evidence shows DNA moved between the two populations at about the marked time.',doesNotClaim:'Not ancestry of one taxon from the other.',directional:false,descent:false,strength:'genetic',stroke:{dash:'3 4',marker:'double-arrow'}},
}

/** Display order for legends: from least to most uncertain, then gene flow. */
export const RELATION_LEGEND_ORDER:readonly RelationClass[]=['branch-context','likely-ancestor','proposed-descent','sister-lineage','debated-origin','unresolved-placement','gene-flow']

export const semanticsOf=(link:Pick<RelationshipRecord,'relation'>):RelationSemantics=>RELATION_SEMANTICS[link.relation]

/** The coarse `type` that a relation class is allowed to appear under. Used by data validation. */
export const ALLOWED_TYPES:Readonly<Record<RelationClass,readonly RelationshipType[]>>={
  'branch-context':['context'],'proposed-descent':['possible'],'likely-ancestor':['possible'],'sister-lineage':['possible'],
  'unresolved-placement':['possible'],'debated-origin':['possible'],'gene-flow':['gene-flow'],
}

/** A line implies ancestry only when its class says so; used to keep "lineage" highlighting honest. */
export const impliesDescent=(link:Pick<RelationshipRecord,'relation'>):boolean=>RELATION_SEMANTICS[link.relation].descent
