# Human Origins

An interactive, research-oriented atlas of human evolution: an evolutionary tree, timeline, migration globe and evidence explorer built on an auditable data model (claim → evidence → source, qualitative uncertainty, competing hypotheses).

## Current release

**0.30.0** — catalog schema `4.2.0`

Status in one line: strong, tested foundation (data model, provenance, uncertainty, graph, CMS); **content coverage is still small** — 18 curated taxa, one image each. Every taxon now has a species page (`/species/[id]`) with a computed completeness tier. See the plan in [`docs/ROADMAP.md`](docs/ROADMAP.md) (Persian).

## Documentation

| File | What it covers |
|---|---|
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | **Path so far, honest gap analysis, and the completion plan** — image system, species pages, tree completion, content tiers, milestones (Persian) |
| [`docs/PHASES.md`](docs/PHASES.md) | Historical execution plan and deployment notes (Persian) |
| [`docs/REVIEW-0.29-deep.md`](docs/REVIEW-0.29-deep.md) | Deep code/data review with applied-fix status and remaining content/release work (Persian) |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Layers and enforced boundaries, data model, media, CMS, editorial rules, quality gates, checklists (English) |
| `docs/reference-ui.png` | Original UI design reference |

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
