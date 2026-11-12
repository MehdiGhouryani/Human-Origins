import {createHash} from 'node:crypto'
import {taxaById} from '../../content/catalog'
import {getSpeciesPage} from '../../content/species-pages'
import {absoluteUrl} from '../../infrastructure/site/url'
import {llmsText, seoDescription} from '../../features/seo/metadata'

// A proposed convention, not a standard: a short index of the key pages (plan phase 11.5). Built from the catalog, so it is static.
export const dynamic = 'force-static'

export function GET() {
  const species = Object.values(taxaById).map(taxon => {
    const page = getSpeciesPage(String(taxon.id))
    return {name: taxon.name, url: absoluteUrl(`/species/${taxon.id}`), note: seoDescription(page?.lead.text ?? taxon.description, taxon.description)}
  })
  const body = llmsText({
    title: 'Human Origins',
    summary: 'A source-aware interactive atlas of human evolution: fossil species, the evidence for them, their dates, and population movements. Every factual claim links to a source.',
    sections: [
      {title: 'Key pages', links: [
        {name: 'Atlas', url: absoluteUrl('/'), note: 'Interactive lineage, evidence, time and migration views.'},
        {name: 'About', url: absoluteUrl('/about'), note: 'How the atlas works, its evidence rule, and what it does not claim.'},
        {name: 'Species index', url: absoluteUrl('/species'), note: 'Every species in the catalog.'},
      ]},
      {title: 'Species', links: species},
    ],
  })
  const etag = `"${createHash('sha256').update(body).digest('base64url').slice(0, 22)}"`
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      ETag: etag,
    },
  })
}
