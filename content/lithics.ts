import {asTaxonId} from '../domain/ids'
import type {TaxonId} from '../domain/ids'

/**
 * Archaeological lithic contexts associated with the named taxa in the atlas.
 *
 * A site-level association is not proof that a particular taxon made a particular artefact.
 * The relationship field states exactly how the evidence is connected. Real photographs must
 * be added only from identifiable museum/site records with verified image rights and credit.
 * SVGs are explanatory schematics, never depictions of recovered artefacts.
 */

export type LithicEvidenceStatus =
  | 'no-secure-association'
  | 'unattributed-evidence'
  | 'contextual-association'
  | 'strong-contextual-association'
  | 'disputed-evidence'

export type LithicRelationship =
  | 'none'
  | 'unattributed-site-record'
  | 'temporal-overlap'
  | 'site-association'
  | 'population-association'
  | 'disputed'

export type LithicDiagramKind =
  | 'none'
  | 'oldowan-core-flake'
  | 'acheulean-biface'
  | 'prepared-core-flake'
  | 'blade-core'
  | 'expedient-core-flake'

export type LithicSource = {
  label: string
  url: string
  year?: number
  kind: 'primary-study' | 'review' | 'assessment'
}

export type LithicContext = {
  id: string
  site: string
  region: string
  ageLabel: string
  technology: string
  relationship: LithicRelationship
  objects: readonly string[]
  diagram: LithicDiagramKind
  /** Search/curation brief for an authentic L1 assemblage photograph. */
  assemblagePhotoBrief: string
  /** Search/curation brief for an authentic L2 diagnostic artefact photograph. */
  artefactPhotoBrief: string
  interpretation: string
  caveat: string
  sources: readonly LithicSource[]
}

export type TaxonLithicEvidence = {
  taxonId: TaxonId
  taxonName: string
  shortName: string
  status: LithicEvidenceStatus
  summary: string
  contexts: readonly LithicContext[]
  /** Other technologies are kept separate from the stone-tool sequence. */
  relatedNonLithicNote?: string
}

const noSecureContext = (taxonId: string, taxonName: string, shortName: string, summary: string): TaxonLithicEvidence => ({
  taxonId: asTaxonId(taxonId),
  taxonName,
  shortName,
  status: 'no-secure-association',
  summary,
  contexts: [],
})

const oldowanReview: LithicSource = {
  label: 'Who made the Oldowan? Reviewing African hominin fossils and archaeological sites from 3.5 million years ago',
  url: 'https://doi.org/10.1016/j.jaa.2025.101704',
  year: 2025,
  kind: 'review',
}

const lomekwiSource: LithicSource = {
  label: '3.3-million-year-old stone tools from Lomekwi 3, West Turkana, Kenya',
  url: 'https://doi.org/10.1038/nature14464',
  year: 2015,
  kind: 'primary-study',
}

const denisovanSource: LithicSource = {
  label: 'Denisovans from southwestern China and their subsistence strategies',
  url: 'https://doi.org/10.1038/s41586-026-10997-4',
  year: 2026,
  kind: 'primary-study',
}

const denisovanProteomicsSource: LithicSource = {
  label: 'Ancient proteins identify various Denisovan remains from Southwest China',
  url: 'https://doi.org/10.1038/s41586-026-10976-9',
  year: 2026,
  kind: 'primary-study',
}

const lithics: readonly TaxonLithicEvidence[] = [
  noSecureContext(
    'sahelanthropus',
    'Sahelanthropus tchadensis',
    'Sahelanthropus',
    'No stone-tool assemblage is securely documented from Toros-Menalla or another context attributable to this taxon. This is a limit of the archaeological record, not proof that the animal was incapable of manipulating stones.',
  ),
  noSecureContext(
    'orrin',
    'Orrorin tugenensis',
    'Orrorin',
    'No lithic assemblage is securely associated with the Lukeino Formation remains. Do not infer stone-tool manufacture from the hand or locomotor anatomy.',
  ),
  noSecureContext(
    'ardipithecus',
    'Ardipithecus ramidus',
    'Ardipithecus',
    'No stone-tool assemblage is securely associated with Aramis or other Ardipithecus contexts. The page should show an explicit evidence-status note rather than a fabricated toolkit.',
  ),
  noSecureContext(
    'anamensis',
    'Australopithecus anamensis',
    'A. anamensis',
    'No stone-tool assemblage is securely associated with Kanapoi, Allia Bay or Woranso-Mille. The absence of a registered assemblage is not a claim that tool use was biologically impossible.',
  ),
  {
    taxonId: asTaxonId('afarensis'),
    taxonName: 'Australopithecus afarensis',
    shortName: 'A. afarensis',
    status: 'unattributed-evidence',
    summary: 'There is no securely attributed A. afarensis stone toolkit. Lomekwi 3 is an earlier, unattributed archaeological assemblage; the proposed Dikika bone cut-marks are a separate and disputed claim, not a recovered stone-tool kit.',
    contexts: [
      {
        id: 'afarensis-lomekwi-comparator',
        site: 'Lomekwi 3',
        region: 'West Turkana, Kenya',
        ageLabel: 'about 3.3 million years ago',
        technology: 'Lomekwian large-flake / core technology',
        relationship: 'unattributed-site-record',
        objects: ['large cores', 'detached flakes', 'percussive implements'],
        diagram: 'none',
        assemblagePhotoBrief: 'Authentic Lomekwi 3 assemblage from a documented museum or excavation record; retain the Lomekwi site attribution and do not attach the objects to A. afarensis.',
        artefactPhotoBrief: 'One catalogued Lomekwi 3 core or flake, both faces, with scale and its institutional record; caption as unattributed.',
        interpretation: 'Lomekwi 3 demonstrates stone knapping well before the classic Oldowan record, but it is not assigned to A. afarensis or to any other named hominin species.',
        caveat: 'Chronological proximity is not taxonomic attribution. This is a comparative, unattributed context, not an A. afarensis tool kit.',
        sources: [lomekwiSource],
      },
    ],
  },
  noSecureContext(
    'africanus',
    'Australopithecus africanus',
    'A. africanus',
    'A. africanus has appeared among proposed candidates in discussions of early African stone-tool makers, but no specific stone assemblage is securely assigned to this taxon. Keep the possibility separate from an attribution.',
  ),
  {
    taxonId: asTaxonId('boisei'),
    taxonName: 'Paranthropus boisei',
    shortName: 'P. boisei',
    status: 'contextual-association',
    summary: 'P. boisei overlaps with Oldowan assemblages in eastern Africa and is discussed as a plausible candidate toolmaker. The archaeological record has not resolved which taxon made individual Oldowan artefacts.',
    contexts: [
      {
        id: 'boisei-oldowan-east-africa',
        site: 'Olduvai Gorge and Koobi Fora archaeological contexts',
        region: 'Tanzania and Kenya, East Africa',
        ageLabel: 'Oldowan sequence, broadly about 2.6–1.6 million years ago',
        technology: 'Oldowan (Mode 1): cores, flakes and hammerstones',
        relationship: 'site-association',
        objects: ['cobble cores', 'sharp flakes', 'hammerstones', 'unmodified transported stones'],
        diagram: 'oldowan-core-flake',
        assemblagePhotoBrief: 'A dated, catalogued Oldowan assemblage from a named Olduvai Bed I or Koobi Fora locality; do not combine artefacts from different layers in one flat lay.',
        artefactPhotoBrief: 'One catalogued Oldowan core or flake from a specified layer, both faces, scale, institution and collection number.',
        interpretation: 'The 2025 review identifies early Homo and P. boisei among the most plausible Oldowan toolmakers, while concluding that the maker question remains unresolved.',
        caveat: 'Co-occurrence and plausible manual capability do not prove that P. boisei produced a particular core or flake. Caption as an archaeological association, never “made by P. boisei”.',
        sources: [oldowanReview],
      },
    ],
  },
  noSecureContext(
    'robustus',
    'Paranthropus robustus',
    'P. robustus',
    'Stone-tool assemblages are not securely attributable to P. robustus. Claims about bone tools or possible tool use must be catalogued as a separate material class and must not be used as evidence for a stone-tool kit.',
  ),
  {
    taxonId: asTaxonId('habilis'),
    taxonName: 'Homo habilis',
    shortName: 'H. habilis',
    status: 'contextual-association',
    summary: 'H. habilis is associated with Oldowan archaeological contexts, especially Olduvai and Koobi Fora, but other hominins occur in the same broad record. The evidence supports context-level association, not exclusive authorship.',
    contexts: [
      {
        id: 'habilis-oldowan-olduvai-koobi-fora',
        site: 'Olduvai Gorge Bed I and Koobi Fora',
        region: 'Tanzania and Kenya, East Africa',
        ageLabel: 'key Oldowan contexts around 1.9–1.8 million years ago; wider Oldowan begins earlier',
        technology: 'Oldowan (Mode 1): core-and-flake reduction',
        relationship: 'site-association',
        objects: ['cobble cores and choppers', 'unretouched flakes', 'hammerstones', 'manuports'],
        diagram: 'oldowan-core-flake',
        assemblagePhotoBrief: 'A single, well-provenanced Oldowan assemblage from a named excavation area and stratigraphic unit; keep Olduvai Bed I and Koobi Fora records separate.',
        artefactPhotoBrief: 'One diagnostic core or flake with both faces and a scale bar; retain its site, layer and catalogue number.',
        interpretation: 'The Oldowan is strongly represented at sites where H. habilis fossils are also known, but P. boisei and other hominins overlap with parts of this archaeological record.',
        caveat: 'Do not write “H. habilis invented the Oldowan” or depict it as the sole maker. Tool authorship remains unresolved.',
        sources: [oldowanReview],
      },
    ],
  },
  {
    taxonId: asTaxonId('ergaster'),
    taxonName: 'Homo ergaster',
    shortName: 'H. ergaster',
    status: 'unattributed-evidence',
    summary: 'Early Acheulean artefacts occur in the same broad African period as H. ergaster, but the industry is not uniquely attributable to that taxon. Keep the archaeological site and the taxonomic hypothesis distinct.',
    contexts: [
      {
        id: 'ergaster-kokiselei-comparator',
        site: 'Kokiselei 4',
        region: 'West Turkana, Kenya',
        ageLabel: 'about 1.76 million years ago',
        technology: 'Early Acheulean: large cutting tools and bifaces',
        relationship: 'unattributed-site-record',
        objects: ['bifacial handaxes', 'large cutting tools', 'associated core-and-flake artefacts'],
        diagram: 'none',
        assemblagePhotoBrief: 'A dated Kokiselei 4 Acheulean assemblage with the exact excavation unit and collection record; do not combine it with Oldowan finds from another level.',
        artefactPhotoBrief: 'One catalogued Kokiselei 4 biface photographed from both faces and edge, with scale and collection provenance.',
        interpretation: 'Kokiselei 4 documents early Acheulean technology at about 1.76 Ma. The publication discusses technological coexistence and does not assign every artefact to a named species.',
        caveat: 'H. ergaster is one taxonomic framework for African early Homo, not an established maker label for Kokiselei 4.',
        sources: [{
          label: 'An earlier origin for the Acheulian',
          url: 'https://doi.org/10.1038/nature10372',
          year: 2011,
          kind: 'primary-study',
        }],
      },
    ],
  },
  {
    taxonId: asTaxonId('erectus'),
    taxonName: 'Homo erectus',
    shortName: 'H. erectus',
    status: 'contextual-association',
    summary: 'H. erectus is associated with several distinct lithic traditions across Africa and Eurasia. They must be presented as separate regional contexts: Dmanisi is Mode 1, while Kokiselei 4 documents early Acheulean technology in West Turkana.',
    contexts: [
      {
        id: 'erectus-dmanisi-mode1',
        site: 'Dmanisi',
        region: 'Georgia, South Caucasus',
        ageLabel: 'about 1.8–1.7 million years ago',
        technology: 'Mode 1 / Oldowan-like core-and-flake technology',
        relationship: 'site-association',
        objects: ['cores', 'flakes', 'chopper-cores', 'manuports'],
        diagram: 'oldowan-core-flake',
        assemblagePhotoBrief: 'Dmanisi artefacts from one published layer or excavation unit, with provenance and scale; do not add Acheulean handaxes to this assemblage.',
        artefactPhotoBrief: 'One documented Dmanisi core or flake, both faces, with scale and its institutional catalogue record.',
        interpretation: 'The Dmanisi assemblage is dominated by simple cores, flakes and manuports and is not an Acheulean handaxe industry.',
        caveat: 'Dmanisi is a site-level association with early Homo fossils. Use “associated with the Dmanisi hominin occupation”, not proof that one fossil individual made an artefact.',
        sources: [{
          label: 'Hominin occupations at the Dmanisi site, Georgia: raw materials and technical behaviours',
          url: 'https://pubmed.ncbi.nlm.nih.gov/21277002/',
          year: 2011,
          kind: 'primary-study',
        }],
      },
      {
        id: 'erectus-kokiselei-acheulean',
        site: 'Kokiselei 4',
        region: 'West Turkana, Kenya',
        ageLabel: 'about 1.76 million years ago',
        technology: 'Early Acheulean: large cutting tools and bifaces',
        relationship: 'unattributed-site-record',
        objects: ['bifacial handaxes', 'large cutting tools', 'core-and-flake artefacts'],
        diagram: 'acheulean-biface',
        assemblagePhotoBrief: 'A separate Kokiselei 4 Acheulean assemblage; do not combine with the Dmanisi Mode 1 material.',
        artefactPhotoBrief: 'One catalogued Kokiselei 4 biface, both faces and edge, with scale and collection record.',
        interpretation: 'The early Acheulean appears alongside Oldowan artefacts in the West Turkana archaeological sequence, showing that the technologies were not simply successive stages.',
        caveat: 'This is an archaeological comparator within the broad H. erectus time range, not a unique species attribution.',
        sources: [{
          label: 'An earlier origin for the Acheulian',
          url: 'https://doi.org/10.1038/nature10372',
          year: 2011,
          kind: 'primary-study',
        }],
      },
    ],
  },
  noSecureContext(
    'heidelbergensis',
    'Homo heidelbergensis',
    'H. heidelbergensis',
    'No stone-tool industry can be assigned uniquely to H. heidelbergensis across the debated taxonomic range. Archaeological sites from this period contain substantial technology, but the labels and population associations vary by region.',
  ),
  {
    taxonId: asTaxonId('neanderthal'),
    taxonName: 'Homo neanderthalensis',
    shortName: 'Neanderthals',
    status: 'strong-contextual-association',
    summary: 'Neanderthal fossils occur in well-documented Middle Palaeolithic contexts, including Mousterian and Levallois technologies. These are archaeological associations with populations and sites, not evidence that every artefact was made by an identified individual.',
    contexts: [
      {
        id: 'neanderthal-mousterian',
        site: 'Kebara Cave and other Middle Palaeolithic Neanderthal contexts',
        region: 'Levant and western Eurasia',
        ageLabel: 'Middle Palaeolithic; dates vary by site and layer',
        technology: 'Mousterian / prepared-core (including Levallois) reduction',
        relationship: 'population-association',
        objects: ['prepared cores', 'Levallois flakes and points', 'scrapers', 'retouched flakes'],
        diagram: 'prepared-core-flake',
        assemblagePhotoBrief: 'A named Mousterian assemblage from a specific Neanderthal-bearing layer; keep separate from nearby H. sapiens-bearing contexts.',
        artefactPhotoBrief: 'One catalogued Levallois core or point, photographed from multiple faces with scale and layer provenance.',
        interpretation: 'Prepared-core and Mousterian technologies are well documented in Neanderthal-bearing archaeological contexts.',
        caveat: 'Mousterian and Levallois technologies are not exclusive biological markers; similar techniques occur in other populations and periods.',
        sources: [{
          label: 'The Neandertal genome and the archaeological context of Neanderthal populations',
          url: 'https://doi.org/10.1126/science.1188021',
          year: 2010,
          kind: 'primary-study',
        }],
      },
    ],
  },
  {
    taxonId: asTaxonId('sapiens'),
    taxonName: 'Homo sapiens',
    shortName: 'H. sapiens',
    status: 'strong-contextual-association',
    summary: 'H. sapiens is associated with a very broad and changing range of stone technologies. The page should use separate dated regional contexts rather than imply one universal toolkit or a single straight-line progression.',
    contexts: [
      {
        id: 'sapiens-jebel-irhoud-msA',
        site: 'Jebel Irhoud',
        region: 'Morocco, North Africa',
        ageLabel: 'about 315,000 years ago',
        technology: 'Middle Stone Age core-and-flake technology',
        relationship: 'population-association',
        objects: ['prepared cores', 'flakes', 'points'],
        diagram: 'prepared-core-flake',
        assemblagePhotoBrief: 'A documented Jebel Irhoud Middle Stone Age assemblage with layer and collection details; do not substitute a generic Mousterian photo.',
        artefactPhotoBrief: 'One catalogued Jebel Irhoud core or point, with both faces, scale, institution and collection number.',
        interpretation: 'Middle Stone Age artefacts occur in the archaeological sequence associated with early H. sapiens fossils at Jebel Irhoud.',
        caveat: 'This is a site/population association. The precise authorship of any individual artefact is not recoverable.',
        sources: [{
          label: 'New fossils from Jebel Irhoud, Morocco and the pan-African origin of Homo sapiens',
          url: 'https://doi.org/10.1038/nature22336',
          year: 2017,
          kind: 'primary-study',
        }],
      },
      {
        id: 'sapiens-blombos-still-bay',
        site: 'Blombos Cave',
        region: 'South Africa',
        ageLabel: 'Still Bay, roughly 77,000–70,000 years ago',
        technology: 'Still Bay bifacial point production',
        relationship: 'population-association',
        objects: ['bifacial points', 'preforms', 'unfinished pieces', 'silcrete tools'],
        diagram: 'acheulean-biface',
        assemblagePhotoBrief: 'A discrete Still Bay point assemblage from Blombos Cave with phase, layer and catalogue metadata.',
        artefactPhotoBrief: 'One catalogued Still Bay point, both faces and edge, with scale and its documented layer.',
        interpretation: 'A technological and morphometric study analysed 371 Still Bay points from Blombos and reconstructed stages of bifacial manufacture.',
        caveat: 'The reduction sequence is a schematic explanation of the documented technology, not a claim that all H. sapiens used identical tools.',
        sources: [{
          label: 'The Still Bay points of Blombos Cave (South Africa)',
          url: 'https://doi.org/10.1016/j.jas.2008.09.028',
          year: 2009,
          kind: 'primary-study',
        }],
      },
    ],
  },
  {
    taxonId: asTaxonId('naledi'),
    taxonName: 'Homo naledi',
    shortName: 'H. naledi',
    status: 'disputed-evidence',
    summary: 'No stone-tool assemblage is securely established as a toolkit made by H. naledi. Reports of possible engravings and a possible tool-shaped rock remain preliminary or disputed and must not be converted into a routine stone-tool image.',
    contexts: [
      {
        id: 'naledi-rising-star-claims',
        site: 'Rising Star Cave system',
        region: 'South Africa',
        ageLabel: 'Engraving chronology and authorship remain unresolved',
        technology: 'Possible cave-wall markings; not a secure lithic industry',
        relationship: 'disputed',
        objects: ['reported wall markings', 'a described possible tool-shaped rock'],
        diagram: 'none',
        assemblagePhotoBrief: 'Do not create an assemblage photograph for this claim. Only add a future image if a peer-reviewed, dated and catalogued lithic object is established.',
        artefactPhotoBrief: 'Do not add a “H. naledi tool” image from the current claim. Preserve the original object record and disputed status if new evidence emerges.',
        interpretation: 'The 2025 eLife report describes preliminary possible markings and a possible lithic implement, while its assessment says further work is needed to support their age, anthropogenic origin and authorship.',
        caveat: 'This is a disputed/preliminary claim, not an accepted stone-tool kit. Keep it out of taxon-attributed media until independent dating and object analysis are available.',
        sources: [
          {
            label: 'An initial report of circa 241,000- to 335,000-year-old rock engravings and their relation to Homo naledi',
            url: 'https://doi.org/10.7554/eLife.89102',
            year: 2025,
            kind: 'assessment',
          },
          {
            label: 'No scientific evidence that Homo naledi buried their dead and produced rock art',
            url: 'https://doi.org/10.1016/j.jhevol.2023.103464',
            year: 2024,
            kind: 'assessment',
          },
        ],
      },
    ],
  },
  {
    taxonId: asTaxonId('denisovan'),
    taxonName: 'Denisovans',
    shortName: 'Denisovans',
    status: 'strong-contextual-association',
    summary: 'The 2026 Bianfu Cave studies provide a major archaeological context linked to Denisovan remains identified through palaeoproteomics and morphology. The cultural sequence is associated with the population, while individual artefact authorship remains an archaeological inference.',
    contexts: [
      {
        id: 'denisovan-bianfu',
        site: 'Bianfu Cave',
        region: 'Heqing County, Yunnan, southwestern China',
        ageLabel: 'Cultural sequence about 190,000–70,000 years ago; diagnostic hominin fossils about 167,000–134,000 years ago',
        technology: 'Expedient core reduction and flake production',
        relationship: 'population-association',
        objects: ['cores', 'flakes', 'expedient flake tools', 'unmodified bone objects (separate material class)'],
        diagram: 'expedient-core-flake',
        assemblagePhotoBrief: 'A documented Bianfu Cave lithic assemblage from a specified layer (3–12); never combine the whole 190–70 ka sequence into a single undifferentiated flat lay.',
        artefactPhotoBrief: 'One catalogued Bianfu Cave core or flake from a specified layer, both faces with scale and collection record.',
        interpretation: 'The 2026 studies report 1,366 stone artefacts in cultural deposits and Denisovan hominin remains identified by proteomic and morphological analyses.',
        caveat: 'The artefact sequence spans longer than the dated diagnostic fossils. State the layer-level relationship and avoid suggesting direct authorship by a particular individual.',
        sources: [denisovanSource, denisovanProteomicsSource],
      },
    ],
    relatedNonLithicNote: 'The same Bianfu Cave research reports extensive use of unmodified bone objects. These belong in a separate bone/organic technology group, not in the stone-tool SVG.',
  },
  {
    taxonId: asTaxonId('floresiensis'),
    taxonName: 'Homo floresiensis',
    shortName: 'H. floresiensis',
    status: 'contextual-association',
    summary: 'Stone artefacts at Liang Bua span about 190,000–50,000 years ago; H. floresiensis skeletal remains date to about 100,000–60,000 years ago. The site sequence is associated with the taxon, but the wider artefact date range should not be presented as an exact lifespan of the species.',
    contexts: [
      {
        id: 'floresiensis-liang-bua',
        site: 'Liang Bua',
        region: 'Flores, Indonesia',
        ageLabel: 'Stone artefacts about 190,000–50,000 years ago; skeletal remains about 100,000–60,000 years ago',
        technology: 'Expedient core-and-flake technology with changing tool forms through the sequence',
        relationship: 'temporal-overlap',
        objects: ['cores', 'flakes', 'points', 'perforators', 'blades and microblades in parts of the sequence'],
        diagram: 'expedient-core-flake',
        assemblagePhotoBrief: 'A single Liang Bua assemblage from a dated layer, keeping the older and younger sequences distinct and noting the raw material.',
        artefactPhotoBrief: 'One catalogue-documented Liang Bua flake, point or perforator from a specified layer, both faces with scale.',
        interpretation: 'The revised chronology separates the age of the skeletal remains from the longer age range of the stone artefacts.',
        caveat: 'The artefact sequence is not coextensive with the fossil range. Caption as a Liang Bua cultural sequence with a qualified association, not an individual-specific toolkit.',
        sources: [{
          label: 'Revised stratigraphy and chronology for Homo floresiensis at Liang Bua in Indonesia',
          url: 'https://doi.org/10.1038/nature17179',
          year: 2016,
          kind: 'primary-study',
        }],
      },
    ],
  },
]

export const LITHIC_EVIDENCE: readonly TaxonLithicEvidence[] = lithics

export const lithicEvidenceByTaxon: ReadonlyMap<string, TaxonLithicEvidence> =
  new Map(lithics.map(record => [String(record.taxonId), record]))

export const LITHIC_TAXON_IDS: readonly string[] =
  lithics.map(record => String(record.taxonId))

export function getLithicEvidence(taxonId: string): TaxonLithicEvidence | undefined {
  return lithicEvidenceByTaxon.get(taxonId)
}

export function hasActionableLithicContext(record: TaxonLithicEvidence): boolean {
  return record.contexts.some(context => context.relationship !== 'none' && context.relationship !== 'unattributed-site-record' && context.diagram !== 'none')
}
