import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Homo erectus. Every statement cites a reference from content/publications.ts. Where the sources used here do not
 * give a value, the text says so; no value is estimated. The taxonomy of the African and Asian fossils is an open
 * question (owner decision D-16) and the page does not decide it. Reviewed 2026-10-14.
 */
export const erectusPage:SpeciesPageContent={
  taxonId:'erectus',
  lead:{
    text:'*Homo erectus* is known from fossils in East Africa, Georgia and Java (Hammond et al. 2021; Lordkipanidze et al. 2013; Indriati et al. 2011). The Nariokotome skeleton from Kenya was described in 1985 as the most complete early hominid skeleton ever found, and it documents anatomical differences from modern humans (Brown et al. 1985). Whether the African and Asian fossils form one species is an open question on this page (Antón et al. 2014; Lordkipanidze et al. 2013).',
    refs:['pub-hammond-2021','pub-lordkipanidze-2013','pub-indriati-2011','pub-brown-1985','pub-anton-2014'],
  },
  facts:[
    {label:'Time range',value:'About 1.855 million years or older in East Africa (East Turkana, KNM-ER 2598); about 1.8 million years ago outside Africa at Dmanisi; the youngest Javanese populations are disputed, with ages from about 546 thousand to 143 thousand years (Indriati et al. 2011)',certainty:'estimated',refs:['pub-hammond-2021','pub-lordkipanidze-2013','pub-indriati-2011']},
    {label:'Region',value:'East Africa (East Turkana and Gona, Kenya and Ethiopia; Konso, Ethiopia); Georgia (Dmanisi); Java, Indonesia (Ngandong and Sambungmacan)',certainty:'established',refs:['pub-hammond-2021','pub-sano-2020','pub-baab-2025','pub-lordkipanidze-2013','pub-indriati-2011']},
    {label:'Brain size',value:'The Dmanisi cranium D4500 has a braincase of 546 cubic centimetres (one individual); the Gona cranium DAN5 has a small brain. The sources used here give no species-wide brain volume range',certainty:'established',refs:['pub-lordkipanidze-2013','pub-baab-2025']},
    {label:'Body size',value:'The Nariokotome male died at about 12 years of age and was already 1.68 metres tall. The sources used here give no adult stature range for the species',certainty:'established',refs:['pub-brown-1985']},
    {label:'Locomotion',value:'Not stated. The sources used on this page do not reconstruct how *Homo erectus* moved',certainty:'estimated',refs:['pub-brown-1985','pub-hammond-2021']},
    {label:'Diet',value:'Not stated. The sources used on this page do not reconstruct the diet of *Homo erectus*',certainty:'estimated',refs:['pub-hammond-2021']},
    {label:'Key fossils',value:'Nariokotome skeleton KNM-WT 15000 (Kenya); Dmanisi cranium D4500 and mandible D2600 (Georgia); KNM-ER 2598 occipital (Kenya); DAN5 cranium (Ethiopia)',certainty:'established',refs:['pub-brown-1985','pub-lordkipanidze-2013','pub-hammond-2021','pub-baab-2025']},
    {label:'Stone tools',value:'Acheulean handaxes at Kokiselei 4, Kenya, about 1.76 million years ago; a bone handaxe at Konso, Ethiopia, about 1.4 million years ago',certainty:'estimated',refs:['pub-lepre-2011','pub-sano-2020']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'The Nariokotome III site, on the west side of Lake Turkana in Kenya, yielded a nearly complete skeleton that was excavated in place from sediments dated close to 1.6 million years (Brown et al. 1985). At Dmanisi in Georgia, the cranium D4500 and its mandible D2600 were reported in 2013 as the first completely preserved adult skull of the early Pleistocene (Lordkipanidze et al. 2013). At East Turkana, Kenya, Hammond and colleagues relocated the locality of the occipital KNM-ER 2598, which lies in a different collection area than first reported, and their work supports an age of more than 1.855 million years (Hammond et al. 2021). Each find adds one site or one individual, and none of them alone defines the species.',refs:['pub-brown-1985','pub-lordkipanidze-2013','pub-hammond-2021']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The Nariokotome skeleton belongs to a male that died at about 12 years of age but was already 1.68 metres tall (Brown et al. 1985). The authors report anatomical differences between *Homo erectus* and modern humans in this specimen (Brown et al. 1985). The Dmanisi cranium D4500 combines a small braincase with a large prognathic face and shows close morphological affinities with the earliest known African Homo fossils (Lordkipanidze et al. 2013). The East Turkana postcranial remains, a metatarsal and a partial ilium found less than 50 metres from where KNM-ER 2598 was first found, are consistent with fossil Homo, but they cannot be associated directly with the occipital (Hammond et al. 2021). Antón and colleagues note that traits once thought to define *H. erectus* did not arise as a single package (Antón et al. 2014).',refs:['pub-brown-1985','pub-lordkipanidze-2013','pub-hammond-2021','pub-anton-2014']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The sources used on this page do not reconstruct how *Homo erectus* moved, so this page states no conclusion about locomotion. The Nariokotome skeleton is described by its stature and by anatomical differences from modern humans, and the abstract gives no locomotion reconstruction (Brown et al. 1985). The East Turkana postcranial remains may be the earliest postcranial specimens attributed to *H. erectus*, but the cited abstract does not describe their gait (Hammond et al. 2021). The Dmanisi abstract does not report locomotion either (Lordkipanidze et al. 2013).',refs:['pub-brown-1985','pub-hammond-2021','pub-lordkipanidze-2013']},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'The Dmanisi cranium D4500 has a braincase of 546 cubic centimetres (Lordkipanidze et al. 2013). The Dmanisi sample of five crania shows wide variation within and among early Homo groups, and the authors infer a single evolving lineage (Lordkipanidze et al. 2013). The sources used here give no species-wide brain volume range. Behaviour is documented through stone tools. Lepre and colleagues report that the Acheulean did not accompany the first human dispersal out of Africa, although it was available at the time (Lepre et al. 2011). Sano and colleagues report that sophisticated flaking was practiced about 1.4 million years ago, also on bone (Sano et al. 2020).',refs:['pub-lordkipanidze-2013','pub-lepre-2011','pub-sano-2020']},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'Kokiselei 4, in the Nachukui Formation of West Turkana in Kenya, has characteristic early Acheulean tools dated to 1.76 million years ago (Lepre et al. 2011). Oldowan and Acheulian artefacts co-occur at the site complex, which indicates that the two technologies are not mutually exclusive, time-successive components of an evolving cultural lineage (Lepre et al. 2011). The bone handaxe from the Konso Formation in Ethiopia is dated to about 1.4 million years ago (Sano et al. 2020). The Konso study describes considerable technological progression in that formation between about 1.75 and less than 1.0 million years ago (Sano et al. 2020).',refs:['pub-lepre-2011','pub-sano-2020']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'Hammond and colleagues report that the newly recovered faunal material at East Turkana consists primarily of C4 grazers, a result confirmed by enamel isotope data (Hammond et al. 2021). This describes the habitat. The newly recovered faunal material is the basis of that description (Hammond et al. 2021). The abstract does not link the grazing fauna to hominin food (Hammond et al. 2021). The sources used on this page do not reconstruct the diet of *Homo erectus*, so the diet is not stated here (Hammond et al. 2021; Lordkipanidze et al. 2013).',refs:['pub-hammond-2021','pub-lordkipanidze-2013']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'*Homo erectus* is known from East Turkana before 1.855 million years ago (Hammond et al. 2021) and from Konso in Ethiopia about 1.4 million years ago (Sano et al. 2020). Dmanisi in Georgia documents the presence of Homo outside Africa about 1.8 million years ago (Lordkipanidze et al. 2013). In Java, the Solo River terrace sites of Ngandong and Sambungmacan hold fossils widely acknowledged as the youngest representatives of the species, and their age is disputed. Argon results average 546 ± 12 thousand years, while the oldest ESR and U-series ages are 143 thousand years, and the authors state that the two methods preclude one another (Indriati et al. 2011).',refs:['pub-hammond-2021','pub-sano-2020','pub-lordkipanidze-2013','pub-indriati-2011']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Spoor and colleagues describe two early taxa, *H. habilis* and *H. erectus*, which they say coexisted in the Lake Turkana basin for almost half a million years (Spoor et al. 2007). Lordkipanidze and colleagues argue for a single evolving lineage of early Homo, with continuity across continents (Lordkipanidze et al. 2013). Antón and colleagues argue that traits once thought to define *H. erectus* did not arise as a single package (Antón et al. 2014). Antón and Snodgrass place the transition from non-erectus early Homo to *H. erectus* among the three important shifts in human evolution (Antón and Snodgrass 2012). A 2025 reconstruction of the Gona cranium DAN5 describes a combination of *H. erectus*-like cranial traits and basal Homo-like facial and dental features with a small brain, which the authors read as an intricate transition from early Homo to *H. erectus* (Baab et al. 2025).',refs:['pub-spoor-2007','pub-lordkipanidze-2013','pub-anton-2014','pub-anton-snodgrass-2012','pub-baab-2025']},
    ]},
  ],
  debates:[
    {id:'one-lineage',question:'Do the early Homo fossils from Africa and Dmanisi form one evolving lineage with *Homo erectus*, or are some of them distinct species?',updated:'2026-10-13',positions:[
      {label:'One evolving lineage',summary:'The Dmanisi sample shows wide variation within and among early Homo groups, which the authors read as a single evolving lineage with continuity across continents (Lordkipanidze et al. 2013).',refs:['pub-lordkipanidze-2013']},
      {label:'Distinct species',summary:'*H. habilis* and *H. erectus* are distinct, independent of overall cranial size, and coexisted for almost half a million years in the Turkana basin (Spoor et al. 2007).',refs:['pub-spoor-2007']},
    ]},
  ],
  unknowns:[
    {text:'Whether the African early Homo fossils are assigned to a separate species, *Homo ergaster*, or to *Homo erectus* is an open question. This page does not decide it (Antón et al. 2014; Lordkipanidze et al. 2013).',refs:['pub-anton-2014','pub-lordkipanidze-2013']},
    {text:'The age of the youngest Javanese populations is disputed between argon and ESR and U-series results, which the authors say preclude one another (Indriati et al. 2011).',refs:['pub-indriati-2011']},
    {text:'The stature and body mass of adult *Homo erectus* are not established in the sources used here. The Nariokotome estimate applies to one juvenile (Brown et al. 1985).',refs:['pub-brown-1985']},
  ],
  reviewedOn:'2026-10-13',
}
