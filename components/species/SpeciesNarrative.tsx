import type {ReactNode} from 'react'
import type {SpeciesPageContent} from '../../domain/species-page'
import type {ReferenceNumbering} from '../../domain/species-page-render'
import AtAGlance from './AtAGlance'
import NarrativeSections from './NarrativeSections'
import Debates from './Debates'

/** Everything that comes from the page's content file: facts, sections, debates and unknowns. */
export default function SpeciesNarrative({page,numbering,figures}:{page:SpeciesPageContent;numbering:ReferenceNumbering;figures?:Partial<Record<string,ReactNode>>}){
  return <>
    <AtAGlance page={page} numbering={numbering}/>
    <NarrativeSections sections={page.sections} numbering={numbering} figures={figures}/>
    <Debates page={page} numbering={numbering}/>
  </>
}
