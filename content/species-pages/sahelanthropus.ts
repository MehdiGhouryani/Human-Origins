import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Pilot page for *Sahelanthropus tchadensis*. Every statement cites references from
 * content/publications.ts that were verified on 2026-10-09 (repository records, institutional press releases and
 * the publication details they give). Owner approval of text and debate summaries is still required.
 */
export const sahelanthropusPage:SpeciesPageContent={
  taxonId:'sahelanthropus',
  lead:{
    text:'*Sahelanthropus tchadensis* is a Late Miocene primate from northern Chad, dated to about 7 million years ago and known mainly from a nearly complete cranium with associated jaws and teeth. It was described in 2002 as a new hominid with a mixture of ape-like and hominin-like features. Whether it walked habitually upright, and whether it belongs to the human lineage at all, are among the most debated questions about the species.',
    refs:['pub-brunet-2002','pub-zollikofer-2005'],
  },
  facts:[
    {label:'Time range',value:'About 7 million years ago (Late Miocene); 6.8–7.2 million years from cosmogenic dating',certainty:'estimated',refs:['pub-lebatard-2008','pub-brunet-2002']},
    {label:'Region',value:'Northern Chad, Toros-Menalla locality TM 266, about 2,500 km from the East African Rift Valley',certainty:'established',refs:['pub-brunet-2002']},
    {label:'Brain size',value:'Not established from the published material reviewed here',certainty:'unknown',refs:['pub-zollikofer-2005']},
    {label:'Body size',value:'Unknown; no complete postcranial skeleton is published',certainty:'unknown',refs:['pub-daver-2022']},
    {label:'Locomotion',value:'Habitual bipedalism argued from the femur, and disputed on the same bones',certainty:'debated',refs:['pub-daver-2022','pub-williams-2026','pub-cazenave-2024']},
    {label:'Diet',value:'Not reconstructed from the sources reviewed here',certainty:'unknown',refs:['pub-brunet-2002']},
    {label:'Key fossils',value:'Cranium TM 266-01-060-1, mandibular fragments and isolated teeth; a femur and two ulnae',certainty:'established',refs:['pub-zollikofer-2005','pub-brunet-2005','pub-daver-2022']},
    {label:'Stone tools',value:'None known from Toros-Menalla',certainty:'established',refs:['pub-brunet-2002','pub-lebatard-2008']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'*Sahelanthropus tchadensis* was described in 2002 from Toros-Menalla locality TM 266 in northern Chad, about 2,500 km from the East African Rift Valley, where the search for early human fossils had been concentrated. Brunet and colleagues described six hominid specimens and proposed a new genus and species with a mosaic of ape-like and hominin-like characters.',refs:['pub-brunet-2002'],singleSource:true},
      {type:'paragraph',text:'The cranium TM 266-01-060-1 is nearly complete but distorted. A virtual reconstruction published in 2005 corrected the distortion and confirmed that the species is a hominid that is not more closely related to the African great apes. Additional teeth and jaw fragments were published in the same year.',refs:['pub-zollikofer-2005','pub-brunet-2005']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The cranium combines ape-like and hominin-like characters, which is why the species was first described as a mosaic. Its basicranium, the base of the skull around the opening for the spinal cord, is central to the argument about posture, and the 2005 reconstruction used it to suggest that the species might have been an upright biped.',refs:['pub-brunet-2002','pub-zollikofer-2005']},
      {type:'paragraph',text:'The teeth and jaw fragments published in 2005 were used to distance the species from the apes. Because the face and dentition are known from few individuals, their interpretation rests on comparisons with a small number of specimens.',refs:['pub-brunet-2005'],singleSource:true},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The main evidence for bipedalism is postcranial. Daver and colleagues described a partial femur and two ulnae from the same locality and argued that the femur is most consistent with habitual bipedalism, while the ulnae preserve evidence of arboreal behaviour.',refs:['pub-daver-2022'],singleSource:true},
      {type:'paragraph',text:'Williams and colleagues re-examined the same bones in 2026 and reported femoral features that they interpret as hominin-like adaptations, including a femoral tubercle and antetorsion. They describe habitual but not obligate bipedalism, combined with a diverse set of arboreal behaviours.',refs:['pub-williams-2026'],singleSource:true},
      {type:'paragraph',text:'Cazenave and colleagues replied in 2024 that neither the external nor the internal structure of the femur supports habitual bipedalism. They found features that are not exclusive to habitual bipeds and limb proportions that resemble those of the African great apes.',refs:['pub-cazenave-2024'],singleSource:true},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'No endocranial volume or brain organisation is established for the species in the sources reviewed here. The 2005 reconstruction addresses the form of the cranium and the basicranium, and it does not give a reliable brain size. The sample therefore cannot yet be used to estimate the size of the brain or its growth.',refs:['pub-zollikofer-2005'],singleSource:true},
      {type:'paragraph',text:'Behaviour is inferred from the bones. The arm bones are read as evidence of climbing, and the 2026 study argues for a substantial amount of time in trees alongside walking on the ground.',refs:['pub-daver-2022','pub-williams-2026']},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'No stone tools are known from Toros-Menalla, and none are associated with the species. The cranium and its associated fauna were recovered with no reported archaeological evidence. Any claim of tool use at this age would need in-situ evidence from the same sediments, and that evidence has not been reported.',refs:['pub-brunet-2002','pub-lebatard-2008']},
      {type:'paragraph',text:'The site is dated by cosmogenic nuclides to about 7 million years ago. The oldest direct evidence of stone-tool manufacture, from Gona at about 2.6–2.5 million years ago, was reported in 2010, which places future tool evidence from this species several million years earlier than the known record.',refs:['pub-lebatard-2008','pub-mcpherron-2010']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'The Toros-Menalla localities lie in a sedimentary sequence in northern Chad. Beryllium-10 exposure ages from 28 samples bracket the level of the cranium at 6.8–7.2 million years, and the fauna recovered with it was used by the 2002 team to suggest an age of 6–7 million years.',refs:['pub-lebatard-2008','pub-brunet-2002']},
      {type:'paragraph',text:'Diet has not been reconstructed from the sources reviewed here, and the environment is inferred from the sediments and fauna rather than from direct evidence of plant use. Reconstructions of the vegetation and climate at the site are therefore provisional.',refs:['pub-brunet-2002','pub-lebatard-2008']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'The species is known from the TM 266 locality and the wider Toros-Menalla area of northern Chad. It is one of the candidates for the human lineage at about seven million years ago, which places it in the Late Miocene.',refs:['pub-brunet-2002','pub-lebatard-2008']},
      {type:'paragraph',text:'That age is several million years older than the Pliocene australopiths that are usually discussed in studies of early bipedalism, so the species is central to questions about when upright walking first appeared. The age also needs to be compared with dated sites of the same time range in East Africa, which the current sources do not cover.',refs:['pub-lebatard-2008','pub-brunet-2002'],singleSource:true},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Sahelanthropus was assigned to the hominin lineage on its description in 2002. The 2005 reconstruction placed it as a hominid, not closer to the African apes, but its place relative to the human and ape lines remains debated. The question depends on which features are treated as diagnostic of the hominin clade, and different authors weight them differently.',refs:['pub-brunet-2002','pub-zollikofer-2005']},
      {type:'paragraph',text:'Cazenave and colleagues suggest that the species may be an evolutionary side branch close to the human lineage but parallel to it. A 2020 review by Macchiarelli and colleagues treats its nature and relationships as an open question.',refs:['pub-cazenave-2024','pub-macchiarelli-2020']},
    ]},
  ],
  debates:[
    {id:'bipedalism',question:'Was *Sahelanthropus* habitually bipedal?',updated:'2026-10-09',positions:[
      {label:'Habitual bipedalism',summary:'Daver and colleagues argue that the femur is most consistent with habitual bipedalism. Williams and colleagues report hominin-like femoral features in 2026 and describe habitual, not obligate, bipedalism with arboreal behaviour. The 2005 basicranial analysis was read in the same direction.',refs:['pub-daver-2022','pub-williams-2026','pub-zollikofer-2005']},
      {label:'Ape-like femur',summary:'Cazenave and colleagues find that neither the external nor the internal femoral structure is exclusive to habitual bipeds, and that limb proportions resemble those of the African great apes.',refs:['pub-cazenave-2024']},
    ]},
    {id:'hominin-status',question:'Does *Sahelanthropus* belong to the human lineage?',updated:'2026-10-09',positions:[
      {label:'Early hominin',summary:'Brunet and colleagues described the species as a new hominid with a mosaic of ape-like and hominin-like characters in 2002. Zollikofer and colleagues concluded in 2005 that it is a hominid, not closer to the African apes.',refs:['pub-brunet-2002','pub-zollikofer-2005']},
      {label:'Side branch outside the human line',summary:'Cazenave and colleagues suggest that the species may be a side branch close to the human lineage but parallel to it. A 2020 review by Macchiarelli and colleagues treats its nature and relationships as unresolved.',refs:['pub-cazenave-2024','pub-macchiarelli-2020']},
    ]},
  ],
  unknowns:[
    {text:'No complete postcranial skeleton is published, so limb proportions are known only from a femur and two ulnae.',refs:['pub-daver-2022','pub-cazenave-2024']},
    {text:'Brain size and internal brain organisation are not established from the published material reviewed here.',refs:['pub-zollikofer-2005']},
    {text:'Diet, habitat use and the species’ place among the Miocene apes and hominins remain unresolved.',refs:['pub-macchiarelli-2020']},
  ],
  reviewedOn:'2026-10-09',
}
