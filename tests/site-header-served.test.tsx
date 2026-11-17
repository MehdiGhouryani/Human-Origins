import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {SiteHeaderServed} from '../components/SiteHeader'

// The mobile menu must work without React: the served header renders a native <details> disclosure, so there
// is no click-controlled button that can sit inert before hydration. The header is the one element a reader
// gets — there is no streamed fallback copy next to it — so the markup below is the whole header contract.
describe('pre-hydration mobile navigation',()=>{
  const markup=renderToStaticMarkup(<SiteHeaderServed/>)

  it('is a native disclosure with explicit button semantics, not a click-controlled button',()=>{
    expect(markup).toContain('<details class="mobile-menu"')
    // role="button" keeps the disclosure reachable as a button while the <details> element owns the state.
    expect(markup).toContain('<summary role="button" class="mobile-menu-toggle"')
    expect(markup).toContain('aria-label="Open navigation"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toMatch(/<(button)[^>]*mobile-menu-toggle/)
    // The disclosure starts closed.
    expect(markup).not.toMatch(/<details[^>]*\bopen\b/)
    // Exactly one header and one disclosure id: the streamed fallback copy must not come back.
    expect(markup.match(/class="topbar/g)?.length).toBe(1)
    expect(markup.match(/id="mobile-navigation"/g)?.length).toBe(1)
  })

  it('carries the four destinations with their query state inside the labelled menu',()=>{
    expect(markup).toContain('aria-label="Mobile navigation"')
    expect(markup).toContain('href="/species"')
    expect(markup).toContain('href="/?journey=1"')
    expect(markup).toContain('href="/?mode=evidence"')
    expect(markup).toContain('href="/about"')
  })
})
