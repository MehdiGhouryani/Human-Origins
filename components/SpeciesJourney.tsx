'use client'
import {motion} from 'motion/react'
import {ChevronRight, CircleDot, Dna, Globe2, MapPin, Sparkles, type LucideIcon} from 'lucide-react'
import type {ExplorerSpecies as Species} from '../features/explorer/types'

type Chapter={id:string;title:string;kicker:string;body:string;icon:LucideIcon}
const chapters:Chapter[]=[
 {id:'origin',title:'Origin',kicker:'WHERE THE BRANCH BEGINS',body:'Place the selected taxon inside the broader human evolutionary story. This panel is a synthesis layer: it does not replace the fossil record or imply a single straight-line ancestor.',icon:Sparkles},
 {id:'range',title:'Range',kicker:'GEOGRAPHIC CONTEXT',body:'Explore the documented and inferred geographic context associated with this taxon. Broad corridors are intentionally separated from precise site evidence.',icon:Globe2},
 {id:'fossils',title:'Fossils',kicker:'PHYSICAL EVIDENCE',body:'Move from the species label to the physical record: fossils, dating methods, stratigraphy and the limits of preservation.',icon:CircleDot},
 {id:'encounters',title:'Encounters',kicker:'POPULATION CONTACT',body:'Where evidence supports overlap, the story becomes one of populations meeting rather than one species simply replacing another.',icon:MapPin},
 {id:'genetics',title:'Gene Flow',kicker:'ANCIENT DNA & POPULATION HISTORY',body:'Genetic evidence can reveal ancestry and admixture that cannot be reconstructed from morphology alone. Evidence strength varies by taxon.',icon:Dna},
]
const activeChapterIndex=(species:Species)=>{
 if(species.evidence.includes('Genetics')) return chapters.findIndex(c=>c.id==='genetics')
 if(species.evidence.includes('Archaeology')) return chapters.findIndex(c=>c.id==='encounters')
 return chapters.findIndex(c=>c.id==='fossils')
}
export default function SpeciesJourney({species}:{species:Species}){
 const active=activeChapterIndex(species)
 return <section className="journey-view">
   <div className="journey-head"><div><div className="view-kicker">SPECIES JOURNEY · {species.group.toUpperCase()}</div><h3>{species.short} <em>across time</em></h3><p>One species, multiple evidence layers. Follow the record without turning uncertainty into a single definitive path.</p></div><div className="journey-status"><span className="live-dot"/>SELECTED<br/><b>{species.date}</b></div></div>
   <div className="journey-rail">{chapters.map((c,i)=>{const I=c.icon;return <motion.article key={c.id} className={`journey-card ${i===active?'current':''}`} whileHover={{y:-3}}><div className="journey-index">0{i+1}</div><div className="journey-icon"><I size={15}/></div><small>{c.kicker}</small><strong>{c.title}</strong><p>{i===0?species.description:c.body}</p><span className="journey-arrow"><ChevronRight size={14}/></span></motion.article>})}</div>
   <div className="journey-footer"><div><span>Evidence footprint</span><b>{species.evidence.join(' · ')}</b></div><div><span>Record</span><b>{species.sourceIds.length} linked source{species.sourceIds.length===1?'':'s'}</b></div><a href="#about">Back to atlas context <ChevronRight size={14}/></a></div>
 </section>
}
