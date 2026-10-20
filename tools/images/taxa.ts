/**
 * Scientific briefing data per core taxon. Every sentence here is a *brief*, not a finding: values marked "verify"
 * must be checked against the cited specimen/site publications (and recorded as sources) before an image is published.
 * Edit this file (and `spec.ts`), then run `npm run images:build`. Never edit `prompts/` or `catalog.*` by hand.
 */
export type TaxonBrief={
  id:string
  name:string
  short:string
  ageText:string
  region:string
  /** Specimen the image is based on; `catalogIds` are ids that exist in content/specimens.ts (empty = no record yet). */
  basis:{primary:string;also:string[];catalogIds:string[]}
  individual:string
  brain:string
  body:string
  /** Directly constrained by the fossils. */
  bone:string[]
  /** Not knowable from the fossils: never invent detail here. */
  unknown:string[]
  skinHair:string
  clothing:string
  habitat:{setting:string;flora:string;fauna:string;climate:string}
  heroScene:string
  behavior:null|{title:string;evidence:string;scene:string;objects:string;caution:string}
  /** True when no cranium is known: the portrait becomes a bone-inventory silhouette instead of a face. */
  noCranium?:boolean
  /** Stone-tool (lithic) evidence: null = none known or none securely attributed (see `noLithicsReason`). */
  lithics:null|{industry:string;attribution:string;kit:string[];keyType:string;typeSites:string[];searchTerms:string[];sequence:string;caution:string}
  noLithicsReason:string
  typeSite:string
  keyBones:[string,string]
  /** Short list used by the S08 anatomy diagram brief. */
  diagnostic:string[]
}

export const TAXA:TaxonBrief[]=[
  {
    id:'sahelanthropus',name:'Sahelanthropus tchadensis',short:'Sahelanthropus',
    ageText:'about 7–6 million years ago (late Miocene)',region:'Toros-Menalla, Djurab Desert, northern Chad',
    basis:{primary:'cranium TM 266-01-060-1 (“Toumaï”)',also:['mandibular and dental fragments from the same locality'],catalogIds:['toumai']},
    individual:'one adult; sex uncertain (the cranium is often read as male) — draw an adult male as a visual convention',
    brain:'about 360–370 cc (chimpanzee-sized; verify)',
    body:'body size and proportions are unknown; draw a chimpanzee-sized adult as a clearly speculative convention',
    bone:['long, low, narrow braincase with a very small brain','massive, continuous brow ridge (supraorbital torus) shelving over the eyes','relatively short, flat midface with only moderate prognathism','small canines worn at the tip (not a projecting, honing canine)','thick tooth enamel and a nuchal crest at the back of the skull'],
    unknown:['whether it walked upright (disputed)','nose, lips, ears and every other soft-tissue detail','skin colour, hair distribution, eye colour','body size and proportions'],
    skinHair:'dark skin; short, fine, dark hair over the scalp and most of the body; face, palms and soles bare',
    clothing:'none',
    habitat:{setting:'shore of a freshwater lake and its rivers, with narrow gallery forest, open woodland and grassy patches',flora:'riparian trees, reed and sedge margins, scattered woodland, patches of grass',fauna:'crocodilians and fish at the water, bovids, anthracothere-like hoofed mammals, early elephant relatives, monkeys (kinds only; verify against the Toros-Menalla faunal list)',climate:'warm, seasonal; no dune desert dominating the scene (verify)'},
    heroScene:'one adult foraging on the ground at the lake margin, a second individual resting low in a tree in the background; both small in a wide landscape',
    behavior:null,
    lithics:null,noLithicsReason:'No stone tools are known from Toros-Menalla or from other hominin contexts of about 7 million years ago.',
    typeSite:'Toros-Menalla locality TM 266, Chad',keyBones:['cranium, lateral and frontal view together','mandible fragment with teeth'],
    diagnostic:['massive brow ridge','small worn canine','position of the foramen magnum (debated)','small braincase','nuchal crest'],
  },
  {
    id:'orrin',name:'Orrorin tugenensis',short:'Orrorin',
    ageText:'about 6 million years ago (late Miocene)',region:'Lukeino Formation, Tugen Hills, Kenya',
    basis:{primary:'fragmentary remains: femora, a humerus fragment, jaw fragments and teeth — no cranium is known',also:[],catalogIds:[]},
    individual:'no individual can be reconstructed from the evidence',
    brain:'unknown (no cranium)',
    body:'femur size suggests a chimpanzee-sized animal (verify); proportions unknown',
    bone:['femur with a long neck and features argued to indicate habitual bipedality (disputed)','small cheek teeth relative to later hominins','a curved finger bone reported to indicate climbing ability','humerus fragment (verify attribution)'],
    unknown:['the whole head and face','soft tissue, skin, hair','overall body proportions','how much time was spent upright versus climbing'],
    skinHair:'not applicable: the head and face are deliberately not rendered',clothing:'none',
    habitat:{setting:'wooded environment with a lake or streams and a mosaic of forest patches and more open woodland (reported; verify)',flora:'evergreen forest patches, woodland, riparian vegetation',fauna:'kinds only: monkeys, small forest antelopes, hyraxes (verify against the Lukeino faunal list)',climate:'warm and humid to seasonal (verify)'},
    heroScene:'a quiet woodland and stream landscape with NO hominin figure (an empty scene), because no reliable body reconstruction exists',
    behavior:null,noCranium:true,
    lithics:null,noLithicsReason:'No stone tools are known from the Lukeino Formation.',
    typeSite:'Lukeino Formation, Tugen Hills, Kenya',keyBones:['femoral fragment, several views','mandible or tooth fragment'],
    diagnostic:['long femoral neck','small cheek teeth','curved finger bone (reported)'],
  },
  {
    id:'ardipithecus',name:'Ardipithecus ramidus',short:'Ardipithecus',
    ageText:'about 4.4 million years ago (early Pliocene)',region:'Aramis, Middle Awash, Afar, Ethiopia',
    basis:{primary:'partial skeleton ARA-VP-6/500 (“Ardi”), adult, probably female; the crushed cranium was virtually reconstructed (the reconstruction itself is debated)',also:[],catalogIds:['ara-vp-6-500']},
    individual:'one adult, probably female',
    brain:'about 300–350 cc (verify)',
    body:'about 120 cm tall and about 50 kg (estimates for ARA-VP-6/500; verify)',
    bone:['small braincase with a projecting but not large lower face','reduced, non-honing canines with little difference between the sexes','grasping big toe (opposable hallux) with a rigid midfoot','short, broad pelvis with flared upper blades, suited to short-range upright walking','long arms and curved fingers retaining climbing ability; no knuckle-walking specialisation'],
    unknown:['exact facial shape (the cranium was crushed)','soft tissue, skin colour, hair','how habitual upright walking was compared with climbing (debated)'],
    skinHair:'dark skin; short, fine, dark hair over most of the body and scalp; face, palms and soles bare',clothing:'none',
    habitat:{setting:'woodland to wooded grassland with forest patches near springs and a river (interpretation debated against a more open setting)',flora:'fig and palm trees, hackberry, woodland canopy, patches of grass',fauna:'kinds only: monkeys, small antelopes (kudu-like browsers), peafowl-like birds, hornbill-like birds (verify against the Aramis faunal list)',climate:'warm, seasonal'},
    heroScene:'one adult walking upright for a few steps on the ground between trees, a second individual climbing a trunk in the background, using the grasping foot',
    behavior:null,
    lithics:null,noLithicsReason:'No stone tools are known from Aramis or from other Ardipithecus contexts.',
    typeSite:'Aramis, Middle Awash, Ethiopia',keyBones:['pelvis','foot with the opposable big toe'],
    diagnostic:['grasping hallux','short broad pelvis','reduced canines','long arms with curved fingers'],
  },
  {
    id:'anamensis',name:'Australopithecus anamensis',short:'A. anamensis',
    ageText:'about 4.2–3.8 million years ago (Pliocene)',region:'Kanapoi and Allia Bay (Lake Turkana basin, Kenya) and Woranso-Mille (Ethiopia)',
    basis:{primary:'mandible KNM-KP 29281 (holotype) with the 2019 cranium MRD-VP-1/1 from Woranso-Mille for the face',also:['proximal tibia from Kanapoi'],catalogIds:['knm-kp-29281']},
    individual:'one adult; sex uncertain (MRD is often read as male) — draw an adult male as a visual convention',
    brain:'about 365 cc (MRD cranium; verify)',
    body:'unknown from a complete skeleton; the tibia indicates upright walking; draw a small adult (about 120–140 cm, verify) as an estimate',
    bone:['projecting (prognathic) face with a long, narrow dental arcade with nearly parallel tooth rows','large canines for a hominin and a deep jaw','small braincase with a low forehead','tibia with joint surfaces consistent with upright walking'],
    unknown:['soft tissue, skin, hair','overall body proportions','how much climbing was retained'],
    skinHair:'dark skin; short, fine, dark hair over most of the body; face, palms and soles bare',clothing:'none',
    habitat:{setting:'bushland and woodland along a river with gallery forest, near the margin of a large lake',flora:'riverine forest, bushland, open woodland, grass patches',fauna:'kinds only: monkeys, bovids, crocodilians, hippo relatives (verify against the Kanapoi/Allia Bay faunal lists)',climate:'warm, seasonal'},
    heroScene:'one adult walking upright along a river bank at the edge of woodland, a second individual drinking at the water in the background',
    behavior:null,
    lithics:null,noLithicsReason:'No stone tools are known from Kanapoi, Allia Bay or Woranso-Mille.',
    typeSite:'Kanapoi, Kenya',keyBones:['mandible with teeth','proximal tibia'],
    diagnostic:['parallel tooth rows','large canine','tibia joint surface (upright walking)','prognathic face'],
  },
  {
    id:'afarensis',name:'Australopithecus afarensis',short:'A. afarensis',
    ageText:'about 3.9–3.0 million years ago (Pliocene)',region:'Hadar (Afar, Ethiopia) and Laetoli (Tanzania)',
    basis:{primary:'AL 444-2 (adult male cranium, about 550 cc) for the face, with Lucy (AL 288-1, adult female) for body proportions',also:['DIK-1-1 (Dikika child)','AL 333 (“First Family”)'],catalogIds:['al-444-2','al-288-1']},
    individual:'one adult male (AL 444-2); body proportions follow Lucy scaled for a larger male',
    brain:'about 380–550 cc (AL 444-2 about 550 cc)',
    body:'females about 105 cm and 25–30 kg; males up to about 150 cm and 40–45 kg (verify)',
    bone:['small, ape-sized braincase with a low sloping forehead','projecting (prognathic) face and a deep, robust jaw with large molars','males with strong muscle crests on the skull (AL 444-2)','long arms relative to legs and curved fingers (retaining climbing ability)','funnel-shaped ribcage, broad bowl-like pelvis and legs adapted to upright walking'],
    unknown:['soft tissue incl. nose, lips and ears','skin colour, hair distribution','facial expressions and exact body fat'],
    skinHair:'dark skin; short, fine, dark body hair, sparser on the face, chest and limbs than a chimpanzee; palms and soles bare (convention)',clothing:'none',
    habitat:{setting:'riverine forest and woodland along rivers and lake margins with open grassy patches (Hadar); wooded savanna with volcanic ash plains (Laetoli)',flora:'riparian trees, acacia-type woodland, grass, reed margins',fauna:'kinds only: three-toed horses, extinct pigs, bovids, giraffids, monkeys, crocodilians (verify species against the Hadar/Laetoli faunal lists)',climate:'warm, seasonal wet-dry cycle'},
    heroScene:'two or three individuals of different size crossing an open woodland edge near a river, walking upright with an efficient, human-like striding gait (not a bent-knee shuffle)',
    behavior:{title:'Upright walking on fresh volcanic ash (Laetoli trackway)',evidence:'Laetoli footprint trails (about 3.66 million years old) preserved in volcanic ash; the trackmaker is usually attributed to A. afarensis (inferred)',scene:'two or three individuals walking upright in single file across a damp grey ash plain after light rain, leaving clear footprints behind them, a distant volcano on the horizon',objects:'footprints in ash; no tools, no fire, no carried objects',caution:'attribution of the trail to A. afarensis is inferred; do not show carrying, hunting, or social ritual'},
    lithics:null,noLithicsReason:'No securely attributed stone tools. Lomekwi 3 (about 3.3 million years ago, Kenya) is not attributed to a species, and the cut-marked bones at Dikika (about 3.4 million years ago) are disputed; both appear only in comparative plate C20, as unattributed.',
    typeSite:'Hadar, Afar, Ethiopia',keyBones:['pelvis (Lucy)','femur and knee region (upright-walking evidence)'],
    diagnostic:['prognathic face','muscle crests in males','long arms with curved fingers','bell-shaped ribcage','upright-walking pelvis and legs'],
  },
  {
    id:'africanus',name:'Australopithecus africanus',short:'A. africanus',
    ageText:'about 3.3–2.1 million years ago (Pliocene to early Pleistocene)',region:'Sterkfontein, Taung and Makapansgat, South Africa',
    basis:{primary:'Sts 71 (adult cranium), compared with Sts 5 (“Mrs Ples”) and the Taung child (type)',also:['Taung 1 (juvenile)'],catalogIds:['sts-71','taung-1']},
    individual:'one adult; sex not asserted — draw an adult female as a visual convention (Sts 5 is often read as female)',
    brain:'about 420–510 cc',
    body:'about 115–140 cm and 30–45 kg (verify); long arms relative to legs',
    bone:['rounder, higher braincase and a more vertical forehead than A. afarensis','less projecting face with smaller canines','broad, flat face with large cheek teeth','long arms and short legs relative to later hominins (retained climbing ability)','no strong skull crests in the female cranium'],
    unknown:['soft tissue, skin, hair','exact nose and lip shape','body fat and expression'],
    skinHair:'dark skin; short, fine, dark body hair, sparse on the face; palms and soles bare (convention)',clothing:'none',
    habitat:{setting:'mosaic of woodland and open grassland on a plateau with limestone/dolomite ridges, caves and seasonal water',flora:'woodland patches, grassland, riparian trees near water',fauna:'kinds only: monkeys, bovids, equids, carnivores such as sabre-toothed cats, birds of prey (verify against the Sterkfontein/Taung faunal lists)',climate:'seasonal, warm'},
    heroScene:'two individuals at the edge of woodland next to a rocky ridge with cave openings; one watching the sky from a low rock (large raptors are a documented predator of juveniles at Taung)',
    behavior:null,
    lithics:null,noLithicsReason:'No stone tools are securely associated with A. africanus.',
    typeSite:'Taung, South Africa',keyBones:['Taung child skull with endocast','pelvis or limb bone (Sterkfontein)'],
    diagnostic:['rounded braincase','reduced prognathism','large cheek teeth','long arms, short legs'],
  },
  {
    id:'habilis',name:'Homo habilis',short:'H. habilis',
    ageText:'about 2.3–1.65 million years ago (early Pleistocene)',region:'Olduvai Gorge (Tanzania) and Koobi Fora (Kenya)',
    basis:{primary:'OH 16 (cranium, about 638 cc), compared with KNM-ER 1813 (smaller cranium, about 510 cc) and OH 24',also:['OH 7 (holotype)'],catalogIds:['oh-16']},
    individual:'one adult; sex not asserted — draw an adult male as a visual convention',
    brain:'about 510–690 cc',
    body:'small: about 100–135 cm and 30–40 kg (verify); arm proportions debated',
    bone:['rounder braincase with a larger brain than Australopithecus','face less projecting; smaller, narrower cheek teeth','moderate, not massive, brow ridge','jaw and teeth still somewhat primitive','forehead low but less sloping than A. afarensis'],
    unknown:['soft tissue, skin, hair','which stone tools they made versus other hominins at the same sites','body proportions (debated)'],
    skinHair:'dark skin; short, fine, dark body hair, sparse on the face and chest; scalp hair present (convention)',clothing:'a simple unsewn animal-hide wrap at the waist, used as a modesty convention for this atlas (not evidence of clothing in this period)',
    habitat:{setting:'lake margin and wooded grassland beside a shallow paleolake with seasonal streams',flora:'acacia-type woodland, grass, reeds and papyrus-like margins',fauna:'kinds only: bovids, equids, pigs, giraffids, crocodilians, large carnivores, extinct elephant relatives (verify against the Olduvai Bed I faunal lists)',climate:'warm, seasonal'},
    heroScene:'two or three individuals at a shaded lake margin: one crouched knapping stone, one watching the grassland',
    behavior:{title:'Making and using Oldowan stone tools at a lake margin',evidence:'Oldowan cores, flakes and hammerstones with cut-marked animal bones at Olduvai (about 1.8 million years ago); authorship by H. habilis versus other hominins is debated',scene:'one adult crouched, striking a cobble core with a rounded hammerstone to detach sharp flakes; a second adult using a flake to cut meat from a small antelope carcass; shaded lake margin',objects:'rounded hammerstone, cobble cores, unretouched sharp flakes, simple choppers — NO handaxes, NO hafted tools, NO fire',caution:'tool authorship is debated; do not show hunting of large game or fire'},
    lithics:{industry:'Oldowan (Mode 1): simple core-and-flake technology',attribution:'Associated with H. habilis at Olduvai Bed I and Koobi Fora but shared with other hominins such as Paranthropus boisei; the earliest known stone tools (Lomekwi 3, about 3.3 Ma; Gona and Ledi-Geraru, about 2.6 Ma) predate H. habilis.',kit:['cobble cores and choppers','hammerstones','unretouched sharp flakes','manuports (carried, unmodified stones)'],keyType:'unifacial chopper on a cobble',typeSites:['Olduvai Gorge Bed I (for example FLK Zinj, DK)','Koobi Fora, Kenya'],searchTerms:['Oldowan chopper Olduvai Gorge','Oldowan flake core Koobi Fora','hammerstone Oldowan'],sequence:'select a cobble, strike the platform with a hammerstone by direct hard-hammer percussion, detach several flakes, then use the sharp flakes and the core',caution:'Tool authorship is debated; do not label the toolkit as made only by H. habilis.'},noLithicsReason:'',
    typeSite:'Olduvai Gorge (Bed I), Tanzania',keyBones:['cranium OH 24 or KNM-ER 1813 (lateral and frontal)','mandible with teeth (OH 7)'],
    diagnostic:['larger, rounder braincase','less projecting face','smaller cheek teeth','moderate brow ridge'],
  },
  {
    id:'erectus',name:'Homo erectus',short:'H. erectus',
    ageText:'about 1.9 million to roughly 0.1 million years ago (Pleistocene)',region:'Africa and Eurasia (Dmanisi in Georgia, Java, China)',
    basis:{primary:'Dmanisi D2282 (about 1.8 million years old), compared with D2700 and Asian H. erectus crania',also:['KNM-WT 15000 (Turkana Boy; catalogued under H. ergaster)'],catalogIds:['d2282']},
    individual:'one adult; sex not asserted — draw an adult male as a visual convention',
    brain:'about 550–1,250 cc (Dmanisi about 546–775 cc; later Asian crania up to about 1,250 cc)',
    body:'Dmanisi adults about 145–166 cm; later H. erectus up to about 170–180 cm (verify); about 40–68 kg; long legs, modern-like proportions',
    bone:['long, low braincase, widest low on the skull','thick cranial bones and a pronounced, continuous brow ridge','sloping forehead with sagittal keeling and an angular back of the skull','face much less projecting than Australopithecus, with smaller teeth','body proportions closer to modern humans (long legs, short arms)'],
    unknown:['hair and skin colour; amount of body hair (sweating adaptations suggest sparse body hair, inferred)','nose shape (a protruding nose is inferred, uncertain)','soft-tissue details'],
    skinHair:'dark skin; sparse body hair; scalp hair present; no beard styling (convention)',clothing:'a simple unsewn animal-hide wrap at the waist, used as a modesty convention for this atlas (not evidence of clothing in this period)',
    habitat:{setting:'wooded grassland and steppe at a river–lake margin in the Caucasus foothills (Dmanisi)',flora:'grassland, scattered trees and shrubs, riverside woodland',fauna:'kinds only: a sabre-toothed cat (Megantereon), a giant hyena (Pachycrocuta), an Etruscan rhinoceros (Stephanorhinus etruscus), a stenonid horse (Equus stenonis), ostriches (verify against the Dmanisi faunal list)',climate:'temperate, seasonal'},
    heroScene:'two or three individuals at the edge of a river-side woodland; one standing alert with the grassland behind, one at the water; a sabre-toothed cat visible only as a distant, small animal',
    behavior:{title:'Butchering a carcass with simple flake tools (Dmanisi)',evidence:'Dmanisi stone tools are a simple core-and-flake (Mode 1) industry with cut-marked bones (about 1.8 million years ago)',scene:'two adults at a carcass of a small ungulate on a river bank, using sharp stone flakes to cut meat; a third individual watching for predators',objects:'unretouched flakes and cobble cores — NO handaxes (Acheulean handaxes are not part of the Dmanisi industry), NO fire, NO hafted tools',caution:'do not show fire, handaxes or hunting of large dangerous game; scavenging versus hunting is debated'},
    lithics:{industry:'Mode 1 core-and-flake at Dmanisi; Acheulean (Mode 2) with handaxes, cleavers and picks in Africa from about 1.76 Ma and later in Eurasia',attribution:'Acheulean is associated with H. erectus/H. ergaster and later species; East Asian assemblages largely lack handaxes (the Movius line, whose significance is debated).',kit:['bifacial handaxes','cleavers','picks','large flakes used as blanks and unretouched flakes (Dmanisi)'],keyType:'Acheulean handaxe (bifacial, ovate or pointed) with a cleaver for comparison',typeSites:['Olduvai Gorge Bed II','Konso, Ethiopia','Kokiselei, Kenya','Dmanisi, Georgia (Mode 1)'],searchTerms:['Acheulean handaxe Olduvai Gorge','Acheulean cleaver Konso','Dmanisi stone tools Mode 1'],sequence:'detach a large flake or use a cobble as a blank, shape both faces with a hard hammer, then thin the edges with a soft hammer',caution:'Do not show Acheulean handaxes in a Dmanisi context: its industry is Mode 1.'},noLithicsReason:'',
    typeSite:'Dmanisi, Georgia',keyBones:['cranium D2700 or D4500 (lateral and frontal)','femur or tibia (long-legged body proportions)'],
    diagnostic:['long, low vault','thick brow ridge','sagittal keel','modern-like limb proportions'],
  },
  {
    id:'heidelbergensis',name:'Homo heidelbergensis',short:'H. heidelbergensis',
    ageText:'about 700,000–300,000 years ago (Middle Pleistocene)',region:'Africa and Europe (Kabwe in Zambia, Petralona in Greece, Mauer in Germany, Boxgrove in England)',
    basis:{primary:'Kabwe 1 (Broken Hill) cranium, adult, probably male, about 1,280 cc',also:['Mauer 1 mandible (type)','Boxgrove tibia'],catalogIds:[]},
    individual:'one adult male (Kabwe 1 is usually read as male)',
    brain:'about 1,100–1,400 cc (Kabwe 1 about 1,280 cc)',
    body:'tall and robust: about 170–180 cm and 70–90 kg (Boxgrove tibia; verify)',
    bone:['massive, double-arched brow ridge','long, low braincase with a large brain','large face with a broad nasal opening and moderate midfacial projection','thick cranial bone and a robust jaw without a true chin','Kabwe 1 shows severe dental disease and bone lesions (optional, subtle)'],
    unknown:['skin, hair and eye colour','soft-tissue details','where the species boundary lies (African versus European material is debated)'],
    skinHair:'medium to dark brown skin for the African sample; scalp hair present, sparse body hair (convention); no beard styling',clothing:'a simple unsewn animal-hide wrap at the waist, used as a modesty convention for this atlas (not evidence of clothing in this period)',
    habitat:{setting:'temperate coastal grassland plain beneath chalk cliffs during a warm interglacial (Boxgrove-type setting)',flora:'grassland, willow and birch scrub, wetland margins',fauna:'kinds only: horse, red/fallow-type deer, an extinct rhinoceros, bear, lion, wolf (verify against the Boxgrove faunal list)',climate:'cool-temperate interglacial'},
    heroScene:'two individuals walking along a grassy plain with chalk cliffs and the sea behind; a herd of horses far away',
    behavior:{title:'Butchering a horse with Acheulean handaxes (Boxgrove-type site)',evidence:'Boxgrove (about 500,000 years ago) preserves flint handaxes and butchered horse and rhinoceros bones; the hominin there is attributed to H. heidelbergensis',scene:'two adults at a freshly killed horse on a muddy pond margin, one cutting meat with a flint handaxe while the other holds the limb; flint flakes scattered nearby',objects:'oval flint handaxes and flakes, antler soft hammer — NO metal, NO hafted tools, NO fire',caution:'hunting versus scavenging is debated; keep the scene calm and non-gory'},
    lithics:{industry:'Late Acheulean and early prepared-core technology (Mode 2 into early Mode 3)',attribution:'Boxgrove handaxes are linked to the Boxgrove tibia attributed to H. heidelbergensis; early prepared-core assemblages in Africa (for example Kapthurin) are linked to the same broad time range; species attribution of the toolmakers is debated.',kit:['thin, finely made flint handaxes','flint flakes and scrapers','soft hammers of antler or bone (organic)','early prepared cores'],keyType:'thin ovate flint handaxe (Boxgrove type)',typeSites:['Boxgrove, England','Kapthurin Formation, Kenya'],searchTerms:['Boxgrove handaxe flint','Acheulean handaxe Middle Pleistocene Europe','Kapthurin Formation prepared core'],sequence:'shape a flint nodule into a handaxe with a hard hammer, then thin and finish it with an antler or bone soft hammer',caution:'The Schöningen spears are wood, not stone, and their hominin attribution is debated (see heidelbergensis.X1).'},noLithicsReason:'',
    typeSite:'Mauer (Germany) and Boxgrove (England)',keyBones:['Kabwe 1 cranium, lateral and frontal','Boxgrove tibia'],
    diagnostic:['double-arched brow ridge','large braincase','broad nasal opening','no true chin'],
  },
  {
    id:'neanderthal',name:'Homo neanderthalensis',short:'Neanderthal',
    ageText:'about 430,000–40,000 years ago (Middle to Late Pleistocene)',region:'Europe and western to central Asia',
    basis:{primary:'Neanderthal 1 (Feldhofer, adult male), compared with La Chapelle-aux-Saints 1',also:['Vindija Neanderthals','Kebara 2'],catalogIds:['neanderthal-1','vindija-1']},
    individual:'one adult male (Neanderthal 1)',
    brain:'about 1,200–1,750 cc (mean about 1,450–1,500)',
    body:'males about 164–168 cm and 64–77 kg; stocky, with a broad chest and relatively short forearms and shins',
    bone:['long, low braincase with an occipital bun at the back','large, projecting midface with a very large nasal opening','double-arched, prominent brow ridges','no true chin and a gap (retromolar space) behind the last molar','robust bones with strong muscle attachments and large eye sockets'],
    unknown:['skin, hair and eye colour (genetic evidence indicates variation)','nose and lip soft tissue','facial expression'],
    skinHair:'pigmentation varied: depict medium-light to medium-brown skin with dark brown to light brown hair; avoid the single “pale, red-haired” stereotype (convention); full beard permitted but not styled',clothing:'simple unsewn animal hide worn as a wrap (plausible, speculative); no sewn tailored clothing, no jewellery',
    habitat:{setting:'cold open steppe-woodland of glacial western Europe near a limestone cave mouth (about 50,000–45,000 years ago)',flora:'grass steppe, scattered pine and birch, shrubs',fauna:'kinds only: horse, reindeer, bison or aurochs, woolly rhinoceros, red deer (verify against the chosen site’s faunal list)',climate:'cold, dry glacial'},
    heroScene:'two or three individuals in hide wraps at a cave mouth overlooking a cold steppe; a small hearth; one looking out over the landscape',
    behavior:{title:'Hafting a stone point to a wooden shaft with birch-tar adhesive (Mousterian)',evidence:'Mousterian stone points and flakes; birch-bark tar adhesives and hafting traces are documented for Neanderthals; fire use is documented',scene:'one adult seated by a small hearth fixing a triangular flint point to a wooden spear shaft with dark tar, a second adult working a flake tool nearby, stone debris around',objects:'triangular flint points, Levallois-style flakes, wooden spear shaft, dark birch-tar lump, small hearth — NO metal, NO sewn clothing, NO bow and arrows',caution:'avoid depicting symbolic ritual, burial or art in this scene; no bow and arrows'},
    lithics:{industry:'Mousterian (Mode 3): Levallois and discoid cores, flakes, points, side-scrapers, denticulates; Quina retouch; hafting with birch-bark tar',attribution:'Strongly associated with Neanderthals in Europe and western Asia, but the Levantine Mousterian at Skhul and Qafzeh was made by early H. sapiens; transitional industries such as the Châtelperronian are attributed to Neanderthals only with debate.',kit:['Levallois flakes and points','side-scrapers','denticulates and notches','retouched points suitable for hafting'],keyType:'Mousterian point or Levallois flake with retouch',typeSites:['Le Moustier, France (type site)','La Ferrassie, France','Combe-Grenal, France'],searchTerms:['Mousterian point Le Moustier','Levallois flake Mousterian','Mousterian side scraper La Ferrassie'],sequence:'Levallois: prepare the core surface, prepare a striking platform, then detach one predetermined flake',caution:'Do not attribute every Mousterian assemblage to Neanderthals (see the Levant).'},noLithicsReason:'',
    typeSite:'Feldhofer Cave (Neander Valley), Germany',keyBones:['La Chapelle-aux-Saints 1 cranium, lateral and frontal','pelvis or rib cage (Kebara 2)'],
    diagnostic:['occipital bun','double-arched brow ridges','large nasal opening','retromolar space','robust, barrel-chested build'],
  },
  {
    id:'sapiens',name:'Homo sapiens (early anatomically modern humans)',short:'H. sapiens',
    ageText:'from about 315,000 years ago to the present; this image depicts an early anatomically modern human of about 100,000–90,000 years ago',region:'Africa, then the Levant and worldwide; this image: Qafzeh, Israel',
    basis:{primary:'Qafzeh 6 (early anatomically modern human, about 100,000–90,000 years old), compared with Jebel Irhoud 1 and Qafzeh 9',also:['Jebel Irhoud (about 315,000 years old)','Omo Kibish I'],catalogIds:['qafzeh-6','jebel-irhoud']},
    individual:'one adult; sex of the specimen not asserted here — draw an adult male as a visual convention (verify in the specimen record)',
    brain:'modern-like (about 1,300–1,600 cc)',
    body:'about 165–180 cm; slender to moderately robust skeleton (verify)',
    bone:['tall, high, rounded braincase with a vertical forehead','small, flat face tucked beneath the braincase','reduced brow ridge','distinct chin on the mandible','small teeth and a narrow nasal opening compared with Neanderthals'],
    unknown:['skin and hair colour of this individual','nose and lip soft tissue','facial hair and ornament (not preserved)'],
    skinHair:'medium to dark brown skin; dark, straight-to-wavy hair worn loose or simply tied; no modern styling (convention)',clothing:'simple unsewn animal hide at most; no sewn tailored clothing',
    habitat:{setting:'Mediterranean oak-pistachio parkland on the Lower Galilee hills above a lake and springs, warm interglacial climate',flora:'oak and pistachio trees, grassy glades, shrubs, reeds at the water',fauna:'kinds only: fallow deer, gazelle, aurochs, wild boar (verify against the Qafzeh faunal list)',climate:'warm, Mediterranean-like'},
    heroScene:'two or three individuals at a cave terrace overlooking the lake and parkland; one standing, one seated working with materials',
    behavior:{title:'Processing red ochre and stringing perforated shell beads (Qafzeh/Skhul)',evidence:'red ochre pieces and perforated Mediterranean marine shells are found in Qafzeh and Skhul Levantine contexts of about 100,000 years ago; their use as personal ornament is inferred',scene:'two adults seated at a cave mouth: one grinding a piece of red ochre on a stone slab, the other threading small perforated shells on a plant-fibre cord',objects:'red ochre lumps, a grinding slab, small perforated marine shells, plant-fibre cord, shell fragments — NO metal, NO sewn clothing, NO pottery',caution:'use of ochre and shells as symbolic ornament is inferred; do not show cave painting or ritual'},
    lithics:{industry:'African Middle Stone Age (Mode 3): Levallois flakes and points, Still Bay bifacial points, Howiesons Poort backed blades; later Upper Palaeolithic blades and microliths',attribution:'Middle Stone Age toolkits are associated with H. sapiens from about 315,000 years ago (Jebel Irhoud), but similar Mode 3 toolkits were also made by Neanderthals; the Levantine Mousterian at Skhul and Qafzeh is attributed to early H. sapiens.',kit:['Levallois flakes and points','Still Bay bifacial leaf points (about 75,000 years ago, Blombos)','Howiesons Poort backed blades (about 65,000 years ago)','bone points and awls (organic; Blombos)'],keyType:'bifacial leaf-shaped Still Bay point (Blombos type)',typeSites:['Jebel Irhoud, Morocco','Blombos Cave, South Africa','Klasies River, South Africa','Qafzeh and Skhul, Israel'],searchTerms:['Still Bay point Blombos','Howiesons Poort backed blade','Jebel Irhoud Levallois flake','Middle Stone Age point Klasies River'],sequence:'Still Bay point: heat-treat the stone where documented, shape both faces by pressure and soft-hammer flaking into a leaf form',caution:'Dates and attribution of individual industries are debated; keep each caption to the dated layer.'},noLithicsReason:'',
    typeSite:'Qafzeh Cave, Israel',keyBones:['Qafzeh 6 cranium, lateral and frontal','mandible with a chin (Qafzeh)'],
    diagnostic:['globular braincase','vertical forehead','reduced brow','chin','small flat face'],
  },
]
