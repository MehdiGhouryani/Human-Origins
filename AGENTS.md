# Agent entry point

1. Read `docs/HUMAN-ORIGINS-FIX-PLAN.md` completely before changing code. It is the approved basis for all work in this repository. The former implementation plan has been retired; do not look for it.
2. Work through the phases in order, starting with phase 0. Follow each phase's steps and its acceptance criteria (marked `پذیرش:` in the plan). Do not start a phase whose predecessor is not accepted.
3. A phase is done only when its acceptance checks pass and `npm run qa:release` exits 0 (`SITE_URL=https://example.com` is required for the build).
4. Do not edit the plan. It is pinned by SHA-256 in `tests/plan-integrity.test.ts`. Status changes and corrections are reported to the owner, who decides whether to amend the plan and update the pinned hash in the same change.
5. If a plan item conflicts with an owner decision, do not resolve it silently. Report the conflict and leave the item unchanged.
6. Never invent scientific facts, dates, DOIs or licences. Unverified items stay unverified and are reported as such.
7. Keep `docs/ARCHITECTURE.md` as the reference for layers and rules. Do not add plans, task lists or status tables to any document other than the plan.
