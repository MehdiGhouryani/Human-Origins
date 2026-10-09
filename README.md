# Human Origins

An interactive, research-oriented atlas of human evolution: an evolutionary tree, timeline, migration globe and evidence explorer built on an auditable data model (claim → evidence → source, qualitative uncertainty, competing hypotheses).

## Current release

**0.32.5** — catalog schema `4.2.0`

Status in one line: strong, tested foundation (data model, provenance, uncertainty, graph, CMS) and a green `qa:release`; the home graph shows the **11-taxon main path** by design (the other 7 taxa keep their own species pages). The Migration view is the next major build. Everything that remains is in the single plan: [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md).

## Documentation

| File | What it covers |
|---|---|
| [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md) | **The only plan.** Phased, step-by-step, written for AI agents and updated after every change. Read it first. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layers and enforced boundaries, data model, media, CMS, editorial rules, quality gates, checklists |
| [`tools/images/`](tools/images/prompts/_global.md) | Image production plan: 200-row catalog (`catalog.csv`/`.json`) and self-contained prompts for reconstructions (`npm run images:build`) |
| [`AGENTS.md`](AGENTS.md) | Five-line entry point for AI coding agents |
| `docs/reference-ui.png`, `docs/mobile-qa/` | Original UI reference and mobile QA screenshots |

## Quick start

Requires **Node ≥ 22.5** (`.nvmrc`; the CMS uses the built-in `node:sqlite`).

```bash
npm install
npm run dev          # http://localhost:3000
npm run qa:release   # full release gate: audits + lint + typecheck + tests + build
```

Admin CMS: <http://localhost:3000/admin> · Species pages: <http://localhost:3000/species>

| Env var | Default | Purpose |
|---|---|---|
| `CMS_ADMIN_PASSWORD` | `change-me-now` (dev only) | Admin password: **required in production** (login is disabled without it) |
| `SITE_URL` | `http://localhost:3000` in development; required HTTPS URL in production | Public origin for canonical links, sitemap, OG and JSON-LD |
| `TRUST_PROXY` | `0` | Set to `1` only behind a trusted reverse proxy that overwrites forwarding headers; enables per-client login throttling |
| `CMS_DB_PATH` | `.cms-data/cms.sqlite` | CMS database |
| `CMS_MEDIA_DIR` | `.cms-data/media` | Uploaded images |

For production, set `SITE_URL=https://your-domain` during the build as well as runtime; production builds fail without it. Back up the CMS with `npm run backup:cms -- /backups/unique-name`, and restore safely into a new directory with `npm run restore:cms -- /backups/unique-name /data/cms-restored`.

## Run and test: owner checklist

Run these in order. Each step says what success looks like.

1. **Install and gate.** `npm install` then `SITE_URL=https://example.com npm run qa:release`. Success: the command exits 0 and ends with the build. The gate runs the audits, lint, typecheck, the unit tests and the production build.
2. **Run the site.** `CMS_ADMIN_PASSWORD=choose-a-password npm run dev` and open <http://localhost:3000/species/afarensis>. Success: the page shows the heading, *At a glance*, *What is debated* and a *Sources* list at the end; the phone-width layout collapses the sections.
3. **Admin slots.** Open <http://localhost:3000/admin/login>, sign in, then go to *Image slots*. Choose a species, use *Upload* on an empty card, pick a photograph, fill *Alt text* and *Note*, and upload. Publish a reconstruction (class D) only after you add the assumptions sheet, the generator and a reviewer decision of *Approve*. Success: the image appears on the species page with its class caption.
4. **Browser tests (not run in the build sandbox).** `npx playwright install chromium`, then `CMS_ADMIN_PASSWORD=choose-a-password npm run test:e2e`. Success: all specs pass. The first run may need `npm run test:visual:update` to create the visual baselines, which you then review and commit.
5. **Reference check (needs internet).** `npm run check:references` compares every publication DOI with Crossref. Fix any mismatch in `content/publications.ts` before a page cites that reference.

If a step fails, send the exact command and the first error lines; the status of each task is in `docs/IMPLEMENTATION-PLAN.md`.

## Useful commands

| Command | Purpose |
|---|---|
| `npm run qa:release` | Everything that must pass before a release |
| `npm run validate:data` | Validate the whole catalog |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright smoke + species-page tests |
| `npm run build:standalone` | Self-contained server build for VPS / container hosts |
| `npm run backup:cms` | Consistent snapshot of `.cms-data/` (SQLite + media) |
| `npm run typecheck` · `npm run lint` | Types / architecture + UI audits + ESLint |

## Repository map

```
domain/            contracts, time engine, research graph + traversal (pure)
content/           canonical data (TypeScript) → one frozen catalog
infrastructure/    repository, catalog validation, CMS (server-only)
features/explorer/ server bootstrap + client-safe selectors/state
presentation/      tree layout, palette, media delivery (display only)
components/ app/   React UI, /admin, /api/admin, /cms-media
scripts/ tests/    audits and tests (the quality gates)
```

Rules that never change: no source → no factual claim; uncertainty is qualitative (no confidence scores); reconstructions are never presented as fossil photographs; nothing is published without passing the audit.
