import type {SpeciesPageContent} from '../../domain/species-page'
import {afarensisPage} from './afarensis'
import {neanderthalPage} from './neanderthal'
import {sapiensPage} from './sapiens'
import {erectusPage} from './erectus'
import {heidelbergensisPage} from './heidelbergensis'
import {habilisPage} from './habilis'
import {anamensisPage} from './anamensis'
import {africanusPage} from './africanus'
import {sahelanthropusPage} from './sahelanthropus'

/**
 * Scientific text of the species pages. One file per taxon, added here as each page is written and
 * reviewed. A taxon without an entry renders the existing record with an “incomplete record” notice.
 */
export const speciesPages:Readonly<Record<string,SpeciesPageContent>>={
  afarensis:afarensisPage,
  anamensis:anamensisPage,
  sahelanthropus:sahelanthropusPage,
  neanderthal:neanderthalPage,
  sapiens:sapiensPage,
  erectus:erectusPage,
  heidelbergensis:heidelbergensisPage,
  habilis:habilisPage,
  africanus:africanusPage,
}

export const getSpeciesPage=(taxonId:string):SpeciesPageContent|undefined=>speciesPages[taxonId]
