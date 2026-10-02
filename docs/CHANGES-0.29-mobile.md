# 0.29 — Mobile & tablet pass

Scope: phone (320–620px), tablet portrait (621–820px) and tablet landscape (821–1024px) for every public page:
`/` (atlas, all five modes + inspector tabs), `/species` and `/species/[id]`. Desktop >1024px is unchanged
except for the global bug fixes marked (all).

QA method: every page rendered in Chromium at 360, 390, 768 and 1024px with touch emulation; scripted check
for horizontal page overflow; visual review of each mode (Tree, Timeline, Migration, Journey, Evidence),
the mobile menu and the Evidence / Specimens inspector tabs.

## Bugs fixed
1. (all) **Migration globe icons rendered at full width.** `.globe-wrap svg{width:100%;min-height:390px}` also hit
   every lucide icon inside the globe UI (layers, info, pins…), producing giant icons that covered the map.
   The map SVG now has `className="globe-map"`; icons are reset.
2. (all) **Time-bar tick labels overflowed** the panel ("8 Ma" / "Present" were centred on the edges). Same fix for the
   Timeline-mode scale.
3. (all) **Brand link on the atlas rendered as a blue underlined link** (the reset only existed under `.species-site`).
4. **Tree trapped touch scrolling.** d3-zoom captured every one-finger drag, so on phones the page could not be scrolled
   past the tree and the panel's own scroll never worked. One finger now scrolls natively, two fingers pinch-zoom.
5. **Tree zoom controls vanished on mobile.** `.tree-wrap` was narrower than the drawing, so the sticky controls slid
   off-screen as soon as the panel scrolled. Wrapper now sizes to the drawing; controls stay pinned bottom-left.
6. **Selected taxon was off-screen on phones** (default Neanderthal sits at the far right). The tree panel now scrolls
   itself (never the page) to keep the selected node in view.
7. **Tree labels ~8px on phones.** Drawing now renders at 960–980px wide inside the scrolling panel (≈11px labels).
8. **Time-bar scrubber squeezed to ~40px at 821–1024px.** Scrubber now gets its own row.
9. **Timeline mode axis misaligned on phones** (scale column 150px vs. rows 115px).
10. **Inspector tabs cut off** ("Genetics" unreachable on narrow screens) → horizontally scrollable tab strip.
11. **Species index overflowed below 332px** (`minmax(300px,1fr)`).
12. **Species dossier at tablet width:** portrait grew wider than its grid track and covered the title.
13. **Neanderthal portrait shows its baked-in caption** ("Homo neanderthalensis / 40,000 years ago" is part of the image
    file) on mobile crops → crops are now 3:2 anchored to the top. Recommended: replace the asset with a caption-free version.
14. Mobile menu: no active item, no Escape-to-close, stayed open after rotating to desktop width → fixed.

## Layout changes
- Phone header: brand + menu on row 1, full-width 40px search on row 2 (EN pill hidden), safe-area padding.
- Hero: content-driven height, fluid type (`clamp`), stronger left-to-right shade for legibility.
- Tablet portrait inspector: two-column (sticky picture | dossier text) instead of a 330px banner.
- Migration globe ≤820px: overlay panels become a stacked flow (story bar → layer filters → map → controls →
  route cards → notes) instead of absolutely-positioned boxes on top of each other.
- Scroll-snap for species deck, journey cards and route cards; 40–44px touch targets for primary controls.
- `app/layout.tsx`: explicit `viewport` export (device width, `viewport-fit=cover`, theme colour).

## Files touched
`app/globals.css` (new "0.29 mobile & tablet layer" appended at the end), `app/species/species.css` (appended layer),
`app/layout.tsx`, `components/EvolutionTree.tsx`, `components/MigrationGlobe.tsx`, `components/SiteHeader.tsx`.

Project audits re-run and passing: validate:syntax, audit:ui, audit:architecture, audit:foundation, audit:boundaries,
audit:runtime-boundaries, audit:version. Run `npm run check && npm run test && npm run build` after `npm ci` locally.
