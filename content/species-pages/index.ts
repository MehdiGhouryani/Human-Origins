import type {SpeciesPageContent} from '../../domain/species-page'
import {afarensisPage} from './afarensis'
import {sahelanthropusPage} from './sahelanthropus'

/**
 * Scientific text of the species pages. One file per taxon, added here as each page is written and
 * reviewed. A taxon without an entry renders the existing record with an “incomplete record” notice.
 */
export const speciesPages:Readonly<Record<string,SpeciesPageContent>>={
  afarensis:afarensisPage,
  sahelanthropus:sahelanthropusPage,
}

export const getSpeciesPage=(taxonId:string):SpeciesPageContent|undefined=>speciesPages[taxonId]
