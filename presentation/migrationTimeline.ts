import {ageMaToSlider,sliderToAgeMa} from '../domain/time'
import {stories,type Story} from './migrationScene'

/**
 * Migration has its own time model. On the global slider the whole dispersal (60 → 5 ka) is under 4% of the track,
 * so a story cannot be scrubbed or played there. Here every scene gets an equal share of the track and its own
 * dwell time. `axis` scenes keep the global non-linear deep-time scale inside their share; the rest are linear.
 */
export type Scene=Story&{zoom:number;scale:'axis'|'linear'}

const cameraFor:Record<string,{zoom:number;scale:'axis'|'linear'}>={
  'deep-africa':{zoom:1.05,scale:'axis'},
  'sapiens-africa':{zoom:1.1,scale:'linear'},
  arabia:{zoom:1.55,scale:'linear'},
  eurasia:{zoom:1.15,scale:'linear'},
  sahul:{zoom:1.5,scale:'linear'},
  americas:{zoom:1.1,scale:'linear'},
}

export const scenes:Scene[]=stories.map(story=>({...story,zoom:cameraFor[story.id]?.zoom??1.4,scale:cameraFor[story.id]?.scale??'linear'}))
export const SCENE_COUNT=scenes.length
/** Default time one scene stays on screen while playing. */
export const SCENE_DWELL_MS=7000

const clamp01=(value:number)=>Math.min(1,Math.max(0,value))

/** Scene that contains a moment (ka). Moments outside the story belong to the nearest end. */
export function sceneIndexAtKa(ka:number):number{
  const index=scenes.findIndex(scene=>ka<=scene.fromKa&&ka>=scene.toKa)
  if(index>=0) return index
  return ka>scenes[0].fromKa?0:scenes.length-1
}

const axisPosition=(ka:number)=>ageMaToSlider(ka/1000)

/** Position of a moment on the story track, 0 (oldest) .. 1 (youngest), equal width per scene. */
export function kaToFraction(ka:number):number{
  const index=sceneIndexAtKa(ka)
  const scene=scenes[index]
  const clamped=Math.min(scene.fromKa,Math.max(scene.toKa,ka))
  const local=scene.scale==='axis'
    ?(axisPosition(clamped)-axisPosition(scene.fromKa))/(axisPosition(scene.toKa)-axisPosition(scene.fromKa))
    :(scene.fromKa-clamped)/(scene.fromKa-scene.toKa)
  return clamp01((index+clamp01(local))/SCENE_COUNT)
}

/** Inverse of {@link kaToFraction}. */
export function fractionToKa(fraction:number):number{
  const position=clamp01(fraction)*SCENE_COUNT
  const index=Math.min(SCENE_COUNT-1,Math.floor(position))
  const local=position-index
  const scene=scenes[index]
  if(scene.scale==='axis'){
    const slider=axisPosition(scene.fromKa)+local*(axisPosition(scene.toKa)-axisPosition(scene.fromKa))
    return sliderToAgeMa(slider)*1000
  }
  return scene.fromKa-local*(scene.fromKa-scene.toKa)
}

/** Fraction at the start of a scene, used by scene jumps. */
export const sceneStartFraction=(index:number)=>clamp01(index/SCENE_COUNT)

/** How far through its own scene a moment is, 0..1. Drives per-scene reveals such as corridor progress. */
export function sceneProgress(fraction:number):number{
  const position=clamp01(fraction)*SCENE_COUNT
  return fraction>=1?1:position-Math.floor(position)
}

export type Advance={fraction:number;ended:boolean}
/** One playback step. `speed` multiplies the dwell rate; at the end the story stops instead of looping. */
export function advanceFraction(fraction:number,deltaMs:number,speed=1,dwellMs=SCENE_DWELL_MS):Advance{
  const next=fraction+(Math.max(0,deltaMs)*Math.max(.05,speed))/(dwellMs*SCENE_COUNT)
  return next>=1?{fraction:1,ended:true}:{fraction:next,ended:false}
}
