'use client'
import {motion} from 'motion/react'
import {ChevronRight, CircleDot, Dna, Globe2, MapPin, Sparkles, type LucideIcon} from 'lucide-react'
import type {ExplorerSpecies as Species} from '../features/explorer/types'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerEvidenceForTaxon} from '../features/explorer/selectors'
import {factsByTopic} from '../domain/facts'
import {rangesOverlap} from '../domain/time'

type ChapterId='origin'|'range'|'fossils'|'encounters'|'genetics'
type Chapter={id:ChapterId;title:string;kicker:string;icon:LucideIcon}
const chapters:Chapter[]=[
 {id:'origin',title:'Origin',kicker:'WHERE THE BRANCH BEGINS',icon:Sparkles},
 {id:'range',title:'Range',kicker:'GEOGRAPHIC CONTEXT',icon:Globe2},
 {id:'fossils',title:'Fossils',kicker:'PHYSICAL EVIDENCE',icon:CircleDot},
 {id:'encounters',title:'Encounters',kicker:'POPULATION CONTACT',icon:MapPin},
 {id:'genetics',title:'Gene Flow',kicker:'ANCIENT DNA & POPULATION HISTORY',icon:Dna},
]
const MAX_NAMES=4
const nameList=(names:readonly string[]):string=>names.length<=MAX_NAMES?names.join(', '):`${names.slice(0,MAX_NAMES).join(', ')} and ${names.length-MAX_NAMES} more`

/** The text of each chapter, built from the taxon's own data. A chapter with no data says so in plain words. */
export function journeyChapterTexts(species:Species,bootstrap:ExplorerBootstrap):Record<ChapterId,string>{
  const range=factsByTopic(species.facts,'geography').map(([,value])=>value)
  const records=getExplorerEvidenceForTaxon(bootstrap,species.id)
  const overlapping=bootstrap.species.filter(other=>other.id!==species.id&&!other.inferred&&rangesOverlap({olderMa:species.start,youngerMa:species.end},{olderMa:other.start,youngerMa:other.end})).map(other=>other.short)
  const byId=new Map(bootstrap.species.map(other=>[other.id,other.short]))
  const partners=[...new Set(bootstrap.graph.relationships.filter(link=>link.type==='gene-flow'&&(String(link.from)===species.id||String(link.to)===species.id)).map(link=>byId.get(String(link.from)===species.id?String(link.to):String(link.from))).filter((name):name is string=>Boolean(name)))]
  return {
    origin:species.description,
    range:range.length?range.join(' · '):'No geographic range is documented for this taxon yet.',
    fossils:records.length
      ?`${records.length} evidence record${records.length===1?'':'s'} linked to this taxon: ${nameList(records.map(record=>record.title))}.`
      :'No evidence record is linked to this taxon yet.',
    encounters:overlapping.length
      ?`Recorded date ranges overlap with ${nameList(overlapping)}. Overlapping dates do not show that the populations met.`
      :'No other taxon in the atlas has an overlapping date range.',
    genetics:partners.length
      ?`Gene flow is recorded between ${species.short} and ${nameList(partners)}.`
      :species.evidence.includes('Genetics')
        ?'Genetic evidence exists for this taxon, but no gene-flow link is recorded.'
        :'No genetic evidence is recorded for this taxon.',
  }
}

const activeChapterIndex=(species:Species)=>{
 if(species.evidence.includes('Genetics')) return chapters.findIndex(c=>c.id==='genetics')
 if(species.evidence.includes('Archaeology')) return chapters.findIndex(c=>c.id==='encounters')
 return chapters.findIndex(c=>c.id==='fossils')
}
export default function SpeciesJourney({species,bootstrap}:{species:Species;bootstrap:ExplorerBootstrap}){
 const active=activeChapterIndex(species)
 const texts=journeyChapterTexts(species,bootstrap)
 return <section className="journey-view">
   <div className="journey-head"><div><div className="view-kicker">SPECIES JOURNEY · {species.group.toUpperCase()}</div><h3>{species.short} <em>across time</em></h3><p>One species, multiple evidence layers. Follow the record without turning uncertainty into a single definitive path.</p></div><div className="journey-status"><span className="live-dot"/>SELECTED<br/><b>{species.date}</b></div></div>
   <div className="journey-rail">{chapters.map((c,i)=>{const I=c.icon;return <motion.article key={c.id} className={`journey-card ${i===active?'current':''}`} whileHover={{y:-3}}><div className="journey-index">0{i+1}</div><div className="journey-icon"><I size={15}/></div><small>{c.kicker}</small><strong>{c.title}</strong><p>{texts[c.id]}</p><span className="journey-arrow"><ChevronRight size={14}/></span></motion.article>})}</div>
   <div className="journey-footer"><div><span>Evidence footprint</span><b>{species.evidence.join(' · ')}</b></div><div><span>Record</span><b>{species.sourceIds.length} linked source{species.sourceIds.length===1?'':'s'}</b></div><a href={`/?species=${species.id}`}>Back to atlas context <ChevronRight size={14}/></a></div>
 </section>
}
