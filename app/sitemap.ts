import type {MetadataRoute} from 'next'
import {contentCatalog} from '../content/catalog'
import {absoluteUrl} from '../infrastructure/site/url'

export const dynamic='force-dynamic'

// Species ids are canonical and append-only, so the built-in catalog is the right source for the sitemap.
export default function sitemap():MetadataRoute.Sitemap{
  const now=new Date()
  return [
    {url:absoluteUrl('/'),lastModified:now,changeFrequency:'weekly',priority:1},
    {url:absoluteUrl('/species'),lastModified:now,changeFrequency:'weekly',priority:.8},
    ...contentCatalog.taxa.map(taxon=>({url:absoluteUrl(`/species/${String(taxon.id)}`),lastModified:now,changeFrequency:'monthly' as const,priority:.7})),
  ]
}
