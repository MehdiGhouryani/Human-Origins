import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Scientific text for *Ardipithecus ramidus*. Every statement cites references from content/publications.ts that were
 * verified on 2026-11-07 from the article, its repository copy or its PubMed record (see each record’s note).
 * Owner review of the text is still required.
 */
export const ardipithecusPage:SpeciesPageContent={
  taxonId:'ardipithecus',
  lead:{
    text:'*Ardipithecus ramidus* is an early hominin from the Afar Rift of Ethiopia, dated to about 4.4 million years ago. It is known mainly from ARA-VP-6/500, a partial skeleton from Aramis, and from postcranial remains from the Gona Project area. The 2009 synthesis placed it on a basal stage of hominin evolution, with a reduced canine complex, a brain as small as that of living chimpanzees and a mainly C3 plant diet. How it moved, and what its anatomy says about the last common ancestor with African apes, remains debated.',
    refs:['pub-white-2009','pub-woldegabriel-2009','pub-simpson-2019','pub-lovejoy-2009-pelvis'],
  },
  facts:[
    {label:'Time range',value:'About 4.4 million years ago, from the sediments at Aramis and the postcranial material from Gona',certainty:'established',refs:['pub-woldegabriel-2009','pub-simpson-2019']},
    {label:'Region',value:'Afar Rift, Ethiopia: the Aramis locality in the Middle Awash and the Gona Project area',certainty:'established',refs:['pub-white-2009','pub-white-2009-habitat','pub-woldegabriel-2009','pub-simpson-2019']},
    {label:'Brain size',value:'Endocranial capacity of about 300 to 350 cubic centimetres, estimated from a reconstructed skull',certainty:'estimated',refs:['pub-suwa-2009-skull','pub-white-2009']},
    {label:'Body size',value:'About 50 kg and about 120 cm for the partial female skeleton; little size difference between the sexes',certainty:'estimated',refs:['pub-white-2009','pub-lovejoy-2009-foot']},
    {label:'Locomotion',value:'Debated: combined arboreal climbing and bipedality, with the foot, hand and pelvis read in different ways',certainty:'debated',refs:['pub-lovejoy-2009-pelvis','pub-lovejoy-2009-reexam','pub-simpson-2019','pub-prang-2019','pub-prang-2021']},
    {label:'Diet',value:'Mainly C3 plants, from enamel isotopes, with only a minimal C4 component',certainty:'estimated',refs:['pub-white-2009','pub-white-2009-habitat']},
    {label:'Key fossils',value:'Partial skeleton ARA-VP-6/500 from Aramis and postcranial material from Gona; about 110 specimens in total',certainty:'established',refs:['pub-white-2009','pub-lovejoy-2009-foot','pub-simpson-2019']},
    {label:'Stone tools',value:'Not reported with the species in the sources reviewed here',certainty:'unknown',refs:['pub-white-2009']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'*Ardipithecus ramidus* was first described in 1994 from teeth and jaw fragments. By 2009 the species was represented by 110 specimens, including a partial female skeleton, ARA-VP-6/500, recovered from the Aramis locality in the Middle Awash. The fossils and their setting were published together in 2009 in *Science*. The overview by White and colleagues gives the specimen count and the main synthesis; the papers on the pelvis, the foot and the skull describe the individual bones in detail. Each of the pelvis, the foot and the skull has its own paper in the 2009 issue.',refs:['pub-white-2009','pub-white-2009-habitat','pub-lovejoy-2009-pelvis','pub-lovejoy-2009-foot','pub-suwa-2009-skull']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The skull described by Suwa and colleagues has a small endocranial capacity of 300 to 350 cubic centimetres, a small cranial size relative to body size, considerable midfacial projection, and no extreme lower-face prognathism of the kind seen in African apes. Its teeth show a reduced canine and premolar complex, as the 2009 overview notes.',refs:['pub-suwa-2009-skull','pub-white-2009']},
      {type:'paragraph',text:'The foot preserves a widely abducent big toe that was not propulsive in terrestrial bipedality, and Lovejoy and colleagues argue that the species kept a grasping big toe. The foot is therefore read as combining grasping with propulsion, which is the title of the foot paper.',refs:['pub-lovejoy-2009-foot','pub-lovejoy-2009-reexam']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',singleSource:true,text:'In one study, Lovejoy and colleagues report that the pelvis and femur have characters of both upright walking and movement in trees. The ilium is mediolaterally expanded and its sacroiliac joint lies further back, features shared with some Miocene apes and with African apes and later hominids. Bipedality was nevertheless facilitated by a shortened ilium and extra lordosis of the lower spine.',refs:['pub-lovejoy-2009-pelvis']},
      {type:'paragraph',text:'Simpson and colleagues analysed the Gona postcranial material and report a locomotor pattern that combines arboreal clambering with a form of terrestrial bipedality. Prang compares the foot with those of anthropoid primates and finds it most similar to those of living chimpanzees and gorillas, and Prang and colleagues report that the hand retains suspensory morphologies shared with chimpanzees and bonobos.',refs:['pub-simpson-2019','pub-prang-2019','pub-prang-2021']},
      {type:'paragraph',text:'From the same material, Lovejoy and colleagues argue that the last common ancestor of humans and African apes lacked the hand, foot, pelvic, vertebral and limb specialisations for suspension and vertical climbing. The foot paper describes that ancestor as a careful climber that retained adaptations to above-branch plantigrady.',refs:['pub-lovejoy-2009-great-divides','pub-lovejoy-2009-foot']},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'Brain size is known only from the reconstructed skull. The endocranial capacity is estimated at 300 to 350 cubic centimetres, and the 2009 overview states that the brain was as small as that of living chimpanzees. Because the cranium was reconstructed from fragments, the estimate is best read as a range rather than as a measured value.',refs:['pub-suwa-2009-skull','pub-white-2009']},
      {type:'paragraph',singleSource:true,text:'Behaviour cannot be read directly from the bones. In one study, Lovejoy argues that upright walking gave the species no energy advantage, so reproductive success must have been central to behaviours that in living chimpanzees and gorillas include upright feeding, male dominance displays, tool use and hunting. This is a hypothesis drawn from the anatomy, not a recorded behaviour.',refs:['pub-lovejoy-2009-reexam']},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'No stone tools are reported with *Ardipithecus ramidus* in the sources reviewed here. The 2009 overview and the habitat paper describe the teeth, the skeleton, the environment and the fauna, and the sources reviewed here do not report an artefact assemblage linked to the species. Technology is therefore recorded as unknown rather than as absent.',refs:['pub-white-2009','pub-white-2009-habitat']},
      {type:'paragraph',singleSource:true,text:'Any statement about tool use by the species would be a hypothesis. In one study, Lovejoy lists tool use among the behaviours that intensified in later lineages, and the page does not treat tool use by *Ardipithecus ramidus* as established.',refs:['pub-lovejoy-2009-reexam']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',singleSource:true,text:'In one study, WoldeGabriel and colleagues report that sediments that contain the species were deposited about 4.4 million years ago on an alluvial floodplain in the western Afar rift, between two volcanic tuffs with nearly identical argon ages. Phytoliths and carbonate isotopes indicate humid, cool woodlands with a grassy substrate.',refs:['pub-woldegabriel-2009']},
      {type:'paragraph',text:'The large mammals associated with the species at Aramis point to a closed habitat. Dental wear, microwear and stable isotopes indicate that the local habitat was predominantly woodland, and the species is placed in the closed habitats along a continuum from forest to wooded grassland.',refs:['pub-white-2009-habitat','pub-white-2009']},
      {type:'paragraph',text:'The 2009 overview describes the diet as predominantly C3 plant based. Enamel isotopes show only a minimal C4 component, which is consistent with forest or woodland feeding.',refs:['pub-white-2009','pub-white-2009-habitat']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'The fossils come from the Middle Awash, where the Aramis locality lies, and from the Gona Project area, both in the Afar Regional State of Ethiopia. The Aramis hominid-bearing unit is the Lower Aramis Member, which WoldeGabriel and colleagues describe as exposed across an arc of more than nine kilometres between two tuffs.',refs:['pub-woldegabriel-2009','pub-white-2009-habitat']},
      {type:'paragraph',singleSource:true,text:'In one study, Simpson and colleagues describe the Gona postcranial remains as 4.4 million years old in their abstract. The Gona and Aramis material therefore sits in the same early Pliocene interval as reported in those papers.',refs:['pub-simpson-2019']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',singleSource:true,text:'In the 2009 overview, White and colleagues describe *Ardipithecus* as a basal hominid adaptive plateau that precedes *Australopithecus* and its successor *Homo*. They conclude that the last common ancestors of humans and African apes were not chimpanzee-like, and that hominids and African apes became highly specialised along very different evolutionary paths.',refs:['pub-white-2009']},
      {type:'paragraph',text:'The main disagreement concerns the ancestor that humans and chimpanzees shared. Lovejoy and colleagues argue that it lacked suspensory and vertical-climbing specialisations. Prang and colleagues argue from the hand that early hominins evolved from an ancestor with a varied positional repertoire, including suspension and vertical climbing.',refs:['pub-lovejoy-2009-great-divides','pub-prang-2021']},
      {type:'paragraph',text:'Prang argues that the foot is African ape-like, while Lovejoy and colleagues describe a foot that combines prehension and propulsion. The two readings disagree about how much of the ape-like foot is inherited from the ancestor.',refs:['pub-prang-2019','pub-lovejoy-2009-foot']},
    ]},
  ],
  debates:[
    {id:'ardipithecus-ancestor-climbing',question:'Did the human–chimpanzee ancestor climb by suspension, or was it a careful climber?',positions:[
      {label:'Careful climber, not suspensory',summary:'Lovejoy and colleagues argue that the ancestor lacked the suspensory and vertical-climbing specialisations of African apes and was a careful climber that retained adaptations to above-branch plantigrady.',refs:['pub-lovejoy-2009-great-divides','pub-lovejoy-2009-foot']},
      {label:'Varied repertoire including suspension',summary:'Prang and colleagues argue from the hand that Ardipithecus retains suspensory morphologies shared with chimpanzees and bonobos, and that early hominins evolved from an ancestor with suspension and vertical climbing.',refs:['pub-prang-2021']},
      {label:'African ape-like foot',summary:'Prang reports that the foot is most similar to those of living chimpanzees and gorillas, and suggests that the precursor of bipedality was African ape-like terrestrial quadrupedalism and climbing.',refs:['pub-prang-2019']},
      {label:'Arboreal clambering with terrestrial bipedality',summary:'Simpson and colleagues report a postcranial pattern that combines arboreal clambering with terrestrial bipedality, which they describe as previously unknown and unpredicted.',refs:['pub-simpson-2019']},
    ],updated:'2026-11-07'},
  ],
  unknowns:[
    {text:'The brain size and body size estimates rest on one reconstructed skull and one partial skeleton. The sources reviewed here do not give population ranges for the species.',refs:['pub-suwa-2009-skull','pub-white-2009']},
    {text:'Whether the Gona postcranial material and the Aramis skeleton belong to the same population, or to closely related groups, is not established in the sources reviewed here.',refs:['pub-simpson-2019','pub-white-2009']},
  ],
  reviewedOn:'2026-11-07',
}
