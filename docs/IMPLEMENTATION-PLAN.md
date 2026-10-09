# Human Origins — Implementation Plan

**Snapshot version:** 0.32.5
**Last updated:** 2026-10-04
**Audience:** AI coding agents first, the project owner second. This is the *only* plan file. Setup is in `README.md`, architecture rules in `docs/ARCHITECTURE.md`.

> **خلاصه برای مالک پروژه (فارسی)**
> این فایل تنها برنامهٔ اجرایی پروژه است و برای مدل‌های هوش مصنوعی نوشته شده. برای شروع هر کار به AI بگو:
> «`docs/IMPLEMENTATION-PLAN.md` را کامل بخوان و تسکِ بعدیِ جدول وضعیت را انجام بده.»
> AI موظف است بعد از هر تسک همین فایل را به‌روز کند (جدول وضعیت، وضعیت تسک، اعداد snapshot و changelog). یک تست (`tests/plan-integrity.test.ts`) مانع می‌شود فایل از ساختار صحیح یا از نسخهٔ پروژه عقب بماند.
> تصمیم‌های شما در بخش ۳ ثبت شده‌اند: گراف ۱۱ گونه، جغرافیای واقعیِ هر دوره، عدم قطعیت به‌صورت کریدور، شروع با *H. sapiens*، لایهٔ سطح دریا/یخ با دقت علمی، ریسپانسیو اجباری.
> صفحات گونه (فازهای P14 تا P16): متن علمی در کد و با منبع نگهداری می‌شود، تصاویر فقط از پنل ادمین و از طریق اسلات‌های نام‌دار اضافه می‌شوند، و منابع در پایان هر صفحه به‌صورت فهرست کوچک و لینک‌دار می‌آیند. این فایل **تنها فایل راهبردی و فازبندی** پروژه است.
> کارهایی که فقط از شما برمی‌آید (علامت `BLOCKED-OWNER`): ثبت baseline تصاویر visual، تست روی دستگاه واقعی، بازبین علمی، انتخاب هاست.

---

## 1. Update protocol (mandatory for every agent)

1. **Read** sections 1–4 and the phase you will work on. Do not read the whole repo first.
2. **Pick** the first task in the status board (section 4) whose status is `TODO` or `IN-PROGRESS` and whose `Depends` are all `DONE`. Tasks marked `BLOCKED-OWNER` are skipped; tell the owner what is needed.
3. **Set** the task to `IN-PROGRESS` before starting. Work on one task at a time. Do not widen scope; new ideas go to section 12 (Backlog), not into code.
4. **Implement** with tests. Every task lists *Acceptance* checks; all must hold.
5. **Gate:** `npm run qa:release` must exit 0 (`SITE_URL=https://example.com` is required for the build). Failing gates are fixed, never skipped, weakened or deleted.
6. **Update this file in the same change:** task `Status`, the status board row, the snapshot numbers in section 2 if they changed, and one line in the Changelog (section 14). If the package version changes, run `npm run bump -- X.Y.Z` and update **Snapshot version** above.
7. **Never** invent scientific facts, dates, coordinates, DOIs or licences. Anything unverified stays `NEEDS-REVIEW` and is shown as such. Verify against primary sources (publisher, PubMed, dataset repository) and record the DOI.
8. If a task cannot be completed as written, set it to `BLOCKED-OWNER` or `NEEDS-REVIEW` with a one-line reason; do not silently change the design.

9. **One strategy file only.** This is the only file that may hold phases, statuses, TODO lists or decisions. `README.md`, `AGENTS.md`, `docs/ARCHITECTURE.md` and the image-prompt files are references; a test fails if they gain plan-like headings. Handoff notes from other chats are folded into this file (see T13.11) and then deleted.

**Status values:** `TODO`, `IN-PROGRESS`, `DONE`, `BLOCKED-OWNER`, `NEEDS-REVIEW`, `OPTIONAL`, `DROPPED`.
**Task format:** `#### T<phase>.<n> — title`, then `Status`, `Size` (S ≤ half day, M ≤ 2 days, L > 2 days), `Depends`, `Steps`, `Acceptance`.

---

## 2. Snapshot (verified 2026-10-04)

| Item | Value |
|---|---|
| Stack | Next.js 16.3.x (Turbopack), React 19.2, TypeScript strict, Vitest 5, Playwright, sharp, d3-geo/zoom/selection, `node:sqlite` (Node ≥ 22.5, `.nvmrc` = 22) |
| Release gate | `SITE_URL=https://example.com npm run qa:release` → **exit 0**: 18 audits, ESLint, `tsc`, **289 unit tests**, production build |
| Content | 18 taxa, 20 relationships, 55 sources, 22 specimens, 27 sites, 16 claims, 21 publications, 0 collections |
| Home graph | **11-taxon main path** (`content/featured.ts` → `mainPathTaxonIds`): sahelanthropus, orrin, ardipithecus, anamensis, afarensis, africanus, habilis, erectus, heidelbergensis, neanderthal, sapiens |
| Completeness (computed) | Tier 2: **0** · Tier 1: 11 · Tier 0: 7 (sahelanthropus, orrin, habilis, heidelbergensis, common, boisei, robustus) |
| Migration view | Legacy: `components/MigrationGlobe.tsx` (d3-geo orthographic SVG, 840×540), `presentation/migrationScene.ts`; 9 hand-drawn continent polygons, 4 straight-line routes, *H. sapiens* only, one source for all routes, no gene flow, no paleogeography |
| Species pages | `app/species/[id]/page.tsx`: hero with portrait, one-sentence description (avg 197 characters), about 7 fact rows, relationship/site cards, generic gallery, evidence graph, a large `SourceIntelligence` panel mid-page; 16 claims in total; no named image slots (admin upload is a generic form with only “tree avatar” and “portrait” slots); no in-text citations; scientific text lives in `content/taxa.ts` |
| Media | Self-hosted; schematic sample images (not fossil photographs); 1 image per taxon; no gallery. Image production plan: `tools/images/` (237-row catalog, 40 class-D prompts; `npm run images:build`) |
| CSS | `app/globals.css` 93 KB + `app/atlas.css` 29 KB; 605 hard-coded hex colours; `font-size:10px` ×117, `9px` ×3, `11px` ×13 |
| CSP | `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, `img-src 'self' data: blob:`, `connect-src 'self'`, `frame-ancestors *` |
| `npm audit` | Production deps: 0. Dev-only: 5 high in the `eslint-config-next` chain (`braces ≤ 3.0.3`; no patched release exists; accepted, see T0.10) |
| Not verified | Playwright e2e and visual baselines (browser download blocked in the build sandbox) |

---

## 3. Decisions

| ID | Decision | Status |
|---|---|---|
| D-01 | The home graph is the **11-taxon main path**. The other 7 taxa keep species pages and are **not** required to reach a higher tier. | DECIDED (owner) |
| D-02 | Migration must use the **paleogeography of the displayed time**, not the modern map. | DECIDED (owner) |
| D-03 | No scroll-driven cinematic storytelling (too costly). The existing journey/cinematic toggle is left as is. | DECIDED (owner) |
| D-04 | Uncertainty is drawn as **corridors** (width and softness encode qualitative uncertainty), not as precise lines. | DECIDED (owner) |
| D-05 | Rollout order: ***H. sapiens* first**, then Neanderthal/Denisovan/*H. heidelbergensis*, then *H. erectus* and deep time. | DECIDED (owner) |
| D-06 | Sea-level and ice-sheet layers are built **rigorously and with cited datasets**. | DECIDED (owner) |
| D-07 | A switch between competing dispersal hypotheses is **optional**: build it only if it is cheap (T10.1); otherwise drop it. | DECIDED (owner: skip if hard) |
| D-08 | Site cards: owner undecided. Default: reuse the existing Inspector site view; no new card component (T10.2, optional). | DEFAULT |
| D-09 | **Responsive is mandatory** everywhere (360, 390, 768, 1024, 1440 px). Touch targets ≥ 44 px; no horizontal page scroll. | DECIDED (owner) |
| D-10 | Renderer: **three.js** (WebGPURenderer with automatic WebGL 2 fallback) with a custom elevation/sea-level shader. Runner-up: MapLibre GL JS 6 globe. Must be confirmed by the spike (T2.4). | PROPOSED |
| D-11 | Languages: **TypeScript (strict)** for app and shader host code; **TSL** (three's TS-embedded shading language) if WebGPURenderer is chosen, otherwise **GLSL ES 3.00**; **Python 3.12** only for the offline data pipeline (outputs are committed; Python is never needed at runtime or in CI). No Rust/WASM. | PROPOSED |
| D-12 | UI honesty label for the paleo layer: “Approximate paleo-geography: reconstructed sea level and ice; uncertainty grows with age.” Confidence is shown as qualitative tiers, never as a number. | PROPOSED |
| D-13 | UI language stays English (`lang="en"`); Persian/RTL is out of scope until the owner decides. | OPEN |
| D-14 | Hosting: VPS/container with a **persistent disk** assumed (CMS needs SQLite + media). | OPEN |
| D-15 | Scientific-first image policy: class C (real specimens, sites, artefacts), A and B are never AI-generated. Class D reconstructions are produced from the self-contained briefs in `tools/images/prompts/` by an artist/3D modeller **or** an image generator (e.g. ChatGPT); every output is a draft until a reviewer approves it, and ships labelled “reconstruction” with an assumptions sheet. | DECIDED (owner) |
| D-16 | Taxonomy of *H. ergaster* / *H. erectus* and where Turkana Boy (KNM-WT 15000) is filed. The catalog files it under *ergaster* today. | OPEN |
| D-18 | Stone-tool images are real, licensed photographs (class C) or diagrams (class B) and the industry timeline is generated (class A). No stone-tool prompts exist: an AI-made artefact photograph would be fabricated evidence, and its flake scars would look right without being right. Toolkits are shown in use only through the existing behaviour scenes (`S11`), whose object lists are fixed. | PROPOSED |
| D-19 | Empty image slots on the public site: *portrait* and *hero* always render a neutral frame (“Image in preparation”); every other slot is hidden until filled. A logged-in admin sees all slots as dashed frames with an Upload link. | DECIDED (owner) |
| D-20 | Species-page text is English first (Persian later, D-13). Scientific text is versioned in code and audited; admins add **images only** from the panel. | DECIDED (owner) |
| D-21 | Rollout of species pages: one pilot page (*A. afarensis*), owner approval of layout and text, then the other 10 core taxa. | DECIDED (owner) |
| D-22 | Source policy for species pages: peer-reviewed primary papers and major reviews, verified by DOI; institutional pages only for context; news never as the only source. Authors are chosen by relevance, recency and peer review, not nationality; work by H. Vahdati Nasab and colleagues is used where it bears on the taxon (Iranian Plateau: Neanderthals, Acheulean, *H. sapiens* dispersal), together with US and international researchers. | DECIDED (owner) |
| D-17 | Image conventions are fixed in `tools/images/prompts/_global.md` (soft-tissue method, eye/skin/hair conventions stated as conventions, no text, non-sexualised, no racial caricature). S01 is a class-B render, *Orrorin* gets a bone-inventory silhouette instead of a face, *H. sapiens* S02 is based on Qafzeh 6, Orrorin and *H. heidelbergensis* are blocked until specimen records exist. | PROPOSED |

---

## 4. Status board

| Phase | Title | Depends | Status |
|---|---|---|---|
| P0 | Technical zero-debt | — | IN-PROGRESS |
| P1 | Migration: spec freeze and contracts | — | TODO |
| P2 | Migration: renderer spike and decision | P1 | TODO |
| P3 | Migration: paleo data pipeline (offline) | P1 | TODO |
| P4 | Migration: paleo runtime MVP (*H. sapiens* window) | P2, P3 | TODO |
| P5 | Migration: corridors, uncertainty, sites | P4 | TODO |
| P6 | Migration: *H. sapiens* content and gene flow | P5 | TODO |
| P7 | Migration: responsive, accessibility, performance | P5 | TODO |
| P8 | Migration: other taxa up to 800 ka | P6 | TODO |
| P9 | Migration: deep time and environment overlays | P8 | TODO |
| P10 | Optional features | P7 | OPTIONAL |
| P11 | Core-taxa content and media | P0 | TODO |
| P12 | Release | P0, P7, P11, P13, P14, P15, P16 | TODO |
| P13 | Scientific image production | P0 (T13.3 also needs T15.1) | TODO |
| P14 | Species pages: platform (slots, admin, references, UI) | — | TODO |
| P15 | Species pages: scientific content (11 core taxa) | P14 | TODO |
| P16 | Species pages: acceptance | P14, P15 | TODO |

Next task for an agent that has no other instruction: **T14.1**, then **T13.1**, then **T14.4** (these three unblock the species pages and all image work), then **T14.5**, then **T15.1**. In parallel and independent of them: **T0.3**, **T0.4** and **T1.1**.

---

## 5. Non-negotiable invariants

From `docs/ARCHITECTURE.md` (read §1–§3 there). In short: canonical data never carries screen coordinates · no source → no factual claim · uncertainty is qualitative, never a score · every release passes the same audit the CMS uses · stable ids are append-only · never fabricate ids, dates, provenance · never treat a reconstruction as an observation · server-only code stays server-only.

Additional rules for the Migration work:

* **Temporal overlap never implies ancestry or contact.** A route or range is shown only where a registered source supports it.
* **No false precision.** A corridor never shows a speed, a year or a boundary finer than its sources; width and edge softness encode uncertainty.
* **Every paleo asset traces to a registered dataset** (licence + attribution rendered in the UI).
* **Approximate by construction.** The UI states what the paleo layer is (D-12). Contested sites/dates are shown as contested.
* **Zero external requests.** All data and code are self-hosted (CSP `connect-src 'self'`, `img-src 'self'`).
* **The Migration chunk is lazy.** The atlas home page bundle must not grow because of it.

---

## 6. Migration analysis (basis for P1–P9)

### 6.1 What is wrong today

| Area | Finding | Consequence |
|---|---|---|
| Geography | 9 coarse hand-drawn polygons; modern shape only | Contradicts D-02; wrong for every time except ≈0 ka |
| Routes | 4 routes as straight interpolations between a few points; they cross sea and land indiscriminately | Not credible; cannot show real corridors, shelf or ice |
| Taxa | *H. sapiens* only | Earlier dispersals (*H. erectus*, Neanderthal/Denisovan ranges) absent |
| Sources | All routes cite one summary source | Violates the project's own evidence standard |
| Science | Single “out of Africa ≈ 60 ka” narrative | Current literature has earlier/failed dispersals and contested dates (see 6.3) |
| Gene flow | Present in the graph, absent on the map | Missed explanatory power |
| UX | Markers are letters; keyboard cannot reach markers behind the globe; label “TIME-LAPSE EARTH” although the Earth does not change | Not engaging; accessibility gap; misleading label |
| Code | One 122-line file with very long lines and many states; no unit tests | Hard to extend |

### 6.2 What actually differed in the past (scientific constraints)

* **Plate motion is secondary** inside the atlas time domain: for the *H. sapiens* window (≤ ~0.3 Ma) continents are effectively at their modern positions. Over ~7 Ma the motion is on the order of tens to a few hundred km depending on the plate (Australia fastest) — **to be quantified in T9.2**, not assumed. The 1-Ga plate model (Müller et al. 2022) states it is not intended for < 5 Ma analyses, so it is not used for rotation.
* **What dominates is sea level and ice:** the Last Glacial Maximum (≈ 26–19 ka) lowstand is on the order of −120 m (far-field records), exposing the Sunda and Sahul shelves, Beringia, the Persian Gulf floor, the North Sea (Doggerland) and Bass Strait. Ice sheets covered large parts of North America and Eurasia.
* **Data coverage differs by age** (this drives the confidence tiers below):

| Age | Best available input | Qualitative tier shown in UI |
|---|---|---|
| 0 – ~26 ka | Ice-sheet + paleotopography reconstructions (ICE-6G_C, GLAC-1D; PMIP protocol ≈ 21–0 ka — confirm extent of the downloaded version) | **Reconstructed** |
| ~26 – 80 ka | PaleoMIST 1.0 (ice margin, paleotopography, thickness; 2.5 ka steps) | **Modelled** |
| 80 – 800 ka | Sea-level stack only (Spratt & Lisiecki); **no global ice-sheet reconstruction** | **Sea level only** |
| > 800 ka | Sea-level reconstructions (Science 2025 GMSL 4.5 Ma; Miller et al. 2020 Cenozoic); coarse | **Coarse** |

* **Method (“anomaly/delta”)**: add a coarse paleotopography *anomaly* (paleotopography(t) − paleotopography(0)) to the high-resolution modern GEBCO grid, as PMIP does with ETOPO1 anomalies; where only sea level exists, threshold the modern grid at the sea level for time *t* (eustatic, no isostatic adjustment). Every limitation is stated in the UI (D-12).

### 6.3 Dispersal knowledge the data model must allow (seed list — **secondary sources; verify primaries before use**)

* Earliest *H. sapiens* in Africa ≈ 300 ka (Jebel Irhoud); early Eurasian specimens: Misliya (Israel) ≈ 177–194 ka, Apidima (Greece) ≈ 210 ka (attribution contested); Levant ≈ 120–90 ka; these are generally read as early/failed dispersals.
* Main dispersal ≈ 60–50 ka with Indian-Ocean-rim and northern routes both debated; Arabia and India evidence > 75–85 ka is debated.
* Sahul: Madjedbebe ≈ 65 ka (**contested**); Lake Mungo ≈ 42 ka widely cited.
* Americas: White Sands footprints ≈ 23–21 ka (dating debated, later reanalysis supportive); coastal vs ice-free-corridor routes debated.
* Earlier dispersals: *H. erectus*/*ergaster* ≈ 1.8 Ma (Dmanisi) and later Asia (e.g., Java, China) → needs deep-time tier (P9).

### 6.4 Datasets (registry seed; verify licence on the download page and record in `content/datasets.ts`, T1.3)

| Dataset | Use | Coverage | Licence / terms (as found) | Reference |
|---|---|---|---|---|
| GEBCO (latest grid at build time; 2025 verified, newer release exists) | Base elevation/bathymetry | Modern, 15″ | Public domain; attribution required; not for navigation; do not imply endorsement | DOI 10.5285/37c52e96-24ea-67ce-e063-7086abc05f29 (GEBCO_2025) |
| Natural Earth | Vector fallback/labels | Modern | Public domain | naturalearthdata.com (**NEEDS-REVIEW** at download) |
| Spratt & Lisiecki 2016 (v2 2025) | Sea level | 0–800 ka | Cite as NOAA/PANGAEA terms | 10.5194/cp-12-1079-2016 · NOAA 10.25921/rd66-5820 · PANGAEA 10.1594/PANGAEA.979830 |
| Science 2025, GMSL past 4.5 Myr | Sea level | 0.8–4.5 Ma | **NEEDS-REVIEW** | 10.1126/science.adv8389 (confirm from publisher page) |
| Miller et al. 2020 | Sea level | Cenozoic | **NEEDS-REVIEW** | 10.1126/sciadv.aaz1346 |
| PaleoMIST 1.0 (Gowan et al. 2021) | Ice + paleotopography | 80–0 ka | **NEEDS-REVIEW** (PANGAEA terms) | 10.1038/s41467-021-21469-w · data 10.1594/PANGAEA.905800 |
| ICE-6G_C / GLAC-1D | Ice + paleotopography | ≈ 21–0 ka | **NEEDS-REVIEW** | PMIP deglaciation protocol |
| Müller et al. 2022 plate model | Sanity bound only (T9.2) | 1 Ga | CC-BY 4.0 | 10.5194/se-13-1127-2022 · Zenodo 13382093 |
| GPlates / pyGPlates | Offline tool for T9.2 | — | GPL-2: never bundled; outputs only | gplates.org |

---

## 7. Technology analysis and recommendation (basis for P2)

### 7.1 Options

| Option | Strengths | Weaknesses | Verdict |
|---|---|---|---|
| **A. d3-geo (SVG/Canvas)** — current | Tiny; already a dependency; easy accessibility | Vector only: a time-varying coast needs pre-computed contours per level; no hillshade/atmosphere; SVG slow with many paths | **Keep only as the no-WebGL fallback** |
| **B. three.js** (WebGPURenderer → WebGL 2 fallback) | One elevation texture + a sea-level uniform lets the GPU recompute land/sea for *any* time while scrubbing; custom shading (hillshade, exposed-shelf highlight, ice, atmosphere); self-hosted; flat map is a second projection; WebGPU is Baseline in all major engines (2026) with automatic fallback | Raw 3D library: camera, gestures, labels, picking are ours to write; WebGPURenderer uses node materials (TSL), not raw GLSL `ShaderMaterial` | **Primary candidate (D-10)** |
| **C. MapLibre GL JS 6.x** (globe projection + custom layer) | Mature gestures, globe↔flat for free, markers/labels; ESM-only, WebGL 2 required; WebGPU in progress | Style/tile model is oversized for one global raster + vectors; sea-level thresholding still needs a custom WebGL layer; workers need `worker-src blob:` (CSP change) | **Runner-up** |
| D. CesiumJS | Real-Earth terrain streaming | Large runtime; paleo needs custom imagery; over-scoped | Not benchmarked; reopen only if B and C fail |
| E. deck.gl GlobeView | Data-viz layers | Globe layer support narrower than flat views (verify) | Not evaluated; reopen only if B and C fail |
| F. Raw WebGL2/WebGPU | Maximum control | Re-implements B | Rejected |

### 7.2 Recommended architecture

```
tools/paleo/ (Python, offline)  ──►  public/assets/paleo/*  (static, fingerprinted)
   GEBCO + sea-level + ice/paleotopo        elevation tiles (lossless WebP, 16-bit packed in RGB)
                                            anomaly/ice rasters per time slice, sea-level.json,
                                            paleo-manifest.json (sha256, dataset ids, licence)
content/datasets.ts, content/corridors.ts ─► audits (licence, land-check)  ─► bootstrap (server)
components/migration/ (client, lazy `next/dynamic`, ssr:false)
   MigrationScene  ─►  GlobeEngine (renderer-agnostic interface)  ─►  three engine | canvas-flat fallback
```

* **Shader logic per fragment:** `h(t) = elevation + anomaly(t)`; land if `h(t) > seaLevel(t)`; *exposed shelf* = currently sea but land at *t* (highlighted — the key “wow” and the scientifically meaningful layer); ice from the ice raster; hillshade from neighbouring samples; depth tint relative to `seaLevel(t)`.
* **Engine interface** (so the renderer can be swapped): `init(canvas, assets)`, `setTime(ka)`, `setLayers(flags)`, `setCamera(view)`, `resize()`, `snapshot()`, `dispose()`.
* **Textures:** desktop 4096×2048 (~10 km/px at the equator); mobile tier 2048×1024; optional lossless regional crops (Sunda–Sahul, Beringia, Arabia–Red Sea, Levant–Mediterranean, North Sea). Ice/anomaly slices load lazily and interpolate.
* **Render on demand** (no continuous loop while static), DPR cap, pause when hidden/off-screen, WebGL context-loss recovery.
* **Fallback** (no WebGL 2/WebGPU, or `?renderer=flat`): Canvas 2D equirectangular map that samples the same data (re-rendered on slider change).
* **Corridors** are great-circle (slerp) paths over waypoints; an **audit proves** every path segment is land at the corridor’s time (except declared, sourced water crossings).

### 7.3 Spike acceptance thresholds (T2.4 decides with measurements)

| Criterion | Threshold |
|---|---|
| Frame rate while dragging + scrubbing | ≥ 50 fps at 390×844 on a 4× CPU-throttled Chromium **and** on a real mid-range Android and an iPhone (owner check, T7.6) |
| Migration chunk | ≤ 300 KB gzip JS (engine + app); home page JS unchanged (±2 %) |
| First meaningful frame | ≤ 2.5 s on “Fast 4G”; first-paint data ≤ 1.5 MB |
| GPU memory (mobile tier) | ≤ 64 MB of textures |
| CSP | No loosening (no new `unsafe-*`, no external hosts) |
| Network | Zero external requests |
| Motion | Honors `prefers-reduced-motion` |
| SSR | Dynamic import only; no server crash; no hydration warnings |

---

## 8. Responsive specification (applies to every phase)

| Width | Layout |
|---|---|
| ≥ 1024 | Two panes: map + side panel (inspector/legend/sites) |
| 640–1023 | Map on top, bottom drawer (peek / half / full) |
| < 640 | Full-bleed map; **bottom sheet** with snap points; time scrubber thumb-reachable at the bottom; layers/legend in the sheet |

Rules: touch targets ≥ 44×44 px; safe-area insets respected; orientation change does not lose state; one-finger rotate, pinch zoom, double-tap zoom, reset button; text ≥ 12 px (no 9–10 px body text); no horizontal page scroll at 320 px; every interactive element reachable and operable by keyboard; Playwright projects for iPhone 13, Pixel 7, iPad and desktop.

---

## 9. Completeness contract (computed in `features/explorer/dossier.ts`, never hand-set)

* **Tier 0:** name + time range + taxonomy; ≥ 1 registered source.
* **Tier 1:** + tree avatar distinct from the portrait; ≥ 3 key facts; ≥ 1 claim linked to evidence.
* **Tier 2:** + ≥ 1 specimen; ≥ 1 site with a declared dating method; ≥ 3 source-backed claims; ≥ 1 gallery image beyond the portrait; a registered relationship placing it in the tree.
* Tier 3 (not computed): independent scientific review recorded in section 13.

---

## 9a. Species page specification (basis for P14–P16)

**Page order (top to bottom).**
1. **Header:** name, time range, “last reviewed” date, portrait slot, a lead of 60–90 words.
2. **At a glance:** fact table (time range, region, brain size, body size, locomotion, diet, key fossils, tools). Every row carries a certainty badge — `established`, `estimated`, `debated` or `unknown` — and citation markers. No numeric confidence scores.
3. **Narrative sections** (accordion on screens < 640 px, open on desktop): Discovery and key fossils · Anatomy · Locomotion and body · Brain and behaviour · Stone tools · Environment and diet · Where and when · Place in the tree. Each section is 80–200 words; the whole page 900–1,500 words.
4. **What is debated:** at least one item per taxon; each item states the question, two to four published positions with their sources, and the date of the latest update.
5. **Images:** named slots (below), then the existing evidence graph, specimens and relationship cards.
6. **Sources:** compact numbered list at the very end (see below). The mid-page `SourceIntelligence` panel moves under the list or is folded into it.

**Writing rules (enforced by `audit:species-pages`).** English; taxon names in italics; ages in Ma/ka. Every paragraph and every fact row has at least one citation; every cited id exists in the reference registry. Banned wording: “proves”, “proved”, “definitively”, “missing link”, “primitive”, “ape-man”, “caveman”; superlatives (“earliest”, “oldest”) only when the cited source says so and the date of the source is shown. Each page states what is unknown. A statement that depends on a single study is flagged as such in the text. Word budgets above are checked. `reviewedOn` is an ISO date; a page older than 12 months is reported by the audit.

**References.** Registry `content/publications.ts` (T14.4): authors, year, title, journal/book, volume and pages, DOI, URL, kind (`primary`, `review`, `dataset`, `institutional`), `verifiedOn` and how it was verified (`doi-resolved`, `publisher-page`, `pubmed`, `repository-record`). Per core taxon: at least 8 references, at least 3 published in the last 8 years where such literature exists, no news item as the only support of a claim. In the text, citations are superscript numbers ordered by first appearance; each is a keyboard-focusable link to its entry, which links back. The list is small (12.5 px, 1.45 line height), collapsed behind “Sources (N)” on mobile, lists the DOI as a link (`rel="noopener noreferrer"`, opens in a new tab), marks `primary`/`review`, and prints cleanly.

**Image slots.** One slot per row of `tools/images/catalog.json` that applies to the taxon (`<taxon>.S02` portrait, `S03` hero, `S10` habitat, `S11` behaviour, `S04`–`S07` specimen plates, `S08` diagram, `S09` scale, `S12` site, `S13` map, `S14` skeleton inventory, `X*` special, `L1`–`L3` stone tools). Each slot defines role, aspect ratio, size, evidence class and review requirement. Public behaviour: decision D-19. Not-applicable slots never render. A slot is filled only by a **published** CMS image carrying that `slotId`; the built-in schematic plates remain fallbacks for the tree avatar and portrait only.

**Admin.** `/admin/media` becomes a **slot matrix** per species: each slot shows empty / draft / live / needs-review, its ratio and size, and an Upload button opening a dialog that pre-fills role, class and ratio, crops server-side to the slot's ratio (with a preview), and requires the fields of the class (credit and licence for C; assumptions, generator, reviewer for D). A counter shows filled/total per species. Text is not edited here (D-20).

**Layout and UI.** One column below 640 px, two columns (content + sticky in-page navigation) from 1024 px; reading measure ≤ 68 characters; body text 16–17 px, never below 12 px; design tokens from `:root` in a dedicated `species-page.css` (no new hard-coded colours; see T0.6); no layout shift from images (reserved aspect-ratio boxes); light/dark; reduced-motion respected; contrast ≥ 4.5:1; every interactive element keyboard-reachable.

**Reference checklist (apply to every new reference before it is cited).** (1) It is a peer-reviewed article, a monograph chapter or a dataset; a press release or news item is never the only support. (2) The DOI exists and resolves; title, first author, year, journal, volume and pages match the publisher or an indexing record. (3) The year is the year of publication as the publisher states it; record the online year when the volume year differs and say so in `note`. (4) No retraction or correction is attached (check the publisher page). (5) It actually supports the sentence it is attached to (read the relevant passage, not only the abstract). (6) Set `kind`, `verifiedOn` (today) and `verification` (`doi-resolved` only if the DOI was resolved; otherwise the method really used). (7) Run `npm run check:references -- <id>` on a machine with network access and fix any difference.

**Debate entry template.** `question`: one neutral question ending in “?”. `positions`: two to four, each with a short label (“Mostly terrestrial”), a one-to-three-sentence summary in the authors' own terms, and the references that hold that position; order positions chronologically when they answer each other, and say so (“A 2024 reply argues…”). `updated`: the date a newer publication was last added. Never present the more recent position as the settled one unless the sources say the question was resolved.

**Research protocol (T15.1).** Sources in this order: peer-reviewed primary papers, major reviews and monograph chapters, institutional pages (context only). Each reference is verified (DOI resolves, metadata matches) before use and recorded with `verifiedOn`. Contested topics need at least two positions with sources. Recent items (for example the 2022–2026 exchange on bipedalism in *Sahelanthropus*) are dated in the text. Unverified items stay `NEEDS-REVIEW` and are not published. Iranian Plateau work (Shoaee, Vahdati Nasab & Petraglia 2021, *J. Anthropol. Archaeol.* 62:101292, doi:10.1016/j.jaa.2021.101292; Vahdati Nasab et al. 2019, *C. R. Palevol* 18(4):465–478, doi:10.1016/j.crpv.2019.02.005; Shoaee et al. 2023, *PLOS ONE*, doi:10.1371/journal.pone.0281872; Shoaee et al. 2024, *Front. Earth Sci.* 12:1352099, doi:10.3389/feart.2024.1352099) bears on *H. erectus* (Acheulean), Neanderthals and *H. sapiens* dispersal; it is not forced into the other taxa.

## 10. Phases and tasks

### P0 — Technical zero-debt

#### T0.1 — Commit visual baselines
- **Status:** BLOCKED-OWNER
- **Size:** S
- **Depends:** —
- **Steps:** On a machine with a browser: `npx playwright install chromium`, `npm run test:visual:update`, review every image, commit `tests/e2e/__screenshots__/`. Then remove `--grep-invert "visual:"` from `.github/workflows/ci.yml`.
- **Acceptance:** `npm run test:visual` passes locally and in CI.

#### T0.2 — Run the e2e suite in a real browser and fix failures
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** —
- **Steps:** `npm ci && npm run build && npm run test:e2e` (set `CMS_ADMIN_PASSWORD`). Fix failures at the root cause.
- **Acceptance:** all specs in `tests/e2e/` pass (11 tests today: smoke 2, species 4, responsive 4, visual 1).

#### T0.3 — CI: accessibility gate, CMS scenario, production audit
- **Status:** TODO
- **Size:** M
- **Depends:** —
- **Steps:** (1) Add `@axe-core/playwright`; test `/`, `/species`, `/species/sapiens`, `/compare`, `/admin/login` for WCAG A/AA violations. (2) Add a Playwright CMS scenario: login → upload an image as draft → publish → visible on its species page → unpublish → built-in image restored. (3) Add `npm audit --omit=dev --audit-level=high` to CI.
- **Acceptance:** the three checks run in CI and pass; axe has zero violations (document any justified exclusion in the test).

#### T0.4 — Slim the bootstrap payload and cache server reads
- **Status:** TODO
- **Size:** M
- **Depends:** —
- **Steps:** Measure the serialized `buildExplorerBootstrap` size. Remove fields no component uses (`taxonNames`, `materialEntities`, `occurrences` and their index maps — verify no selector uses them). Wrap `getLiveContent` and the dossier loader in `React.cache()` so `generateMetadata` and the page share one build. Add `tests/bootstrap-payload.test.ts` with a size budget (current size after removal + 10 %).
- **Acceptance:** payload smaller by the removed fields; budget test passes; no behaviour change (existing tests green).

#### T0.5 — URL as the source of state
- **Status:** TODO
- **Size:** M
- **Depends:** —
- **Steps:** Ensure the first server render already uses `species`, `mode`, `time` from `searchParams` (no flash of the default species). Use `pushState` for species changes so Back/Forward works; `replaceState` for continuous values (time). Derive the default species from the first available taxon, not a hard-coded id. Put the Inspector tab in the URL.
- **Acceptance:** a Playwright test opens `/?species=sapiens&mode=timeline&time=91.0`, sees *H. sapiens* on first paint, changes species twice, presses Back twice and returns to the original state.

#### T0.6 — CSS debt with a ratchet gate
- **Status:** TODO
- **Size:** L
- **Depends:** —
- **Steps:** (1) Create `scripts/audit-css.mjs` that counts hard-coded hex/rgb colours, `font-size` < 12px and duplicate selectors in `app/*.css`, compares with `scripts/css-budget.json` and **fails if any count increases**; wire into `qa:release`. (2) Move colours into `:root` custom properties (light/dark ready). (3) Raise body text to ≥ 12 px (10 px ×117, 9 px ×3, 11 px ×13 today); uppercase micro-labels may be 11 px only when decorative and `aria-hidden`. (4) Split `globals.css` by feature (tree, timeline, inspector, admin). Lower the budget after each step.
- **Acceptance:** budget file shows counts strictly lower than today's (605 hex, 117/3/13 small sizes); visual baselines reviewed; no horizontal overflow at 320 px.

#### T0.7 — Tighten CSP and framing
- **Status:** TODO
- **Size:** S
- **Depends:** —
- **Steps:** Ask the owner whether the app must be embeddable in another site. If not: `frame-ancestors 'self'` (and `X-Frame-Options: SAMEORIGIN`). Test whether production needs `'unsafe-eval'`; remove it if not (keep `'unsafe-inline'` only if Next inline bootstrap requires it, or switch to nonces). Do not add `worker-src blob:` unless D-10 chooses MapLibre.
- **Acceptance:** `curl -I` shows the new policy; app and admin work in production mode; a test asserts the header.

#### T0.8 — Docs hygiene and plan integrity gate
- **Status:** DONE
- **Size:** S
- **Depends:** —
- **Steps:** Removed obsolete docs; created this plan; added `AGENTS.md`; added `tests/plan-integrity.test.ts`; `tests/site-age-consistency.test.ts` guards site ages against taxon ranges.
- **Acceptance:** `docs/` contains only `ARCHITECTURE.md`, `IMPLEMENTATION-PLAN.md`, `reference-ui.png`, `mobile-qa/`; the plan-integrity test passes.

#### T0.9 — Repo hygiene and shared rate limiting
- **Status:** TODO
- **Size:** S
- **Depends:** —
- **Steps:** Remove or correct `metadata.json` (contains an unrelated AI-Studio capability entry). Document `TRUST_PROXY`/forwarded-header behaviour of the login rate limiter; if more than one process will run, store counters in SQLite instead of memory.
- **Acceptance:** no unrelated config remains; rate-limit behaviour is documented in `docs/ARCHITECTURE.md` §6 and covered by a test.

#### T0.10 — Record accepted dev-only audit findings
- **Status:** DONE
- **Size:** S
- **Depends:** —
- **Steps:** `npm audit` lists 5 high findings, all in `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces ≤ 3.0.3` (no patched `braces` release exists; npm's suggested fix is a downgrade to Next 14 tooling and is rejected). `npm audit --omit=dev` reports 0. Re-check on every dependency update.
- **Acceptance:** CI runs the production audit (T0.3).

### P1 — Migration: spec freeze and contracts

#### T1.1 — Confirm scope, tiers and wording
- **Status:** TODO
- **Size:** S
- **Depends:** —
- **Steps:** Confirm with the owner: D-10/D-11 as proposed, tier names and D-12 wording (sections 6.2, 7), and the *H. sapiens*-first scope. Update section 3 statuses.
- **Acceptance:** D-10…D-12 are `DECIDED` or amended; no open question blocks P2.

#### T1.2 — Domain contracts for paleo and dispersal
- **Status:** TODO
- **Size:** M
- **Depends:** T1.1
- **Steps:** Add `domain/paleo.ts` (`PaleoTier`, `SeaLevelSample`, `PaleoSlice`, `PaleoManifest`) and `domain/dispersal.ts` (`Corridor{id, taxonId, olderMa, youngerMa, waypoints[], widthKm, uncertainty (qualitative), hypothesisGroup?, sourceIds ≥ 1, waterCrossings[] (each with maxKm + sourceIds)}`, `GeneFlowPulse{relationshipId, interval, area?, placeBasisSourceId?}`). Branded ids, runtime validators, unit tests. Migration note in `migrations/` (new files only; no id reuse).
- **Acceptance:** `tsc` and unit tests pass; invalid examples are rejected with specific codes.

#### T1.3 — Dataset registry and licence ledger
- **Status:** TODO
- **Size:** M
- **Depends:** T1.2
- **Steps:** Create `content/datasets.ts` (`id, title, authors, year, doi, version, licence, attribution, url, retrievedOn`). Seed from section 6.4; each `NEEDS-REVIEW` entry must be verified against the repository page and the licence quoted. Add `audit:datasets` (licence in an allow-list; DOI present; attribution non-empty) and wire into `qa:phase3`. Add a Credits panel source (rendered in P4).
- **Acceptance:** audit passes; an entry with an unknown licence fails the audit.

#### T1.4 — Freeze the legacy migration view
- **Status:** TODO
- **Size:** S
- **Depends:** —
- **Steps:** Add a deprecation header to `components/MigrationGlobe.tsx` and `presentation/migrationScene.ts`; remove the “TIME-LAPSE EARTH” label; no new features there.
- **Acceptance:** label gone (done 2026-10-09: “TIME-LAPSE EARTH” replaced by “Time slice”, verified in the client bundle); the deprecation header and the no-new-features rule are still open. nothing else changed.

### P2 — Migration: renderer spike and decision

#### T2.1 — Spike harness and throwaway data
- **Status:** TODO
- **Size:** M
- **Depends:** T1.1
- **Steps:** Dev-only route (404 in production) `app/dev/globe-spike`; `scripts/measure-chunk.mjs` (gzip size of a route's chunks); fps/memory probe. Generate a throwaway 2048×1024 elevation texture from GEBCO (reuse T3.2 script when it exists).
- **Acceptance:** harness reports fps, JS size, texture memory; not shipped in production.

#### T2.2 — Prototype B (three.js)
- **Status:** TODO
- **Size:** M
- **Depends:** T2.1
- **Steps:** Sphere + elevation texture + sea-level uniform + drag/pinch/zoom + one great-circle route. Test WebGPURenderer and `forceWebGL`. Tree-shake imports.
- **Acceptance:** measurements recorded in T2.4.

#### T2.3 — Prototype C (MapLibre GL JS 6)
- **Status:** TODO
- **Size:** M
- **Depends:** T2.1
- **Steps:** Globe projection, custom layer drawing the same shading, same route as a line layer; self-hosted style (no tiles); note CSP changes needed.
- **Acceptance:** measurements recorded in T2.4.

#### T2.4 — Decision record
- **Status:** TODO
- **Size:** S
- **Depends:** T2.2, T2.3
- **Steps:** Fill the table below with measured numbers, apply the thresholds of section 7.3, set D-10/D-11, delete the losing prototype and the harness route.
- **Acceptance:** section 7.3 thresholds met by the winner; decision recorded here.

| Metric | three.js | MapLibre 6 |
|---|---|---|
| fps (throttled / real device) | *to measure* | *to measure* |
| JS gzip | *to measure* | *to measure* |
| First meaningful frame | *to measure* | *to measure* |
| GPU texture memory | *to measure* | *to measure* |
| CSP changes | none expected | `worker-src blob:` |

### P3 — Migration: paleo data pipeline (offline)

#### T3.1 — Pipeline skeleton
- **Status:** TODO
- **Size:** M
- **Depends:** T1.3
- **Steps:** `tools/paleo/` with `pyproject.toml` (pinned: numpy, xarray, netCDF4, rasterio, pyproj, shapely, pillow/imagecodecs), a single entry `python -m paleo build`, deterministic output, `npm run paleo:build` wrapper. Raw downloads go to a git-ignored `tools/paleo/raw/`. CI never runs Python.
- **Acceptance:** a clean checkout builds identical outputs (same sha256) twice.

#### T3.2 — Elevation textures
- **Status:** TODO
- **Size:** M
- **Depends:** T3.1
- **Steps:** From the latest GEBCO grid produce 4096×2048 and 2048×1024 equirectangular elevation (16-bit packed into RGB, lossless WebP) and the regional crops of section 7.2. Document the resampling method and its error near shelf edges.
- **Acceptance:** `paleo-manifest.json` lists each file with sha256, bytes, dataset id; first-paint set ≤ 1.5 MB.

#### T3.3 — Sea-level curves
- **Status:** TODO
- **Size:** M
- **Depends:** T3.1
- **Steps:** Combine Spratt & Lisiecki (0–800 ka), the 4.5 Myr reconstruction and Miller et al. 2020 into `sea-level.json` (time, level, lower, upper, source id). Document how joins/offsets are handled; keep the original resolution.
- **Acceptance:** sanity tests (not truth claims): level at 0 ka within ±5 m; at 20 ka between −140 and −100 m; at 125 ka between −5 and +15 m. Uncertainty band present.

#### T3.4 — Ice and paleotopography anomaly slices
- **Status:** TODO
- **Size:** L
- **Depends:** T3.1, T3.2
- **Steps:** Read the dataset documentation first (sign conventions, reference sea level, land-sea mask definition). Build anomaly and ice rasters (2048×1024) for the supported slices (default model: PaleoMIST 1.0 for 80–0 ka to avoid seams; record the alternative). Beyond 80 ka: no ice layer, tier “Sea level only”.
- **Acceptance:** golden checks: pick points *by script* where modern depth is 20–90 m inside the Sunda Shelf, Sahul shelf, Bering Strait, North Sea, Persian Gulf and Bass Strait; they are land at 20 ka and water at 0 ka. Bab-el-Mandeb remains water at 20 ka. Each golden region is verified against literature and cited.

#### T3.5 — Manifest, fingerprint and audit
- **Status:** TODO
- **Size:** S
- **Depends:** T3.2, T3.3, T3.4
- **Steps:** Add `audit:paleo`: every file in `public/assets/paleo/` matches the manifest sha256, every dataset id exists in the registry, licences are allowed, total size within budget (first paint ≤ 1.5 MB, lazy total ≤ 8 MB).
- **Acceptance:** audit in `qa:phase3`; tampering with a file fails it.

### P4 — Migration: paleo runtime MVP (*H. sapiens* window, 0–330 ka)

#### T4.1 — Module structure and lazy loading
- **Status:** TODO
- **Size:** M
- **Depends:** T2.4, T3.5
- **Steps:** `components/migration/` with `MigrationScene` (client), `engine/types.ts` (`GlobeEngine`), `engine/<winner>/`, `fallback/CanvasFlat`. Load with `next/dynamic` (`ssr:false`) only when `mode=migration`. Keep boundaries (`audit:runtime-boundaries`).
- **Acceptance:** home page JS size unchanged; no server import in client files.

#### T4.2 — Base layer shader
- **Status:** TODO
- **Size:** L
- **Depends:** T4.1
- **Steps:** Elevation + anomaly + sea level + exposed-shelf highlight + ice + hillshade + ocean depth tint + atmosphere rim, as in section 7.2.
- **Acceptance:** at 20 ka the Sunda shelf, Beringia and Doggerland appear as land; at 0 ka the modern coast; pixel-hash snapshot tests at 0, 20, 125 ka.

#### T4.3 — Time integration
- **Status:** TODO
- **Size:** S
- **Depends:** T4.2
- **Steps:** Bind to the explorer’s `time` state/URL (Ma ↔ ka only at the edge). Slider scrubs sea level continuously; ice/anomaly slices interpolate.
- **Acceptance:** deep link `/?mode=migration&time=0.02` opens at 20 ka.

#### T4.4 — Confidence, legend and credits
- **Status:** TODO
- **Size:** M
- **Depends:** T1.3, T4.2
- **Steps:** Tier badge by time (section 6.2), legend (land, exposed shelf, ice, sea), methodology popover with D-12 text, Credits listing every dataset used (from the registry).
- **Acceptance:** badge text matches the tier at 10, 50, 300 ka; credits list equals the datasets referenced in the manifest.

#### T4.5 — Camera and gestures
- **Status:** TODO
- **Size:** M
- **Depends:** T4.2
- **Steps:** One-finger rotate with inertia, pinch zoom, double-tap zoom, wheel zoom, reset, region presets (Africa, Levant, Sunda–Sahul, Beringia). Latitude clamp; no gimbal flips.
- **Acceptance:** Playwright touch tests pass on iPhone 13 and Pixel 7 profiles.

#### T4.6 — Tests
- **Status:** TODO
- **Size:** M
- **Depends:** T4.2
- **Steps:** Unit tests (time → tier, sea-level lookup, uniform packing); Playwright: canvas is not blank (pixel read), slider changes the pixel hash, reduced-motion respected; visual baselines at three times.
- **Acceptance:** all pass in CI.

### P5 — Migration: corridors, uncertainty, sites

#### T5.1 — Corridor data and validation
- **Status:** TODO
- **Size:** M
- **Depends:** T4.6, T1.2
- **Steps:** `content/corridors.ts`; extend `validateCatalog`: ids unique, ≥ 1 source, interval inside the taxon range, waypoints valid, uncertainty qualitative, water crossings declared with sources.
- **Acceptance:** invalid fixtures rejected with codes; unit tests.

#### T5.2 — Path geometry and frontier
- **Status:** TODO
- **Size:** M
- **Depends:** T5.1
- **Steps:** Great-circle (slerp) interpolation, ribbon geometry, frontier progress `p(t)` clamped to the corridor interval.
- **Acceptance:** tests: endpoints exact, monotone progress, no wrap artefacts at ±180° longitude.

#### T5.3 — Land-check audit
- **Status:** TODO
- **Size:** L
- **Depends:** T5.1, T3.5
- **Steps:** `audit:corridors` samples each path every ≤ 25 km at the start, middle and end times, decodes the paleo data in Node with `sharp`, and fails if a segment is water unless it lies in a declared crossing within its `maxKm`. Print a readable report.
- **Acceptance:** a deliberately wrong waypoint fails the audit; correct data passes.

#### T5.4 — Corridor rendering
- **Status:** TODO
- **Size:** L
- **Depends:** T5.2, T4.5
- **Steps:** Ribbon width ∝ uncertainty with soft edges, animated frontier glow (static when reduced motion), contested corridors drawn with a distinct dashed/hatched style and label, legend entry “wider = less certain”.
- **Acceptance:** visual baselines; no speed/year labels finer than the source interval.

#### T5.5 — Sites layer and accessible list
- **Status:** TODO
- **Size:** M
- **Depends:** T4.5
- **Steps:** Kind-specific icons, clustering at low zoom, hit area ≥ 44 px, back-hemisphere markers hidden. A keyboard- and screen-reader-operable site list (listbox) replaces canvas-only access; selecting a site syncs the Inspector.
- **Acceptance:** keyboard-only flow selects a site; axe clean.

#### T5.6 — Remove the legacy view
- **Status:** TODO
- **Size:** S
- **Depends:** T5.4, T5.5
- **Steps:** Delete `MigrationGlobe.tsx`, `migrationScene.ts`, unused CSS; update `scripts/audit-ui-contract.mjs` and `scripts/audit-code.mjs` interactive-SVG lists.
- **Acceptance:** no references remain; all gates green.

### P6 — Migration: *H. sapiens* content and gene flow

#### T6.1 — Evidence inventory
- **Status:** TODO
- **Size:** L
- **Depends:** T5.1
- **Steps:** For each candidate in section 6.3 (and any the agent finds) record: event, place, interval with ±, dating method, primary DOI, contested? Verify every DOI at the publisher/PubMed. Output as new `sources`, `publications`, `evidence` records (no free text without a source).
- **Acceptance:** `validate:data` and `audit:provenance` pass; every item either has a verified DOI or stays `NEEDS-REVIEW` and is not drawn.

#### T6.2 — Corridor set v1 (*H. sapiens*)
- **Status:** TODO
- **Size:** L
- **Depends:** T6.1, T5.3
- **Steps:** Author corridors: within Africa; early Levant; Arabia/Indian-Ocean-rim; northern/Eurasian steppe; Sahul; Europe; East Asia; Beringia and the Americas. Contested dates form `hypothesisGroup`s.
- **Acceptance:** `audit:corridors` passes; every corridor has ≥ 1 verified source.

#### T6.3 — Gene-flow pulses
- **Status:** TODO
- **Size:** M
- **Depends:** T6.1
- **Steps:** Render pulses for registered gene-flow relationships (Neanderthal, Denisovan) only where a source gives a spatial basis; otherwise show the event in the side panel and the graph, never as an invented map location.
- **Acceptance:** no pulse without `placeBasisSourceId`; test enforces it.

#### T6.4 — Journey chapters from data
- **Status:** TODO
- **Size:** M
- **Depends:** T6.2
- **Steps:** Generate the journey chapters from corridors (time window, camera preset, text from sourced claims). Keep the existing cinematic toggle; no scroll-driven mode (D-03).
- **Acceptance:** adding a corridor adds a chapter without code changes.

#### T6.5 — Scientific review
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** T6.2, T6.3
- **Steps:** An independent reviewer (specialist or advisor) checks corridors, intervals, contested flags and wording; record in section 13.
- **Acceptance:** review log entry with date and scope; changes applied.

### P7 — Migration: responsive, accessibility, performance

#### T7.1 — Responsive layouts
- **Status:** TODO
- **Size:** L
- **Depends:** T5.5
- **Steps:** Implement section 8: panes, drawer, bottom sheet with snap points, thumb-reachable scrubber, safe areas, orientation changes.
- **Acceptance:** Playwright at 320, 390, 768, 1024, 1440 px: no horizontal scroll, all controls ≥ 44 px, sheet snaps work.

#### T7.2 — Performance budgets and runtime behaviour
- **Status:** TODO
- **Size:** M
- **Depends:** T5.4
- **Steps:** `audit:perf` (migration chunk gzip ≤ budget; home bundle not larger); texture tier by capability + a “Light mode” toggle; DPR cap; render on demand; pause when hidden/off-screen; context-loss recovery.
- **Acceptance:** thresholds of section 7.3 met; losing and restoring the GL context recovers without reload (test).

#### T7.3 — Fallbacks
- **Status:** TODO
- **Size:** M
- **Depends:** T4.1
- **Steps:** Canvas-flat fallback using the same data; server-rendered text/table summary of corridors and sites for no-JS and crawlers.
- **Acceptance:** `?renderer=flat` and a browser without WebGL both work; summary visible without JS.

#### T7.4 — Accessibility pass
- **Status:** TODO
- **Size:** M
- **Depends:** T5.5
- **Steps:** Canvas `role="img"` with a live summary of the current slice; keyboard rotate/zoom/time; `prefers-reduced-motion`; contrast ≥ 4.5:1 for text and ≥ 3:1 for map symbology; colour-blind-safe palette checked with a simulation.
- **Acceptance:** axe zero violations on the Migration view; manual keyboard checklist recorded.

#### T7.5 — Device-profile e2e and visuals
- **Status:** TODO
- **Size:** M
- **Depends:** T7.1
- **Steps:** Playwright projects (iPhone 13, Pixel 7, iPad, desktop) running the Migration scenarios; visual baselines.
- **Acceptance:** green in CI.

#### T7.6 — Real-device check
- **Status:** BLOCKED-OWNER
- **Size:** S
- **Depends:** T7.2
- **Steps:** Owner tests iOS Safari and Android Chrome: smooth rotate/scrub, no overheating, sheet usable one-handed; reports results here.
- **Acceptance:** results logged in section 13.

### P8 — Migration: other taxa up to 800 ka

#### T8.1 — Taxon-generic layers
- **Status:** TODO
- **Size:** M
- **Depends:** T6.4
- **Steps:** Layer toggles per taxon; support two geometries: **routes** (corridors) and **ranges** (occurrence polygons with uncertainty); coexistence is shown without implying contact.
- **Acceptance:** unit tests; a test proves coexistence never draws a contact link.

#### T8.2 — Neanderthal, Denisovan, *H. heidelbergensis*
- **Status:** TODO
- **Size:** L
- **Depends:** T8.1
- **Steps:** Verified ranges/sites and intervals per taxon (same evidence rules as T6.1); gene-flow pulses meet the *H. sapiens* corridors only where sourced.
- **Acceptance:** `audit:corridors`/range audit pass; review entry for each taxon.

### P9 — Migration: deep time and environment overlays

#### T9.1 — Deep-time sea level and “Coarse” tier
- **Status:** TODO
- **Size:** M
- **Depends:** T8.2
- **Steps:** Extend `sea-level.json` and the UI to 0.8–8 Ma using the verified datasets; “Coarse” badge; no ice layer.
- **Acceptance:** the tier badge and credits are correct across the whole time domain.

#### T9.2 — Plate-motion bound
- **Status:** TODO
- **Size:** M
- **Depends:** T9.1
- **Steps:** Offline (pyGPlates, GPL, outputs only): compute the displacement of every main-path site and key regions from 8 Ma to 0 using an appropriate model (note the < 5 Ma caveat of the 1-Ga model); record maxima in this file. Decide with the owner whether any correction is needed.
- **Acceptance:** numbers recorded; decision logged; if “not applied”, the methodology text states the bound.

#### T9.3 — *H. erectus* and early dispersal
- **Status:** TODO
- **Size:** L
- **Depends:** T9.1
- **Steps:** Verified sites/intervals (e.g., Dmanisi and Asian sites), corridors/ranges, contested dates flagged.
- **Acceptance:** corridor audit passes at the Ma tier; review entry.

#### T9.4 — Environmental overlays (only with licensed data)
- **Status:** OPTIONAL
- **Size:** L
- **Depends:** T9.1
- **Steps:** Humid-period Sahara/Arabia, palaeolakes, etc.; each overlay needs a registered dataset with licence and a clear time window.
- **Acceptance:** audit passes; D-12 wording extended to the overlay.

### P10 — Optional features

#### T10.1 — Competing dispersal hypotheses switch
- **Status:** OPTIONAL
- **Size:** M
- **Depends:** T7.5
- **Steps:** Meaning: the same time slice can have two published readings (for example “one main dispersal ≈ 60 ka” vs “earlier waves too”). Reuse the existing `InterpretationSet` model and the corridors' `hypothesisGroup`; a segmented control swaps the group. Implement only if it needs no new data model; otherwise set `DROPPED`.
- **Acceptance:** switching changes drawn corridors and the legend; both readings cite sources.

#### T10.2 — Site cards
- **Status:** OPTIONAL
- **Size:** M
- **Depends:** T5.5
- **Steps:** Reuse the Inspector site panel (image, specimens, claim list, link to the species page). No new design system.
- **Acceptance:** owner confirms usefulness (D-08) before work starts.

### P11 — Core-taxa content and media (11-taxon path)

#### T11.1 — Claims, evidence and sources for the four Tier-0 core taxa
- **Status:** DROPPED
- **Size:** L
- **Depends:** —
- **Steps:** Superseded by phase P15: each core taxon task writes its claims, evidence and sources together with the page text. Specimen records for *Orrorin* and *H. heidelbergensis* are in T13.3.
- **Acceptance:** none.

#### T11.2 — Raise the core taxa to Tier 2
- **Status:** TODO
- **Size:** L
- **Depends:** T15.14, T13.10
- **Steps:** Per taxon close the missing checks of section 9 (specimen, dated site, ≥ 3 claims, gallery image, relationship). Images must be licensed and self-hosted, with `credit`, `licence`, `alt`, `note`.
- **Acceptance:** all 11 core taxa show Tier 2 in the computed dossier (test asserts it for `mainPathTaxonIds`).

#### T11.3 — Collections (museums)
- **Status:** TODO
- **Size:** M
- **Depends:** T13.3
- **Steps:** Fill `content/collections.ts` from verified institutional records; link specimens.
- **Acceptance:** audit passes; no empty collections.

#### T11.4 — CMS image roles and ordering
- **Status:** DROPPED
- **Size:** L
- **Depends:** —
- **Steps:** Superseded: the metadata part is T13.1; crop/reorder/batch upload moved to the Backlog (section 12).
- **Acceptance:** none.

#### T11.5 — Scientific review of tree edges
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** T15.14
- **Steps:** Review relationship labels/directions (for example the *afarensis → boisei* edge after *P. aethiopicus* was removed) and uncertainty wording; record in section 13.
- **Acceptance:** review log entry; corrections applied with migration notes.

### P12 — Release

#### T12.1 — SEO and structured-data audit
- **Status:** TODO
- **Size:** S
- **Depends:** T0.5
- **Steps:** Validate JSON-LD, canonical URLs, OG, sitemap, robots on every route; make sure unknown species return 404 and malformed URLs return 404 (regression tests exist).
- **Acceptance:** audit script and tests pass.

#### T12.2 — Content freeze, fingerprint, version bump
- **Status:** TODO
- **Size:** S
- **Depends:** T11.2, T7.5
- **Steps:** `npm run bump -- X.Y.Z`, regenerate fingerprint, update **Snapshot version**.
- **Acceptance:** `audit:version` and `audit:reproducibility` pass.

#### T12.3 — Deploy
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** T12.2, D-14
- **Steps:** Node ≥ 22.5; persistent disk for `CMS_DB_PATH` and `CMS_MEDIA_DIR`; `CMS_ADMIN_PASSWORD`, `SITE_URL`; HTTPS; scheduled `backup:cms`; restore rehearsal with `restore:cms`; use `NEXT_OUTPUT=standalone npm run build:standalone` if running the standalone server.
- **Acceptance:** production smoke test of the HTTP checks used in section 13 passes.

#### T12.4 — Monitoring
- **Status:** TODO
- **Size:** S
- **Depends:** T12.3
- **Steps:** Error reporting and uptime check; log CMS rejections (rejected published rows are already reported by `getLiveContent`).
- **Acceptance:** a forced error is visible in the monitoring tool.

#### T12.5 — Final scientific sign-off
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** T6.5, T11.5
- **Steps:** Reviewer confirms Tier 3 for the core taxa and the Migration corridors.
- **Acceptance:** section 13 entry.

---

### P13 — Scientific image production

Reference: `tools/images/catalog.json` / `catalog.csv` (**237 rows**: 165 standard = 11 core taxa × 15, 18 special, 33 stone-tool = 11 taxa × 3, 21 comparative; waves 66 / 55 / 44 / 18 / 21 / 33), `tools/images/prompts/_global.md` (rules, usage, assumptions sheet, reviewer checklist), `tools/images/prompts/<taxon>.md` and `tools/images/prompts/ALL.md` (40 self-contained class-D prompts). Edit `tools/images/taxa.ts` or `spec.ts`, then run `npm run images:build`; `tests/image-plan.test.ts` fails if the committed outputs are stale. Row statuses: `TODO` (180), `BLOCKED-NO-SPECIMEN` (34: *Orrorin*, *H. heidelbergensis*), `NOT-APPLICABLE` (23: behaviour slots and stone-tool slots without evidence). Evidence classes: **A** code from sourced data (30), **B** code + licensed scan/template (60), **C** licensed photograph/scan of a real specimen or artefact — never AI (102), **D** reconstruction (45 rows, 40 prompts). Stone tools (series `L1` kit photograph, `L2` key tool type, `L3` how-it-was-made diagram, plus comparatives C17–C21) are classes C/B/A only; the 6 taxa without securely attributed tools (*Sahelanthropus*, *Orrorin*, *Ardipithecus*, *A. anamensis*, *A. afarensis*, *A. africanus*) have `NOT-APPLICABLE` rows with the reason recorded.

#### T13.1 — Media metadata for scientific images
- **Status:** DONE
- **Size:** M
- **Depends:** T14.1
- **Steps:** Extend `MediaAsset` and the CMS (form, API, store, validators, migration note in `migrations/`, new files only) with `slotId` (a `MediaSlotId` from T14.1; nullable for legacy images; at most one live image per slot), `evidenceClass` (A/B/C/D mapped to “data-derived diagram”, “specimen photograph”, “reconstruction”), `catalogCode` (row of `tools/images/catalog.json`), `specimenRef`, `assumptions` (text), `generator` (`{name,version,date}` or null), `reviewedBy` (`{name,date,decision}` or null). Rules in `validateCatalog` and the CMS publish gate: class D cannot be published without `assumptions`, `generator` or artist credit, and `reviewedBy.decision = approve`; class C requires `specimenRef` and a licence; the UI shows the class label next to every image. Existing sample schematics keep working (they are `placeholder`).
- **Acceptance:** unit tests for each rule; the CMS refuses to publish an unreviewed class-D image; the species page shows “Reconstruction” on a published class-D image; `validate:data` and all audits pass. *Done 2026-10-06 at store, API, audit and species-page level (`tests/cms-scientific-media.test.ts`); the admin form fields for specimen, assumptions, generator and reviewer decision are delivered by T14.3.*

#### T13.2 — Decide ergaster / erectus and Turkana Boy (D-16)
- **Status:** BLOCKED-OWNER
- **Size:** S
- **Depends:** —
- **Steps:** Owner decides the filing of KNM-WT 15000 and whether *H. ergaster* stays a separate taxon. Update `content/` records and `tools/images/taxa.ts` (`erectus.basis.also`) accordingly, then `npm run images:build`.
- **Acceptance:** D-16 `DECIDED`; catalog rows consistent with the taxa records.

#### T13.3 — Unblock Orrorin and H. heidelbergensis
- **Status:** TODO
- **Size:** M
- **Depends:** T15.1
- **Steps:** Add verified specimen records (with DOI-backed sources) for *Orrorin* (femora, mandibles, teeth, humerus fragment) and *H. heidelbergensis* (Kabwe 1, Mauer 1, Boxgrove tibia, others as supported). Then set their `basis.catalogIds` in `tools/images/taxa.ts` and rebuild.
- **Acceptance:** the 31 `BLOCKED-NO-SPECIMEN` rows become `TODO`; `tests/image-plan.test.ts` passes with `blockedTaxa` equal to `[]` (update that assertion in the same change).

#### T13.4 — Source and licence ledger for class-C images
- **Status:** TODO
- **Size:** L
- **Depends:** T13.1
- **Steps:** For each class-C row (102, including the stone-tool rows `L1`/`L2` and comparatives C20/C21) search the source order given in its brief and record the best candidate in `tools/images/sources.json` (`code`, institution, catalog number, URL, licence name and quoted licence text, credit string, retrieval date, scale bar present?). Download nothing without a recorded licence. Add a test that every candidate has a licence from the allow-list used by the media audit. Rows with no licensed candidate are marked `NO-LICENSED-SOURCE` and stay empty.
- **Acceptance:** every class-C row has a candidate or an explicit `NO-LICENSED-SOURCE`; the ledger test passes.

#### T13.5 — Class-A generators
- **Status:** TODO
- **Size:** L
- **Depends:** T13.1
- **Steps:** Scripts under `tools/images/generators/` that read sourced tables `tools/images/data/*.json` (each row with a source id) and write deterministic SVG + WebP: S09 scale bands, cranial-capacity chart (C03), body-size bands (C04), time-range chart (C13), stone-tool industries timeline (C17, associations drawn as “associated” or “unattributed”, never “made by”), admixture diagram (neanderthal.X3, numbers only from sources), and — after T3.5 — S13 and C14–C16 site maps on the paleo layer. Output carries `evidenceClass A`.
- **Acceptance:** same input gives byte-identical output (test); every number in an image resolves to a source record.

#### T13.6 — Class-B diagrams and avatars from licensed scans
- **Status:** TODO
- **Size:** L
- **Depends:** T13.4
- **Steps:** Using only scans/photos with a recorded licence: S01 avatars (one render preset for all taxa), S08 annotated diagrams (labels from claim records), S14 skeleton-inventory diagrams, the stone-tool reduction diagrams `L3` and C18/C19 (technological modes, flake mechanics), the other class-B rows and comparative lineups C01, C02, C05–C10, C12.
- **Acceptance:** all class-B rows delivered as SVG/WebP with licence and credit recorded; labels trace to claims.

#### T13.7 — Produce class-D wave 1 (S02 portraits and S10 habitats)
- **Status:** NEEDS-REVIEW
- **Size:** L
- **Depends:** T13.4, T13.6
- **Steps:** Owner or artist runs the prompts in `tools/images/prompts/<taxon>.md` following `_global.md` (one conversation per image, attach the reference renders, regenerate on any failed check), fills the assumptions sheet and saves the files. *Orrorin* S02 is the bone-inventory silhouette. Start with *A. afarensis* as the pilot to validate the prompt format, then amend `spec.ts` if the pilot reveals a systematic problem.
- **Acceptance:** 22 images (11 portraits, 11 habitats; 2 of them blocked until T13.3) with assumptions sheets, ready for review. *Delivered 2026-10-05 in `Human-Origins-organized.zip`; QA findings are tracked in T13.11.*

#### T13.8 — Produce class-D waves 2–4 (S03 heroes, S11 behaviour scenes, sapiens.X1)
- **Status:** NEEDS-REVIEW
- **Size:** L
- **Depends:** T13.7
- **Steps:** Same procedure. S11 exists only for the 6 taxa with documented behaviour; keep every scene limited to the objects the prompt lists.
- **Acceptance:** 18 images (11 heroes, 6 scenes, 1 Irhoud portrait) with assumptions sheets. *Delivered 2026-10-05; the hero of H. sapiens is missing and two images must be regenerated (T13.11).*

#### T13.9 — Scientific review of class-D images
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** T13.7
- **Steps:** A specialist applies the reviewer checklist in `_global.md` to every class-D image and records approve / revise / reject in the assumptions sheet; record the review in section 13.
- **Acceptance:** every image to be published has an `approve` decision.

#### T13.10 — Upload, publish and verify
- **Status:** TODO
- **Size:** M
- **Depends:** T13.1, T13.9
- **Steps:** Upload the approved and delivered images through the CMS with the full metadata, using a manifest generated from the catalog; verify gallery counts and tiers.
- **Acceptance:** the 11 core taxa have at least the images required by section 9 (Tier 2 gallery check); no unreviewed class-D image is public; `npm run qa:release` passes.

#### T13.11 — Fix the findings of the delivered image pack
- **Status:** TODO
- **Size:** M
- **Depends:** T13.8
- **Steps:** (1) Adopt `Human-Origins-organized-corrected.zip` as the source of truth: 21 of 40 files were in the wrong slot in the first pack (taxa 06–11 shifted; verified by viewing all 40 images; `MANIFEST.csv` lists every move). (2) Regenerate `heidelbergensis.S03` and `erectus.S11`: both show visible anatomy, which breaks the non-sexualised framing rule; the prompts now carry a strict no-anatomy rule and a waist-wrap modesty convention for *Homo* (done 2026-10-05); regenerate the two images from the updated `ALL.md`. (3) Generate the missing `sapiens.S03` hero (the pack has two habitat plates and no hero). (4) Confirm the identity of the three portraits assigned by visual features (`africanus.S02`, `habilis.S02`, `erectus.S02`). (5) Add a crop step to the CMS import with `sharp` (centre crop 3:2 to 16:9 and 2:3 to 4:5; the 27 off-ratio files are listed in the manifest); for `habilis.S03` (2.36:1) and `heidelbergensis.S11` check the crop by eye. (6) Keep *Orrorin* and *H. heidelbergensis* images unpublished until T13.3. (7) Fold in the handoff of 2026-10-06 (`Human-Origins-compact-handoff.zip`, then delete `HANDOFF.md`): the pack holds 32 active images already cropped to the prompt sizes and recompressed (lossy WebP q88; some were upscaled, so prefer the original generations where they exist), 8 held images and one alternate habitat; four regenerations failed for lack of AI credit (`africanus.S02`, `africanus.S03`, `habilis.S03`, `habilis.S11`); `erectus.S11` must not be published; `sapiens.S03` is still missing; the identity of the `africanus`, `habilis` and `erectus` portraits is unconfirmed; every regenerated image needs an assumptions note of at most 120 words; the pack's `REFERENCE.md` must be byte-identical to `tools/images/prompts/ALL.md` (diff it; the handoff reports that the copies inside the older ZIP were not); total pack size stays under 40 MB.
- **Acceptance:** `MANIFEST.csv` shows no `MISSING`, no `RATIO` and no open `REGENERATE`/`CONFIRM`; a test verifies every delivered file matches its catalog ratio.

### P14 — Species pages: platform

Goal: a complete, accessible species-page shell, named image slots with a slot-based admin, and a reference system, all verified by tests; no scientific text is written here.

#### T14.1 — Slot definitions from the image catalog
- **Status:** DONE
- **Size:** M
- **Depends:** —
- **Steps:** Extend `tools/images/build.ts` to emit `content/media-slots.generated.ts` (slot id, taxon, series, role, kind, evidence class, ratio, size, `publicRule`: `always` for `S02`/`S03`, `whenFilled` otherwise, `applicable`: false for not-applicable rows, `needsReview`: true for class D). Add `domain/media-slots.ts` with `MediaSlotId` and helpers. `tests/image-plan.test.ts` checks the file is in sync.
- **Acceptance:** every slot of the catalog exists once; not-applicable rows are marked; `tsc` and tests pass. *Done 2026-10-06: `content/media-slots.generated.ts` (237 slots), `domain/media-slots.ts`, `tests/media-slots.test.ts`.*

#### T14.2 — Slot resolution
- **Status:** DONE
- **Size:** M
- **Depends:** T13.1
- **Steps:** Add `features/explorer/slots.ts`: `resolveSlots(taxon, media)` returns, per slot, the live CMS image with that `slotId` (published, review rules satisfied) or `empty`; add `isAdminPreview()` (server: valid session cookie) so admins also receive empty slots. Built-in schematic plates fill only the avatar and portrait.
- **Acceptance:** unit tests: filled/empty/draft/unreviewed-class-D/admin-preview cases; no CMS image without `slotId` leaks into a slot. *Done 2026-10-07: `features/explorer/slots.ts` (`resolveSlots`: show / frame / locked / hidden, built-in plates only for avatar and portrait, defence-in-depth rule check), slot groups in `domain/media-slots.ts`, slot metadata carried by `ExplorerMedia`, `tests/slot-resolution.test.ts`.*

#### T14.3 — Admin slot matrix and slot upload
- **Status:** NEEDS-REVIEW
- **Size:** L
- **Depends:** T13.1, T14.1
- **Steps:** Rebuild `app/admin/(dashboard)/media` around a species selector and the slot matrix described in section 9a: status badges, filled/total counter, Upload dialog pre-filled from the slot, server-side crop with `sharp` to the slot ratio and size (preview before saving), class-specific required fields (specimen reference, assumptions sheet, generator, reviewer name/date/decision: the API already accepts and enforces them, T13.1), draft→publish with the class-D review gate, replace and unpublish. Keep the old generic upload as “Other image” (no slot). Mobile layout per section 8.
- **Acceptance:** a Playwright scenario (added to T0.3's CMS test) uploads an image to `afarensis.S02`, publishes it and sees it on `/species/afarensis`; unpublish restores the frame; an unreviewed class-D image cannot be published; axe clean; usable at 390 px. *Built 2026-10-07: `/admin/media/slots` (slot matrix per species, progress counter, upload with centre-crop preview and server-side `sharp` crop to the slot ratio, class-specific fields, edit and review, publish, unpublish, replace, delete draft; nav link). The API flow is tested end to end in `tests/cms-slot-api.test.ts` (crop, role/kind/class from the slot, closed and foreign slots refused, unreviewed class D refused, review then publish, replacement takes the old image offline). That test found and fixed a bug: publishing a replacement was blocked by the duplicate-slot audit. Not verifiable here: the Playwright scenario, axe and the 390 px check (T14.12).*

#### T14.4 — Reference registry and DOI ledger
- **Status:** DONE
- **Size:** M
- **Depends:** —
- **Steps:** Extend `content/publications.ts` and `domain/research-model.ts` as the single reference registry (section 9a); no second list. Add `scripts/check-references.mjs` (network, owner-run, not in `qa:release`) that resolves every DOI through Crossref and reports mismatches in title, year or journal. Seed with the three Iranian Plateau papers of section 9a after verifying them.
- **Acceptance:** validators and tests: unique ids, DOI format, `verifiedOn` present for every reference used by a page; the three seed papers are present. *Done 2026-10-06 (decision: no second registry — `content/publications.ts` is the single reference registry, extended with `kind`, `verifiedOn`, `verification`; helpers in `domain/references.ts`; audit rules; `npm run check:references` is the owner-run Crossref check, its comparison logic is unit-tested offline; seeded with four verified Iranian Plateau papers: Shoaee et al. 2021, Vahdati Nasab et al. 2019, Shoaee et al. 2023, Shoaee et al. 2024; `tests/references.test.ts`). The 21 older records stay without `verifiedOn` until a page cites them (T15.x).*

#### T14.5 — Species-page content schema, validator and audit
- **Status:** DONE
- **Size:** L
- **Depends:** T14.4
- **Steps:** Add `domain/species-page.ts` (`SpeciesPageContent`: `lead`, `facts[]` with certainty and refs, `sections[]` of blocks (paragraph, list, table, note) with refs, `debates[]` with positions and refs, `reviewedOn`), content files `content/species-pages/<taxon>.ts`, loader, and `scripts/audit-species-pages.mjs` enforcing the writing rules of section 9a (citations, ids, word budgets, banned words, debates, dates). Wire into `qa:phase3`. Add one fixture page for tests only.
- **Acceptance:** fixtures that break each rule fail with a specific code; the audit passes on the fixture; existing audits unchanged. *Done 2026-10-06: `domain/species-page.ts` (types, limits, banned wording), `infrastructure/validation/species-pages.ts` (pure validator, 30 rule codes), `content/species-pages/index.ts` (empty registry), `npm run audit:species-pages` in `qa:phase3`, fixture in `tests/fixtures/species-page.ts`, `tests/species-page.test.ts`. Statements that cite a single reference warn unless `singleSource` is set and the text says so.*

#### T14.6 — Page shell, tokens and navigation
- **Status:** NEEDS-REVIEW
- **Size:** L
- **Depends:** T14.5
- **Steps:** Rebuild `app/species/[id]/page.tsx` as a composition of components under `components/species/` (Header, AtAGlance, Section, Debates, SlotGallery, Sources) using `app/species/species-page.css` with tokens; sticky in-page navigation (desktop), accordion (mobile); reserved aspect-ratio boxes; keep the evidence graph, specimens, relationships and pager cards. Pages without content files render the current record with the “incomplete record” notice.
- **Acceptance:** visual baselines at 390, 768, 1280 px; no layout shift (CLS ≈ 0) with and without images; no horizontal scroll at 320 px; the CSS budget of T0.6 does not increase. *Built 2026-10-06: `components/species/*`, `app/species/species-page.css` (tokens, no new hard-coded colours except the four certainty colours), sticky navigation, accordion sections, plain layout for taxa without a content file, integration test with fixture content (`tests/species-page-integration.test.tsx`). Not verifiable here: visual baselines at 390/768/1280 px, CLS and the 320 px overflow check need a browser (owner T0.1/T0.2, then T14.12).*

#### T14.7 — Narrative, fact-table and debate components
- **Status:** NEEDS-REVIEW
- **Size:** M
- **Depends:** T14.6
- **Steps:** Implement certainty badges, the at-a-glance table, section blocks and the Debates component (question, positions with sources, last-updated). Citation markers are rendered by one component shared with the reference list.
- **Acceptance:** component tests; keyboard operation; axe clean; badges never show numbers. *Built 2026-10-06: certainty badges, at-a-glance table, section blocks (paragraph, note, list, table), debates and unknowns; component tests in `tests/species-components.test.tsx`. Keyboard operation and axe need a browser (T14.12).*

#### T14.8 — Compact reference list and in-text citations
- **Status:** NEEDS-REVIEW
- **Size:** M
- **Depends:** T14.4, T14.6
- **Steps:** Number references by first citation; superscript links with back-links; collapsed “Sources (N)” on mobile; entries per section 9a; copy-citation button; print stylesheet; remove the mid-page `SourceIntelligence` panel from the species page (the panel stays on the home Inspector).
- **Acceptance:** every marker resolves; list order equals citation order; DOI links valid format; axe clean; print preview readable. *Built 2026-10-06: numbering by first citation (`domain/species-page-render.ts`), superscript links with back-links (anchor integrity tested), collapsible “Sources (N)”, kind label, safe DOI links, copy-citation button, print rules; the legacy mid-page source panel is replaced on pages that have a content file and kept on the others. Axe and print preview need a browser (T14.12).*

#### T14.9 — Slot-aware gallery and empty-slot behaviour
- **Status:** NEEDS-REVIEW
- **Size:** M
- **Depends:** T14.2, T14.6
- **Steps:** Render slots by role (portrait, hero, habitat, plates, diagrams, maps, tools) with captions that state the evidence class (“Reconstruction”, “Specimen photograph”, “Data-derived diagram”), credit and licence; apply decision D-19; admin preview shows dashed frames with an Upload link to the matching slot.
- **Acceptance:** tests for public vs admin rendering; captions present for every class; no empty frame for `whenFilled` slots in public view. *Built 2026-10-07 (its tests pass; it stays NEEDS-REVIEW until the page shell it sits in, T14.6, is checked in a browser): `components/species/SlotGallery.tsx` (hero frame for everyone, grouped slots, evidence-class captions with credit, licence, specimen and an assumptions box for reconstructions; admin preview shows dashed frames with Upload links and locked slots; legacy images without a slot under “More images”); `tests/slot-gallery.test.tsx` and the integration test.*

#### T14.10 — Stone-tool section
- **Status:** TODO
- **Size:** S
- **Depends:** T14.7
- **Steps:** Add the Stone tools section (industry, typical kit, key tool type, attribution caution) rendered from the page content; taxa without securely attributed tools show a cited “no securely attributed stone tools” note with the reason.
- **Acceptance:** pilot and one tool-less taxon render correctly; every sentence is cited.

#### T14.11 — SEO and structured data
- **Status:** TODO
- **Size:** S
- **Depends:** T14.7
- **Steps:** JSON-LD uses the lead, facts and `reviewedOn` (`dateModified`); canonical and Open Graph from the portrait slot when live; sitemap `lastmod` from `reviewedOn`; description meta from the lead.
- **Acceptance:** structured-data validation on the pilot; sitemap entries updated.

#### T14.12 — Tests and visual baselines for the platform
- **Status:** NEEDS-REVIEW
- **Size:** M
- **Depends:** T14.3, T14.9, T0.3
- **Steps:** Unit tests for slots, audit and references; Playwright: slot upload scenario, public vs admin view, section accordion on mobile, reference back-links; visual baselines for the pilot page.
- **Acceptance:** all green in CI; baselines committed by the owner (T0.1). *Written 2026-10-09, not run in the build sandbox: `tests/e2e/species-pages.spec.ts` (headings, citation anchors, back-links, unknown and malformed addresses), `tests/e2e/species-responsive.spec.ts` (phone, iPhone SE and tablet: no horizontal overflow, 44 px navigation targets, sections collapse on phones; matches the responsive project pattern), `tests/e2e/admin-slots.spec.ts` (sign-in, slot matrix, on-hold lock; skipped unless CMS_ADMIN_PASSWORD is set). The owner runs them with `npm run test:e2e`; visual baselines are still owner work (T0.1).*

### P15 — Species pages: scientific content

Every task: collect and verify at least 8 references (section 9a), write the page content file, add the claims/evidence records it relies on to the catalog (so the taxon reaches Tier 1 and the claim part of Tier 2), run `audit:species-pages` and `validate:data`, update the page's `reviewedOn`. “Registry candidates” are ids already in `content/sources.ts`; “search leads” are topics to look up, **not** verified citations. Nothing unverified is published.

#### T15.1 — Research protocol and reference vetting
- **Status:** DONE
- **Size:** M
- **Depends:** T14.4
- **Steps:** Write the protocol of section 9a into the reference tooling: a checklist per reference (primary or review, DOI resolved, authors and year match, retraction and correction check, relevant to the claim), a template for a “debate” entry, and an owner-run report from `check-references`. Verify the three Iranian Plateau papers and record them. Record the verified references for the *Sahelanthropus* locomotion exchange (Daver et al. 2022 *Nature*; Cazenave et al. 2024 *J. Hum. Evol.*; Williams et al. 2026, journal to be confirmed).
- **Acceptance:** protocol committed; three seed papers and the *Sahelanthropus* papers present with `verifiedOn`. *Done 2026-10-07: reference checklist and debate-entry template added to section 9a; the three Iranian Plateau papers and the three verified papers of the Sahelanthropus exchange (Daver et al. 2022, Cazenave et al. 2024, Williams et al. 2026) are in the registry; the owner still runs `npm run check:references` with network access.*

#### T15.2 — Pilot: Australopithecus afarensis
- **Status:** NEEDS-REVIEW
- **Size:** L
- **Depends:** T14.7, T14.8, T14.9, T15.1
- **Steps:** Must cover: discovery and key fossils (Hadar including A.L. 288-1 and A.L. 444-2, Laetoli footprints, Dikika child); anatomy and sexual size difference; locomotion (upright walking with retained climbing features: summarize the debate); brain and body size; diet; environment; behaviour and tools (no securely attributed tools; Dikika cut-mark claim disputed); relation to *A. anamensis* and later taxa. Debates: locomotion, attribution of the Laetoli trail, Dikika cut marks, anagenesis with *A. anamensis*. Registry candidates: `nature-johanson-1976`, `si-afarensis-species`, `si-al-444-2`, `nature-haileselassie-2019`. Search leads: Dikika child, Burtele foot, Lucy's death, Laetoli trail reanalysis.
- **Acceptance:** owner approves layout and text; audit and tests pass; this page is the template for the others. *Drafted 2026-10-09: `content/species-pages/afarensis.ts`, registered in `content/species-pages/index.ts`. Passes `audit:species-pages` with 0 errors and 0 warnings. Eight verified references (Kimbel & Delezene 2009; Alemseged et al. 2006; Green & Alemseged 2012; McNutt et al. 2021; Gunz et al. 2020; Haile-Selassie et al. 2019; McPherron et al. 2010; Domínguez-Rodrigo et al. 2010), three of them from 2018 on. Four debates: climbing, anagenesis versus overlap, Dikika cut marks, Laetoli trackmakers. Nine statements that rest on one study carry `singleSource` (shown as “single study” on the page). Open before DONE: the owner approves the text and the debate summaries (the reviewer checks position summaries, T15.15); the Kimbel & Delezene venue must be confirmed with `npm run check:references` (the DOI record at the publisher lists another venue); the page is not yet checked in a browser (T14.12).*

#### T15.3 — Sahelanthropus tchadensis
- **Status:** NEEDS-REVIEW
- **Size:** L
- **Depends:** T15.2
- **Steps:** Must cover: discovery (2001, Toros-Menalla), cranium TM 266-01-060-1, dating method and its uncertainty, femur and ulnae, environment, taxonomic status. Debates (dated): habitual bipedalism (2022, 2024, 2026 positions), whether it is a hominin. Registry candidates: `si-toumai`, `si-sahelanthropus-species`.
- **Acceptance:** as T15.2. *Drafted 2026-10-09: `content/species-pages/sahelanthropus.ts`, registered in the index. Passes `audit:species-pages` with 0 errors and 0 warnings. Nine verified references (Brunet et al. 2002, 2005; Zollikofer et al. 2005; Lebatard et al. 2008; Daver et al. 2022; Cazenave et al. 2024; Williams et al. 2026; Macchiarelli et al. 2020; McPherron et al. 2010), four of them from 2018 on. Three debates: habitual bipedalism, membership of the human lineage (two debates in the page). Owner approval of text and debate summaries and a browser check (T14.12) are still required.*

#### T15.4 — Orrorin tugenensis
- **Status:** TODO
- **Size:** M
- **Depends:** T15.2
- **Steps:** Must cover: Lukeino Formation, the fragmentary sample (no cranium), dating, femur and the bipedalism arguments with their critics, taxonomic relationships. State plainly that the sample is fragmentary; replace the current fact “Bipedal on the ground; also climbed” with a certainty-labelled statement. Registry candidates: `si-orrorin-species`.
- **Acceptance:** as T15.2; the overstated fact is gone from `taxa.ts` and from the Inspector. *Progress 2026-10-09 (page not yet written): four verified references registered (Senut et al. 2001; Sawada et al. 2002; Richmond & Jungers 2008; Almécija et al. 2013); the overstated facts “Bipedal on the ground; also climbed” and the unsourced diet list are corrected in `content/taxa.ts`. Still needed before the page can pass the audit (at least eight citable references, three from 2018 on): (a) DOIs not yet confirmed for Galik et al. 2004 (Science 305:1450–1453), Puymerail 2017 (C. R. Palevol 16) and the Pickford & Senut femur and dental papers; (b) no verified study after 2018 has been found yet, so a targeted search of recent literature is required. Decision needed: the numeric time range in `taxa.ts` (6 to 5.8 Ma) differs from Sawada et al. (2002), who conclude 6.0–5.7 Ma; change the numbers only after the owner decides, because they drive the graph and the site-age audit.*

#### T15.5 — Ardipithecus ramidus
- **Status:** TODO
- **Size:** M
- **Depends:** T15.2
- **Steps:** Must cover: Aramis, ARA-VP-6/500, foot with grasping big toe, pelvis, reduced canines, habitat. Debates: habitat (woodland versus more open), what its anatomy implies for the last common ancestor, extent of bipedality. Registry candidates: `science-white-2009`, `si-ardipithecus-species`.
- **Acceptance:** as T15.2.

#### T15.6 — Australopithecus anamensis
- **Status:** TODO
- **Size:** M
- **Depends:** T15.2
- **Steps:** Must cover: Kanapoi, Allia Bay, Woranso-Mille, the 2019 cranium, tibia and upright walking, relation to *A. afarensis*. Debates: anagenesis versus overlap. Registry candidates: `nature-leakey-1995`, `nature-haileselassie-2019`, `si-anamensis-species`.
- **Acceptance:** as T15.2.

#### T15.7 — Australopithecus africanus
- **Status:** TODO
- **Size:** M
- **Depends:** T15.2
- **Steps:** Must cover: Taung, Sterkfontein, Makapansgat, dating, anatomy, Taung child and the raptor-predation evidence, relation to other australopiths and *Homo*. Debates: dating of the Sterkfontein sample, its place in the tree. Registry candidates: `nature-dart-1925`, `si-africanus-species`, `si-sts-71-3d`.
- **Acceptance:** as T15.2.

#### T15.8 — Homo habilis
- **Status:** TODO
- **Size:** L
- **Depends:** T15.2
- **Steps:** Must cover: Olduvai, OH 7 and OH 16, Koobi Fora, brain size, Oldowan toolkit and authorship (shared with other hominins), body proportions. Debates: whether *H. habilis* is a single valid species or a grouping of early *Homo* (including *H. rudolfensis*), the earliest *Homo* fossils. Registry candidates: `si-habilis-species`, `si-oh-16`, `si-oh-5`.
- **Acceptance:** as T15.2.

#### T15.9 — Homo erectus
- **Status:** TODO
- **Size:** L
- **Depends:** T15.2, T15.13
- **Steps:** Must cover: Dmanisi, African and Asian samples, brain-size range, body proportions, Mode 1 at Dmanisi and the Acheulean elsewhere including the Iranian Plateau (T15.13), dispersal. Debates: *H. erectus* versus *H. ergaster* (and the filing of Turkana Boy, D-16), where it originated, late survivors. Registry candidates: `si-erectus-species`, `si-d2282`, `quageo-dmanisi-2010`.
- **Acceptance:** as T15.2.

#### T15.10 — Homo heidelbergensis
- **Status:** TODO
- **Size:** L
- **Depends:** T15.2
- **Steps:** Must cover: Mauer, Kabwe, Petralona, Boxgrove, brain size, body build, Acheulean to early Mode 3, the Schöningen spears with their attribution caution. Debates: the taxon's boundaries and alternative names proposed for the African material, the relation of the Sima de los Huesos sample to Neanderthals. Registry candidates: `si-heidelbergensis-species`, `nature-meyer-2014`.
- **Acceptance:** as T15.2; specimen records for this taxon exist (T13.3) before its specimen section is published.

#### T15.11 — Homo neanderthalensis
- **Status:** TODO
- **Size:** L
- **Depends:** T15.2, T15.13
- **Steps:** Must cover: Feldhofer and other key sites, anatomy, brain and body, Mousterian technology and hafting, diet, the genome and admixture, the Zagros and Iranian Plateau evidence (T15.13), extinction. Debates: intentional burial, the timing and causes of disappearance, attribution of transitional industries. Registry candidates: `si-neanderthal-species`, `si-neanderthal-dna`, `si-feldhofer`, `science-green-2010`, `nature-krause-2010`, `nature-reich-2010`, `nature-slon-2018`.
- **Acceptance:** as T15.2.

#### T15.12 — Homo sapiens
- **Status:** TODO
- **Size:** L
- **Depends:** T15.2, T15.13
- **Steps:** Must cover: Jebel Irhoud and the other early fossils, anatomy, brain, Middle Stone Age technology and early symbolic objects, dispersal out of Africa including the Levant, Arabia and the Iranian Plateau corridor (T15.13), admixture. Debates: the timing and number of dispersals, the origin of the species (single region versus structured populations), contested early dates. Registry candidates: `nature-hublin-2017`, `nature-richter-2017`, `si-sapiens-300ka`, `si-sapiens-species`, `si-qafzeh-6-3d`, `si-singa`.
- **Acceptance:** as T15.2; consistent with the Migration corridors (P6).

#### T15.13 — Iranian Plateau evidence pack
- **Status:** TODO
- **Size:** M
- **Depends:** T15.1
- **Steps:** Verify and record the references and claims on the Iranian Plateau (Acheulean sites, Zagros Mousterian, Neanderthal remains, the northern and southern dispersal routes) from Shoaee, Vahdati Nasab & Petraglia 2021, Vahdati Nasab et al. 2019, Shoaee et al. 2023 and the primary papers they cite; mark every item that is not yet in a peer-reviewed publication (for example press reports of Neanderthal teeth from Qale-Kurd cave) as `NEEDS-REVIEW` and do not publish it until a paper exists. The same records feed the Migration corridors in P6.
- **Acceptance:** records present with DOIs and `verifiedOn`; no unpublished claim is published.

#### T15.14 — Gate: all 11 core pages complete
- **Status:** TODO
- **Size:** S
- **Depends:** T15.2, T15.3, T15.4, T15.5, T15.6, T15.7, T15.8, T15.9, T15.10, T15.11, T15.12
- **Steps:** Check that the 11 pages pass the audit, that `buildSpeciesDossier` reports Tier 2 for the claim and source checks, and that no page cites an unverified reference.
- **Acceptance:** audit and tests pass for all 11 core taxa.

#### T15.15 — Independent scientific review of the 11 pages
- **Status:** BLOCKED-OWNER
- **Size:** M
- **Depends:** T15.14
- **Steps:** A specialist reviews text, debates, references and certainty labels; record the review in section 13 and apply changes.
- **Acceptance:** review log entry per taxon (or one entry covering all) with date and scope.

#### T15.16 — Pages for the 7 non-core taxa
- **Status:** OPTIONAL
- **Size:** L
- **Depends:** T15.14
- **Steps:** Short pages from existing records (decision D-01): lead, facts, one debate, references; no image requirement.
- **Acceptance:** audit passes; optional by decision.

### P16 — Species pages: acceptance

#### T16.1 — Owner acceptance and page freeze
- **Status:** BLOCKED-OWNER
- **Size:** S
- **Depends:** T15.15, T14.12
- **Steps:** Owner checks the 11 pages on a phone and on desktop, confirms the slot matrix works with real images and approves; then regenerate the fingerprint (T12.2).
- **Acceptance:** approval recorded in section 13.

## 11. Commands

| Purpose | Command |
|---|---|
| Install | `npm ci` |
| Full release gate | `SITE_URL=https://example.com npm run qa:release` |
| Unit tests | `npx vitest run` |
| Typecheck / lint | `npx tsc --noEmit` · `npx eslint .` |
| Data validation | `npm run validate:data` |
| E2E (needs browser) | `npx playwright install chromium && npm run build && npm run test:e2e` |
| Visual baselines | `npm run test:visual:update` |
| Rebuild image catalog and prompts | `npm run images:build` |
| Version bump | `npm run bump -- X.Y.Z` |
| CMS backup / restore | `npm run backup:cms` · `npm run restore:cms` |
| Production server | `SITE_URL=… CMS_ADMIN_PASSWORD=… npm run build && npm start` |

## 12. Backlog (ideas not yet scheduled — do not implement without a task)

Persian/RTL UI (D-13) · sound/narration · timeline uncertainty bars · clickable non-species search results (check current state first) · CMS roles/users and shared rate limiting · object storage for serverless hosting · crop/reorder/batch upload (see T11.4) · data in CMS rather than code.

## 13. Review log (humans and verified checks)

| Date | Scope | Who | Result |
|---|---|---|---|
| 2026-10-04 | Production smoke test over HTTP: pages, 404s (unknown and malformed species URLs), auth redirects, forged cookie, login/logout, admin APIs, headers | Agent | Pass after fixes (see Changelog) |

## 14. Changelog (newest first; one line per change)

* 2026-10-09 — Full site review (114 pages: every species, every explorer mode and species combination, sitemap, robots, admin pages with session, status codes, titles, descriptions, lang, viewport, H1 count, alt text, JSON-LD validity, internal links and images): no broken links, no broken images, no visible “undefined”/“NaN”, all metadata present. Fixed: the misleading “TIME-LAPSE EARTH” label on the migration view (now “Time slice”); the species facts of Ardipithecus (locomotion overstated), A. anamensis (“earliest well-established”), A. africanus (climbing overstated), A. afarensis (diet inconsistent with its species page), and Neanderthal (diet). Version 0.32.5 because the catalog fingerprint changed. Open decisions: frame policy for public pages (T0.7); the numeric Orrorin time range (T15.4); species facts in the Inspector are not individually cited, only the pilot pages are (a broader fact-by-fact sourcing pass is planned under P15).
* 2026-10-09 — Bug fix: a class-D reconstruction in a named slot could not be published even after review, because the free-image rule “reconstructions must be labelled” looked for words in the note; slot images are now labelled by their class on the page, so that rule applies only to free-standing images (`infrastructure/validation/audit.ts`, regression test in `tests/cms-scientific-media.test.ts`).
* 2026-10-09 — Verified on the production build: public and admin routes, admin slot upload with server-side crop, review gate, publish, public delivery of the image, unpublish, draft delete, cross-origin write refused (403), logout, sitemap, robots and security headers. Added owner e2e specs and a run-and-test checklist in the README.
* 2026-10-09 — T15.4 started: Orrorin references (four verified), overstated locomotion and diet facts corrected; page not written (missing DOIs and post-2018 literature).
* 2026-10-09 — T15.3 drafted (NEEDS-REVIEW): Sahelanthropus pilot page; registry corrected: Daver 2022 pages (94–100) and full author list, Cazenave 2024 author list and DOI from the Max Planck press release (its earlier record had no verification), Williams 2026 without an unconfirmed page range; five new verified references (Brunet 2002, 2005; Zollikofer 2005; Lebatard 2008; Macchiarelli 2020). Version 0.32.3.
* 2026-10-09 — T15.2 drafted (NEEDS-REVIEW): A. afarensis pilot page with eight verified references and four debates; the Haile-Selassie 2019 record keeps its original id and gains verification fields (a duplicate was removed); version 0.32.2 because the catalog fingerprint changed.
* 2026-10-07 — T15.1 done: reference checklist and debate template (section 9a); Daver 2022, Cazenave 2024 and Williams 2026 added to the registry (version 0.32.1 because the catalog fingerprint changed).
* 2026-10-07 — T14.2 done, T14.3 and T14.9 built (NEEDS-REVIEW until browser checks): slot resolution, slot-aware gallery on species pages (hero frame, grouped images, evidence captions), admin slot matrix with centre-crop upload; fixed: publishing a replacement image was blocked by the duplicate-slot audit.
* 2026-10-06 — T14.6–T14.8 built (NEEDS-REVIEW until browser checks): species-page shell and components, citations and reference list, section navigation, lead used as meta description; integration test renders the real page with fixture content.
* 2026-10-06 — T14.5 done: species-page content schema, validator (word budgets, citations, banned wording, dated superlatives, italics, debates, unknowns, recency, staleness), audit in `qa:phase3`, fixture and tests.
* 2026-10-06 — Version 0.32.0 (`npm run bump`): the catalog gained four references, so its fingerprint changed (`audit:reproducibility` requires the manifest to match).
* 2026-10-06 — T14.4 done: single reference registry in `content/publications.ts` (kind, verifiedOn, verification), `domain/references.ts`, audit rules, `npm run check:references` (owner-run Crossref check), four verified Iranian Plateau papers; tests added.
* 2026-10-06 — T14.1 and T13.1 done: 237 generated slot definitions with shared publish rules (`validateSlotMedia`), CMS columns `slot_id`, `evidence_class`, `specimen_ref`, `assumptions`, `generator`, `reviewed_by`, slot exclusivity (a replacement demotes the previous image), audit rules, evidence-class label on species pages, API accepts slot uploads; tests added.
* 2026-10-06 — Species-page phases added: P14 platform (slots, admin matrix, references, UI), P15 scientific content (pilot *A. afarensis*, then 10 taxa, Iranian Plateau pack, review), P16 acceptance; section 9a (page specification, research protocol); decisions D-19…D-22; T11.1 dropped (superseded by P15); the image-pack handoff folded into T13.11; one-strategy-file rule enforced by test.
* 2026-10-05 — Prompts: strict no-anatomy rule and modesty waist-wrap convention for Homo (habilis, erectus, heidelbergensis); `ALL.md` rebuilt.
* 2026-10-05 — Stone tools added to the image plan: series `L1`–`L3` for all 11 taxa (33 rows, 18 not applicable), comparatives C17–C21, `lithics` data in `taxa.ts`, D-18; catalog is now 237 rows. Delivered image pack reviewed: 21 files re-slotted, sapiens hero missing, 2 images need regeneration, 27 need crops (T13.11); T13.7/T13.8 set to NEEDS-REVIEW.
* 2026-10-05 — `tools/images/prompts/ALL.md`: all 40 class-D prompts in one copy-ready file; prompts made independent of project file codes; editorial “verify” notes scrubbed from prompt text.
* 2026-10-04 — Image production plan: `tools/images/` (200-row catalog, 40 self-contained class-D prompts, global rules), D-15 decided, D-16/D-17 added, phase P13 added, T11.4 dropped, `tests/image-plan.test.ts` added.
* 2026-10-04 — Technical fix pass: type error and 3 stale tests, ESLint clean, dead tree components removed, soft-404 and forged-cookie 200s fixed (`app/loading.tsx` removed), malformed species URLs → 404, `output:'standalone'` made opt-in, `.nvmrc` added, `qa:release` exits 0.
* 2026-10-04 — Obsolete docs removed; this plan created; `AGENTS.md`, `tests/plan-integrity.test.ts`, `tests/site-age-consistency.test.ts` added; `docs/ARCHITECTURE.md` and `README.md` corrected.
