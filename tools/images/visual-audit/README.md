# CMS media visual-only thumbnail inventory

This file records a first-pass visual review of the 31 committed CMS media directories.

## Counts

- 10 portrait reconstructions
- 10 habitat/story scenes
- 8 environment-only plates
- 3 behaviour/tool-use scenes

## Important boundary

The descriptions and candidate roles are based only on the thumbnails. They are **not** assignments to a taxon, slot, specimen, source or licence. No species IDs or slot IDs have been inferred from appearance. The CSV deliberately leaves `taxonId`, `slotId`, `sourceId` and `rightsStatus` blank, and every row has `assignmentStatus=unassigned-visual-only`.

## Reconciliation

Join the CSV to the sanitized output of `npm run export:cms-media` by `mediaId`. Use the CMS record's taxon, slot, source, rights, assumptions, variants and review state as the authority. Then verify candidate role against `content/media-slots.generated.ts` and the media gate. A file must not be published until source/rights and required scientific review are confirmed.

The original files remain unchanged in `.cms-data/media/<mediaId>/`. This inventory does not move, rename, delete or publish any files.
