import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Pilot page. Every statement cites references from content/publications.ts that were verified
 * on 2026-10-09 (repository and indexing records). Owner approval of layout and wording is still required.
 */
export const afarensisPage:SpeciesPageContent={
  taxonId:'afarensis',
  lead:{
    text:'*Australopithecus afarensis* is an early hominin species known from eastern Africa between about 3.9 and 3.0 million years ago. It was recognised in 1978 from the partial skeleton AL 288-1, known as Lucy, and is now documented by many fragmentary fossils from Ethiopia, Kenya and Tanzania. Its combination of upright walking, an ape-sized brain and retained climbing ability makes it a central reference point in debates about the origin of the human lineage.',
    refs:['pub-kimbel-2009','pub-alemseged-2006'],
  },
  facts:[
    {label:'Time range',value:'About 3.9–3.0 million years ago (estimated; dates vary by site)',certainty:'estimated',refs:['pub-kimbel-2009','pub-alemseged-2006','pub-mcnutt-2021']},
    {label:'Region',value:'Ethiopia (Hadar, Dikika, Woranso-Mille), Kenya (Koobi Fora), Tanzania (Laetoli)',certainty:'established',refs:['pub-kimbel-2009','pub-haileselassie-2019','pub-mcnutt-2021']},
    {label:'Brain size',value:'About 380–550 cc (estimated from crania and endocasts)',certainty:'estimated',refs:['pub-gunz-2020','pub-kimbel-2009']},
    {label:'Body size',value:'Females about 105 cm; males up to about 150 cm (estimated from a small number of skeletons)',certainty:'estimated',refs:['pub-kimbel-2009']},
    {label:'Locomotion',value:'Habitual upright walking; the extent of retained climbing is debated',certainty:'debated',refs:['pub-mcnutt-2021','pub-alemseged-2006','pub-green-2012']},
    {label:'Diet',value:'Plant-based and probably mixed; the share of hard or grassy foods is debated',certainty:'debated',refs:['pub-kimbel-2009']},
    {label:'Key fossils',value:'AL 288-1 (Lucy); AL 444-2 (adult male cranium); DIK-1-1 (Selam, juvenile); Laetoli footprints',certainty:'established',refs:['pub-kimbel-2009','pub-alemseged-2006','pub-mcnutt-2021']},
    {label:'Stone tools',value:'No securely attributed stone toolkit; the Dikika cut marks are disputed',certainty:'debated',refs:['pub-mcpherron-2010','pub-dominguez-rodrigo-2010']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'The species was recognised in 1978, when Lucy (AL 288-1) was described from the Hadar Formation in the Afar region of Ethiopia. Hadar has since yielded a large sample of the species, and much of what is known about its anatomy rests on fossils from Hadar, Dikika and Woranso-Mille. Complete adult skeletons are not known; most of the record is fragmentary.',refs:['pub-kimbel-2009'],singleSource:true},
      {type:'paragraph',text:'The juvenile skeleton DIK-1-1, nicknamed Selam, was recovered at Dikika and described in 2006. It is about 3.3 million years old and represents a presumed female of about three years of age. Its skull shows that most features diagnostic of the species were already present at that age, and the skeleton includes a scapula, a hyoid and parts of the foot and lower limb.',refs:['pub-alemseged-2006'],singleSource:true},
      {type:'paragraph',text:'At Laetoli in Tanzania, footprints preserved in volcanic ash date to about 3.66 million years ago. The trackway at site G is usually attributed to the species. A 2021 re-study of the site A trackway concluded that at least two hominin taxa with different feet and gaits coexisted at Laetoli.',refs:['pub-mcnutt-2021'],singleSource:true},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The skull combines an ape-sized braincase with a projecting face and large cheek teeth. Adult males have strong skull crests, and the canines are small compared with those of living apes. Lucy and the Hadar adults show that the pelvis and leg were already adapted to upright walking, while the upper body retained ape-like proportions.',refs:['pub-kimbel-2009','pub-alemseged-2006'],singleSource:true},
      {type:'paragraph',text:'The Dikika juvenile adds many skeletal elements not previously known from the Pliocene hominin record, among them a hyoid bone with typical African-ape morphology. Its teeth place the individual at about three years of age, and the braincase shows that the adult features of the face and skull were already forming early in development.',refs:['pub-alemseged-2006'],singleSource:true},
      {type:'paragraph',text:'The juvenile scapula is gorilla-like and its hand phalanges are long and curved. The authors note that these features raise questions about how important tree climbing remained in the species.',refs:['pub-alemseged-2006','pub-green-2012']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The lower limb and foot of the Dikika juvenile provide clear evidence for bipedal locomotion. At Laetoli, the site G trackways are widely accepted as unequivocal evidence of obligate bipedalism at about 3.66 million years ago.',refs:['pub-alemseged-2006','pub-mcnutt-2021']},
      {type:'paragraph',text:'The main evidence for retained climbing comes from the shoulder. In a 2012 analysis of the Dikika scapulae, Green and Alemseged found that the glenoid cavity points upward, as in living apes and unlike humans, and that the shoulder anatomy of juveniles and adults was similar. They concluded that the species was still a capable climber.',refs:['pub-green-2012','pub-alemseged-2006']},
      {type:'paragraph',text:'Adult body size is estimated at about 105 cm in females, based on Lucy, and up to about 150 cm in males. Strong size dimorphism is inferred from a small number of skeletons, so these figures are approximate.',refs:['pub-kimbel-2009'],singleSource:true},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'Endocranial imprints from eight crania, including the Dikika juvenile, were studied with conventional and synchrotron computed tomography. The sulcal patterns show an ape-like brain organisation, with no features derived towards humans. This contradicts earlier claims of human-like reorganisation in the species.',refs:['pub-gunz-2020'],singleSource:true},
      {type:'paragraph',text:'Brain growth was protracted compared with chimpanzees: infant endocranial volumes, compared with adult values, indicate a long period of development. The authors argue that this prolonged growth may have been critical for the evolution of a long period of childhood learning in hominins.',refs:['pub-gunz-2020'],singleSource:true},
      {type:'paragraph',text:'Adult brain size is estimated at roughly 380 to 550 cc. The overall picture is of a small, ape-like brain that matured more slowly than that of chimpanzees.',refs:['pub-gunz-2020','pub-kimbel-2009']},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'In 2010, McPherron and colleagues reported stone-tool cut marks and percussion marks on animal bones from Dikika, dated to before 3.39 million years ago. They attributed the consumption of animal tissues to *A. afarensis* and noted that this extended the record of stone-tool use by about 800,000 years.',refs:['pub-mcpherron-2010'],singleSource:true},
      {type:'paragraph',text:'Domínguez-Rodrigo, Pickering and Bunn argued that all the marks result from trampling, because some of them superficially resemble experimentally trampled bones, and that the best evidence for butchery dates to 2.6–2.5 million years ago. The debate remains open, and no stone toolkit is securely attributed to *A. afarensis*.',refs:['pub-dominguez-rodrigo-2010','pub-mcpherron-2010','pub-kimbel-2009']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'Fossil sites are mainly wooded and riverine settings. Hadar, Dikika and Woranso-Mille lie in the Afar region of Ethiopia, and Laetoli preserves ash deposits from a volcanic landscape in Tanzania. Reconstructions from sediments and fauna indicate mosaics of woodland, grassland and river margins.',refs:['pub-kimbel-2009'],singleSource:true},
      {type:'paragraph',text:'Diet is reconstructed from teeth, dental microwear and isotopes. The species had large cheek teeth, and microwear studies have been used to argue for different food mixes, so the share of hard or grassy foods remains debated.',refs:['pub-kimbel-2009'],singleSource:true},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'Fossils are documented from Hadar, Dikika and Woranso-Mille in Ethiopia, from Koobi Fora in Kenya and from Laetoli in Tanzania. The species overlapped in time with *A. anamensis*: the 2019 Woranso-Mille cranium, dated to about 3.8 million years ago, was assigned to *A. anamensis*, and the two species overlapped for at least 100,000 years.',refs:['pub-haileselassie-2019','pub-kimbel-2009','pub-mcnutt-2021']},
      {type:'paragraph',text:'Dates for most sites rest on volcanic tuffs, and estimates still vary by site. The time range given at the top of this page is therefore an approximation across the sites listed above.',refs:['pub-kimbel-2009'],singleSource:true},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'*A. afarensis* is usually placed as a descendant of *A. anamensis*. The 2019 study argues that the two species differ more than previously recognised and overlapped in time, which challenges the widely accepted view that one species transformed into the other.',refs:['pub-haileselassie-2019','pub-kimbel-2009']},
      {type:'paragraph',text:'Its relationship to later australopiths and to early *Homo* is debated. The species is discussed as a candidate ancestral group rather than as a settled ancestor of a later taxon. The answer depends on how the morphological differences between successive australopith species are weighted, and different authors weigh them differently.',refs:['pub-kimbel-2009'],singleSource:true},
    ]},
  ],
  debates:[
    {id:'climbing',question:'How much did *A. afarensis* still climb trees?',updated:'2026-10-09',positions:[
      {label:'Climbing retained',summary:'The juvenile scapula is gorilla-like, its hand bones are long and curved, and the shoulder of juveniles and adults is oriented as in living apes. Green and Alemseged concluded that the species was still a capable climber.',refs:['pub-green-2012','pub-alemseged-2006']},
      {label:'Walking as the main mode',summary:'The lower limb and the Laetoli trails show that walking was the main mode of locomotion, and the climbing features are read as remnants of ancestral anatomy. This reading is central to the review of the locomotor debate centred on Lucy.',refs:['pub-kimbel-2009']},
    ]},
    {id:'lineage',question:'Did *A. afarensis* evolve from *A. anamensis* in a single lineage?',updated:'2026-10-09',positions:[
      {label:'Single lineage (anagenesis)',summary:'One species gradually transformed into the other through time. This has been the widely accepted hypothesis, and it predicts no overlap between the two.',refs:['pub-haileselassie-2019']},
      {label:'Overlapping species (cladogenesis)',summary:'The 2019 Woranso-Mille cranium shows that the two species differ more than previously recognised and overlapped for at least 100,000 years, which contradicts a simple transformation.',refs:['pub-haileselassie-2019']},
    ]},
    {id:'dikika-cut-marks',question:'Do the Dikika cut marks show that *A. afarensis* used stone tools?',updated:'2026-10-09',positions:[
      {label:'Tool-made cut marks',summary:'McPherron and colleagues identified stone-tool cut and percussion marks on bones older than 3.39 million years and attributed the behaviour to *A. afarensis*.',refs:['pub-mcpherron-2010']},
      {label:'Trampling damage',summary:'Domínguez-Rodrigo, Pickering and Bunn argued that the marks are trampling damage, based on experimental comparisons, and that secure butchery evidence dates to about 2.6–2.5 million years ago.',refs:['pub-dominguez-rodrigo-2010']},
    ]},
    {id:'laetoli-trackmakers',question:'Which hominins made the Laetoli trackways?',updated:'2026-10-09',positions:[
      {label:'Site G attributed to A. afarensis',summary:'The site G trackway, dated to about 3.66 million years ago, is usually attributed to *A. afarensis*.',refs:['pub-mcnutt-2021']},
      {label:'Two taxa at Laetoli',summary:'A 2021 re-study of the site A trackway found different foot proportions and gait, and argued that at least two hominin taxa coexisted at Laetoli.',refs:['pub-mcnutt-2021']},
    ]},
  ],
  unknowns:[
    {text:'No complete adult skeleton is known. Most of the species is documented by fragmentary bones and teeth, together with a few partial skeletons.',refs:['pub-kimbel-2009']},
    {text:'Soft tissues, including the nose, lips, ears, skin and hair, are not preserved. Any reconstruction of them rests on bone and on stated conventions.',refs:['pub-kimbel-2009']},
    {text:'Which species made the site G trackway, and whether the site A trackmaker was a second hominin taxon, remain open questions.',refs:['pub-mcnutt-2021']},
  ],
  reviewedOn:'2026-10-09',
}
