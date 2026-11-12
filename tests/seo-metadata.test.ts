import {describe, expect, it} from 'vitest'
import {taxaById} from '../content/catalog'
import {getSpeciesPage} from '../content/species-pages'
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TITLE_MAX,
  breadcrumbNode,
  graphDocument,
  jsonLdHtml,
  llmsText,
  seoDescription,
  seoTitle,
  taxonNode,
} from '../features/seo/metadata'

const taxa = Object.values(taxaById)

describe('seoDescription', () => {
  it('keeps a text that already fits the range', () => {
    const text = 'x'.repeat(130)
    expect(seoDescription(text)).toBe(text)
  })

  it('cuts at a sentence end when the text is longer than the maximum', () => {
    const first = 'First sentence of the page, long enough to pass the minimum length for a description here.'
    const text = `${first} ${'Second sentence that keeps going. '.repeat(6)}`
    const result = seoDescription(text)
    expect(result.endsWith('.')).toBe(true)
    expect(result.length).toBeGreaterThanOrEqual(DESCRIPTION_MIN)
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
  })

  it('cuts at a word boundary with an ellipsis when no sentence end fits', () => {
    const text = 'word '.repeat(80)
    const result = seoDescription(text)
    expect(result.endsWith('…')).toBe(true)
    expect(result.length).toBeLessThanOrEqual(DESCRIPTION_MAX)
  })

  it('uses the fallback when the text is shorter than the minimum', () => {
    const fallback = 'y'.repeat(140)
    expect(seoDescription('short', fallback)).toBe(fallback)
  })

  it('removes emphasis markers', () => {
    expect(seoDescription('*Homo* sapiens '.repeat(10))).not.toContain('*')
  })
})

describe('seoTitle', () => {
  it('stays within the title limit for every taxon in the catalog', () => {
    for (const taxon of taxa) {
      expect(seoTitle(taxon.name, taxon.date).length, taxon.name).toBeLessThanOrEqual(TITLE_MAX)
    }
  })
})

describe('species descriptions from the page text', () => {
  it('fits the description range for every species with a page', () => {
    for (const taxon of taxa) {
      const page = getSpeciesPage(String(taxon.id))
      if (!page) continue
      const description = seoDescription(page.lead.text, taxon.description)
      expect(description.length, taxon.name).toBeGreaterThanOrEqual(DESCRIPTION_MIN)
      expect(description.length, taxon.name).toBeLessThanOrEqual(DESCRIPTION_MAX)
    }
  })
})

describe('structured data', () => {
  it('writes no parent taxon or ancestry for each species', () => {
    for (const taxon of taxa) {
      const node = taxonNode({
        url: `https://example.org/species/${taxon.id}`,
        scientificName: taxon.name,
        rank: 'species',
        description: taxon.description,
        alternateNames: [taxon.name],
      })
      const keys = Object.keys(node)
      expect(keys.some(key => /parent|ancestor/i.test(key)), taxon.name).toBe(false)
      expect(node['@type']).toBe('Taxon')
    }
  })

  it('numbers breadcrumb items from 1 in order', () => {
    const node = breadcrumbNode('https://example.org/species/x', [
      {name: 'Human Origins', url: 'https://example.org/'},
      {name: 'Species', url: 'https://example.org/species'},
      {name: 'X', url: 'https://example.org/species/x'},
    ]) as {itemListElement: {position: number}[]}
    expect(node.itemListElement.map(item => item.position)).toEqual([1, 2, 3])
  })

  it('escapes "<" so no string can close the script element', () => {
    const html = jsonLdHtml(graphDocument([{'@type': 'X', name: '</script><script>alert(1)</script>'}]))
    expect(html).not.toContain('</script')
    expect(html).not.toContain('<script')
    expect(JSON.parse(html.replace(/\\u003c/g, '<'))['@graph'][0].name).toContain('</script>')
  })
})

describe('llms text', () => {
  it('writes a title, a summary and one line per link', () => {
    const text = llmsText({
      title: 'T',
      summary: 'S',
      sections: [{title: 'Species', links: [{name: 'A', url: 'https://example.org/a', note: 'n'}]}],
    })
    expect(text.startsWith('# T\n\n> S\n')).toBe(true)
    expect(text).toContain('- [A](https://example.org/a): n')
    expect(text.endsWith('\n')).toBe(true)
  })
})
