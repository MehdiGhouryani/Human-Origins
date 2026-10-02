# Human Origins — Architecture & Rules

Reference for how the system is built and the rules it enforces. The plan and history live in [`ROADMAP.md`](./ROADMAP.md) (Persian); setup is in the [`README`](../README.md).

## 1. Principles

1. **Canonical data is separate from presentation.** Scientific records never carry screen coordinates; layout lives in `presentation/`.
2. **No source → no factual claim.** Provenance (claim → evidence → source, with roles) is a first-class contract, verified both by declared ids and by graph traversal.
3. **Uncertainty is qualitative, never a score.** The UI names the source role, scope and dating method; it never ranks evidence with a number.
4. **Everything that can be audited is audited.** Releases are gated by `npm run qa:release`; the CMS publishes through the *same* audit.
5. **Append-only identity.** Stable ids are never silently changed; scientific-meaning changes need a migration note and produce a new catalog fingerprint.

## 2. Layers and enforced boundaries

| Directory | Responsibility | Rule (enforced by) |
|---|---|---|
| `domain/` | Types/contracts, branded ids, time engine, labels, research graph + traversal, indexes, immutability | Pure; no React/Next, no infrastructure (`audit:architecture`) |
| `content/` | Canonical data authored in TypeScript, assembled in `catalog.ts` into one frozen `ContentCatalog` | Only source of truth; no legacy data layer (`audit:architecture`) |
| `infrastructure/` | `repository.ts`, validation (`audit.ts`, fingerprint), `cms/` (SQLite store, auth, image pipeline) | Server-only (`import 'server-only'`) |
| `features/explorer/` | `bootstrap.ts` (server) builds a frozen, serializable read model; `selectors.ts`, `state.ts`, `useExplorerController.ts` (client-safe) | Only `bootstrap.ts` may touch content/infrastructure (`audit:boundaries`) |
| `presentation/` | Tree layout, palette, labels, media-delivery resolution | Display-only |
| `components/`, `app/` | React UI; admin under `app/admin`, API under `app/api/admin` | `'use client'` files may not import infrastructure or `bootstrap` except types (`audit:runtime-boundaries`) |
| `migrations/` | V21 → V23 append-only migration manifest | Never delete legacy content without a disposition record |

Data flow: `content/` → `buildResearchIndexes` / `buildResearchGraph` → `buildExplorerBootstrap(catalog, copy)` (server) → deep-frozen props → client selectors. The public page calls `getLiveContent()`, which merges **published** CMS media/copy over the built-in catalog.

## 3. Data model

**Entities** (`domain/contracts.ts`, `domain/research-model.ts`): Taxon, TaxonName, Occurrence, MaterialEntity, Specimen, Site, SiteContext, Evidence, Claim, Source, Publication, Institution, Collection, Relationship, MediaAsset, InterpretationSet/Position, RelationshipHypothesisSet/Position.

* **Ids** are branded strings (`TaxonId`, `ClaimId`, …) validated at runtime (`^[a-z0-9:-]+$`, bounded length).
* **Immutability**: the catalog is `deepFreeze`d at construction; the explorer snapshot is frozen again after hydration.
* **Fingerprint**: a deterministic hash of the whole catalog (`createCatalogFingerprint`), recorded in `public/assets/catalog-runtime-manifest.json` and checked by `audit:reproducibility`.
* **Physical material, specimen identity and occurrence are never collapsed** into one record.
* **Provenance**: Claim → Evidence → Source with role-aware links (`supports`, `documents`, `dates`, `contextualizes`, `catalogues`, `hosts`, `illustrates`, `interprets`); each claim declares an epistemic basis.
* **Uncertainty**: `ClaimUncertainty` profiles (dimension × state × note) and **interpretation sets** (competing documented positions). Relationships can carry **competing hypothesis sets** (e.g. *H. ergaster*/*erectus*; *H. erectus*/*heidelbergensis*).
* **Time** (`domain/time.ts`): canonical unit is **Ma**; site ages may be ka at the data edge (`kaToMa`/`maToKa`). `TimeInterval{olderMa,youngerMa,uncertaintyMa?,datingClass?}`. `parseAgeLabel` turns labels like `315 ± 34 ka` into intervals and deliberately returns *nothing* for qualitative labels ("Multiple periods", "~100 ka+") rather than inventing precision. Every resolved interval must declare a dating method (`MISSING_SITE_CONTEXT_DATING_CLASS`). The slider's non-linear scale is presentation-only. **Temporal overlap never implies ancestry** (`rangesOverlap`, `intervalsOverlap`, `taxaAtAge` only say who coexisted).
* **Graph** (`domain/research-graph.ts`, `graph-traversal.ts`): a deterministic projection (nodes + directional predicates such as `supported-by`, `documented-by`, `dated-by`; claims point *to* evidence). `traverse`, `findPath`, `provenanceChainForClaim` are cycle-safe; the bootstrap precomputes a serializable `provenanceChains` map for the UI. Presentation-only projections (site views, coordinates) are excluded.

**Standards (conceptual alignment, not imported ontologies):** Darwin Core (Taxon, Occurrence, MaterialEntity; measurements deferred), CIDOC CRM (explicit Institution/Collection/MaterialEntity/event boundaries), W3C PROV-O (Claim→Evidence→Source), Crossref (DOI + bibliographic metadata, reconciled as a validation step, never blind import).

**Migration rules (non-negotiable):** never fabricate ids, dates or provenance; never reinterpret a layout coordinate as geography; never collapse material/specimen/occurrence; never silently change a stable id; never treat a generated/reconstructed image as a fossil observation; never delete legacy content without a disposition record. Legacy plates are quarantined under `public/assets/legacy/` and must not return to production UI without a new provenance review.

## 4. Media

`MediaAsset` = `{subject, roles[], kind, src, variants[], credit, license?, sourceUrl, alt, note, publicationStatus, rightsStatus, sourceLinks}`.

* **Roles**: `tree-thumbnail`, `profile-portrait`, `dossier-hero`, `anatomy-plate`, `comparative-morphology`, `specimen-reference`, `habitat`, `behavior`, `scale-reference`, `gallery`, `context`. *Today the UI ignores roles and uses `defaultMediaId` everywhere — fixing this is Milestone M1.*
* **Publication status** (`approved`, `review-required`, `schematic`; `legacy`/`retired` are audit errors for live media) is separate from **rights status** (`clear`, `review-required`, `institutional-terms`, `unknown`).
* **Audit rules**: alt text required; a scientific note recommended; `approved` needs a license or source URL; `review-required` needs a source URL; a `reconstruction` must say it is a reconstruction/illustration; remote hosts are allow-listed (`upload.wikimedia.org`); local paths must be `/assets/` or `/cms-media/`.
* **Delivery** (`presentation/mediaDelivery.ts`): declared variant closest to the wanted width → `src` → Wikimedia thumbnail URL (strictly 3-segment commons paths) → raw `src`.

## 5. Explorer runtime

Server builds the bootstrap once per request; the client only reads it. URL state (`species`, `mode`, `time`, `site`, `q`, `journey`) is decoded once after mount (SSR-safe) and written back throttled. Modes: Tree, Timeline, Migration, Journey, Evidence. Inspector tabs: Overview, Evidence (Evidence graph, competing relationship hypotheses, claim ledger with provenance trail), Specimens, Lifestyle, Genetics.

## 5b. Species pages (`/species`, `/species/[id]`)

Server-rendered per request from `getLiveContent()`. `features/explorer/dossier.ts` is the pure read model: lineage and gene flow from registered relationships only, coexistence by time overlap (never ancestry), sites with dating method, merged sources, previous/next, a **computed** completeness tier (ROADMAP §8) and schema.org `Taxon` JSON-LD. Unknown ids → `notFound()`. Canonical URLs, OG, `sitemap.xml` and `robots.txt` use `SITE_URL` (`infrastructure/site/url.ts`).

## 6. CMS (`/admin`)

Self-hosted admin for species images and site copy. Requires **Node ≥ 22.5** (`node:sqlite`).

| Env var | Default | Purpose |
|---|---|---|
| `CMS_ADMIN_PASSWORD` | `change-me-now` (dev only; banner shown while unset) | Admin password — **set it in production** |
| `CMS_DB_PATH` | `.cms-data/cms.sqlite` | Media metadata, copy, history, sessions |
| `CMS_MEDIA_DIR` | `.cms-data/media` | Processed image files |

* **Upload pipeline** (`infrastructure/cms/assets.ts`, sharp): real-image validation, ≤ 20 MB, ≤ 6000 px, EXIF stripped, WebP `thumbnail`/`card`/`detail` (never upscaled; only variants that exist are declared) → saved as **draft**.
* **Publish gate**: publishing — or editing anything already live — dry-runs `validateCatalog` on the catalog *as it would become*. Failure → HTTP 422 with the audit codes; nothing is written.
* **Privacy & serving**: files are served by `app/cms-media/[id]/[file]` (strict allow-listed names; path traversal tested), **not** from `public/` (Next.js indexes `public/` at startup, so runtime uploads there would 404 until a restart). Drafts are visible only to a signed-in admin; published files are public and `immutable`-cached.
* **Copy**: slots are registered in `content/copy-registry.ts` (the single source of fallback wording); unpublishing restores built-in text. Add a slot = one registry entry + `getCopy(copy,'slot.id')`.
* **Safety nets**: `getLiveContent()` serves the built-in catalog if the CMS store cannot open or the merged catalog fails the audit. History records every upload/edit/publish/delete.
* **Auth**: one shared password, timing-safe compare, random expiring sessions (HttpOnly, SameSite=Lax). In production the dev fallback password is never accepted (login answers 503 until `CMS_ADMIN_PASSWORD` is set). Failed logins are rate-limited (5 per 15 min per client, `infrastructure/cms/rateLimit.ts`). Middleware rejects state-changing `/api/admin` calls whose Origin/Referer host differs from the serving host. Middleware only checks cookie presence (Edge runtime cannot load `node:sqlite`); the real check is in the dashboard layout and every API route.
* **Limits**: single shared admin; no roles or rate limiting (put `/admin` behind host access control); taxon-level images only; needs a persistent writable disk (on read-only/serverless hosts the public site falls back to built-in content, but uploads need an external DB + object store — `store.ts`/`assets.ts` are the seam). Back up `.cms-data/` as one volume.

## 7. Sources & editorial policy

* **Source roles**: institutional record, institutional synthesis, peer-reviewed paper, museum 3D record. Evidence is `documented` (a specific observation/specimen/result) or `interpreted` (a synthesis).
* The Smithsonian Human Origins Program records (species/specimen pages and 3D Digitization objects) are the primary institutional sources; the UI links out instead of mirroring third-party meshes. URLs live in `content/sources.ts`.
* **Publication metadata verified against publisher/PubMed records (V20):** Hublin et al. 2017 *Nature* 546:289 (10.1038/nature22336); Richter et al. 2017 *Nature* 546:293 (10.1038/nature22335); Hublin et al. 2018 correction *Nature* 558:E6 (10.1038/s41586-018-0166-3); Meyer et al. 2014 *Nature* 505:403 (10.1038/nature12788); Green et al. 2010 *Science* 328:710 (10.1126/science.1188021); Garcia et al. 2010 *Quaternary Geochronology* 5:443 (10.1016/j.quageo.2009.09.012). DOIs must be unique (`DUPLICATE_PUBLICATION_DOI`).
* Site dating-method classifications: Jebel Irhoud (thermoluminescence, 315 ± 34 ka), White Sands (`multiple`), Sterkfontein (`multiple`, genuinely conflicting estimates) and Drimolen (`multiple`) were verified against published sources; the remaining sites use established textbook classifications and still need a source-level review (Tier 3 in the roadmap).

## 8. Quality gates

`npm run qa:release` = `qa:phase3` (= `qa:phase2` + `audit:graph-traversal`) → `check` → `test` → `build`.

| Gate | Guards |
|---|---|
| `validate:syntax` | TS/TSX transpiles in all source roots |
| `audit:architecture` | No `any`/`@ts-ignore`, no legacy imports, canonical roots only |
| `audit:boundaries`, `audit:runtime-boundaries` | Server/client separation (see §2) |
| `audit:version` | `package.json` ↔ catalog ↔ manifests ↔ README release agree |
| `audit:ui` | Every button has a type and a handler (a `type="submit"` is accepted only if the file wires `onSubmit`); no dead `#` links; interactive SVG titled |
| `audit:media`, `validate:assets`, `validate:data` | Media quality, asset manifest, full referential/semantic validation of the catalog |
| `audit:research-model`, `-indexes`, `semantic`, `provenance`, `uncertainty`, `graph`, `migration`, `graph-traversal` | Model invariants, indexes, provenance, uncertainty, graph safety, migration manifest, traversal (every claim reaches a source) |
| `audit:reproducibility` | Live fingerprint equals the manifest |
| `check` | syntax + lint + data + assets + `tsc --noEmit` |
| `test` | Vitest (76 tests) |
| `build` | `next build` |

Also available: `npm run test:e2e` (Playwright, currently 2 smoke tests), `qa:installed`.
Accessibility is checked ad hoc with axe-core (WCAG A/AA) — not yet a CI gate.

## 9. Checklists

**Version bump** (no script yet — Milestone M0). Change release/schema in: `content/catalog.ts` (`schemaVersion`, `modelVersion`, `release`); `package.json` (`version`, then `npm install --package-lock-only`); `infrastructure/validation/audit.ts` and `scripts/audit-research-model-entry.ts` (pinned schema/model); `tests/bootstrap-contract.test.ts` and `tests/foundation-integrity.test.ts`; `public/assets/asset-manifest.json` (`version` = release without the leading `0.`); `public/assets/catalog-runtime-manifest.json` (release, schema, **fingerprint** — print it with `catalogRuntimeMetadata`); `README.md` (`**release**` marker). Bump the schema only when the *canonical* model changes.

**Add a taxon** (typically): `content/taxa.ts`, `taxon-names.ts`, `media.ts` (+ default media id), `relationships.ts`, `presentation/treeLayout.ts` (hand-placed coordinates today; automatic layout is Milestone M3) and lineage labels/palette; then sources, specimens, evidence, claims, sites as available. Run `npm run validate:data`.

**Add a media role / copy slot / field**: update the contract, `labels.ts`, audits and tests; scientific-meaning changes need a migration note and a new fingerprint.

## 10. Known technical debt

Hand-placed tree coordinates · media `roles` only partly used by the UI (tree icon + portrait; no tools/features sections yet) · 12 of 14 images hotlinked from Wikimedia · thin e2e · the CMS end-to-end scenario is not yet a committed Playwright test · login rate limit is per process (in-memory) · the whole catalog is serialized to the client on the atlas page.
