import type {MetadataRoute} from 'next'
import {taxaById} from '../content/catalog'
import {getSpeciesPage} from '../content/species-pages'
import {absoluteUrl} from '../infrastructure/site/url'

// Canonical pages only (plan phase 9.5). lastModified is the reviewer's date from the species page, and is left out when there is none.
export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {url: absoluteUrl('/')},
    {url: absoluteUrl('/about')},
    {url: absoluteUrl('/species')},
  ]
  for (const id of Object.keys(taxaById)) {
    const reviewedOn = getSpeciesPage(id)?.reviewedOn
    entries.push({url: absoluteUrl(`/species/${id}`), ...(reviewedOn ? {lastModified: reviewedOn} : {})})
  }
  return entries
}
