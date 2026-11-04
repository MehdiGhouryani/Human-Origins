import type {SectionId} from '../../domain/species-page'
import type {SlotState} from './slots'

/**
 * Scene images (habitat S10, behaviour S11, specimen reconstruction X1) belong next to the text that explains them,
 * not in a gallery at the bottom of the page. This says which section each one sits in.
 */
const SCENE_SERIES=['S10','S11','X1'] as const
type SceneSeries=typeof SCENE_SERIES[number]

/** Behaviour scenes whose subject is stone-tool use: they illustrate the "Stone tools" section. */
const TOOL_SCENES=new Set(['habilis','erectus','heidelbergensis','neanderthal'])

export function sectionPreference(series:SceneSeries,taxonId:string):SectionId[]{
  if(series==='S10') return ['environment-diet','where-when','discovery']
  if(series==='X1') return ['discovery','anatomy']
  if(taxonId==='afarensis') return ['locomotion','brain-behaviour']
  if(TOOL_SCENES.has(taxonId)) return ['stone-tools','brain-behaviour']
  return ['brain-behaviour','stone-tools','locomotion']
}

export type ScenePlacement={
  bySection:Map<SectionId,SlotState[]>
  /** Slot ids drawn inside the narrative, so the gallery does not repeat them. */
  placedIds:Set<string>
}

/**
 * Public visitors only get slots that are live. A signed-in editor also gets the empty frames, in the section where the
 * image will appear, so the layout can be judged before the picture exists. Slots on hold stay in the gallery.
 */
export function placeSceneSlots(input:{taxonId:string;states:readonly SlotState[];sectionIds:readonly SectionId[];adminPreview:boolean}):ScenePlacement{
  const bySection=new Map<SectionId,SlotState[]>()
  const placedIds=new Set<string>()
  for(const state of input.states){
    const series=state.slot.series as SceneSeries
    if(!SCENE_SERIES.includes(series)) continue
    const placeable=state.visibility==='show'||(input.adminPreview&&state.visibility==='frame')
    if(!placeable) continue
    const target=sectionPreference(series,input.taxonId).find(section=>input.sectionIds.includes(section))
    if(!target) continue
    bySection.set(target,[...(bySection.get(target)??[]),state])
    placedIds.add(String(state.slot.id))
  }
  for(const list of bySection.values()) list.sort((a,b)=>SCENE_SERIES.indexOf(a.slot.series as SceneSeries)-SCENE_SERIES.indexOf(b.slot.series as SceneSeries))
  return {bySection,placedIds}
}
