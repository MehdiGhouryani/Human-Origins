import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement as h} from 'react'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerSpeciesById} from '../features/explorer/selectors'
import {groupTaxaByClade} from '../domain/taxon-model'
import TaxonNavigator from '../components/TaxonNavigator'
import RelationshipTable from '../components/RelationshipTable'
import RelationshipLegend from '../components/RelationshipLegend'
import FamilyView from '../components/FamilyView'
import Inspector,{type InspectorTab} from '../components/Inspector'

const bootstrap=buildExplorerBootstrap()
const noop=()=>{}
const nav=(selectedId:string,saved:string[]=[])=>renderToStaticMarkup(h(TaxonNavigator,{species:bootstrap.species,selectedId,onSelect:noop,savedIds:new Set(saved),graphIds:new Set(bootstrap.graph.taxonIds)}))
const inspector=(id:string,initialTab:InspectorTab='Overview')=>renderToStaticMarkup(h(Inspector,{bootstrap,species:getExplorerSpeciesById(bootstrap,id),bookmarked:false,onToggleBookmark:()=>true,onRevealSite:noop,initialTab}))
const count=(html:string,needle:RegExp)=>(html.match(needle)||[]).length

describe('taxon navigator',()=>{
  it('renders one chip for every catalogue taxon (no hidden taxa)',()=>{expect(count(nav('neanderthal'),/data-taxon="/g)).toBe(bootstrap.species.length)})
  it('has exactly one selected chip and one tab stop (roving tabindex)',()=>{
    const html=nav('erectus');expect(count(html,/aria-current="true"/g)).toBe(1);expect(count(html,/tabindex="0"/g)).toBe(1)
  })
  it('shows a position/count indicator and one section per clade, taken from the data',()=>{
    const html=nav('neanderthal');expect(html).toMatch(/\d+ of 18/)
    expect(count(html,/class="taxon-group"/g)).toBe(groupTaxaByClade(bootstrap.species).length)
  })
  it('marks the inferred node as inferred and flags saved taxa',()=>{
    const html=nav('neanderthal',['sapiens']);expect(html).toContain('Inferred');expect(html).toMatch(/aria-label="Saved"/)
  })
  it('still has a tab stop when the selected id is unknown',()=>{expect(count(nav('does-not-exist'),/tabindex="0"/g)).toBe(1)})
})

describe('relationship table (accessible graph alternative)',()=>{
  it('is a real table with a caption, column headers and one row per relationship',()=>{
    const html=renderToStaticMarkup(h(RelationshipTable,{bootstrap}))
    expect(html).toContain('<caption>');expect(count(html,/scope="col"/g)).toBeGreaterThanOrEqual(5)
    expect(count(html,/<tbody>.*<\/tbody>/s)).toBe(1);expect(count(html,/<tr>/g)-1).toBe(bootstrap.relationships.length)
  })
  it('states what each relationship does not claim and shows certainty',()=>{
    const html=renderToStaticMarkup(h(RelationshipTable,{bootstrap}));expect(count(html,/rel-no-claim/g)).toBe(bootstrap.relationships.length);expect(html).toMatch(/Debated|Medium|High/)
  })
  it('marks external sources as opening in a new tab for screen readers',()=>{expect(renderToStaticMarkup(h(RelationshipTable,{bootstrap}))).toContain('(opens in a new tab)')})
  it('uses an honest empty state for a taxon with no recorded relationships',()=>{
    const isolated={...bootstrap,relationships:[]}
    expect(renderToStaticMarkup(h(RelationshipTable,{bootstrap:isolated,taxonId:'sapiens'}))).toMatch(/reflects what the dataset represents, not a finding/)
  })
})

describe('legend',()=>{
  it('explains every class present in the data and nothing else',()=>{
    const present=new Set(bootstrap.relationships.map(r=>r.relation));const html=renderToStaticMarkup(h(RelationshipLegend,{present}))
    expect(count(html,/<li>/g)).toBe(present.size)
  })
})

describe('family view (mobile relationship surface)',()=>{
  it('lets you walk from a taxon to what is drawn from it',()=>{const html=renderToStaticMarkup(h(FamilyView,{bootstrap,taxonId:'common',onSelect:noop}));expect(html).toContain('Branches drawn from it');expect(html).toContain('Sahelanthropus')})
  it('lists documented gene flow separately from descent',()=>{const html=renderToStaticMarkup(h(FamilyView,{bootstrap,taxonId:'neanderthal',onSelect:noop}));expect(html).toContain('Documented genetic exchange');expect(html).toContain('Drawn from')})
})

describe('species navigator',()=>{
  it('labels exactly the taxa that are not drawn on the main graph (7 of 18)',()=>{
    const html=nav('neanderthal');expect(count(html,/taxon-chip-off/g)).toBe(7);expect(count(html,/class="taxon-chip /g)).toBe(18)
  })
})

describe('inspector',()=>{
  it('labels the inferred common ancestor as an inferred node, never "Extinct"',()=>{
    const html=inspector('common');expect(html).toContain('Inferred ancestral node');expect(html).not.toMatch(/>Extinct</);expect(html).toContain('not a named fossil species')
  })
  it('keeps "Extinct" for recorded taxa',()=>{expect(inspector('erectus')).toMatch(/>Extinct</)})
  it('uses "not represented in the atlas" wording, not "no evidence exists", for empty genetic evidence and Lifestyle',()=>{
    for(const tab of ['Evidence','Lifestyle'] as const){const html=inspector('common',tab);expect(html).toMatch(/is represented for/);expect(html).toMatch(/not a finding that none exists/);expect(html).not.toMatch(/no (archaeological|genetic) (record|evidence) (is|exists)/i)}
  })
  it('lists genetic evidence records and gene flow for Neanderthals',()=>{const html=inspector('neanderthal','Evidence');expect(html).toContain('Genetic evidence records');expect(html).toContain('Documented gene flow')})
  it('has three views: Overview, Evidence and Lifestyle',()=>{const html=inspector('heidelbergensis');expect(count(html,/role="tab"/g)).toBe(3);expect(html).not.toContain('>Specimens<');expect(html).not.toContain('>Relationships<')})
  it('exposes tablist semantics with roving tabindex',()=>{const html=inspector('erectus');expect(html).toContain('role="tablist"');expect(count(html,/role="tab"/g)).toBe(3);expect(count(html,/role="tab"[^>]*tabindex="0"/g)).toBe(1)})
  it('renders every catalogue taxon without throwing (missing optional fields tolerated)',()=>{for(const t of bootstrap.species) for(const tab of ['Overview','Evidence','Lifestyle'] as const) expect(()=>inspector(t.id,tab),`${t.id}/${tab}`).not.toThrow()})
  it('does not throw for a taxon with no media or facts',()=>{
    const bare={...getExplorerSpeciesById(bootstrap,'erectus'),media:[],facts:[]} as never
    expect(()=>renderToStaticMarkup(h(Inspector,{bootstrap,species:bare,bookmarked:false,onToggleBookmark:()=>true,onRevealSite:noop}))).not.toThrow()
  })
})
