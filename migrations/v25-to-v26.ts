/**
 * 0.25.3 → 0.26.0 scientific corrections.
 *
 * The taxon set is frozen (14 taxa, no additions). These records explain every change of scientific
 * meaning so the new catalog fingerprint is traceable. Relationship IDs embed their endpoints, so a
 * corrected edge receives a new ID; the old ID is listed as retired and is never reused.
 */
export type ScientificCorrection={
  id:string
  entity:'taxon'|'relationship'
  before:string
  after:string
  retiredIds:readonly string[]
  newIds:readonly string[]
  rationale:string
}

export const v25ToV26Corrections:readonly ScientificCorrection[]=[
  {
    id:'ardipithecus-ramidus-chronology',
    entity:'taxon',
    before:'Ardipithecus ramidus · ~5.8–4.2 Ma · evidence includes Archaeology',
    after:'Ardipithecus ramidus · ~4.5–4.3 Ma · Fossil + Dating',
    retiredIds:[],
    newIds:[],
    rationale:'5.8 Ma belongs to Ardipithecus kadabba, a separate species. Ar. ramidus is dated to ~4.4 Ma (Aramis, Middle Awash). No archaeological record is associated with it.',
  },
  {
    id:'paranthropus-boisei-origin',
    entity:'relationship',
    before:'ardipithecus → boisei (context)',
    after:'afarensis → boisei (context)',
    retiredIds:['rel-ardipithecus-boisei-6'],
    newIds:['rel-afarensis-boisei-6'],
    rationale:'Robust australopiths arise from within Australopithecus, not directly from Ardipithecus (~2 Myr gap).',
  },
  {
    id:'paranthropus-robustus-origin',
    entity:'relationship',
    before:'boisei → robustus (context)',
    after:'afarensis → robustus (context) + competing-hypothesis set',
    retiredIds:['rel-boisei-robustus-7'],
    newIds:['rel-afarensis-robustus-7'],
    rationale:'P. robustus is not descended from P. boisei (they overlap in time on different continents). The two are drawn as sibling branches, with monophyly vs. parallel origin exposed as a hypothesis set.',
  },
  {
    id:'early-homo-origin',
    entity:'relationship',
    before:'ardipithecus → habilis (possible)',
    after:'afarensis → habilis (possible)',
    retiredIds:['rel-ardipithecus-habilis-8'],
    newIds:['rel-afarensis-habilis-8'],
    rationale:'Early Homo arises from an australopith (A. afarensis, A. garhi or A. sediba are debated); a direct Ardipithecus → Homo link skipped ~2 Myr.',
  },
] as const
