# 0.29.0: release-candidate pass (fixes, mobile, test coverage)

Builds on the 0.29 mobile pass (docs/CHANGES-0.29-mobile.md). The release is now actually 0.29.0 everywhere.

## Bugs fixed
1. **Version mismatch**: the folder/zip said v29, while the package, catalog, manifests, README and Hero badge said 0.28.0. Bumped to **0.29.0** with the new `npm run bump X.Y.Z` (scripts/bump-version.mjs), which also regenerates the fingerprint and asset hashes.
2. **CI was red**: `validate:assets` failed (asset-manifest `version` was stuck at 25.3), which broke `qa:release`. Fixed by the bump script.
3. **`typecheck:foundation` could not find `tsc`** outside CI (`bash -lc` reset PATH).
4. **Phones/tablets: scroll inside scroll.** Timeline, Migration, Evidence and Journey were trapped in a ~300px inner scroll box. Now only the Tree keeps a bounded panel (`.tree-shell.is-tree` / `.is-panel`).
5. **Migration globe on phones**: the Earth used about 40% of the width, and evidence markers were about 2px (impossible to tap). Phones now get a cropped viewBox around the globe, constant-size markers and a 24px hit area.
6. **Globe markers/corridors could not be clicked**, because pointerdown captured the pointer for a drag. Drag now starts only on empty map with the primary button.
7. **Globe drag performance**: rotation updates are coalesced per animation frame; continents, graticule and corridor paths are memoized.
8. **"300 kaPresent"**: overlapping axis labels on phones (time bar and Timeline scale).
9. **Small text**: about 40 label styles rendered at 9–10px on ≤820px. There is now an 11px floor, and tree labels are compensated for the scaled drawing.
10. **Mobile menu accessibility**: focus moves into the menu, Tab is trapped, Escape closes and returns focus to the toggle, a tap outside closes it, there is a visible focus ring (it was `outline:none`), and targets are 44px.
11. **Global focus ring** for every interactive element without a specific style. Inspector tabs support Home/End.
12. **Neanderthal asset**: replaced with a caption-free crop. The old file had the caption baked into the pixels (original kept outside the repo).

## CSS
- Removed about 70 dead rules (classes no longer present in any component), 125 declarations overridden later by the same selector, and duplicates. Reformatted from minified one-liners to one declaration per line.
- Verified pixel-identical: before/after screenshots at 320/390/768/1024/1440px for every mode and page (the only differences were sub-threshold anti-aliasing).

## Tests
- `tests/e2e/responsive.spec.ts`: no horizontal overflow at 320–1024 on 7 routes, an 11px text floor, no nested scroll trap, mobile-menu focus contract, and touch target sizes.
- `tests/e2e/visual.spec.ts`: full-page visual baselines on desktop, Pixel 7, iPhone SE and iPad Mini projects. Generate baselines once in CI/Linux with `npm run test:visual:update` and commit them.
- CI runs `next build` and then e2e against the production server.

## Still to verify on your side
`npm ci && npm run qa:release && npm run test:e2e` (Next 16 is not available in the authoring sandbox), plus a real-device pass on iOS Safari and Android Chrome.
