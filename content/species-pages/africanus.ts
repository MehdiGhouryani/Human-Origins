import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Australopithecus africanus. Every statement cites a reference from content/publications.ts. Where the sources used
 * here do not give a value, the text says so; no value is estimated. The age of Sterkfontein Member 4 and the number
 * of species in that sample are disputed; the page states the positions and does not decide. The 1925 statements by
 * Dart are reported as his arguments, not as current estimates. Reviewed 2026-10-13.
 */
export const africanusPage:SpeciesPageContent={
  taxonId:'africanus',
  lead:{
    text:'*Australopithecus africanus* was named by Raymond Dart in 1925 from a juvenile skull found at Taungs (Dart 1925). Sterkfontein is the most prolific single source of *Australopithecus* fossils, and most of them come from Member 4. The age of that deposit is disputed, between about 2.1 and 2.6 million years from flowstones and about 3.4 to 3.5 million years from cosmogenic dating (Granger et al. 2022; Pickering and Kramers 2010).',
    refs:['pub-dart-1925','pub-granger-2022','pub-pickering-2010'],
  },
  facts:[
    {label:'Time range',value:'Disputed. Flowstone dating places Sterkfontein Member 4 between 2.65 and 2.01 million years ago, with the last appearance of the species at about 2 million years ago (Pickering and Kramers 2010). Cosmogenic burial dating gives 3.41 ± 0.11 and 3.49 ± 0.19 million years for the lower middle and upper middle parts of Member 4 (Granger et al. 2022)',certainty:'estimated',refs:['pub-pickering-2010','pub-granger-2022']},
    {label:'Region',value:'South Africa: Taungs, where the type specimen was found (Dart 1925); Sterkfontein, where most *Australopithecus* fossils come from Member 4 (Granger et al. 2022)',certainty:'established',refs:['pub-dart-1925','pub-granger-2022']},
    {label:'Brain size',value:'Not stated. The sources used on this page give no cranial capacity for the species',certainty:'estimated',refs:['pub-dart-1925']},
    {label:'Body size',value:'Not stated. The sources used on this page give no stature or body mass estimate for the species',certainty:'estimated',refs:['pub-fornai-2021']},
    {label:'Locomotion',value:'Disputed or not stated. Dart read the position of the foramen magnum of the Taung skull as showing a posture more erect than that of modern apes (Dart 1925). A 2020 letter argues that the trabecular evidence of the femoral head does not support locomotor diversity at Sterkfontein (Haeusler et al. 2020)',certainty:'debated',refs:['pub-dart-1925','pub-haeusler-2020']},
    {label:'Diet',value:'Not stated. The sources used on this page do not reconstruct the diet of the species',certainty:'estimated',refs:['pub-granger-2022']},
    {label:'Key fossils',value:'The Taung skull, the type specimen (Dart 1925); the Sterkfontein skeletons Sts 14 and StW 431 from Member 4 (Fornai et al. 2021). The skeleton StW 573 ("Little Foot") comes from Member 2 and is dated to 3.67 ± 0.16 million years (Granger et al. 2022)',certainty:'established',refs:['pub-dart-1925','pub-fornai-2021','pub-granger-2022']},
    {label:'Stone tools',value:'No stone tools are attributed to the species by the sources used here. The title of a 2015 dating study places an Oldowan assemblage in Sterkfontein Member 5 (Granger et al. 2015)',certainty:'estimated',refs:['pub-granger-2015']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'Dart published the species in *Nature* on 7 February 1925 (Dart 1925). He describes a fossil skull that was blasted out of a limestone cliff at Taungs, together with a natural cast of the brain cavity and a mandible (Dart 1925). Cleaning the rock exposed almost the whole face (Dart 1925). Dart proposed a new family for the specimen and named it *Australopithecus africanus*, after the southern horizon and the continent where it was found (Dart 1925). The article has no abstract, so these statements are taken from its text.',refs:['pub-dart-1925'],singleSource:true},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'Dart describes the Taung skull as juvenile: the first permanent molars are the only permanent teeth that have erupted, which he compared with a human child of about six years (Dart 1925). He considered the face and the dentition humanoid rather than anthropoid, and he concluded that the fossil was a man-like ape, not a true man (Dart 1925). More recent work compares two sacra from Sterkfontein Member 4, and the authors find that the two individuals are unlikely to be conspecific (Fornai et al. 2021).',refs:['pub-dart-1925','pub-fornai-2021']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'Dart read the forward position of the foramen magnum in the Taung skull as showing a posture appreciably more erect than that of modern apes (Dart 1925). He reported this as an argument from one juvenile skull. A 2020 letter responds to claims of locomotor and taxonomic diversity among Sterkfontein hominins, and its authors argue that the current trabecular evidence of the femoral head does not support them (Haeusler et al. 2020). The sources used on this page give no further reconstruction of how the species moved.',refs:['pub-dart-1925','pub-haeusler-2020']},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'The sources used on this page give no cranial capacity for *Australopithecus africanus*, so no volume is stated here. Dart argued in 1925 that the natural brain cast of the Taung skull showed a brain larger than expected for an ape (Dart 1925). This page reports that as his 1925 argument and does not adopt it as a current estimate, because the endocast belongs to one juvenile skull. The sources used here describe no behaviour of the species, so none is stated. Dart himself calls the specimen a man-like ape and not a true man (Dart 1925).',refs:['pub-dart-1925'],singleSource:true},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'The sources used on this page attribute no stone tool industry to *Australopithecus africanus*. The 2015 dating study is titled as dating the Member 2 *Australopithecus* skeleton and the Member 5 Oldowan assemblage at Sterkfontein, and it gives a cosmogenic burial date of 3.67 ± 0.16 million years for the skeleton StW 573 (Granger et al. 2015; Granger et al. 2022). The Oldowan assemblage is a different deposit from Member 4, which holds most of the fossils of the species (Granger et al. 2022). This rests on one study.',refs:['pub-granger-2015','pub-granger-2022']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'The sources used on this page do not reconstruct the environment or the diet of *Australopithecus africanus*, so neither is stated here. Dart argued in 1925 that the open country of southern Africa, with occasional wooded belts and a scarcity of water, was the setting in which this group evolved (Dart 1925). This page reports that as his historical argument; the dating and morphology studies used here do not test it (Granger et al. 2022; Fornai et al. 2021). The diet is not stated.',refs:['pub-dart-1925','pub-granger-2022','pub-fornai-2021']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'The type specimen comes from Taungs (Dart 1925). Sterkfontein is the most prolific single source of *Australopithecus* fossils, and the vast majority come from Member 4, a cave breccia (Granger et al. 2022). Pickering and Kramers dated flowstones of the site by uranium-lead methods and place Member 4 between 2.65 and 2.01 million years, with the last appearance of the species at about 2 million years (Pickering and Kramers 2010). Granger and colleagues report cosmogenic burial ages of 3.41 ± 0.11 million years for the lower middle part of Member 4, 3.49 ± 0.19 million years for its upper middle part, and 3.61 ± 0.09 million years for Jacovec Cavern (Granger et al. 2022).',refs:['pub-dart-1925','pub-granger-2022','pub-pickering-2010']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Dart proposed that the Taung fossil was an extinct link between man and his simian ancestor (Dart 1925). Granger and colleagues state that, with the date of 3.67 ± 0.16 million years for StW 573, their ages place nearly the entire *Australopithecus* assemblage of Sterkfontein in the mid-Pliocene, contemporaneous with *Australopithecus afarensis* in East Africa (Granger et al. 2022). They also show that the flowstones dated earlier lie within Member 4 and therefore underestimate the age of the fossils (Granger et al. 2022). Pickering and Kramers report the flowstones of StW 573 at about 2.2 million years (Pickering and Kramers 2010). The sources used here do not decide which age is correct.',refs:['pub-dart-1925','pub-granger-2022','pub-pickering-2010']},
    ]},
  ],
  debates:[
    {id:'age-of-member-4',question:'How old is the *Australopithecus* assemblage of Sterkfontein Member 4?',updated:'2026-10-13',positions:[
      {label:'Flowstone ages',summary:'U-Pb dating of flowstones places Member 4 between 2.65 and 2.01 million years, and the last appearance of *Australopithecus africanus* at about 2 million years (Pickering and Kramers 2010).',refs:['pub-pickering-2010']},
      {label:'Cosmogenic burial ages',summary:'Cosmogenic burial dating gives 3.41 ± 0.11 and 3.49 ± 0.19 million years for the fossil-bearing breccia of Member 4, and the flowstones dated earlier are stratigraphically intrusive and underestimate the age of the fossils (Granger et al. 2022). A 2023 reply defends this dating against an argument based on fossil monkeys (Granger et al. 2023).',refs:['pub-granger-2022','pub-granger-2023']},
    ]},
    {id:'one-or-more-species',question:'Does the Sterkfontein Member 4 sample hold one *Australopithecus* species, or more than one?',updated:'2026-10-13',positions:[
      {label:'More than one species',summary:'The sacra of two individuals from Member 4 are unlikely to be conspecific, which supports taxonomic heterogeneity (Fornai et al. 2021).',refs:['pub-fornai-2021']},
      {label:'Alternative explanations',summary:'Some studies explore alternative hypotheses for the morphological variation of the Member 4 assemblage, and the review notes that such variation could be mistaken for taxonomic diversity (Beaudet 2023).',refs:['pub-beaudet-2023']},
      {label:'Evidence not sufficient',summary:'The trabecular evidence of the femoral head does not support locomotor or taxonomic diversity at Sterkfontein, although the authors do not dismiss taxonomic heterogeneity (Haeusler et al. 2020).',refs:['pub-haeusler-2020']},
    ]},
  ],
  unknowns:[
    {text:'The age of Sterkfontein Member 4 is disputed between about 2.1 to 2.6 million years and about 3.4 to 3.5 million years. This page does not decide the question (Pickering and Kramers 2010; Granger et al. 2022).',refs:['pub-pickering-2010','pub-granger-2022']},
    {text:'Whether the Member 4 sample holds more than one species is not settled (Fornai et al. 2021; Beaudet 2023).',refs:['pub-fornai-2021','pub-beaudet-2023']},
    {text:'The stature, body mass, cranial capacity, diet and stone tools of *Australopithecus africanus* are not established in the sources used on this page.',refs:['pub-dart-1925','pub-fornai-2021']},
  ],
  reviewedOn:'2026-10-13',
}
