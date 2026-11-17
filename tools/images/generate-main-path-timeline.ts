import {mkdirSync,writeFileSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
import {featured} from '../../content/featured'
import {taxa} from '../../content/taxa'
import {sourceRecords} from '../../content/sources'

const MAX_AGE=8
const WIDTH=1800
const HEIGHT=1120
const LEFT=360
const RIGHT=1695
const PLOT_WIDTH=RIGHT-LEFT
const TOP=305
const ROW=66
const nl=String.fromCharCode(10)
const escape=(value:string)=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')
const x=(age:number)=>LEFT+((MAX_AGE-age)/MAX_AGE)*PLOT_WIDTH
const certaintyColor={high:'#85b8a5',medium:'#d8ad6c',debated:'#c88f9b'} as const
const certaintyLabel={high:'HIGH',medium:'MEDIUM',debated:'DEBATED'} as const

const ordered=featured.mainPathTaxonIds.map(id=>{
  const taxon=taxa.find(item=>String(item.id)===String(id))
  if(!taxon) throw new Error('Main-path taxon '+String(id)+' is missing from the content catalog.')
  return taxon
})
if(ordered.length!==11) throw new Error('Expected 11 main-path taxa, found '+ordered.length+'.')

const ticks=[8,7,6,5,4,3,2,1,0.5,0]
const tickMarkup=ticks.map(age=>{
  const px=x(age)
  const label=age===0?'Present':age>=1?String(age)+' Ma':String(age*1000)+' ka'
  return '<line x1="'+px+'" y1="270" x2="'+px+'" y2="1002" class="grid"/><text x="'+px+'" y="252" class="tick" text-anchor="middle">'+label+'</text>'
}).join(nl)

const rows=ordered.map((taxon,index)=>{
  const y=TOP+index*ROW
  const older=taxon.chronology.olderMa
  const younger=taxon.chronology.youngerMa
  const certainty=taxon.chronology.certainty??'medium'
  const x1=x(older),x2=x(younger)
  const width=Math.max(2,x2-x1)
  const label=escape(taxon.short)
  const date=escape(taxon.date)
  const sources=taxon.sourceIds.map(id=>sourceRecords.find(source=>String(source.id)===String(id))).filter(Boolean)
  const sourceTitles=sources.map(source=>source!.title).join('; ')
  return '<g data-taxon="'+escape(String(taxon.id))+'">'+
    '<text x="98" y="'+(y+4)+'" class="taxon">'+label+'</text>'+
    '<text x="98" y="'+(y+27)+'" class="date">'+date+'</text>'+
    '<rect x="'+x1.toFixed(1)+'" y="'+(y-10)+'" width="'+width.toFixed(1)+'" height="22" rx="8" fill="'+certaintyColor[certainty]+'" opacity=".9"/>'+
    '<line x1="'+x1.toFixed(1)+'" y1="'+(y-15)+'" x2="'+x1.toFixed(1)+'" y2="'+(y+17)+'" stroke="#f0e9dd" stroke-width="1.4" opacity=".78"/>'+
    '<line x1="'+x2.toFixed(1)+'" y1="'+(y-15)+'" x2="'+x2.toFixed(1)+'" y2="'+(y+17)+'" stroke="#f0e9dd" stroke-width="1.4" opacity=".78"/>'+
    '<text x="1530" y="'+(y+5)+'" class="confidence" fill="'+certaintyColor[certainty]+'">'+certaintyLabel[certainty]+'</text>'+
    '<title>'+label+': '+date+'. Qualitative certainty: '+certaintyLabel[certainty]+'. Sources: '+escape(sourceTitles)+'</title>'+
    '</g>'
})

const svg=[
'<svg xmlns="http://www.w3.org/2000/svg" width="'+WIDTH+'" height="'+HEIGHT+'" viewBox="0 0 '+WIDTH+' '+HEIGHT+'" role="img" aria-labelledby="title desc">',
'  <title id="title">Recorded time intervals for the 11 taxa in the Human Origins main path</title>',
'  <desc id="desc">A data-derived timeline showing the older and younger bounds currently recorded for eleven hominin taxa, from about seven million years ago to the present. Each row includes the catalogue qualitative chronology certainty, not a statistical probability or confidence interval. Time overlap does not imply direct ancestry.</desc>',
'  <defs>',
'    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0c2022"/><stop offset="1" stop-color="#071315"/></linearGradient>',
'    <style>',
'      text{font-family:Inter,Arial,sans-serif;fill:#eee8dc}',
'      .title{font-family:"Cormorant Garamond",Georgia,serif;font-size:54px;font-weight:600}',
'      .subtitle{font-size:19px;fill:#9eaca6}',
'      .kicker{font-size:15px;font-weight:700;letter-spacing:.14em;fill:#e8bd70}',
'      .taxon{font-size:20px;font-weight:650}',
'      .date{font-size:15px;fill:#9eaca6}',
'      .tick{font-size:14px;fill:#afbbb4}',
'      .confidence{font-size:13px;font-weight:750;letter-spacing:.06em}',
'      .grid{stroke:#30494a;stroke-width:1;stroke-dasharray:3 8}',
'      .rule{stroke:#2b4142;stroke-width:1}',
'      .note{font-size:16px;fill:#d4d9d1}',
'      .small{font-size:13px;fill:#9eaca6}',
'    </style>',
'  </defs>',
'  <rect width="'+WIDTH+'" height="'+HEIGHT+'" fill="url(#bg)"/>',
'  <circle cx="1640" cy="65" r="270" fill="#244343" opacity=".16"/>',
'  <text x="96" y="95" class="kicker">COMPARATIVE CHRONOLOGY · CLASS A DATA DIAGRAM</text>',
'  <text x="96" y="158" class="title">Eleven taxa through deep time</text>',
'  <text x="98" y="198" class="subtitle">Catalogued time intervals · 8 Ma to present · older bounds at left, younger bounds at right</text>',
'  <line x1="96" y1="222" x2="1700" y2="222" class="rule"/>',
'  <text x="98" y="252" class="kicker">TAXON / CATALOGUE LABEL</text>',
'  <text x="'+LEFT+'" y="252" class="kicker">TIME (Ma)</text>',
tickMarkup,
rows.join(nl),
'  <line x1="96" y1="1034" x2="1700" y2="1034" class="rule"/>',
'  <text x="98" y="1064" class="note">Colour = qualitative chronology certainty recorded in the catalogue: high · medium · debated. It is not a probability.</text>',
'  <text x="98" y="1090" class="small">Bars are the current catalogue interval bounds, not statistical confidence intervals. Overlap is temporal only; it does not establish direct ancestry.</text>',
'</svg>'
].join(nl)+'\n'

const notes=[
  '# compare.C13 — main-path time ranges',
  '',
  'Status: **class-A draft generated from the canonical content catalog**.',
  '',
  'The SVG is built from featured.mainPathTaxonIds. Bar endpoints come from taxon.chronology.olderMa and chronology.youngerMa; the text label comes from taxon.date; qualitative certainty comes from chronology.certainty; and source links come from taxon.sourceIds. Numeric ranges are not duplicated in the generator.',
  '',
  'The coloured certainty label is qualitative (high, medium, debated) and is not a probability or a statistical confidence interval. The horizontal bar is the catalogue recorded interval. Overlapping bars do not imply direct ancestry.',
  '',
  '## Taxon source trail',
  ...ordered.map(taxon=>{
    const titles=taxon.sourceIds.map(id=>sourceRecords.find(source=>String(source.id)===String(id))).filter(Boolean).map(source=>source!.title)
    return '- **'+taxon.name+'** ('+taxon.date+'; '+(taxon.chronology.certainty??'medium')+'): '+titles.join('; ')+'. IDs: '+taxon.sourceIds.map(String).join(', ')+'.'
  }),
  '',
  'The image is a draft only. It is not placed in public/assets or linked to the live comparison surface until the owner approves the visual treatment and the CMS slot is available.'
].join(nl)+'\n'

const svgPath=resolve(process.argv[2]??'tools/images/drafts/compare-time-ranges.svg')
const notesPath=resolve(process.argv[3]??'tools/images/drafts/compare-time-ranges-notes.md')
mkdirSync(dirname(svgPath),{recursive:true})
mkdirSync(dirname(notesPath),{recursive:true})
writeFileSync(svgPath,svg,'utf8')
writeFileSync(notesPath,notes,'utf8')
process.stdout.write('Wrote '+svgPath+nl+'Wrote '+notesPath+nl)
