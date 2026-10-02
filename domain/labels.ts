import type {ClaimEpistemicBasis,ClaimStatus,SourceType,UncertaintyDimension,UncertaintyState,InterpretationPositionKind} from './contracts'
import type {DatingClass} from './time'

export const sourceTypeLabel:Record<SourceType,string>={
  'primary-study':'Primary study',
  'peer-reviewed-paper':'Peer-reviewed paper',
  'institutional-record':'Institutional record',
  'institutional-synthesis':'Institutional synthesis',
  'museum-3d':'Museum 3D record',
  'educational-synthesis':'Educational synthesis'
}
export const claimStatusLabel:Record<ClaimStatus,string>={
  verified:'Verified record',
  'partially-verified':'Partially verified',
  contextual:'Contextual synthesis',
  'disputed-interpretation':'Interpretive / debated'
}
export const claimStatusTone:Record<ClaimStatus,string>={
  verified:'verified',
  'partially-verified':'partial',
  contextual:'contextual',
  'disputed-interpretation':'interpretive'
}
export const claimEpistemicBasisLabel:Record<ClaimEpistemicBasis,string>={
  'direct-record':'Direct record',
  measurement:'Measurement / dating result',
  'derived-analysis':'Derived analysis',
  'cross-source-synthesis':'Cross-source synthesis',
  'relationship-interpretation':'Relationship interpretation'
}


export const uncertaintyDimensionLabel:Record<UncertaintyDimension,string>={
  chronology:'Chronology',
  'taxonomic-assignment':'Taxonomic assignment',
  relationship:'Relationship',
  geography:'Geography',
  provenance:'Provenance',
  interpretation:'Interpretation',
  scope:'Scope',
}
export const uncertaintyStateLabel:Record<UncertaintyState,string>={
  bounded:'Bounded',
  open:'Open',
  contested:'Contested',
  'source-limited':'Source-limited',
  unknown:'Unknown',
}
export const interpretationKindLabel:Record<InterpretationPositionKind,string>={
  'documented-interpretation':'Documented interpretation',
  'alternative-interpretation':'Alternative interpretation',
  'methodological-caution':'Methodological caution',
}
export const datingClassLabel:Record<DatingClass,string>={
  relative:'Relative / biochronological',
  radiometric:'Radiometric (e.g. ⁴⁰Ar/³⁹Ar, ¹⁴C, U-Pb)',
  paleomagnetic:'Paleomagnetic correlation',
  'trapped-electron':'Trapped-charge (e.g. thermoluminescence, ESR)',
  genetic:'Molecular / genetic dating',
  multiple:'Multiple independent methods',
  unspecified:'Method not specified',
}
