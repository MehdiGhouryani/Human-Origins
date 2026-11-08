import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Scientific text for *Orrorin tugenensis*. Every statement cites references from content/publications.ts that were
 * verified on 2026-11-07 from the article, its repository copy or its publisher page (see each record’s note).
 * Owner review of the text is still required.
 */
export const orrinPage:SpeciesPageContent={
  taxonId:'orrin',
  lead:{
    text:'*Orrorin tugenensis* is a hominin from the Lukeino Formation in the Tugen Hills of Kenya, dated to about 6 million years ago. The species was named in 2001, and the naming material includes a molar. Its locomotor evidence comes mainly from proximal femora: three fragments are known, and the best preserved shows a cortex pattern that its describers read as bipedal. Other analyses place the femur between Miocene apes and later hominins, and the species’ place in the human lineage remains disputed.',
    refs:['pub-senut-2001','pub-sawada-2002','pub-senut-2018','pub-galik-2004','pub-almecija-2013'],
  },
  facts:[
    {label:'Time range',value:'About 6 to 5.7 million years ago; the lower Aragai levels are dated to about 6 to 5.8 million years',certainty:'estimated',refs:['pub-sawada-2002','pub-gommery-2022']},
    {label:'Region',value:'Lukeino Formation, Tugen Hills, Baringo County, Kenya; sites include Kapsomin, Aragai and Kapcheberek',certainty:'established',refs:['pub-senut-2018','pub-gommery-2022','pub-pickford-2022']},
    {label:'Brain size',value:'Not established: no cranium is described in the sources reviewed here',certainty:'unknown',refs:['pub-galik-2004','pub-senut-2018']},
    {label:'Body size',value:'About 35 to 50 kg for the best-preserved young adult femur; the other fragmentary femur gives larger estimates',certainty:'estimated',refs:['pub-nakatsukasa-2007']},
    {label:'Locomotion',value:'Interpreted as habitually bipedal from the femur; the interpretation is disputed',certainty:'debated',refs:['pub-pickford-2002','pub-galik-2004','pub-richmond-2008','pub-almecija-2013']},
    {label:'Diet',value:'Not reconstructed from the sources reviewed here',certainty:'unknown',refs:['pub-senut-2018']},
    {label:'Key fossils',value:'Naming material including a molar; three proximal femora, including BAR 1002’00',certainty:'established',refs:['pub-senut-2001','pub-galik-2004','pub-senut-2018']},
    {label:'Stone tools',value:'None reported from the Lukeino sites in the sources reviewed here',certainty:'unknown',refs:['pub-senut-2018']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'*Orrorin tugenensis* was named in 2001 from Lukeino Formation material in the Tugen Hills of Kenya. The naming material includes a molar, and additional dental and postcranial remains from the same formation were described later. Three partial femora had been collected by the time of the femoral studies of 2002 and 2004.',refs:['pub-senut-2001','pub-senut-2018','pub-pickford-2002']},
      {type:'paragraph',text:'The 2004 report in *Science* states that, of 20 fossils recovered from the formation by then, three are proximal femora. The Aragai site, in the lower part of the formation, has also yielded fossil monkeys: Gommery and colleagues describe a new colobine monkey from Aragai and date the lower Aragai levels to about 6 to 5.8 million years.',refs:['pub-galik-2004','pub-gommery-2022']},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The known anatomy comes mainly from teeth and femora. Senut and colleagues describe dental remains from the formation, and Galik and colleagues describe the best-preserved femur, BAR 1002’00, as having an intact head joined to the shaft by an elongated neck. Most of the locomotor discussion depends on that neck and head.',refs:['pub-senut-2018','pub-galik-2004']},
      {type:'paragraph',text:'No cranium is described for the species in the sources reviewed here, so its face and braincase cannot be compared with those of other early hominins. The dental anatomy is therefore the main other source of comparison.',refs:['pub-senut-2018','pub-galik-2004']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',singleSource:true,text:'In one CT study, Galik and colleagues examined the BAR 1002’00 neck and shaft. The cortex is markedly thinner at the top of the neck than at the bottom, a pattern that differs from the roughly equal cortical thickness of extant African apes, approaches the condition in later hominids, and indicates bipedality.',refs:['pub-galik-2004']},
      {type:'paragraph',singleSource:true,text:'In one analysis of three femoral fragments, Pickford and colleagues concluded that the species was habitually bipedal. They report derived features shared with australopiths and *Homo*, and none shared with *Pan* or *Gorilla*.',refs:['pub-pickford-2002']},
      {type:'paragraph',text:'Richmond and Jungers analysed the proximal femur quantitatively and dated bipedal adaptations to about six million years ago. Almécija and colleagues report that the femur has morphometric affinities with both Miocene apes and later hominins, and in shape space it falls between them.',refs:['pub-richmond-2008','pub-almecija-2013']},
      {type:'paragraph',singleSource:true,text:'One study estimates body mass at about 35 to 50 kg for the best-preserved young adult. The other fragmentary femur gives larger estimates, which the authors read as individual variation.',refs:['pub-nakatsukasa-2007']},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'No brain size can be estimated from the sources reviewed here, because no cranium is described. Behaviour is inferred only indirectly. The bipedal femoral pattern suggests habitual walking on two legs, but the sources do not reconstruct social organisation, feeding behaviour or the balance between walking and climbing.',refs:['pub-galik-2004','pub-pickford-2002','pub-senut-2018']},
      {type:'paragraph',text:'Statements about these topics would be hypotheses drawn from other species, and the page does not treat them as findings. The same caution applies to every inference about tool use, which the sources reviewed here do not link to the species.',refs:['pub-senut-2018','pub-galik-2004']},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'No stone tools are reported from the Lukeino sites in the sources reviewed here. The dental and femoral studies that describe the material do not report an artefact assemblage from the same deposits, so technology is recorded as unknown rather than as absent.',refs:['pub-senut-2018','pub-galik-2004']},
      {type:'paragraph',text:'Any claim about tool use by *Orrorin tugenensis* would need new evidence from the same deposits. The page therefore records the question as open, and keeps the femoral evidence for bipedality separate from the question of tools.',refs:['pub-galik-2004','pub-senut-2018']},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',singleSource:true,text:'The sources reviewed here do not reconstruct the palaeoenvironment of the species beyond its fauna and dating. In one study, Gommery and colleagues document the colobine monkeys of the lower Aragai levels, which places the material in the Late Miocene of the Tugen Hills.',refs:['pub-gommery-2022']},
      {type:'paragraph',singleSource:true,text:'The one dental study reviewed here describes the teeth but draws no dietary conclusion from them, so no diet is reconstructed for the species in the sources reviewed here.',refs:['pub-senut-2018']},
      {type:'paragraph',text:'A direct study of the hominin material, rather than of the associated fauna, would be needed to test habitat and diet for the species.',refs:['pub-senut-2018','pub-gommery-2022']},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'Sawada and colleagues date the accumulation of the Lukeino Formation to between 6.0 and 5.7 million years ago, using potassium–argon dating and magnetostratigraphy. Gommery and colleagues date the lower Aragai levels to about 6 to 5.8 million years. The two ranges overlap, but they refer to different parts of the formation.',refs:['pub-sawada-2002','pub-gommery-2022']},
      {type:'paragraph',singleSource:true,text:'In one study, Pickford and colleagues describe hominid material from the younger Mabaget Formation, dated to 5.0 to 4.5 million years ago, and report that its dimensions are compatible with both *Orrorin tugenensis* and *Ardipithecus ramidus*. The comparison concerns dimensions and does not assign the material to either species.',refs:['pub-pickford-2022']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Orrorin is usually treated as an early hominin, but the sources disagree about how close it is to later lineages. Pickford and colleagues report derived femoral features shared with australopiths and *Homo*, and none shared with *Pan* or *Gorilla*. Almécija and colleagues place the femoral shape between Miocene apes and later hominins.',refs:['pub-pickford-2002','pub-almecija-2013']},
      {type:'paragraph',text:'Richmond and Jungers use the femur to argue that bipedal adaptations were present about six million years ago. Pickford and colleagues report that Pliocene material from Mabaget is dimensionally compatible with both *Orrorin* and *Ardipithecus*, which does not settle the relation between the two genera.',refs:['pub-richmond-2008','pub-pickford-2022']},
    ]},
  ],
  debates:[
    {id:'orrorin-habitual-bipedalism',question:'Was *Orrorin tugenensis* habitually bipedal?',positions:[
      {label:'Habitually bipedal',summary:'Pickford and colleagues conclude from three femoral fragments that the species was habitually bipedal, with derived features shared with australopiths and Homo.',refs:['pub-pickford-2002']},
      {label:'Bipedal from the neck cortex',summary:'Galik and colleagues read the thinner superior cortex of the femoral neck as evidence of bipedality, a pattern that differs from that of extant African apes.',refs:['pub-galik-2004']},
      {label:'Mosaic femoral shape',summary:'Almécija and colleagues report morphometric affinities with both Miocene apes and later hominins; in shape space the femur lies between the two groups.',refs:['pub-almecija-2013']},
      {label:'Bipedal adaptations by six million years',summary:'Richmond and Jungers date bipedal adaptations to about six million years ago using a quantitative femoral analysis.',refs:['pub-richmond-2008']},
    ],updated:'2026-11-07'},
  ],
  unknowns:[
    {text:'The sources reviewed here do not establish whether the femora and the dental remains belong to one species, or to one population.',refs:['pub-senut-2018','pub-galik-2004']},
    {text:'Brain size, diet, social behaviour and tool use are not reconstructed for the species in the sources reviewed here.',refs:['pub-senut-2018','pub-galik-2004']},
  ],
  reviewedOn:'2026-11-07',
}
