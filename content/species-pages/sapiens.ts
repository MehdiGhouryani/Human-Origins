import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Homo sapiens. Every statement cites a reference from content/publications.ts. Where the sources used here do not
 * give a value, the text says so; no value is estimated. Reviewed 2026-10-13.
 */
export const sapiensPage:SpeciesPageContent={
  taxonId:'sapiens',
  lead:{
    text:'*Homo sapiens* is the species of all living humans. The oldest directly dated remains come from Jebel Irhoud in Morocco, about 315,000 years old, found with Middle Stone Age stone tools (Richter et al. 2017; Hublin et al. 2017). Genomes show that most Neanderthal DNA in present-day people outside Africa entered the ancestors of those people in one period, about 50,500 to 43,500 years ago (Iasi et al. 2024).',
    refs:['pub-hublin-2017','pub-richter-2017','pub-iasi-2024'],
  },
  facts:[
    {label:'Time range',value:'About 315,000 years ago at Jebel Irhoud; a skull from Greece dated to more than 210,000 years ago is interpreted as early *Homo sapiens* (Harvati et al. 2019)',certainty:'estimated',refs:['pub-hublin-2017','pub-richter-2017','pub-harvati-2019']},
    {label:'Region',value:'Africa (Jebel Irhoud, Morocco); Europe (Apidima Cave, southern Greece, one skull interpreted as *Homo sapiens*)',certainty:'established',refs:['pub-hublin-2017','pub-harvati-2019']},
    {label:'Brain size',value:'Within the range of present-day humans already about 300,000 years ago; globular brain shape reached present-day variation later, between about 100,000 and 35,000 years ago',certainty:'estimated',refs:['pub-neubauer-2018']},
    {label:'Body size',value:'Not stated. The sources used on this page give no stature or body mass estimate for these fossils',certainty:'estimated',refs:['pub-hublin-2017']},
    {label:'Locomotion',value:'Not stated. The sources used on this page do not describe how these fossils moved',certainty:'estimated',refs:['pub-hublin-2017']},
    {label:'Diet',value:'Not stated. The sources used on this page do not reconstruct the diet of these people',certainty:'estimated',refs:['pub-richter-2017']},
    {label:'Key fossils',value:'Jebel Irhoud remains from Morocco, including the Irhoud 3 mandible (dated with a tooth to 286 ± 32 thousand years ago); the Apidima 1 cranium from Greece',certainty:'established',refs:['pub-hublin-2017','pub-richter-2017','pub-harvati-2019']},
    {label:'Stone tools',value:'Middle Stone Age flint artefacts, some fire-heated, found with the Jebel Irhoud remains; dated to 315 ± 34 thousand years ago by thermoluminescence',certainty:'estimated',refs:['pub-richter-2017']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'New human fossils from Jebel Irhoud, Morocco, were reported in 2017 (Hublin et al. 2017). Richter and colleagues date fire-heated flint artefacts from new excavations at the Middle Stone Age site; the artefacts are directly associated with the newly discovered remains of *Homo sapiens* (Richter et al. 2017). A weighted average places the artefacts and the remains at 315 ± 34 thousand years ago (Richter et al. 2017). Before this work, the earliest fossil attributed to a modern form of *Homo sapiens* came from eastern Africa and was about 195 thousand years old, so the emergence of modern human biology was commonly placed at around 200 thousand years ago (Richter et al. 2017). The authors describe the site as containing one of the earliest directly dated Middle Stone Age assemblages (Richter et al. 2017).',refs:['pub-hublin-2017','pub-richter-2017']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The Jebel Irhoud fossils combine features. Their face, jaw and teeth align with early or recent anatomically modern humans. Their neurocranium and endocast are more archaic (Hublin et al. 2017). The authors describe these remains as early stages of the *Homo sapiens* clade, in which key features of modern morphology were established (Hublin et al. 2017). The authors identify a mosaic of features, including facial, mandibular and dental morphology (Hublin et al. 2017). They state that the processes behind the emergence of *Homo sapiens* involved the whole African continent (Hublin et al. 2017).',refs:['pub-hublin-2017'],singleSource:true},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The sources used on this page do not describe the locomotion of the Jebel Irhoud people, so this page states no conclusion about how they moved. The main published description concentrates on the face, jaw, teeth and endocast (Hublin et al. 2017). The abstract describes the face, jaw, teeth and endocast and does not report postcranial evidence (Hublin et al. 2017). This page therefore does not infer locomotion from the cranial evidence. No locomotion is reported for early *Homo sapiens* fossil in the sources used here (Hublin et al. 2017).',refs:['pub-hublin-2017'],singleSource:true},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'Neubauer and colleagues used computed tomography scans to analyse endocranial casts of 20 *Homo sapiens* fossils from different periods (Neubauer et al. 2018). Brain size in early *Homo sapiens* already fell within the range of present-day humans about 300,000 years ago. Brain shape changed more slowly: it reached present-day human variation between about 100,000 and 35,000 years ago, after other craniofacial features had become modern. The authors state that this process started only after other key features of craniofacial morphology appeared modern, and that it paralleled the emergence of behavioural modernity as seen from the archaeological record (Neubauer et al. 2018). The authors state that their findings are consistent with important genetic changes affecting early brain development within the *Homo sapiens* lineage (Neubauer et al. 2018).',refs:['pub-neubauer-2018'],singleSource:true},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'The Jebel Irhoud remains are associated with Middle Stone Age artefacts, including fire-heated flint. Thermoluminescence dating places the artefacts and fossils at 315 ± 34 thousand years ago (Richter et al. 2017). Richter and colleagues argue that the emergence of *Homo sapiens* and of the Middle Stone Age are close in time, which suggests a larger, potentially pan-African origin for both (Richter et al. 2017). Richter and colleagues describe the artefacts as directly associated with the new remains of *Homo sapiens* (Richter et al. 2017).',refs:['pub-richter-2017'],singleSource:true},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'The sources used here do not reconstruct the environment or diet of the Jebel Irhoud people, so neither is stated on this page. The Irhoud 3 mandible was dated with a tooth to 286 ± 32 thousand years ago, using a recalculated uranium-series with electron spin resonance age (Richter et al. 2017). This age supports the weighted average age of 315 ± 34 thousand years for the artefacts and the associated remains (Richter et al. 2017). The page does not infer environment or diet from the dating evidence. This rests on one study.',refs:['pub-richter-2017'],singleSource:true},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'Jebel Irhoud lies in North Africa. The authors describe it as the oldest and richest African Middle Stone Age hominin site that documents early stages of the *Homo sapiens* clade (Hublin et al. 2017). In southern Greece, the Apidima 1 cranium is dated to more than 210,000 years ago and presents a mixture of modern human and archaic features; the authors interpret it as an early *Homo sapiens* population (Harvati et al. 2019). The authors argue that the origin of the species involved the whole African continent (Hublin et al. 2017). Modern humans at Grotte Mandrin in France are dated to between 56,800 and 51,700 years ago (Slimak et al. 2022).',refs:['pub-hublin-2017','pub-harvati-2019','pub-slimak-2022']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'*Homo sapiens* is the species of all living humans, and its early members are documented at Jebel Irhoud (Hublin et al. 2017). Present-day people outside Africa carry Neanderthal DNA. Most of it came into their ancestors in one period, about 50,500 to 43,500 years ago, so the two groups interbred (Iasi et al. 2024). Iasi and colleagues base their estimate on genomes of present-day and ancient people (Iasi et al. 2024). The Apidima 1 cranium is dated separately and is discussed in the Time range row (Harvati et al. 2019). A complete Neanderthal genome from the Altai Mountains was published in 2014 (Prüfer et al. 2014). A second study dates the same admixture to about 45,000 to 49,000 years ago (Sümer et al. 2025).',refs:['pub-hublin-2017','pub-iasi-2024','pub-harvati-2019','pub-prufer-2014','pub-sumer-2025']},
    ]},
  ],
  debates:[
    {id:'modern-features',question:'Did modern human features appear gradually, or were they already present in early *Homo sapiens*?',updated:'2026-10-13',positions:[
      {label:'Gradual change',summary:'Brain shape reached present-day human variation only between about 100,000 and 35,000 years ago, after other craniofacial features had become modern (Neubauer et al. 2018).',refs:['pub-neubauer-2018']},
      {label:'Early mixture',summary:'The Apidima 1 cranium, dated to more than 210,000 years ago, presents a mixture of modern human and archaic features (Harvati et al. 2019).',refs:['pub-harvati-2019']},
    ]},
  ],
  unknowns:[
    {text:'The stature, body mass, locomotion and diet of early *Homo sapiens* are not established in the sources used on this page.',refs:['pub-hublin-2017']},
    {text:'The identity and age of the Apidima 1 cranium are the basis of the earliest Eurasian claim. The sources used here do not settle how many times early *Homo sapiens* dispersed out of Africa (Harvati et al. 2019).',refs:['pub-harvati-2019']},
  ],
  reviewedOn:'2026-10-13',
}
