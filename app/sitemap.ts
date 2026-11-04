import type {MetadataRoute} from 'next'
import {contentCatalog} from '../content/catalog'
import {getSpeciesPage} from '../content/species-pages'
import {absoluteUrl} from '../infrastructure/site/url'
import {buildSitemapEntries} from '../infrastructure/site/sitemapEntries'

export const dynamic='force-dynamic'

// Species ids are canonical and append-only, so the built-in catalog is the right source for the sitemap.
export default function sitemap():MetadataRoute.Sitemap{
  return buildSitemapEntries({
    taxonIds:contentCatalog.taxa.map(taxon=>String(taxon.id)),
    reviewedOn:id=>getSpeciesPage(id)?.reviewedOn,
    url:absoluteUrl,
  })
}
