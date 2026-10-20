import type {SpeciesPageContent} from '../../domain/species-page'

/**
 * Scientific text for Homo neanderthalensis. Every statement cites entries of content/publications.ts.
 * Some facts rest on older studies (1998 to 2014) because no newer source was found for them; the text says so.
 */
export const neanderthalPage:SpeciesPageContent={
  taxonId:'neanderthal',
  lead:{
    text:'*Homo neanderthalensis* lived across Europe and western and central Asia from roughly 350,000 to 40,000 years ago. Its remains are known from Iraq to the Altai Mountains. The third high-coverage Neanderthal genome comes from Chagyrskaya Cave in Siberia and is from a female individual. Genomes show that Neanderthals interbred with the ancestors of most people living outside Africa, in one period about 50,500 to 43,500 years ago.',
    refs:['pub-villa-2014','pub-pomeroy-2020','pub-prufer-2014','pub-mafessoni-2020','pub-iasi-2024'],
  },
  facts:[
    {label:'Time range',value:'About 350,000 to 40,000 years ago; in the 40 sites studied, Neanderthals disappear by about 39,000 years ago',certainty:'estimated',refs:['pub-villa-2014','pub-higham-2014']},
    {label:'Region',value:'From Spain and France to Iraq and the Altai Mountains',certainty:'established',refs:['pub-hoffmann-2019-jhe','pub-duveau-2019','pub-pomeroy-2020','pub-prufer-2014']},
    {label:'Brain size',value:'Slightly larger than recent humans on average; the difference lies within the range of modern human variation',certainty:'estimated',refs:['pub-schoenemann-2026']},
    {label:'Body size',value:'Stature and body mass ranges are not stated here, because no verified source gives them. The one individual with described proportions, Saint-Césaire 1, is a morphological Neanderthal with hyperarctic body proportions (Trinkaus et al. 1998)',certainty:'estimated',refs:['pub-trinkaus-1998']},
    {label:'Locomotion',value:'Femoral shaft loading with an early modern human emphasis on antero-posterior loading, combined with Neanderthal hip and pelvic proportions (one individual, Saint-Césaire 1; Trinkaus et al. 1999)',certainty:'estimated',refs:['pub-trinkaus-1999']},
    {label:'Diet',value:'Mammal meat, according to isotope analysis of two Neanderthals: their high nitrogen isotope values can be explained by mammal meat consumption alone (Jaouen et al. 2019)',certainty:'estimated',refs:['pub-jaouen-2019']},
    {label:'Key fossils',value:'Altai genome (2014); Chagyrskaya 8 genome (2020); Shanidar Z skeleton (found in 2018)',certainty:'established',refs:['pub-prufer-2014','pub-mafessoni-2020','pub-pomeroy-2020']},
    {label:'Stone tools',value:'Middle Palaeolithic industries. The 2014 review finds that the record is not different enough from that of modern humans to explain the disappearance of Neanderthals through inferiority',certainty:'estimated',refs:['pub-villa-2014']},
  ],
  sections:[
    {id:'discovery',blocks:[
      {type:'paragraph',text:'Shanidar Z, an adult Neanderthal from Shanidar Cave in Iraqi Kurdistan, was found in 2018. The articulated upper body lies near the site known as the “flower burial” (Pomeroy et al. 2020). The Chagyrskaya Cave genome, from Siberia, is the third high-coverage Neanderthal genome. It was sequenced at 27-fold coverage from a female individual. The same study estimates that the Siberian Neanderthal groups had fewer than 60 individuals (Mafessoni et al. 2020).',refs:['pub-pomeroy-2020','pub-mafessoni-2020']},
      {type:'paragraph',text:'The Altai Neanderthal genome, published in 2014, is a complete genome sequence from this species. This rests on one study (Prüfer et al. 2014).',refs:['pub-prufer-2014'],singleSource:true},
    ]},
    {id:'anatomy',blocks:[
      {type:'paragraph',text:'The shape of the endocranial surface differs from that of recent humans. This difference is not explained by thickness of the skull vault alone (Natahi et al. 2025). Brain volume is on average slightly larger than in recent humans, and the spread of values overlaps the modern range (Schoenemann et al. 2026).',refs:['pub-natahi-2025','pub-schoenemann-2026']},
      {type:'paragraph',text:'Both studies work on the braincase, through endocasts and skull measurements. They describe the shape and size of the brain container. They do not describe the face or the rest of the skeleton.',refs:['pub-natahi-2025','pub-schoenemann-2026']},
    ]},
    {id:'locomotion',blocks:[
      {type:'paragraph',text:'The Saint-Césaire 1 skeleton, from the Châtelperronian of France, is described as a morphological Neanderthal with hyperarctic body proportions (Trinkaus et al. 1998). Its locomotor patterns had shifted to more closely resemble those of other Upper Paleolithic humans (Trinkaus et al. 1998). The shape of its femoral shaft fits best a model of Neanderthal pelvic and hip proportions combined with an early modern human emphasis on antero-posterior loading of the midshaft (Trinkaus et al. 1999). These are findings for one individual.',refs:['pub-trinkaus-1998','pub-trinkaus-1999']},
      {type:'paragraph',text:'The 1999 analysis scales diaphyseal strength with the body proportions of Neanderthals and of European early modern humans (Trinkaus et al. 1999). With earlier Upper Palaeolithic human proportions the Saint-Césaire 1 femur appears hyper-robust. The authors argue that its load levels and patterns are reasonable for a Late Pleistocene human only if it is given the hyperarctic body proportions of a Neanderthal (Trinkaus et al. 1999). This rests on one study.',refs:['pub-trinkaus-1999'],singleSource:true},
    ]},
    {id:'brain-behaviour',blocks:[
      {type:'paragraph',text:'A 2020 review by Nielsen and colleagues is titled “*Homo neanderthalensis* and the evolutionary origins of ritual in *Homo sapiens*” (Nielsen et al. 2020). The title ties Neanderthal evidence to the origin of ritual, but this page does not report the review’s conclusions. A 2026 study by Schoenemann and colleagues is titled “Neanderthal brain and cognition reconsidered” (Schoenemann et al. 2026).',refs:['pub-nielsen-2020','pub-schoenemann-2026']},
      {type:'paragraph',text:'Footprints at Le Rozel in Normandy, about 80,000 years old, record the composition of the group that made them (Duveau et al. 2019). This rests on one study.',refs:['pub-duveau-2019'],singleSource:true},
    ]},
    {id:'stone-tools',blocks:[
      {type:'paragraph',text:'The 2014 systematic review compared the archaeological records of Neanderthals and contemporary modern humans. It finds that the Neanderthal record is not different enough to explain their disappearance through inferiority in the domains that leave archaeological traces. The review therefore gives no archaeological support to explanations that rely on Neanderthal technological inferiority. The authors describe the Neanderthal record as covering roughly 350,000 to 40,000 years ago, the period used for the time range on this page. The authors note that the Neanderthal fossil record samples hundreds of individuals.',refs:['pub-villa-2014'],singleSource:true},
    ]},
    {id:'environment-diet',blocks:[
      {type:'paragraph',text:'Jaouen and colleagues analysed carbon and nitrogen isotopes in single amino acids of collagen from two Neanderthals and from the fauna associated with them (Jaouen et al. 2019). They conclude that the high nitrogen isotope values can be explained by mammal meat consumption alone, without invoking the processing of food, the consumption of mammoths or young mammals, or freshwater fish and mushrooms as additional protein sources (Jaouen et al. 2019). The results reinforce the interpretation of Neanderthal dietary adaptations as successful top-level carnivores, even after the arrival of modern humans in Europe (Jaouen et al. 2019). This rests on one study.',refs:['pub-jaouen-2019'],singleSource:true},
    ]},
    {id:'where-when',blocks:[
      {type:'paragraph',text:'In Europe, Neanderthals disappear from the dated record by about 39,000 years ago, based on 40 sites that were analysed (Higham et al. 2014). Modern humans are dated at Grotte Mandrin in France to between 56,800 and 51,700 years ago. The site shows alternating occupation by Neanderthals and modern humans (Slimak et al. 2022).',refs:['pub-higham-2014','pub-slimak-2022']},
      {type:'paragraph',text:'The cave paintings attributed to Neanderthals in Spain are dated by uranium-series methods. Whether those dates are reliable is disputed, and the debate below sets out both positions (Hoffmann et al. 2019; Aubert et al. 2018).',refs:['pub-hoffmann-2019-jhe','pub-aubert-2018']},
      {type:'paragraph',text:'Sites that yield skeletons or genomes lie far apart. Shanidar Cave is in Iraq (Pomeroy et al. 2020). The Altai Mountains and Chagyrskaya Cave are in Siberia (Prüfer et al. 2014; Mafessoni et al. 2020). Le Rozel lies in Normandy (Duveau et al. 2019).',refs:['pub-pomeroy-2020','pub-prufer-2014','pub-mafessoni-2020','pub-duveau-2019']},
    ]},
    {id:'place-in-tree',blocks:[
      {type:'paragraph',text:'Neanderthals and the ancestors of present-day non-African people were separate populations that interbred. Genomes of present-day and ancient people show that most of the Neanderthal gene flow into these ancestors came from one period, about 50,500 to 43,500 years ago (Iasi et al. 2024). This rests on one study.',refs:['pub-iasi-2024'],singleSource:true},
      {type:'paragraph',text:'A second study, using the earliest modern human genomes from Ranis in Germany, dates the same admixture to about 45,000 to 49,000 years ago (Sümer et al. 2025). The two estimates overlap. This rests on one study.',refs:['pub-sumer-2025'],singleSource:true},
    ]},
  ],
  debates:[
    {id:'cave-art-dates',question:'Are the early uranium-series dates for Spanish Neanderthal cave paintings reliable?',positions:[
      {label:'The dates hold',summary:'The authors respond to the critique and keep their published uranium-series dates.',refs:['pub-hoffmann-2019-jhe']},
      {label:'The dates may be wrong',summary:'Aubert and colleagues argue that the early dates for Neanderthal cave art may be wrong.',refs:['pub-aubert-2018']},
    ],updated:'2026-10-13'},
  ],
  unknowns:[
    {text:'The cause of the Neanderthal disappearance is not established. The 2014 review finds no archaeological support for inferiority as the cause. It notes that interbreeding and assimilation may explain why the Neanderthal skeletal form disappears from the fossil record (Villa and Roebroeks 2014).',refs:['pub-villa-2014']},
  ],
  reviewedOn:'2026-10-13',
}
