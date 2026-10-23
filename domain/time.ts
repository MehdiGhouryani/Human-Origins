export type TimeUnit='Ma'|'ka'|'years'
export type DatingClass='relative'|'radiometric'|'paleomagnetic'|'trapped-electron'|'genetic'|'multiple'|'unspecified'
import type {SourceId} from './ids'

export type TimeEstimateKind='interval'|'point'|'bounded'
export type TimeCertainty='high'|'medium'|'debated'

export type TimeInterval={
  olderMa:number
  youngerMa:number
  label:string
  datingClass?:DatingClass
  uncertaintyMa?:number
  sourceIds?:readonly SourceId[]
  estimateKind?:TimeEstimateKind
  certainty?:TimeCertainty
}

export type ParsedAgeLabel=TimeInterval & {unit:TimeUnit}

export const TIME_DOMAIN={oldestMa:8,youngestMa:0} as const

/**
 * The deep-time axis used everywhere (tree, timeline, scrubber ticks).
 * Piecewise-linear segmentation gives ample room to the late Pleistocene hominin explosion
 * without disconnecting from the deep 8 Ma evolutionary scale.
 */
export const TIME_AXIS_ANCHORS_MA=[8,4,2,0.5,0] as const
const SEGMENT_CUMULATIVE_FRACTIONS=[0, 0.20, 0.40, 0.66, 1.00] as const

export function formatAxisAnchor(ageMa:number):string{
  return ageMa===0?'Present':ageMa>=1?`${ageMa} Ma`:`${Math.round(ageMa*1000)} ka`
}

/** 0 = oldest edge (8 Ma), 1 = present. */
export function ageMaToFraction(ageMa:number):number{
  const a=Math.max(TIME_DOMAIN.youngestMa,Math.min(TIME_DOMAIN.oldestMa,ageMa))
  const anchors=TIME_AXIS_ANCHORS_MA
  const fractions=SEGMENT_CUMULATIVE_FRACTIONS
  for(let i=0;i<anchors.length-1;i++){
    const older=anchors[i], younger=anchors[i+1]
    if(a<=older && a>=younger){
      const t=(older-a)/(older-younger)
      return fractions[i]+t*(fractions[i+1]-fractions[i])
    }
  }
  return 1
}

export function fractionToAgeMa(fraction:number):number{
  const f=Math.max(0,Math.min(1,fraction))
  const anchors=TIME_AXIS_ANCHORS_MA
  const fractions=SEGMENT_CUMULATIVE_FRACTIONS
  for(let i=0;i<fractions.length-1;i++){
    const startF=fractions[i], endF=fractions[i+1]
    if(f<=endF || i===fractions.length-2){
      const t=(f-startF)/(endF-startF)
      return anchors[i]+t*(anchors[i+1]-anchors[i])
    }
  }
  return 0
}
export function sliderToAgeMa(value:number):number{return fractionToAgeMa(Math.max(0,Math.min(100,value))/100)}
export function ageMaToSlider(ageMa:number):number{return ageMaToFraction(ageMa)*100}
export function maToKa(ageMa:number):number{return Math.max(0,ageMa*1000)}
export function kaToMa(ageKa:number):number{return Math.max(0,ageKa/1000)}
export function formatAgeMa(ageMa:number):string{if(ageMa>=1){const digits=ageMa>=2.95?0:1;return `${Number(ageMa.toFixed(digits))} Ma ago`};if(ageMa>=0.001)return `${Math.round(ageMa*1000)} ka ago`;if(ageMa>0)return `${Math.round(ageMa*1_000_000)} years ago`;return 'Present'}
export function containsAge(interval:TimeInterval,ageMa:number):boolean{return ageMa<=interval.olderMa&&ageMa>=interval.youngerMa}
export function containsAgeWithUncertainty(interval:TimeInterval,ageMa:number):boolean{const u=interval.uncertaintyMa??0;return ageMa<=interval.olderMa+u&&ageMa>=Math.max(0,interval.youngerMa-u)}
export function normalizeInterval(olderMa:number,youngerMa:number,label?:string):TimeInterval{const older=Math.max(0,Math.max(youngerMa,olderMa));const younger=Math.max(0,Math.min(olderMa,youngerMa));return {olderMa:older,youngerMa:younger,label:label??formatAgeMa(older),estimateKind:older===younger?'point':'interval'}}

/**
 * Parse only the bounded information that is actually expressed in a human-readable age label.
 * Open-ended labels such as "~100 ka+" and synthesis labels such as "Multiple periods"
 * intentionally return undefined rather than manufacturing a false numeric interval.
 */
export function parseAgeLabel(label:string,fallbackKa?:number,sourceIds?:readonly SourceId[],certainty?:TimeCertainty):ParsedAgeLabel|undefined{
  const raw=label.trim()
  if(!raw || /multiple\s+periods|late\s+pleistocene|middle\s+pleistocene|and\s+younger|\+\s*$/.test(raw.toLowerCase())) return undefined

  const range=raw.match(/(\d+(?:\.\d+)?)\s*[–-]\s*(\d+(?:\.\d+)?)\s*(Ma|ka)/i)
  if(range){
    const first=Number(range[1]),second=Number(range[2]),unit=range[3].toLowerCase() as 'ma'|'ka'
    const factor=unit==='ma'?1:0.001
    return {
      olderMa:Math.max(first,second)*factor,
      youngerMa:Math.min(first,second)*factor,
      label:raw,
      estimateKind:'interval',
      certainty,
      sourceIds,
      unit:unit==='ma'?'Ma':'ka',
    }
  }

  const uncertainty=raw.match(/(\d+(?:\.\d+)?)\s*[±+\/-]\s*(\d+(?:\.\d+)?)\s*(Ma|ka)/i)
  if(uncertainty){
    const center=Number(uncertainty[1]),error=Number(uncertainty[2]),unit=uncertainty[3].toLowerCase() as 'ma'|'ka'
    const factor=unit==='ma'?1:0.001
    return {
      olderMa:center*factor,
      youngerMa:center*factor,
      label:raw,
      estimateKind:'point',
      uncertaintyMa:error*factor,
      certainty,
      sourceIds,
      unit:unit==='ma'?'Ma':'ka',
    }
  }

  const point=raw.match(/(\d+(?:\.\d+)?)\s*(Ma|ka)/i)
  if(point){
    const value=Number(point[1])*(point[2].toLowerCase()==='ma'?1:0.001)
    return {
      olderMa:value,
      youngerMa:value,
      label:raw,
      estimateKind:'point',
      certainty,
      sourceIds,
      unit:point[2].toLowerCase()==='ma'?'Ma':'ka',
    }
  }

  if(fallbackKa!==undefined && Number.isFinite(fallbackKa) && fallbackKa>0){
    const value=kaToMa(fallbackKa)
    return {olderMa:value,youngerMa:value,label:raw,estimateKind:'point',certainty,sourceIds,unit:'ka'}
  }

  return undefined
}

/** True when two closed age ranges (older/younger bounds in Ma) share at least one point, optionally widened by a symmetric uncertainty in Ma. */
export function rangesOverlap(a:{olderMa:number;youngerMa:number},b:{olderMa:number;youngerMa:number},toleranceMa=0):boolean{
  return a.olderMa+toleranceMa>=b.youngerMa && b.olderMa+toleranceMa>=a.youngerMa
}

/** Whether two time intervals overlap; with `withUncertainty` each side's own `uncertaintyMa` widens its bounds before comparing. */
export function intervalsOverlap(a:TimeInterval,b:TimeInterval,options:{withUncertainty?:boolean}={}):boolean{
  const widen=(interval:TimeInterval)=>{const u=options.withUncertainty?interval.uncertaintyMa??0:0;return {olderMa:interval.olderMa+u,youngerMa:Math.max(0,interval.youngerMa-u)}}
  return rangesOverlap(widen(a),widen(b))
}

/** Items whose [end, start] range (Ma, start = older) contains the given age -- the "who coexisted at this moment" query. */
export function taxaAtAge<T extends {start:number;end:number}>(items:readonly T[],ageMa:number):readonly T[]{
  return items.filter(item=>ageMa<=item.start && ageMa>=item.end)
}

export type TemporalMode='trail'|'window'

export type TemporalWindow={
  centerMa:number
  halfWidthMa:number
  halfWidthKa:number
  olderMa:number
  youngerMa:number
  label:string
}

export type SiteTemporalMatch={
  matches:boolean
  hasDocumentedInterval:boolean
  hasUncertainty:boolean
  isQualitativeOrUnbounded:boolean
  effectiveOlderMa?:number
  effectiveYoungerMa?:number
  explanation:string
}

/**
 * Returns an exploratory temporal window around a selected deep-time moment (Ma).
 * If halfWidthKa is omitted, an adaptive exploratory window is used:
 * - Late Pleistocene (<= 0.5 Ma / 500 ka): 50 ka (0.05 Ma)
 * - Middle/Early Pleistocene (0.5 to 2.0 Ma): 150 ka (0.15 Ma)
 * - Deep time (> 2.0 Ma): 300 ka (0.30 Ma)
 */
export function getExploratoryTemporalWindow(centerMa:number,customHalfWidthKa?:number):TemporalWindow{
  const center=Math.max(TIME_DOMAIN.youngestMa,Math.min(TIME_DOMAIN.oldestMa,centerMa))
  const halfWidthKa=customHalfWidthKa && customHalfWidthKa>0
    ? customHalfWidthKa
    : center<=0.5 ? 50 : center<=2.0 ? 150 : 300
  const halfWidthMa=halfWidthKa*0.001
  const olderMa=Math.min(TIME_DOMAIN.oldestMa,center+halfWidthMa)
  const youngerMa=Math.max(TIME_DOMAIN.youngestMa,center-halfWidthMa)
  const label=`${formatAgeMa(olderMa)} – ${formatAgeMa(youngerMa)} (±${halfWidthKa} ka)`
  return {centerMa:center,halfWidthMa,halfWidthKa,olderMa,youngerMa,label}
}

/**
 * Evaluates whether an evidence site's documented temporal record overlaps the given exploratory window.
 * - Retains focused site always.
 * - Honestly excludes open-ended/qualitative/multi-period sites (where timeInterval is undefined) to prevent false precision.
 * - Uses published dating uncertainty (uncertaintyMa) to widen bounds before overlap testing.
 */
export function evaluateSiteWindowOverlap(
  siteAgeKa:number,
  siteInterval:TimeInterval|undefined,
  window:TemporalWindow,
  isFocused=false
):SiteTemporalMatch{
  if(isFocused){
    return {
      matches:true,
      hasDocumentedInterval:Boolean(siteInterval && siteInterval.estimateKind==='interval'),
      hasUncertainty:Boolean(siteInterval?.uncertaintyMa && siteInterval.uncertaintyMa>0),
      isQualitativeOrUnbounded:!siteInterval,
      explanation:'Retained in view: currently focused site.',
    }
  }

  if(!siteInterval){
    return {
      matches:false,
      hasDocumentedInterval:false,
      hasUncertainty:false,
      isQualitativeOrUnbounded:true,
      explanation:'Excluded from window: dating is qualitative or open-ended without documented bounds.',
    }
  }

  const u=siteInterval.uncertaintyMa??0
  const effectiveOlderMa=siteInterval.olderMa+u
  const effectiveYoungerMa=Math.max(0,siteInterval.youngerMa-u)

  const matches=effectiveOlderMa>=window.youngerMa && effectiveYoungerMa<=window.olderMa
  const hasInterval=siteInterval.estimateKind==='interval'
  const hasUncertainty=u>0

  return {
    matches,
    hasDocumentedInterval:hasInterval,
    hasUncertainty,
    isQualitativeOrUnbounded:false,
    effectiveOlderMa,
    effectiveYoungerMa,
    explanation:matches
      ? `Documented dating (${siteInterval.label}) intersects the exploratory window [${formatAgeMa(window.olderMa)} – ${formatAgeMa(window.youngerMa)}].`
      : `Documented dating (${siteInterval.label}) is outside the exploratory window [${formatAgeMa(window.olderMa)} – ${formatAgeMa(window.youngerMa)}].`,
  }
}

