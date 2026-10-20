import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Homo habilis. Every statement cites a reference from content/publications.ts. Where the sources used here do not
 * give a value, the text says so; no value is estimated. Whether the OH 7 type and related specimens form one species,
 * and how close the species is to Australopithecus, are disputed; the page states the positions and does not decide.
 * Reviewed 2026-10-13.
 */
export const habilisPage:SpeciesPageContent={
  taxonId:'habilis',
  lead:{
    text:'*Homo habilis* was named in 1964 from specimens found at Olduvai Gorge in Tanzania, with the type specimen OH 7 (Leakey et al. 1964). Its place in the genus is disputed. Some researchers argue that its lineage originated before 2.3 million years ago, while others find that its dental morphology is closer to *Australopithecus* than to later *Homo* (Spoor et al. 2015; Davies et al. 2024).',
    refs:['pub-leakey-1964','pub-spoor-2015','pub-davies-2024'],
  },
  facts:[
    {label:'Time range',value:'No time range for the species is given by the sources used here. Spoor and colleagues argue that the habilis lineage originated before 2.3 million years ago (Spoor et al. 2015). The Olduvai Bed I site AGS, dated to 1.84 million years ago, records hominin butchery, but its abstract names no species (Stancampiano et al. 2022)',certainty:'estimated',refs:['pub-spoor-2015','pub-stancampiano-2022']},
    {label:'Region',value:'East Africa: Olduvai Gorge, Tanzania (the type specimens; Leakey et al. 1964); the Turkana basin, Kenya, where Spoor and colleagues report early Homo fossils from Ileret (Spoor et al. 2007); Ledi-Geraru, Ethiopia, an early Homo mandible that is not assigned to a species (Villmoare et al. 2015)',certainty:'established',refs:['pub-leakey-1964','pub-villmoare-2015','pub-spoor-2007']},
    {label:'Brain size',value:'The sources used on this page give no verified cranial capacity for the species, so none is stated here',certainty:'estimated',refs:['pub-davies-2024']},
    {label:'Body size',value:'Not stated. The sources used on this page give no stature or body mass estimate for the species',certainty:'estimated',refs:['pub-davies-2024']},
    {label:'Locomotion',value:'Not stated. The sources used on this page do not describe how the species moved',certainty:'estimated',refs:['pub-spoor-2015']},
    {label:'Diet',value:'Not stated. The sources used on this page do not reconstruct the diet of the species',certainty:'estimated',refs:['pub-davies-2024']},
    {label:'Key fossils',value:'OH 7, the type specimen from Olduvai Gorge (Leakey et al. 1964; Spoor et al. 2015); OH 16, which displays derived dental features (Davies et al. 2024)',certainty:'established',refs:['pub-leakey-1964','pub-spoor-2015','pub-davies-2024']},
    {label:'Stone tools',value:'The sources used here do not name the stone tools of the species. Butchering by hominins at Bed I sites is reported at 1.84 million years ago (Stancampiano et al. 2022)',certainty:'estimated',refs:['pub-stancampiano-2022']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'The species was named by Leakey, Tobias and Napier in 1964 in *Nature*, from specimens found at Olduvai Gorge in Tanzania, with OH 7 as the type specimen (Leakey et al. 1964). The 1964 article has no abstract, so the naming is the only claim this page takes from it. The reconstruction of the OH 7 jaw by virtual methods was published in 2015 (Spoor et al. 2015). The authors describe the reconstructed jaw as remarkably archaic in shape (Spoor et al. 2015).',refs:['pub-leakey-1964','pub-spoor-2015']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'Davies and colleagues study the internal dental morphology of *Homo habilis*, the enamel-dentine junction, which is preserved in cases of moderate tooth wear (Davies et al. 2024). They compare dentine crown shape and size across the mandibular and maxillary tooth rows with a comparative sample of 712 specimens (Davies et al. 2024). They find that EDJ morphology is for the most part remarkably archaic (Davies et al. 2024). The chronologically younger specimen OH 16 displays a suite of derived features, and its inclusion in the species leads to excessive levels of variation (Davies et al. 2024). This rests on one study.',refs:['pub-davies-2024'],singleSource:true},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The sources used on this page do not describe how *Homo habilis* moved, so this page states no conclusion about locomotion. The 2015 jaw reconstruction concerns the shape of the face and jaw, not the rest of the skeleton (Spoor et al. 2015). The species is therefore not described here in terms of its gait or body proportions. The abstract concerns the jaw alone and reports no postcranial material (Spoor et al. 2015). No locomotion is therefore inferred from the jaw evidence. This rests on one study.',refs:['pub-spoor-2015'],singleSource:true},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'The sources used on this page give no verified cranial capacity for *Homo habilis*, so no volume is stated here. The dental evidence is used for the affinities of the species (Davies et al. 2024). The sources used on this page do not describe its cognition or behaviour beyond what is recorded in the tool and butchery evidence (Stancampiano et al. 2022). The authors of the dental study use dentine crown shape and size to characterise the species, not its cognition (Davies et al. 2024). This rests on one study.',refs:['pub-davies-2024','pub-stancampiano-2022'],singleSource:true},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'The AGS site at Olduvai Gorge is dated to 1.84 million years ago and is described as a seasonally waterlogged, largely unvegetated lakeside site near an ephemeral freshwater river (Stancampiano et al. 2022). The authors report that hominins there performed butchering activities similar to those at other Bed I sites, and they did not need the shelter of trees (Stancampiano et al. 2022). The abstract does not name the species that made the butchery marks, so the page attributes no stone tool industry to *Homo habilis* from this study. The abstract reports butchery marks at a Bed I site and does not name the species that made them (Stancampiano et al. 2022). This rests on one study.',refs:['pub-stancampiano-2022'],singleSource:true},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'Stancampiano and colleagues reconstruct the environment at AGS from fossil biomarkers and their carbon isotope values (Stancampiano et al. 2022). The site was a lakeside setting with C4 grasses, and it contrasts with the other anthropogenic sites at Olduvai Gorge in its sparse vegetation (Stancampiano et al. 2022). The sources used here do not reconstruct the diet of *Homo habilis*, so the diet is not stated on this page. The abstract of the AGS study does not report diet, and its isotope values are used to reconstruct vegetation, not hominin food (Stancampiano et al. 2022).',refs:['pub-stancampiano-2022','pub-davies-2024']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'The type specimens come from Olduvai Gorge, Tanzania (Leakey et al. 1964). Early Homo from Ledi-Geraru in Ethiopia is dated to 2.80 to 2.75 million years ago, and the authors describe the partial mandible LD 350-1 as early Homo, without naming a species (Villmoare et al. 2015). Spoor and colleagues report new early Homo fossils from Ileret, east of Lake Turkana in Kenya, and conclude that *H. habilis* and *H. erectus* coexisted in the Turkana basin for almost half a million years (Spoor et al. 2007). A 2025 study compares the structure of the mandibles Omo 222-1973-2744 and KW 7000, an early Homo infant from South Africa, and the authors conclude that taxonomic diversity in early Homo was already evident in infancy (Braga and Moggi-Cecchi 2025).',refs:['pub-leakey-1964','pub-villmoare-2015','pub-spoor-2007','pub-braga-2025']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Spoor and colleagues argue that the reconstructed OH 7 jaw suggests deep-rooted species diversity in early Homo (Spoor et al. 2015). Spoor and colleagues also found that the Ileret fossils confirm the distinctiveness of *H. habilis* and *H. erectus*, independently of overall cranial size, and that the two taxa coexisted for almost half a million years (Spoor et al. 2007). Davies and colleagues conclude that the *H. habilis* hypodigm has more in common with *Australopithecus* than with later *Homo* (Davies et al. 2024). Antón and colleagues argue that traits once thought to define early Homo, particularly *H. erectus*, did not arise as a single package (Antón et al. 2014). The authors note that several studies argue that the variation in the species exceeds that of a single species and that a second species, *Homo rudolfensis*, is also present (Davies et al. 2024).',refs:['pub-spoor-2015','pub-spoor-2007','pub-davies-2024','pub-anton-2014']},
    ]},
  ],
  debates:[
    {id:'closeness-to-australopithecus',question:'How far back does the *Homo habilis* lineage reach, and how close is the species to *Australopithecus*?',updated:'2026-10-13',positions:[
      {label:'Deep-rooted lineage',summary:'The reconstructed OH 7 jaw has a remarkably archaic shape, which suggests that the lineage originated before 2.3 million years ago and marks deep-rooted species diversity in early Homo (Spoor et al. 2015).',refs:['pub-spoor-2015']},
      {label:'Closer to Australopithecus',summary:'The enamel-dentine junction of the species is for the most part remarkably archaic, and the hypodigm has more in common with *Australopithecus* than with later *Homo*; OH 16 has derived features that create excessive variation (Davies et al. 2024).',refs:['pub-davies-2024']},
    ]},
  ],
  unknowns:[
    {text:'Whether the variation in *Homo habilis* exceeds that of a single species, and whether a second species, *Homo rudolfensis*, is present, is disputed (Davies et al. 2024). This page does not decide the question.',refs:['pub-davies-2024']},
    {text:'The stature, body mass, cranial capacity, locomotion and diet of *Homo habilis* are not established in the sources used on this page.',refs:['pub-davies-2024','pub-spoor-2015']},
    {text:'Whether the early Homo mandible LD 350-1 belongs to the species is not stated by its authors (Villmoare et al. 2015).',refs:['pub-villmoare-2015']},
  ],
  reviewedOn:'2026-10-13',
}
