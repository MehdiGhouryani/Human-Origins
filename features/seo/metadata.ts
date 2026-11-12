// Search metadata and structured data (plan phase 9). Pure functions: no framework imports, so they are unit-tested directly.

export const TITLE_MAX = 60
export const DESCRIPTION_MIN = 120
export const DESCRIPTION_MAX = 160

const SCHEMA_CONTEXT = 'https://schema.org'

/** Removes emphasis markers and collapses whitespace. */
export function plainText(value: string): string {
  return value.replace(/\*+/g, '').replace(/\s+/g, ' ').trim()
}

/**
 * Builds a meta description from text the page already shows. It keeps whole sentences when they fit in
 * 160 characters, cuts at a word boundary otherwise, and falls back to the catalog description when the text is too short.
 * No claim is added that is not already on the page.
 */
export function seoDescription(text: string, fallback = ''): string {
  const clean = plainText(text)
  if (clean.length >= DESCRIPTION_MIN && clean.length <= DESCRIPTION_MAX) return clean
  if (clean.length > DESCRIPTION_MAX) {
    const head = clean.slice(0, DESCRIPTION_MAX + 1)
    const sentenceEnd = head.lastIndexOf('. ')
    if (sentenceEnd >= DESCRIPTION_MIN - 1) return clean.slice(0, sentenceEnd + 1)
    const cut = clean.slice(0, DESCRIPTION_MAX - 1)
    const space = cut.lastIndexOf(' ')
    return cut.slice(0, space > 0 ? space : cut.length).replace(/[,;:\s]+$/, '') + '…'
  }
  const fb = plainText(fallback)
  if (fb.length >= DESCRIPTION_MIN && fb.length <= DESCRIPTION_MAX) return fb
  return clean || fb
}

/** Species title: the name and the date when the result fits in 60 characters, otherwise the name alone. */
export function seoTitle(name: string, date: string): string {
  const withDate = `${name} (${date}) · Human Origins`
  return withDate.length <= TITLE_MAX ? withDate : `${name} · Human Origins`
}

export function graphDocument(nodes: readonly Record<string, unknown>[]): Record<string, unknown> {
  return {'@context': SCHEMA_CONTEXT, '@graph': nodes}
}

/** Escapes "<" so that no string in the document can close the script element. */
export function jsonLdHtml(document: Record<string, unknown>): string {
  return JSON.stringify(document).replace(/</g, '\\u003c')
}

export function websiteNode(url: string, name: string): Record<string, unknown> {
  return {'@type': 'WebSite', '@id': `${url}#website`, url, name, inLanguage: 'en'}
}

export function aboutPageNode(url: string, name: string, description: string): Record<string, unknown> {
  return {'@type': 'AboutPage', '@id': `${url}#aboutpage`, url, name, description, inLanguage: 'en'}
}

export function breadcrumbNode(url: string, items: readonly {name: string; url: string}[]): Record<string, unknown> {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: items.map((item, index) => ({'@type': 'ListItem', position: index + 1, name: item.name, item: item.url})),
  }
}

/**
 * A Taxon node for one species. It carries only fields the page shows: the scientific name, the rank, and the
 * description. No parent taxon is written: ancestry is not asserted (plan phase 9.4).
 */
export function taxonNode(input: {
  url: string
  scientificName: string
  rank: string
  description: string
  alternateNames: readonly string[]
}): Record<string, unknown> {
  const alternates = input.alternateNames.filter(name => name && name !== input.scientificName)
  return {
    '@type': 'Taxon',
    '@id': `${input.url}#taxon`,
    url: input.url,
    name: input.scientificName,
    ...(alternates.length ? {alternateName: alternates} : {}),
    taxonRank: input.rank,
    description: input.description,
  }
}

/** The /llms.txt body: a title, a one-line summary, and linked sections (the llms.txt convention; not a formal standard). */
export function llmsText(input: {
  title: string
  summary: string
  sections: readonly {title: string; links: readonly {name: string; url: string; note: string}[]}[]
}): string {
  const lines = [`# ${input.title}`, '', `> ${input.summary}`, '']
  for (const section of input.sections) {
    lines.push(`## ${section.title}`, '')
    for (const link of section.links) lines.push(`- [${link.name}](${link.url}): ${link.note}`)
    lines.push('')
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}
