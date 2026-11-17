# Changelog

## Unreleased

### One header, one disclosure id (fixes CI run #71's four E2E failures)
- The streamed Suspense fallback header is gone. `<SiteHeader>` rendered `<Suspense fallback={<SiteHeaderFallback/>}>` around the resolved header, so on the force-dynamic routes every page here uses, Next streamed a full fallback header (`.brand`, `summary.mobile-menu-toggle`, `#mobile-navigation`) and then the resolved header into the same document; the React streamed-boundary wrapper (`div#S:0[hidden]`) kept holding the fallback copy in the live DOM after hydration (CI traces show both copies at failure time). That made `.brand` and `#mobile-navigation` resolve twice (failures A and D) and gave a no-JS reader two header copies. Every page that shows the header is `dynamic='force-dynamic'`, so `useSearchParams()` needs no boundary and the header is now a single server-rendered element: served and hydrated markup are the same component (`SiteHeaderMarkup`), the served links carry the resolved destinations, and the pre-hydration contract is unchanged (native `<details>` disclosure, real hrefs, no inert control). `tests/e2e/mobile-nav-fallback.spec.ts` now targets the plain `.topbar` locator — strict mode fails if a second header ever appears again — and the unit test moved to `tests/site-header-served.test.tsx`, asserting the same disclosure contract plus exactly one header and one `#mobile-navigation` id.
- The mobile menu state can no longer be lost at hydration or fall out of sync (failures B and C). Before, the menu could be opened before the framework chunks executed; the `toggle` event fired before React could listen, so React kept `open=false`, the menu was left with a stale `aria-expanded`/icon and — because the Escape/outside-tap listeners were attached in an effect keyed on `open` — no way to close it; on CI the boundary activation also replaced the header subtree, which closed a menu the reader had just opened. Now the native `[open]` attribute is the source of truth: React reads it on mount and mirrors it through a `toggle` listener on the `<details>` element, and the key (Escape, Tab trap), pointer (outside tap) and desktop-width listeners are attached once for the lifetime of the header instead of per open, so there is no attach window after reopening. Focus moves into the menu on open and returns to the toggle on Escape, as before. Verified against the production build with a chunk-delay probe (toggle clicked pre-hydration: the menu survives hydration with `aria-expanded` synced, Escape/outside tap close it, single header throughout; five runs, plus unthrottled runs).

### Mobile navigation before hydration (second pass)
- The mobile menu is a native `<details>` disclosure now, in the served header and in the Suspense fallback: it opens with Enter from the keyboard and its links navigate before React attaches (and with scripts blocked), so no served variant of the header carries a control that does nothing until hydration. The hydrated header adds the focus trap, Escape/outside-tap closing, the `aria-expanded` mirror and the Space key on top of the native state; the summary carries `role="button"` because Chromium does not expose the button role for a summary inside a `display: contents` parent. Regression tests: `tests/e2e/mobile-nav-fallback.spec.ts` (framework chunks blocked, so the page never hydrates; 320/360/390/768 px) and `tests/site-header-fallback.test.tsx` (served markup has no click-controlled toggle). Finding reported, not changed: on force-dynamic routes Next streams the fallback header and the resolved header into the same HTML, so a no-JS reader receives two header copies (the second is the one shown and interactive; pre-existing behaviour, owner decision needed if it should be deduplicated server-side).

### Search metadata coverage (phase 9 follow-up)
- `seoDescription` now cuts an over-long catalog fallback with the same sentence/word rule as page text (before, a species without an authored page got its full catalog description, over 160 characters). Nothing is invented; a source text shorter than 120 characters stays short.
- Production metadata coverage for all 18 species: `tests/species-metadata.test.tsx` runs the real `generateMetadata` per species (unique titles ≤ 60, absolute canonicals, indexable, descriptions from page text) plus the sitemap (18 species + 3 canonical static pages, `lastmod` only where a reviewer date exists) and the explorer canonical/noindex rules. Reported limitation: the descriptions of `boisei`, `ergaster` and `robustus` are 76–106 characters because their catalog records are that short — these are outside-graph taxa whose content is parked; filling them is a content decision, not a padding task.

### Release gate portability
- The data audits (`validate:data`, `audit:media`, `audit:research-model`, `audit:*`, `images:build`, `check:references`) invoked `tsc` through a bare `execFileSync`, which cannot exec the `.cmd` shim on Windows (`spawnSync tsc ENOENT`). They now resolve TypeScript's own `bin/tsc` and run it with the current Node binary (`scripts/lib/tsc-bin.mjs`), identical behaviour on Linux/macOS. CI on ubuntu is unaffected.

### CSS audit (phase 7.4 counting tool)
- `npm run audit:css` (read-only): reproducible counts for the plan's CSS debt — lines per stylesheet (globals 5306 + atlas 454 = 5760 against the deferred < 2500 target), 19 `!important`, 49 media queries, 126 selector definitions repeated across rules (top: `.tree-shell` 10×, `.topbar` 9×), and 39 class names no source or test file references (deletion is an owner decision; the 2026-10-12 purge protocol — computed-style fingerprint over page×width combinations — must be repeated first). The graph-lineage list is empty: no frozen class is unreferenced.

### Performance and accessibility (phase 7, in progress)
- Measurement protocol: `npm run perf:baseline` (mobile: CPU x4 and a Fast 4G profile; desktop: unthrottled; medians of five runs). Baseline in `tests/perf/baseline.json`; the after-change run in `tests/perf/after-phase7.json`.
- The client bootstrap no longer carries the audit-only publication fields (`note`, `verifiedOn`, `verification`): 5 to 6 KB less HTML on the wire on pages that carry explorer data. Fields the UI reads (including `kind`) are unchanged.
- Time milestones: accessible names contain the visible label (axe `label-content-name-mismatch`, nine nodes on Evidence).
- Compare: the Genetics chip text now meets 4.5:1 (5.8:1 on its background; axe `color-contrast`, two nodes).
- Repeatable axe check outside the graph: `npm run test:a11y` (axe-core 4.14, now a development dependency). The lineage and evidence graph containers are excluded, as frozen by decision; the check covers about, compare, evidence, migration and species, and all five pass.
- Species page: the 3D viewer button had 1.6:1 contrast because the `.dossier a` reset forced the body text colour; it keeps its dark text now (`.dossier .viewer-btn`). The specimen note is lightened to 7.0:1 (was 3.9:1). These are visible colour changes in the specimen archive.
- The stylesheet split was reverted: Turbopack's CSS bundling changed the rule order, and `experimental.cssChunking: 'strict'` is supported only with webpack.
- Explorer bootstrap: the browser no longer receives fields that no component reads (`identifiers` on publications and sources, `contributors` on publications). The narrowed `ClientPublicationRecord` and `ClientSourceRecord` types make a future read fail the type check. Serialised payload: home 357 KB to 309 KB, species 432 KB to 384 KB; rendering unchanged.
- Migration atlas: the live region announces the scene only, not the count of visible sites, so playback does not repeat it (phase 7.5). The count stays visible on screen.
- Header navigation: a link pressed right after a selection keeps the species and the mode. The header now builds the target from the address bar at click time, because `useSearchParams` can lag an explorer URL write (navigation.spec.ts:31 failed about one run in six before this; 32 of 32 pass in the repeat run afterwards).
- Axe gate extended: `tests/e2e/a11y-responsive.spec.ts` runs on every viewport (desktop, phone, iPhone SE, tablet) and on eight routes (home, about, compare, evidence, migration and three species pages). 32 of 32 pass.
- Home page: preload hints for the three hero images, each limited to the viewport that shows it (the hero is a CSS background, which the browser found late). Home mobile LCP median 1960 ms, from 3352 ms at baseline (five runs, Fast 4G and CPU x4; raw result in `tests/perf/after-lcp-hero.json`). Rendering unchanged (max 2/255 noise).
- Search: canonical rules for the explorer (`?species=X` points to `/species/X`, modes point to `/`), `noindex` for the comparison view, titles up to 60 characters, and descriptions of 120 to 160 characters taken from page text.
- Crawler policy in `robots.txt`: training crawlers blocked, search and retrieval crawlers allowed, tokens checked against the operators' documentation. The sitemap lists the 21 canonical pages with `lastmod` where a reviewer date exists. Both files are no longer forced dynamic.
- Structured data: one `@graph` per species (Taxon without any parent taxon, and a breadcrumb), AboutPage on About, WebSite on the home page. `X-Robots-Tag: noindex` on `/admin` and `/api`.
- `/llms.txt`: a short index of the key pages, built from the catalog, with an ETag. It follows a proposed convention and makes no promise about search or answer engines.
- Not yet met: the mobile TBT budget (under 200 ms) and the payload budgets. Measured mobile TBT is between about 0.2 s and 1.5 s, and the run-to-run spread is larger than the changes so far.

### Explorer UX
- Compare shows the same Tree / Timeline / Migration / Compare tab bar as the explorer, so it is no longer a dead end; focus returns to the selected tab after a switch.
- On phones the four view tabs share one row (icon above label) instead of wrapping Compare to a second line.
- Compare portraits: the avatar image is contained in its 68 px circle (`position: relative`); before, it filled the whole header cell, appeared enlarged and blurred, and hid the taxon name.
- Touch targets reach 44 px on touch widths for the Compare chips, the profile secondary actions, the bookmark button and the family-view and time-scale disclosures. `tests/e2e/compare.spec.ts` guards the tab bar, the avatar size and the chip height.

### Species pages
- Authored species pages now cover the whole main path: 11 of the 18 taxa, including *Ardipithecus ramidus* and *Orrorin tugenensis*, with 16 newly verified publications (each record states how it was checked). `npm run audit:species-pages` passes for all eleven. The catalog runtime fingerprint was regenerated for the new content; the release number is unchanged.

### Fixes
- Migration globe: the Greenland ring was wound counter-clockwise, so d3-geo read it as "the whole sphere except Greenland" and flooded every continent and the ocean with land colour. The ring is reversed, the base colours live in `globePalette` and are tested for WCAG 1.4.11 contrast (>= 3:1), and routes get a dark casing so they stay readable over land and sea. `tests/migration-scene-geometry.test.ts` fails if any ring is inverted again.
- In-app navigation: the Journey "Back to atlas context" link and the search "See all results" link are `next/link` again (no full page reload). `tests/no-internal-anchors.test.ts` guards public UI.
- Sitemap: `lastmod` comes from each species page's `reviewedOn` date instead of "now", and `/about` is listed.
- Admin login: a process-wide tarpit slows every attempt after 10 recent failures (250 ms doubling to 5 s, at most 8 delayed attempts in flight, never a lock-out). Before, `adminLoginGlobalLimiter` was exported but unused, so with the default `TRUST_PROXY=0` failed logins were unlimited. `docs/ARCHITECTURE.md` now says what is enforced where.

### Species images (in progress)
- Fixed: the species header could show a specimen reconstruction (sapiens showed the Jebel Irhoud 1 face). The designated default portrait now wins, and specimen slots never stand in for a species.
- Fixed: visitor-facing labels no longer use data-model or QA wording ("dossier hero", "Record signal", "Source Intelligence", "CLAIM LEDGER", "Evidence rule", "Tree avatar distinct from the portrait").
- Fixed: on phones and tablets the species portrait used a 16:9 or 3:2 frame and cut the face off; it keeps the 4:5 frame now.
- Hand-off importer for the image package: creates CMS drafts only, with checksum verification, status-aware filtering, catalogued source URLs and an explicit generator record. Nothing is approved or published by the tool.
- Scene images sit beside their section; a live wide image becomes the species header banner (responsive, caption with class, credit and assumptions).
- Real reconstructions appear in the profile preview at full frame.
- Nothing is public yet: every reconstruction waits for a named human review. Visitors see only one neutral "Image in preparation" frame, in the header position, where a species has no approved picture yet.

### Migration atlas (map-first rebuild)
- Migration is now a full-width map stage. The 9-polygon sketch is replaced by real present-day Natural Earth coastlines drawn on a canvas (110m, with 50m when zoomed in), so islands, seas and all 27 registered sites sit where they belong. Corridors are generalized bands with a dark casing; evidence kinds differ by shape and colour; nearby sites cluster.
- The story has its own timeline: 6 scenes with equal width and a 7 s dwell, Play/Pause, speed, scene dots and camera that follows the scene (until you move it). The global slider gave the whole 60-5 ka dispersal under 4% of the track and Play crossed it in about half a second.
- Zoom reaches region level (up to 12x), with two-finger pinch, Ctrl/⌘+scroll, keyboard and a flat-map projection. Layers, a sites list and an "About this map" panel hold what used to be nine stacked blocks of text and controls. On phones the stage and the story dock fit in the first screen.
- The `time` URL parameter keeps two decimals in Migration (0.1 slider units is about 1.5 ka near the present); other modes are unchanged.
- The previous Migration view logged a React hydration mismatch (#418) on load in a real browser; the new one loads without console errors (checked in Chromium). The cause in the old view was not isolated.
- Accessibility: axe-core reports no violations in eight atlas states (WCAG 2.0 to 2.2 A/AA); the page keeps an `h1` while the hero is hidden; the brand link's accessible name contains its visible text.
- Continental shelf layer (on by default, switchable): Natural Earth bathymetry (public domain) shows the seabed shallower than 200 m today, which makes the Sunda and Sahul shelves, Beringia and the North Sea visible. Labelled everywhere as today's seabed, not a past shoreline; no sea-level reconstruction is drawn. The simplified files agree with the source on about 98.7% (coarse) and 99.5% (detailed) of 3,878 sea sample points on a 3 degree grid (`tools/geo/build-shelf.mjs`).
- Added dependencies `topojson-client` (runtime) and `topojson-server`, `topojson-simplify` (build tool only), plus types.
- Known follow-ups: past shorelines at a given moment, sea-level curve and climate layers (they need a global elevation grid and a curve that this environment could not download; ETOPO 2022 is CC0 and Spratt & Lisiecki 2016 is CC BY 3.0); more scenes and sites (editorial work); the old `.globe-*` rules in `globals.css` are now unused.

### Assets and metadata
- Cormorant Garamond and Inter are self-hosted through `next/font/local` (SIL OFL, licences in `app/fonts`). The tokens named them before, but nothing loaded them, so visitors saw system fallbacks.
- Added favicon, Apple touch icon, web manifest and Open Graph / Twitter cards. They are generated by `tools/brand/build.mjs` and contain no scientific claims.

### Repository
- Added `package-lock.json` (CI runs `npm ci`, which failed without it).
- Stopped tracking `.aistudio/` (Google AI Studio scratch media) and added it to `.gitignore`.

## 0.33.0

### Navigation and state
- The URL is the single source of explorer state (species, mode, time, site, comparison). Hash fragments survive, the header uses client-side links, and Back and Forward work.
- Header: Species, Journey, Evidence, About. Mode tabs: Tree, Timeline, Migration, Compare, as a keyboard-operable tablist. About is a real page.
- A header link pressed right after a tab change is no longer undone by a pending URL write.

### Species profile and pages
- The profile is always open on wide screens and a bottom sheet below 1024px. It has three tabs (Overview, Evidence, Lifestyle) and one primary action.
- On phones, the evidence, specimens, sources and sites panels of a species page and each debate fold into accordions. The source list shows four entries first.
- The scientific name is no longer repeated under the title, and the Compare action opens the comparison for that species.
- Heading levels on species pages are fixed (h2 above h3).

### Graph and lists
- All 18 species chips and 11 graph taxa select their own profile. Taxa outside the graph are labelled "Outside graph". Migration corridors are drawn for H. sapiens only.
- On phones the lineage is one flat list instead of the map, and the relation caption folds under "Why this line?".
- Graph avatars share one clip path.
- "Map range" is offered only for H. sapiens and for taxa that a registered site names.

### Comparison
- The comparison is an explorer mode (`mode=compare&cmp=…`), shareable by link. `/compare` redirects to it.
- The cranial scale runs from 300 to 1,800 cm³ and keeps every bar on its track. Genetics come only from sourced records. Date-range overlap is reported for every pair and is stated as dating only. At most three taxa can be compared, and nothing is removed silently.
- On phones the label column is narrow and sticks while the taxa scroll.

### Accessibility and responsiveness
- Text is at least 11px in every stylesheet. Standalone touch targets are 44px on touch widths (citation numbers inside sentences are exempt).
- The live announcement no longer repeats on every time tick.
- The phone hero is 160px tall.

### Content
- Journey chapters are built from each taxon's own data.
- The unsourced hero quote is removed, and the hero eyebrow and title live in the copy registry.
- Public media notes no longer carry administrator instructions.

### Maintenance
- About 180 CSS rules (80 unused class names) are removed, and `.hero` has one base definition.
- Error boundary around the explorer, a lockfile, `ALLOWED_DEV_ORIGINS`, and the fix plan pinned by SHA-256.

### Known gaps
- Authored species pages exist for two species only.
- The explorer payload is 290 KB before compression (45 KB gzip). Lazy-loading evidence data is not done.
- Safari and Firefox were not tested.
