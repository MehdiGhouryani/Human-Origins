/**
 * Structure of a species page's scientific text (plan phase P14/P15). The text lives in code under
 * `content/species-pages/<taxon>.ts`, is validated by `infrastructure/validation/species-pages.ts` and
 * cites only references from `content/publications.ts`. Citation numbers are never typed by hand:
 * the UI numbers `refs` by first appearance.
 *
 * Inline markup in any text field: `*italic*` only (used for taxon names). No HTML, no links.
 */
export type Certainty='established'|'estimated'|'debated'|'unknown'
export const CERTAINTIES:readonly Certainty[]=['established','estimated','debated','unknown']

/** Publication ids from `content/publications.ts`. */
export type RefId=string

export type PageFact={label:string;value:string;certainty:Certainty;refs:RefId[]}

export type PageBlock=
  |{type:'paragraph';text:string;refs:RefId[];/** True when the statement rests on one study and says so. */singleSource?:boolean}
  |{type:'note';text:string;refs:RefId[];singleSource?:boolean}
  |{type:'list';items:{text:string;refs:RefId[]}[]}
  |{type:'table';caption:string;rows:{label:string;value:string;refs:RefId[]}[]}

export const SECTION_IDS=['discovery','anatomy','locomotion','brain-behaviour','stone-tools','environment-diet','where-when','place-in-tree'] as const
export type SectionId=typeof SECTION_IDS[number]
export const SECTION_TITLES:Record<SectionId,string>={
  discovery:'Discovery and key fossils',
  anatomy:'Anatomy',
  locomotion:'Locomotion and body',
  'brain-behaviour':'Brain and behaviour',
  'stone-tools':'Stone tools',
  'environment-diet':'Environment and diet',
  'where-when':'Where and when',
  'place-in-tree':'Place in the tree',
}
export type PageSection={id:SectionId;blocks:PageBlock[]}

export type DebatePosition={label:string;summary:string;refs:RefId[]}
export type PageDebate={id:string;question:string;positions:DebatePosition[];/** ISO date of the latest update to this debate. */updated:string}
export type PageUnknown={text:string;refs:RefId[]}

export type SpeciesPageContent={
  taxonId:string
  lead:{text:string;refs:RefId[]}
  /** Rows of the “At a glance” table; must contain every label of `REQUIRED_FACT_LABELS`. */
  facts:PageFact[]
  sections:PageSection[]
  debates:PageDebate[]
  /** What is not known: shown after the debates. At least one item. */
  unknowns:PageUnknown[]
  /** ISO date of the last editorial review of the whole page. */
  reviewedOn:string
  /** Explains why fewer than the required number of recent references exist (otherwise the rule is an error). */
  recentWaiver?:string
}

export const REQUIRED_FACT_LABELS=['Time range','Region','Brain size','Body size','Locomotion','Diet','Key fossils','Stone tools'] as const

export const SPECIES_PAGE_LIMITS={
  leadWords:{min:60,max:90},
  sectionWords:{min:80,max:200},
  totalWords:{min:900,max:1500},
  blockChars:900,
  debatePositions:{min:2,max:4},
  minDebates:1,
  minReferences:8,
  recentReferences:{count:3,years:8},
  staleAfterMonths:12,
} as const

/** Wording that never appears on a species page. */
export const BANNED_PHRASES:readonly RegExp[]=[
  /\bproves?\b/i,/\bproved\b/i,/\bdefinitive(?:ly)?\b/i,/\bconclusively\b/i,/\bmissing link\b/i,/\bprimitive\b/i,/\bape[- ]?man\b/i,/\bcave[- ]?man\b/i,
]
/** Superlatives that are only allowed in a block that also shows a year (the source's date). */
export const DATED_SUPERLATIVES:readonly RegExp[]=[/\bearliest\b/i,/\boldest\b/i,/\byoungest\b/i,/\blatest\b/i,/\bmost recent\b/i]
