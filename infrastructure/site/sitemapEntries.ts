import type {MetadataRoute} from 'next'

export type SitemapInput={
  taxonIds:readonly string[]
  /** ISO date (YYYY-MM-DD) the species page was last reviewed, if it has an authored page. */
  reviewedOn:(taxonId:string)=>string|undefined
  url:(path:string)=>string
}

const parseDate=(value?:string)=>{
  const time=value?Date.parse(`${value}T00:00:00Z`):Number.NaN
  return Number.isNaN(time)?undefined:new Date(time)
}

/**
 * Builds sitemap entries from content review dates instead of "now".
 * A crawler that sees every URL modified on every fetch learns to ignore the signal.
 * When no review date is known the field is omitted rather than invented.
 */
export function buildSitemapEntries(input:SitemapInput):MetadataRoute.Sitemap{
  const dates=input.taxonIds.map(id=>parseDate(input.reviewedOn(id))).filter((date):date is Date=>Boolean(date))
  const siteDate=dates.length?new Date(Math.max(...dates.map(date=>date.getTime()))):undefined
  const entry=(path:string,lastModified:Date|undefined,changeFrequency:'weekly'|'monthly',priority:number)=>({
    url:input.url(path),
    ...(lastModified?{lastModified}:{}),
    changeFrequency,
    priority,
  })
  return [
    entry('/',siteDate,'weekly',1),
    entry('/species',siteDate,'weekly',.8),
    entry('/about',siteDate,'monthly',.4),
    ...input.taxonIds.map(id=>entry(`/species/${id}`,parseDate(input.reviewedOn(id))??siteDate,'monthly',.7)),
  ]
}
