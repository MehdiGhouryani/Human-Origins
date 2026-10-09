import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {numberReferences,parseRichText} from '../domain/species-page-render'
import AtAGlance from '../components/species/AtAGlance'
import NarrativeSections from '../components/species/NarrativeSections'
import Debates from '../components/species/Debates'
import ReferenceList from '../components/species/ReferenceList'
import SectionNav from '../components/species/SectionNav'
import SpeciesNarrative from '../components/species/SpeciesNarrative'
import {Cite,RichText} from '../components/species/Rich'
import {makeContext,makeValidPage} from './fixtures/species-page'
import {SECTION_IDS,SECTION_TITLES} from '../domain/species-page'

const page=makeValidPage()
const numbering=numberReferences(page)
const publications=makeContext().publications
const html=(node:React.ReactElement)=>renderToStaticMarkup(node)
// The lead is rendered in the page header, before the narrative; it carries the first citations.
const full=()=>html(<><p><RichText text={page.lead.text}/><Cite refs={page.lead.refs} numbering={numbering} where="lead"/></p><SpeciesNarrative page={page} numbering={numbering}/><ReferenceList numbering={numbering} publications={publications}/></>)

describe('reference numbering',()=>{
  it('numbers references by first appearance in reading order',()=>{
    // lead cites ref-1, ref-6; the fact table adds ref-2; sections add more.
    expect(numbering.order.slice(0,3)).toEqual(['ref-1','ref-6','ref-2'])
    expect(numbering.numbers.get('ref-1')).toBe(1)
    expect(numbering.numbers.get('ref-6')).toBe(2)
    expect(numbering.numbers.get('ref-2')).toBe(3)
    expect(new Set(numbering.order).size).toBe(numbering.order.length)
    expect(numbering.firstAt.get('ref-1')).toBe('lead')
    expect(numbering.firstAt.get('ref-2')).toBe('fact-time-range')
  })
  it('is deterministic',()=>{
    expect(numberReferences(page).order).toEqual(numbering.order)
  })
  it('parses italic markup',()=>{
    expect(parseRichText('a *Homo sapiens* b')).toEqual([{text:'a ',italic:false},{text:'Homo sapiens',italic:true},{text:' b',italic:false}])
    expect(html(<RichText text="see *Homo erectus* here"/>)).toContain('<em>Homo erectus</em>')
  })
})

describe('species page components',()=>{
  it('renders the fact table with certainty badges and citations, never numbers as confidence',()=>{
    const markup=html(<AtAGlance page={page} numbering={numbering}/>)
    expect(markup).toContain('id="at-a-glance"')
    expect((markup.match(/sp-fact"/g)??[]).length).toBe(8)
    expect(markup).toContain('sp-badge-estimated')
    expect(markup).toContain('>Estimated<')
    expect(markup).toMatch(/<sup class="sp-cite"[^>]*><span><a href="#ref-\d+"/)
    expect(markup).not.toMatch(/\d+\s*%/)
  })

  it('renders eight sections in order as accordions with the section titles',()=>{
    const markup=html(<NarrativeSections sections={page.sections} numbering={numbering}/>)
    expect((markup.match(/<details/g)??[]).length).toBe(8)
    const positions=SECTION_IDS.map(id=>markup.indexOf(`id="${id}"`))
    expect(positions.every(position=>position>=0)).toBe(true)
    expect([...positions].sort((a,b)=>a-b)).toEqual(positions)
    for(const id of SECTION_IDS) expect(markup).toContain(`>${SECTION_TITLES[id]}<`)
    expect(markup).toContain('<details id="discovery"')
  })

  it('renders each block type',()=>{
    const custom=[{id:'anatomy' as const,blocks:[
      {type:'paragraph' as const,text:'Plain *italic* text',refs:['ref-1'],singleSource:true},
      {type:'note' as const,text:'A note',refs:['ref-2']},
      {type:'list' as const,items:[{text:'one',refs:['ref-1']},{text:'two',refs:['ref-2']}]},
      {type:'table' as const,caption:'Measurements',rows:[{label:'Height',value:'105 cm',refs:['ref-3']}]},
    ]}]
    const customNumbering=numberReferences({...page,sections:custom as never})
    const markup=html(<NarrativeSections sections={custom as never} numbering={customNumbering}/>)
    expect(markup).toContain('<em>italic</em>')
    expect(markup).toContain('single study')
    expect(markup).toContain('role="note"')
    expect(markup).toContain('<li>')
    expect(markup).toContain('<caption>Measurements</caption>')
    expect(markup).toContain('<th scope="row">Height</th>')
  })

  it('renders debates as questions with positions, citations and a dated update, then what is not known',()=>{
    const markup=html(<Debates page={page} numbering={numbering}/>)
    expect(markup).toContain('id="debated"')
    expect(markup).toContain('How much time did it spend climbing?')
    expect((markup.match(/<li><strong>/g)??[]).length).toBe(2)
    expect(markup).toContain('Updated September 2026')
    expect(markup).toContain('id="unknown"')
    expect(markup).toContain('What is not known')
  })

  it('renders the reference list with anchors, kinds, safe DOI links and back-links',()=>{
    const markup=html(<ReferenceList numbering={numbering} publications={publications}/>)
    expect(markup).toContain('id="sources"')
    expect(markup).toContain(`Sources (${numbering.order.length})`)
    expect(markup).toContain('id="ref-1"')
    expect(markup).toContain('rel="noopener noreferrer"')
    expect(markup).toContain('target="_blank"')
    expect(markup).toContain('href="https://doi.org/')
    expect(markup).toContain('Primary')
    expect(markup).toContain('href="#cite-1"')
    expect(markup).toContain('aria-label="Copy citation"')
    expect(html(<ReferenceList numbering={{order:[],numbers:new Map(),firstAt:new Map()}} publications={publications}/>)).toBe('')
  })

  it('links every citation to a reference and every back-link to a citation',()=>{
    const markup=full()
    const cites=new Set([...markup.matchAll(/href="#ref-(\d+)"/g)].map(match=>match[1]))
    const refs=new Set([...markup.matchAll(/ id="ref-(\d+)"/g)].map(match=>match[1]))
    const backs=new Set([...markup.matchAll(/href="#cite-(\d+)"/g)].map(match=>match[1]))
    const anchors=new Set([...markup.matchAll(/ id="cite-(\d+)"/g)].map(match=>match[1]))
    expect([...cites].sort()).toEqual([...refs].sort())
    expect(refs.size).toBe(numbering.order.length)
    expect([...backs].sort()).toEqual([...anchors].sort())
    expect(anchors.size).toBe(numbering.order.length)
    // each citation anchor appears once, so ids are unique
    for(const n of anchors) expect(markup.split(` id="cite-${n}"`).length-1,`cite-${n}`).toBe(1)
  })

  it('renders the in-page navigation',()=>{
    const markup=html(<SectionNav items={[{id:'at-a-glance',label:'At a glance'},{id:'sources',label:'Sources'}]}/>)
    expect(markup).toContain('aria-label="On this page"')
    expect(markup).toContain('href="#sources"')
  })
})
