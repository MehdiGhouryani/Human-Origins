import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import {SiteHeaderFallback} from '../components/SiteHeader'

// The mobile menu must work without React: the served header (and the Suspense fallback) render a native
// <details> disclosure, so there is no click-controlled button that can sit inert before hydration.
describe('pre-hydration mobile navigation',()=>{
  const markup=renderToStaticMarkup(<SiteHeaderFallback/>)

  it('is a native disclosure with explicit button semantics, not a click-controlled button',()=>{
    expect(markup).toContain('<details class="mobile-menu"')
    // role="button" keeps the disclosure reachable as a button while the <details> element owns the state.
    expect(markup).toContain('<summary role="button" class="mobile-menu-toggle"')
    expect(markup).toContain('aria-label="Open navigation"')
    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toMatch(/<(button)[^>]*mobile-menu-toggle/)
    // The disclosure starts closed.
    expect(markup).not.toMatch(/<details[^>]*\bopen\b/)
  })

  it('carries the four destinations with their query state inside the labelled menu',()=>{
    expect(markup).toContain('aria-label="Mobile navigation"')
    expect(markup).toContain('href="/species"')
    expect(markup).toContain('href="/?journey=1"')
    expect(markup).toContain('href="/?mode=evidence"')
    expect(markup).toContain('href="/about"')
  })
})
