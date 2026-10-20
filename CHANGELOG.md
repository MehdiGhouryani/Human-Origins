# Changelog

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
