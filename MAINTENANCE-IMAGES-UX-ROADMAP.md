# Maintenance, media and UX roadmap

Updated: 2026-11-17  
Repository baseline: `main` at `b629798736d462ff355425c16ead04bebcc6e172`  
Working branch: `chore/cleanup-assets-ux-phase1`

This roadmap groups the owner's three priorities into auditable work. It supplements, rather than rewrites, the approved explorer fix plan.

## 1. Remove obsolete and unnecessary files

### Verified safe cleanup
- `scripts/validate-assets.py` is not referenced by the package scripts, CI, or the repository code search. The maintained asset gate is `npm run validate:assets`, which runs `scripts/validate-assets.mjs`. The unreferenced Python duplicate is removed in this phase.

### Do not delete without another verification pass
- The CSS audit reports 39 class names with no raw source/test reference and 126 repeated selector definitions. The audit itself says this is a candidate list, not proof: computed class names and visual/CSS cascade effects can be missed. Re-run the 50 page × viewport computed-style fingerprint before deleting CSS.
- The graph/lineage CSS is explicitly frozen by the approved plan and must not be removed as cleanup.
- `public/assets/hero-evolution.webp` was confirmed unreferenced and removed in this branch (68,230 bytes). The active `hero-mobile.webp`, `hero-tablet.webp` and `hero-desktop.webp` variants remain. Its SHA-256 and retirement reason are preserved in `migrations/v32-to-v33.ts`; the manifest and validator now describe the active responsive assets.
- `docs/reference-ui.png`, mobile QA captures, migration records, sample species plates, and lockfiles are not deletion candidates merely because they are not imported by runtime components.

## 2. Complete, create and synchronize images

### Current inventory
- Image-slot catalog: 237 rows.
- Statuses: 180 TODO, 34 BLOCKED-NO-SPECIMEN, 23 NOT-APPLICABLE.
- The repository contains 31 `.cms-data/media/<media-id>/` directories with 114 processed WebP variants.
- The image directories are tracked, but `.cms-data/cms.sqlite` is intentionally excluded from Git. The SQLite records that map each media ID to a taxon, slot, status, licence, source, and review are therefore not available in this checkout.

### TODO backlog breakdown
The 180 TODO rows are not interchangeable production tasks:

| Evidence class | Rows | Production rule |
|---|---:|---|
| A — data-derived | 26 | Generate reproducibly from cited catalog data; carry units, uncertainty and method notes |
| B — scan-based diagram | 46 | Requires a licensed scan/reference image and attribution; never use an unlicensed scan |
| C — real specimen/site photo | 75 | Find an institution/museum/open-licence photograph; never generate a fake fossil photograph |
| D — reconstruction | 33 | Follow the per-taxon brief; preserve assumptions; require human review before publication |

The TODO rows also include 35 specimen-reference slots, 44 anatomy plates and 22 comparative-morphology slots. There are 33 TODO slots with a dedicated prompt file; the other slots have their own catalog brief. A slot marked BLOCKED-NO-SPECIMEN remains blocked regardless of how attractive a generated image might be.

### Safe synchronization procedure
1. On the server or deployment volume that owns the CMS, run `CMS_DB_PATH=.cms-data/cms.sqlite CMS_MEDIA_DIR=.cms-data/media npm run export:cms-media > cms-media-manifest.json`. The command opens SQLite read-only and emits a sanitized JSON inventory; it does not export admin sessions, passwords, review identities or generator account metadata.
2. The report includes each media ID, taxon, slot, role, provenance/rights fields, assumptions, variants, file sizes and SHA-256 values. It also reports untracked media directories, missing variant files, unreferenced files, invalid paths and duplicate published slot assignments.
3. Share the resulting manifest (not the database or a credentials-bearing backup) for reconciliation. Match every media ID and variant to its directory and to the canonical `taxonId` and `slotId` in `content/media-slots.generated.ts`.
4. Keep imported media in draft/review-required state until the source URL, licence/rights status, specimen reference (where relevant), alt text, and editorial review are complete.
5. Publish only through the existing CMS slot gate. Never infer that an image is publishable just because a file exists. The exporter is read-only and never deletes, moves or publishes files.

### Creation priorities and scientific constraints
- Prioritize the visible portrait, tree thumbnail, and dossier hero slots for the 11 main-path taxa, then fill evidence-led anatomy, site and comparison slots.
- Generate only reconstruction/schematic classes for which the slot brief supplies a defensible evidence basis and assumptions sheet.
- Do not generate synthetic specimen photographs or label generated reconstructions as fossil photographs.
- Keep all 34 BLOCKED-NO-SPECIMEN slots blocked until the corresponding specimen record and provenance exist. Keep 23 NOT-APPLICABLE rows out of production.

Use `npm run images:build`, the per-taxon briefs under `tools/images/prompts/`, and the existing hand-off importer. Do not bypass the slot validator.

### First source-backed image draft
- A reproducible class-A vector draft for `afarensis.S09` is available at `tools/images/drafts/afarensis-scale.svg`.
- Rebuild it with `npm run images:afarensis-scale`; the source is `tools/images/generate-afarensis-scale.mjs`.
- The draft separates McHenry's sex-specific stature and mass averages from the 95% prediction interval for Lucy reported by Brassey et al. (2018). These are not interchangeable estimates; the image and notes state the methods and limitations.
- The SVG has a source/caveat note and a reproducibility test. It is deliberately not in `public/assets` and is not linked to the live catalogue until CMS media metadata can attach it to `afarensis.S09`.


## 3. Improve UX and simplify journeys

### Phase 1 shipped in this branch
- On compact Migration views, the four map actions (zoom in/out, reset, projection switch) are moved into one native disclosure control.
- The desktop map control rail remains unchanged.
- Playwright coverage verifies the compact disclosure opens, exposes all actions and closes, and that desktop keeps its existing control rail.

### Next UX candidates
- Reduce the first-viewport control density on Home, Compare and Migration without hiding core tasks.
- Keep one primary action per surface and group secondary settings into disclosure panels.
- Improve mobile Evidence/Compare navigation and preserve clear current-selection feedback.
- Validate with the existing 320, 360, 390, 768, 1024 and desktop viewport matrix, plus keyboard and screen-reader checks.

## 4. Performance and acceptance gates

Latest committed five-run lab report (`tests/perf/after-mission.json`, 2026-11-13):
- Home mobile: LCP 2,180 ms; TBT 272 ms.
- Species mobile: LCP 2,292 ms; TBT 635 ms.
- Compare mobile: LCP 2,088 ms; TBT 417 ms.
- Migration mobile: LCP 2,184 ms; TBT 404 ms; CLS 0.0953.
- The target TBT is below 200 ms; the mobile budget is not yet met.

For each future phase:
- Record the baseline and after-change measurement with the same five-run protocol.
- Run the relevant unit and Playwright tests.
- Run `npm run qa:release`.
- Keep image, CSS and content changes reversible and traceable.
- Do not merge a performance change that worsens the agreed budgets without an explicit owner decision.
