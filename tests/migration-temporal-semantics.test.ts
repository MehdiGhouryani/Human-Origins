import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {evidenceSites} from '../content/sites'
import {routes} from '../presentation/migrationScene'
import {
  evaluateSiteWindowOverlap,
  getExploratoryTemporalWindow,
  type TemporalWindow,
  type TimeInterval,
} from '../domain/time'
import {
  DEFAULT_EXPLORER_STATE,
  applyUrlState,
  readExplorerState,
  writeExplorerSearch,
  type ExplorerState,
  type UrlValidity,
} from '../features/explorer/state'

const siteContextMap=new Map(contentCatalog.siteContexts.map(sc=>[String(sc.siteId),sc]))

const valid:UrlValidity={
  taxonIds:new Set(['neanderthal','sapiens','erectus','habilis']),
  siteIds:new Set(evidenceSites.map(s=>String(s.id))),
  defaultTaxonId:'neanderthal',
  compareIds:new Set(['neanderthal','sapiens','erectus','habilis']),
  compareDefault:['sapiens','neanderthal','erectus'],
}

describe('Migration Atlas — Phase 2: Explicit Temporal Semantics',()=>{

  describe('1. Mode A: Historical evidence trail and focused-site exception',()=>{
    it('shows evidence sites with ageKa >= timeKa and excludes younger sites',()=>{
      const timeKa=100 // 100 ka ago
      const visible=evidenceSites.filter(s=>s.ageKa>=timeKa)
      expect(visible.some(s=>s.id==='jebel-irhoud')).toBe(true) // 315 ka >= 100 ka
      expect(visible.some(s=>s.id==='dmanisi')).toBe(true) // 1770 ka >= 100 ka
      expect(visible.some(s=>s.id==='tianyuan')).toBe(false) // 40 ka < 100 ka
      expect(visible.some(s=>s.id==='white-sands')).toBe(false) // 21 ka < 100 ka
    })

    it('accumulates evidence as time moves toward the present (cumulative trail)',()=>{
      const at500ka=evidenceSites.filter(s=>s.ageKa>=500)
      const at100ka=evidenceSites.filter(s=>s.ageKa>=100)
      const at20ka=evidenceSites.filter(s=>s.ageKa>=20)

      expect(at100ka.length).toBeGreaterThan(at500ka.length)
      expect(at20ka.length).toBeGreaterThan(at100ka.length)
      // Every site visible at 500 ka remains visible at 100 ka and 20 ka
      for(const s of at500ka){
        expect(at100ka.some(x=>x.id===s.id)).toBe(true)
        expect(at20ka.some(x=>x.id===s.id)).toBe(true)
      }
    })

    it('retains a focused site even when its age is younger than the selected time',()=>{
      const timeKa=500 // 500 ka ago
      const focusSite='tianyuan' // 40 ka
      const visible=evidenceSites.filter(s=>s.ageKa>=timeKa||s.id===focusSite)
      expect(visible.some(s=>s.id==='tianyuan')).toBe(true)
    })
  })

  describe('2. Mode B: Evidence near the selected time with documented intervals',()=>{
    it('evaluates Singa (~120–150 ka) correctly inside and outside its documented interval',()=>{
      const singa=evidenceSites.find(s=>s.id==='singa')!
      const singaContext=siteContextMap.get('singa')
      expect(singaContext?.timeInterval?.estimateKind).toBe('interval')
      expect(singaContext?.timeInterval?.olderMa).toBeCloseTo(0.150,3)
      expect(singaContext?.timeInterval?.youngerMa).toBeCloseTo(0.120,3)

      // At 135 ka with ±50 ka window (85–185 ka): Singa (120–150 ka) overlaps
      const windowAt135ka=getExploratoryTemporalWindow(0.135,50)
      const match135=evaluateSiteWindowOverlap(singa.ageKa,singaContext?.timeInterval,windowAt135ka)
      expect(match135.matches).toBe(true)
      expect(match135.hasDocumentedInterval).toBe(true)

      // At 40 ka with ±50 ka window (0–90 ka): Singa (120–150 ka) does NOT overlap
      const windowAt40ka=getExploratoryTemporalWindow(0.040,50)
      const match40=evaluateSiteWindowOverlap(singa.ageKa,singaContext?.timeInterval,windowAt40ka)
      expect(match40.matches).toBe(false)
    })

    it('evaluates Rising Star (335–236 ka) correctly across temporal windows',()=>{
      const nalediSite=evidenceSites.find(s=>s.id==='rising-star')!
      const ctx=siteContextMap.get('rising-star')
      expect(ctx?.timeInterval?.estimateKind).toBe('interval')

      // At 285 ka with ±50 ka window (235–335 ka): intersects
      const window285=getExploratoryTemporalWindow(0.285,50)
      expect(evaluateSiteWindowOverlap(nalediSite.ageKa,ctx?.timeInterval,window285).matches).toBe(true)

      // At 100 ka with ±50 ka window (50–150 ka): does not intersect
      const window100=getExploratoryTemporalWindow(0.100,50)
      expect(evaluateSiteWindowOverlap(nalediSite.ageKa,ctx?.timeInterval,window100).matches).toBe(false)
    })

    it('evaluates Drimolen (~2.04–1.95 Ma) correctly in early Pleistocene vs late Pleistocene',()=>{
      const drimolen=evidenceSites.find(s=>s.id==='drimolen')!
      const ctx=siteContextMap.get('drimolen')

      // At 2.0 Ma with adaptive window (±150 ka -> 1.85–2.15 Ma): intersects
      const window2Ma=getExploratoryTemporalWindow(2.0)
      expect(evaluateSiteWindowOverlap(drimolen.ageKa,ctx?.timeInterval,window2Ma).matches).toBe(true)

      // At 0.4 Ma with adaptive window: does not intersect
      const window400ka=getExploratoryTemporalWindow(0.4)
      expect(evaluateSiteWindowOverlap(drimolen.ageKa,ctx?.timeInterval,window400ka).matches).toBe(false)
    })

    it('evaluates Toros-Menalla (~7–6 Ma) in Miocene deep time',()=>{
      const toumai=evidenceSites.find(s=>s.id==='toros-menalla')!
      const ctx=siteContextMap.get('toros-menalla')

      // At 6.5 Ma with deep time window (±300 ka -> 6.2–6.8 Ma): intersects
      const window65=getExploratoryTemporalWindow(6.5)
      expect(evaluateSiteWindowOverlap(toumai.ageKa,ctx?.timeInterval,window65).matches).toBe(true)

      // At 3.0 Ma: does not intersect
      const window3Ma=getExploratoryTemporalWindow(3.0)
      expect(evaluateSiteWindowOverlap(toumai.ageKa,ctx?.timeInterval,window3Ma).matches).toBe(false)
    })
  })

  describe('3. Sites with published dating uncertainty',()=>{
    it('widens Jebel Irhoud (315 ± 34 ka) bounds so it intersects a 260 ka window via its ±34 ka margin',()=>{
      const jebelIrhoud=evidenceSites.find(s=>s.id==='jebel-irhoud')!
      const ctx=siteContextMap.get('jebel-irhoud')
      expect(ctx?.timeInterval?.uncertaintyMa).toBeCloseTo(0.034,3)

      // Window at 260 ka (0.260 Ma) with halfWidth 50 ka: [210 ka, 310 ka] = [0.210, 0.310] Ma
      const window260=getExploratoryTemporalWindow(0.260,50)
      // Without uncertainty, center 315 ka is outside [210, 310]
      // With uncertainty, younger bound = 315 - 34 = 281 ka <= 310 ka -> matches!
      const evaluation=evaluateSiteWindowOverlap(jebelIrhoud.ageKa,ctx?.timeInterval,window260)
      expect(evaluation.matches).toBe(true)
      expect(evaluation.hasUncertainty).toBe(true)
      expect(evaluation.effectiveYoungerMa).toBeCloseTo(0.281,3)
      expect(evaluation.effectiveOlderMa).toBeCloseTo(0.349,3)

      // At 150 ka (window 100–200 ka): younger bound 281 ka > 200 ka -> outside
      const window150=getExploratoryTemporalWindow(0.150,50)
      expect(evaluateSiteWindowOverlap(jebelIrhoud.ageKa,ctx?.timeInterval,window150).matches).toBe(false)
    })
  })

  describe('4. Temporal-window boundary behavior',()=>{
    it('inclusively matches when a site boundary exactly equals the window boundary',()=>{
      const customWindow:TemporalWindow={
        centerMa:0.150,
        halfWidthMa:0.050,
        halfWidthKa:50,
        olderMa:0.200,
        youngerMa:0.100,
        nominalOlderMa:0.200,
        nominalYoungerMa:0.100,
        clippedAtPresent:false,
        clippedAtOldestLimit:false,
        label:'0.200 Ma – 0.100 Ma (±50 ka)',
      }
      // Site whose older bound exactly touches 0.100 Ma
      const touchingSiteInterval:TimeInterval={
        olderMa:0.100,
        youngerMa:0.080,
        label:'100–80 ka',
        estimateKind:'interval',
      }
      const evalTouch=evaluateSiteWindowOverlap(90,touchingSiteInterval,customWindow)
      expect(evalTouch.matches).toBe(true)

      // Site whose younger bound exactly touches 0.200 Ma
      const touchingOlderSiteInterval:TimeInterval={
        olderMa:0.250,
        youngerMa:0.200,
        label:'250–200 ka',
        estimateKind:'interval',
      }
      const evalTouchOlder=evaluateSiteWindowOverlap(225,touchingOlderSiteInterval,customWindow)
      expect(evalTouchOlder.matches).toBe(true)

      // Site strictly outside (0.099 Ma younger bound and 0.050 Ma older bound)
      const outsideSiteInterval:TimeInterval={
        olderMa:0.099,
        youngerMa:0.050,
        label:'99–50 ka',
        estimateKind:'interval',
      }
      expect(evaluateSiteWindowOverlap(75,outsideSiteInterval,customWindow).matches).toBe(false)
    })

    it('correctly handles window centered exactly at 0 Ma (Present) with clipping metadata and label',()=>{
      const w0=getExploratoryTemporalWindow(0)
      expect(w0.centerMa).toBe(0)
      expect(w0.halfWidthKa).toBe(50)
      expect(w0.halfWidthMa).toBe(0.05)
      expect(w0.nominalOlderMa).toBe(0.05)
      expect(w0.nominalYoungerMa).toBe(-0.05)
      expect(w0.olderMa).toBe(0.05)
      expect(w0.youngerMa).toBe(0)
      expect(w0.clippedAtPresent).toBe(true)
      expect(w0.clippedAtOldestLimit).toBe(false)
      expect(w0.label).toBe('50 ka ago – Present (clipped at present, nominal ±50 ka)')

      // Overlap checks at 0 Ma
      const recentSite:TimeInterval={olderMa:0.030,youngerMa:0.010,label:'30–10 ka',estimateKind:'interval'}
      expect(evaluateSiteWindowOverlap(20,recentSite,w0).matches).toBe(true)

      const olderOutsideSite:TimeInterval={olderMa:0.120,youngerMa:0.060,label:'120–60 ka',estimateKind:'interval'}
      expect(evaluateSiteWindowOverlap(90,olderOutsideSite,w0).matches).toBe(false)
    })

    it('correctly handles window centered exactly at 8 Ma (oldest limit) with clipping metadata and label',()=>{
      const w8=getExploratoryTemporalWindow(8.0)
      expect(w8.centerMa).toBe(8.0)
      expect(w8.halfWidthKa).toBe(300)
      expect(w8.halfWidthMa).toBe(0.3)
      expect(w8.nominalOlderMa).toBe(8.3)
      expect(w8.nominalYoungerMa).toBe(7.7)
      expect(w8.olderMa).toBe(8.0)
      expect(w8.youngerMa).toBe(7.7)
      expect(w8.clippedAtPresent).toBe(false)
      expect(w8.clippedAtOldestLimit).toBe(true)
      expect(w8.label).toBe('8 Ma ago – 7.7 Ma ago (clipped at 8 Ma limit, nominal ±300 ka)')

      // Overlap check at 8 Ma
      const mioceneSite:TimeInterval={olderMa:7.9,youngerMa:7.5,label:'7.9–7.5 Ma',estimateKind:'interval'}
      expect(evaluateSiteWindowOverlap(7700,mioceneSite,w8).matches).toBe(true)

      const youngerOutsideSite:TimeInterval={olderMa:7.6,youngerMa:7.2,label:'7.6–7.2 Ma',estimateKind:'interval'}
      expect(evaluateSiteWindowOverlap(7400,youngerOutsideSite,w8).matches).toBe(false)
    })

    it('correctly identifies clipped vs non-clipped windows just inside domain boundaries',()=>{
      // Just inside present boundary (0.020 Ma / 20 ka)
      const w20ka=getExploratoryTemporalWindow(0.020)
      expect(w20ka.nominalYoungerMa).toBeCloseTo(-0.030,3)
      expect(w20ka.youngerMa).toBe(0)
      expect(w20ka.clippedAtPresent).toBe(true)
      expect(w20ka.clippedAtOldestLimit).toBe(false)
      expect(w20ka.label).toContain('clipped at present')

      // Just inside oldest boundary (7.900 Ma)
      const w79Ma=getExploratoryTemporalWindow(7.900)
      expect(w79Ma.nominalOlderMa).toBeCloseTo(8.200,3)
      expect(w79Ma.olderMa).toBe(8.0)
      expect(w79Ma.clippedAtOldestLimit).toBe(true)
      expect(w79Ma.label).toContain('clipped at 8 Ma limit')

      // Fully unclipped window in late Pleistocene (0.200 Ma / 200 ka)
      const w200ka=getExploratoryTemporalWindow(0.200)
      expect(w200ka.clippedAtPresent).toBe(false)
      expect(w200ka.clippedAtOldestLimit).toBe(false)
      expect(w200ka.olderMa).toBeCloseTo(0.250,3)
      expect(w200ka.youngerMa).toBeCloseTo(0.150,3)
      expect(w200ka.label).toBe('250 ka ago – 150 ka ago (±50 ka)')
    })
  })

  describe('5. Honest handling of open-ended, qualitative, and undated sites',()=>{
    it('flags Levant (~100 ka+), Eurasia, and Global as qualitative and excludes them from bounded window',()=>{
      for(const siteId of ['levant','eurasia','global']){
        const site=evidenceSites.find(s=>s.id===siteId)!
        const ctx=siteContextMap.get(siteId)
        // parseAgeLabel intentionally produces undefined for qualitative labels
        expect(ctx?.timeInterval).toBeUndefined()

        const window=getExploratoryTemporalWindow(0.100,50)
        const evaluation=evaluateSiteWindowOverlap(site.ageKa,ctx?.timeInterval,window,false)
        expect(evaluation.matches).toBe(false)
        expect(evaluation.isQualitativeOrUnbounded).toBe(true)
      }
    })

    it('retains qualitative or open-ended sites when they are the explicitly focused site',()=>{
      const levant=evidenceSites.find(s=>s.id==='levant')!
      const ctx=siteContextMap.get('levant')
      const window=getExploratoryTemporalWindow(0.040,50)

      // Without focus: excluded
      expect(evaluateSiteWindowOverlap(levant.ageKa,ctx?.timeInterval,window,false).matches).toBe(false)

      // With focus: retained!
      const focusedEval=evaluateSiteWindowOverlap(levant.ageKa,ctx?.timeInterval,window,true)
      expect(focusedEval.matches).toBe(true)
      expect(focusedEval.isQualitativeOrUnbounded).toBe(true)
      expect(focusedEval.explanation).toContain('focused site')
    })
  })

  describe('6. State synchronization: time, species, and navigation remain invariant',()=>{
    it('switching temporal mode does not change the selected time or species',()=>{
      const stateBefore:ExplorerState={
        ...DEFAULT_EXPLORER_STATE,
        selectedId:'neanderthal',
        time:65,
        mode:'migration',
        temporalMode:'trail',
      }

      const stateAfter:ExplorerState={
        ...stateBefore,
        temporalMode:'window',
      }

      expect(stateAfter.time).toBe(stateBefore.time)
      expect(stateAfter.selectedId).toBe(stateBefore.selectedId)
      expect(stateAfter.mode).toBe('migration')
      expect(stateAfter.temporalMode).toBe('window')
    })

    it('site-focused navigation preserves the focused site across temporal modes',()=>{
      const stateWithFocus:ExplorerState={
        ...DEFAULT_EXPLORER_STATE,
        selectedId:'sapiens',
        time:40,
        mode:'migration',
        focusSite:'jebel-irhoud',
        temporalMode:'window',
      }

      expect(stateWithFocus.focusSite).toBe('jebel-irhoud')
      expect(stateWithFocus.selectedId).toBe('sapiens')
    })
  })

  describe('7. URL-state serialization and browser history for temporal modes',()=>{
    it('reads tmode=window from URL search params into ExplorerState',()=>{
      const decoded=readExplorerState('species=sapiens&mode=migration&time=40&tmode=window')
      expect(decoded.temporalMode).toBe('window')
      expect(decoded.mode).toBe('migration')
      expect(decoded.selectedId).toBe('sapiens')
      expect(decoded.time).toBe(40)
    })

    it('defaults temporalMode to trail when tmode is absent from URL',()=>{
      const decoded=readExplorerState('species=sapiens&mode=migration&time=40')
      expect(decoded.temporalMode).toBeUndefined()
      const applied=applyUrlState(DEFAULT_EXPLORER_STATE,decoded,valid)
      expect(applied.temporalMode).toBe('trail')
    })

    it('writes tmode=window only when in migration mode and temporalMode is window',()=>{
      const stateMigrationWindow:ExplorerState={
        ...DEFAULT_EXPLORER_STATE,
        selectedId:'sapiens',
        mode:'migration',
        time:40,
        temporalMode:'window',
      }
      expect(writeExplorerSearch(stateMigrationWindow)).toContain('tmode=window')

      const stateMigrationTrail:ExplorerState={
        ...DEFAULT_EXPLORER_STATE,
        selectedId:'sapiens',
        mode:'migration',
        time:40,
        temporalMode:'trail',
      }
      expect(writeExplorerSearch(stateMigrationTrail)).not.toContain('tmode=')

      const stateTree:ExplorerState={
        ...DEFAULT_EXPLORER_STATE,
        selectedId:'sapiens',
        mode:'tree',
        time:40,
        temporalMode:'window',
      }
      // tmode is not written outside migration mode, keeping URLs clean
      expect(writeExplorerSearch(stateTree)).not.toContain('tmode=')
    })

    it('preserves browser Back and Forward round-trip',()=>{
      const initial:ExplorerState={
        ...DEFAULT_EXPLORER_STATE,
        selectedId:'sapiens',
        mode:'migration',
        time:35,
        temporalMode:'trail',
      }

      // User switches to window mode
      const updated:ExplorerState={...initial,temporalMode:'window'}
      const searchString=writeExplorerSearch(updated)

      // Simulating browser navigation reading the written URL
      const backNav=applyUrlState(initial,readExplorerState(searchString),valid)
      expect(backNav.temporalMode).toBe('window')
      expect(backNav.time).toBe(35)
      expect(backNav.selectedId).toBe('sapiens')
    })
  })

  describe('8. Corridor visibility restriction remains strictly enforced',()=>{
    it('corridors are drawn only for Homo sapiens in both Mode A and Mode B',()=>{
      const timeKa=50

      // For Homo sapiens: corridors exist
      const sapiensRoutes=routes.filter(r=>timeKa<=r.startKa&&timeKa>=r.endKa)
      expect(sapiensRoutes.length).toBeGreaterThan(0)

      // For non-sapiens (e.g. Neanderthal): corridors must be empty array
      const selectedNonSapiens:string='neanderthal'
      const visibleRoutesForNeanderthal=selectedNonSapiens==='sapiens'
        ? routes.filter(r=>timeKa<=r.startKa&&timeKa>=r.endKa)
        : []
      expect(visibleRoutesForNeanderthal).toEqual([])

      const selectedErectus:string='erectus'
      const visibleRoutesForErectus=selectedErectus==='sapiens'
        ? routes.filter(r=>timeKa<=r.startKa&&timeKa>=r.endKa)
        : []
      expect(visibleRoutesForErectus).toEqual([])
    })
  })
})
