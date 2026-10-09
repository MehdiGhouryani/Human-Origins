import type {SpeciesPageContent} from '../../domain/species-page'
import type {ReferenceNumbering} from '../../domain/species-page-render'
import AtAGlance from './AtAGlance'
import NarrativeSections from './NarrativeSections'
import Debates from './Debates'

/** Everything that comes from the page's content file: facts, sections, debates and unknowns. */
export default function SpeciesNarrative({page,numbering}:{page:SpeciesPageContent;numbering:ReferenceNumbering}){
  return <>
    <AtAGlance page={page} numbering={numbering}/>
    <NarrativeSections sections={page.sections} numbering={numbering}/>
    <Debates page={page} numbering={numbering}/>
  </>
}
