import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {migrationCorridorsById} from '../content/migration-corridors'
import {routes} from '../presentation/migrationScene'
import {validateCatalog} from '../infrastructure/validation/audit'
import {buildExplorerBootstrap} from '../features/explorer/bootstrap'
import {getExplorerMigrationCorridors,getExplorerMigrationCorridorById} from '../features/explorer/selectors'
import manifest from '../public/assets/catalog-runtime-manifest.json'
import {catalogRuntimeMetadata} from '../infrastructure/validation/fingerprint'

describe('Migration Corridor Data Model and Provenance Phase 3', () => {
  it('1. Preserves exactly the same four corridor IDs', () => {
    const ids = contentCatalog.migrationCorridors.map((c) => String(c.id))
    expect(ids).toEqual(['out-of-africa', 'eastern-route', 'central-asia', 'americas'])
    expect(contentCatalog.migrationCorridors.length).toBe(4)
  })

  it('2. Preserves corridor coordinate tuples, origin/destination labels, and display labels', () => {
    const outOfAfrica = migrationCorridorsById['out-of-africa']
    expect(outOfAfrica).toBeDefined()
    expect(outOfAfrica.label).toBe('Africa → Arabia → Eurasia')
    expect(outOfAfrica.originLabel).toBe('East Africa')
    expect(outOfAfrica.destinationLabel).toBe('Western Europe')
    expect(outOfAfrica.coordinates).toEqual([[36, 2], [48, 25], [35, 32], [35, 39], [8, 48]])

    const americas = migrationCorridorsById['americas']
    expect(americas).toBeDefined()
    expect(americas.label).toBe('Northeast Asia → Americas')
    expect(americas.originLabel).toBe('Siberia')
    expect(americas.destinationLabel).toBe('South America')
    expect(americas.coordinates).toEqual([[87, 51], [140, 52], [170, 55], [-165, 55], [-130, 50], [-105, 40], [-65, -15]])
  })

  it('3. Rejects invalid coordinates (out-of-bounds longitude or latitude)', () => {
    const testCoordinates = (coords: readonly (readonly [number, number])[]) => {
      return coords.every(([lon, lat]) => lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90)
    }

    expect(testCoordinates([[190, 0]])).toBe(false)
    expect(testCoordinates([[0, 95]])).toBe(false)
    expect(testCoordinates([[-181, -40]])).toBe(false)

    for (const corridor of contentCatalog.migrationCorridors) {
      expect(testCoordinates(corridor.coordinates)).toBe(true)
    }
  })

  it('4. Preserves valid temporal display windows and window-filtering compatibility', () => {
    for (const corridor of contentCatalog.migrationCorridors) {
      const {startMa, endMa} = corridor.temporalWindow
      expect(startMa).toBeGreaterThan(endMa)
      expect(startMa).toBeLessThanOrEqual(8)
      expect(endMa).toBeGreaterThanOrEqual(0)
    }

    const projectedRoutes = routes
    expect(projectedRoutes.length).toBe(4)
    expect(projectedRoutes.find((r) => r.id === 'out-of-africa')?.startKa).toBe(60)
    expect(projectedRoutes.find((r) => r.id === 'out-of-africa')?.endKa).toBe(5)
  })

  it('5. Every corridor reference resolves to valid canonical IDs in the catalog', () => {
    const claimIds = new Set(contentCatalog.claims.map((c) => String(c.id)))
    const evidenceIds = new Set(contentCatalog.evidence.map((e) => String(e.id)))
    const sourceIds = new Set(contentCatalog.sources.map((s) => String(s.id)))
    const taxonIds = new Set(contentCatalog.taxa.map((t) => String(t.id)))

    for (const corridor of contentCatalog.migrationCorridors) {
      expect(taxonIds.has(String(corridor.taxonId))).toBe(true)
      for (const cid of corridor.claimIds) {
        expect(claimIds.has(String(cid))).toBe(true)
      }
      for (const eid of corridor.evidenceIds) {
        expect(evidenceIds.has(String(eid))).toBe(true)
      }
      for (const sid of corridor.sourceIds) {
        expect(sourceIds.has(String(sid))).toBe(true)
      }
    }
  })

  it('6. Explicit source-link roles do not incorrectly label a contextual synthesis as direct proof', () => {
    for (const corridor of contentCatalog.migrationCorridors) {
      expect(corridor.sourceLinks.length).toBeGreaterThan(0)
      for (const link of corridor.sourceLinks) {
        // Dispersal summary source must be contextualizes, not supports/direct proof
        if (String(link.sourceId) === 'si-dispersal-summary' || String(link.sourceId) === 'si-human-evidence') {
          expect(link.role).toBe('contextualizes')
        }
      }
    }
  })

  it('7. Corridor is represented as schematic/hypothesis-scale, without numeric confidence scores', () => {
    for (const corridor of contentCatalog.migrationCorridors) {
      expect(['schematic-corridor']).toContain(corridor.geometryKind)
      expect(['continent-scale', 'hypothesis-scale']).toContain(corridor.spatialScale)
      expect(corridor.spatialLimitationNote).toBeDefined()
      expect(corridor.spatialLimitationNote.length).toBeGreaterThan(10)
      // Assert no numeric confidence score on canonical record
      expect((corridor as Record<string, unknown>).confidence).toBeUndefined()
      expect((corridor as Record<string, unknown>).certaintyScore).toBeUndefined()
    }
  })

  it('8. Bootstrap and selectors project canonical migration corridors', () => {
    const bootstrap = buildExplorerBootstrap()
    const corridors = getExplorerMigrationCorridors(bootstrap)
    expect(corridors.length).toBe(4)

    const corridor = getExplorerMigrationCorridorById(bootstrap, 'out-of-africa')
    expect(corridor).toBeDefined()
    expect(corridor?.label).toBe('Africa → Arabia → Eurasia')
  })

  it('9. Catalog fingerprint and runtime manifest stay reproducible and audit passes', () => {
    const auditReport = validateCatalog()
    expect(auditReport.ok).toBe(true)
    expect(auditReport.errors).toBe(0)

    expect(manifest.release).toBe(catalogRuntimeMetadata.release)
    expect(manifest.schemaVersion).toBe(catalogRuntimeMetadata.schemaVersion)
    expect(manifest.fingerprint).toBe(catalogRuntimeMetadata.fingerprint)
    expect(manifest.counts.migrationCorridors).toBe(4)
  })
})
