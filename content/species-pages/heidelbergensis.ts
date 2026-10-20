import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Homo heidelbergensis. Every statement cites a reference from content/publications.ts. Where the sources used here do
 * not give a value, the text says so; no value is estimated. Whether the species is valid, and which fossils belong to
 * it, is disputed; the page states the positions and does not decide. Reviewed 2026-10-13.
 */
export const heidelbergensisPage:SpeciesPageContent={
  taxonId:'heidelbergensis',
  lead:{
    text:'*Homo heidelbergensis* is a Middle Pleistocene species known from Europe and Africa, including the Sima de los Huesos crania in Spain and the Kabwe cranium in Zambia (Arsuaga et al. 2014; Grün et al. 2020). Its status is disputed. Some researchers treat it as the ancestor of both Neanderthals and modern humans, while the Sima fossils are read by others as the early roots of the Neanderthal lineage (Mounier and Mirazón Lahr 2016; Arsuaga et al. 2014).',
    refs:['pub-arsuaga-2014','pub-grun-2020','pub-mounier-2016'],
  },
  facts:[
    {label:'Time range',value:'The Sima de los Huesos crania date to about 430 thousand years ago (Arsuaga et al. 2014). The Kabwe cranium is often estimated at about 500 thousand years, but its age is not settled (Grün et al. 2020)',certainty:'estimated',refs:['pub-arsuaga-2014','pub-grun-2020']},
    {label:'Region',value:'Europe (Sima de los Huesos, Atapuerca, Spain); Africa (Kabwe, Zambia). The ancestral population is described as Afro-European (Mounier and Mirazón Lahr 2016)',certainty:'established',refs:['pub-arsuaga-2014','pub-grun-2020','pub-mounier-2016']},
    {label:'Brain size',value:'The sources used here give no verified cranial capacity for the species. The Kabwe cranium BH1 has a fairly thick vault and unusually marked paranasal pneumatisation (Balzeau et al. 2017)',certainty:'estimated',refs:['pub-balzeau-2017']},
    {label:'Body size',value:'Not stated. The sources used on this page give no stature or body mass estimate for the species',certainty:'estimated',refs:['pub-stringer-2012']},
    {label:'Locomotion',value:'Not stated. The sources used on this page do not describe how the species moved',certainty:'estimated',refs:['pub-arsuaga-2014']},
    {label:'Diet',value:'Not stated. The sources used on this page do not reconstruct the diet of the species',certainty:'estimated',refs:['pub-stringer-2012']},
    {label:'Key fossils',value:'Seventeen crania from Sima de los Huesos, Atapuerca (Arsuaga et al. 2014); the Kabwe cranium BH1, Zambia (Balzeau et al. 2017; Grün et al. 2020)',certainty:'established',refs:['pub-arsuaga-2014','pub-balzeau-2017','pub-grun-2020']},
    {label:'Stone tools',value:'A lithic assemblage from Kabwe, Zambia, that its authors interpret as a transitional Early Stone Age/Middle Stone Age industry; it is not well provenanced (Miedzianogora et al. 2025)',certainty:'estimated',refs:['pub-miedzianogora-2025']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'The Kabwe cranium was recovered from cave deposits in 1921, during metal ore mining in what is now Zambia (Grün et al. 2020). The original site has since been completely quarried away, so its recovery was unsystematic (Grün et al. 2020). At Atapuerca in northern Spain, the Sima de los Huesos site has yielded seventeen Middle Pleistocene crania, seven of them new in the 2014 study, and the hominin-bearing layer has been reassigned to about 430 thousand years ago (Arsuaga et al. 2014). The Sima sample is the basis of the Neanderthal-roots reading of the species.',refs:['pub-grun-2020','pub-arsuaga-2014']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The Sima de los Huesos crania show a consistent pattern with derived Neandertal features in the face and anterior vault, many related to the masticatory apparatus (Arsuaga et al. 2014). The authors conclude that facial modification was the first step in the evolution of the Neandertal lineage, with different anatomical modules evolving at different rates (Arsuaga et al. 2014). The Kabwe cranium BH1 has been described by micro-CT, which shows its internal anatomy (Balzeau et al. 2017). The micro-CT study describes the Kabwe cranium as one of the best preserved hominin fossils from the mid-Pleistocene (Balzeau et al. 2017).',refs:['pub-arsuaga-2014','pub-balzeau-2017']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The sources used on this page do not describe how *Homo heidelbergensis* moved, so this page states no conclusion about locomotion. The Sima and Kabwe studies concentrate on crania and internal cranial anatomy (Arsuaga et al. 2014; Balzeau et al. 2017), and the abstracts give no postcranial reconstruction. The Kabwe cranium is one of the best preserved hominin fossils from the mid-Pleistocene (Balzeau et al. 2017), but the abstract used here does not describe the rest of the skeleton. No locomotion is therefore inferred from the Sima or Kabwe material on this page.',refs:['pub-arsuaga-2014','pub-balzeau-2017']},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'The sources used here give no verified cranial capacity for the species, so no volume is stated on this page. The Kabwe cranium BH1 has a fairly thick cranial vault, and for many of the analysed features it does not show the apomorphic conditions seen in either Neandertals or *H. sapiens* (Balzeau et al. 2017). The authors note that further research is needed on the role of the species in the course of human evolution (Balzeau et al. 2017). This rests on one study.',refs:['pub-balzeau-2017'],singleSource:true},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'Miedzianogora and colleagues study the lithic assemblage from Kabwe in relation to *Homo heidelbergensis* sensu lato and the origins of the Middle Stone Age (Miedzianogora et al. 2025). They interpret the assemblage as a transitional Early Stone Age/Middle Stone Age industry, and they note that its excavation means it is not well provenanced (Miedzianogora et al. 2025). The authors state that a possible association with *H. heidelbergensis* sensu lato fossils hints that the early Middle Stone Age could have included other members of our clade than *H. sapiens* (Miedzianogora et al. 2025). The sources used on this page do not describe tool industries at Sima de los Huesos, so no tool industry is attributed to the Sima crania here (Arsuaga et al. 2014).',refs:['pub-miedzianogora-2025','pub-arsuaga-2014']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'The sources used on this page do not reconstruct the environment or diet of the species, so neither is stated here. The Kabwe chronology is itself uncertain, which limits what can be said about the setting in which the cranium lived (Grün et al. 2020). The page therefore reports no environmental conclusion for the species (Grün et al. 2020; Arsuaga et al. 2014). The Sima study analyses cranial, facial and dental features (Arsuaga et al. 2014), and the Sima crania are dated through the reassigned hominin-bearing layer, not through their setting (Arsuaga et al. 2014).',refs:['pub-grun-2020','pub-arsuaga-2014']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'The Sima de los Huesos crania are dated to about 430 thousand years ago at Atapuerca, Spain (Arsuaga et al. 2014). The Kabwe cranium is often estimated at about 500 thousand years old, but its recovery impedes accurate dating (Grün et al. 2020). The Kabwe study argues that later Middle Pleistocene Africa held several contemporaneous hominin lineages, among them *H. sapiens*, *H. heidelbergensis* or *H. rhodesiensis*, and *Homo naledi* (Grün et al. 2020). Mounier and Mirazón Lahr predict an African origin for the Afro-European ancestral population (Mounier and Mirazón Lahr 2016).',refs:['pub-arsuaga-2014','pub-grun-2020','pub-mounier-2016']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Stringer describes the status of the species as fundamental to the debate about modern human origins (Stringer 2012). Genetic data suggest that *H. sapiens* and *H. neanderthalensis* shared a last common ancestor in the Middle Pleistocene, about 400 to 700 thousand years ago, which is at least 200,000 years earlier than the species origin indicated by the fossils (Stringer 2016). Mounier and Mirazón Lahr support an Afro-European ancestral population in the Middle Pleistocene that they call *H. heidelbergensis* sensu lato (Mounier and Mirazón Lahr 2016). Roksandić and colleagues propose that *H. heidelbergensis*, in the strict and the broad sense, and *H. rhodesiensis* be abandoned, because these names do not reflect the full range of hominin variability in the Middle Pleistocene (Roksandić et al. 2022).',refs:['pub-stringer-2012','pub-stringer-2016','pub-mounier-2016','pub-roksandic-2022']},
    ]},
  ],
  debates:[
    {id:'classification',question:'How should the Middle Pleistocene fossils usually called *Homo heidelbergensis* be classified?',updated:'2026-10-13',positions:[
      {label:'Afro-European ancestor',summary:'An Afro-European ancestral population in the Middle Pleistocene, *H. heidelbergensis* sensu lato, is the ancestor of both lineages (Mounier and Mirazón Lahr 2016). Genetic data place the last common ancestor about 400 to 700 thousand years ago (Stringer 2016).',refs:['pub-mounier-2016','pub-stringer-2016']},
      {label:'Neanderthal roots',summary:'Derived Neandertal features are present in the face and anterior vault of the Sima crania about 430 thousand years ago, which the authors read as the roots of the Neanderthal lineage (Arsuaga et al. 2014).',refs:['pub-arsuaga-2014']},
      {label:'Abandon the name',summary:'*H. heidelbergensis* (sensu stricto and sensu lato) and *H. rhodesiensis* should be abandoned, because they fail to reflect the full range of Middle Pleistocene hominin variability; *H. bodoensis* is proposed for an early Middle Pleistocene ancestor of the *H. sapiens* lineage (Roksandić et al. 2022).',refs:['pub-roksandic-2022']},
    ]},
  ],
  unknowns:[
    {text:'Whether *Homo heidelbergensis* is a valid species is disputed. Roksandić and colleagues propose abandoning the name and introducing *Homo bodoensis* for an early Middle Pleistocene ancestor of the *Homo sapiens* lineage (Roksandić et al. 2022), while Mounier and Mirazón Lahr use *H. heidelbergensis* sensu lato for an Afro-European ancestral population (Mounier and Mirazón Lahr 2016). This page does not decide the question.',refs:['pub-roksandic-2022','pub-mounier-2016']},
    {text:'The age of the Kabwe cranium is not settled. The study argues that its unsystematic recovery impedes accurate dating (Grün et al. 2020).',refs:['pub-grun-2020']},
    {text:'The stature, body mass, locomotion and diet of *Homo heidelbergensis* are not established in the sources used on this page.',refs:['pub-stringer-2012','pub-arsuaga-2014']},
  ],
  reviewedOn:'2026-10-13',
}
