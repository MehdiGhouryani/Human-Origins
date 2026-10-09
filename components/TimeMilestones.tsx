'use client'
import {memo,useMemo} from 'react'
import type {ExplorerSpecies} from '../features/explorer/types'
import {buildMilestones,scaleExplanation} from '../domain/time-milestones'
import {isInferredNode} from '../domain/taxon-model'
import {formatAgeMa} from '../domain/time'

/** Jump-to moments and an honest note about the non-linear scale. Milestones come from the catalogue, never from a fixed list. */
function TimeMilestones({species,selected,onJump}:{species:readonly ExplorerSpecies[];selected?:ExplorerSpecies;onJump:(ageMa:number)=>void}){
  const milestones=useMemo(()=>buildMilestones(species),[species])
  const showSelected=selected&&!isInferredNode(selected)
  return <div className="time-milestones">
    <div role="group" aria-label="Jump to a moment in time" className="time-milestone-row">
      {milestones.map(m=><button type="button" key={m.id} className="time-milestone" title={m.detail} aria-label={`Jump to ${m.detail}`} onClick={()=>onJump(m.ageMa)}><strong>{m.label}</strong><small>{m.ageMa===0?'now':formatAgeMa(m.ageMa).replace(' ago','')}</small></button>)}
      {showSelected&&<button type="button" className="time-milestone time-milestone-selected" aria-label={`Jump to the middle of ${selected.short}'s documented range, ${selected.date}`} onClick={()=>onJump((selected.start+selected.end)/2)}><strong>{selected.short}</strong><small>selected taxon</small></button>}
    </div>
    <p className="time-scale-note">{scaleExplanation()} Arrow keys fine-tune the time; Page Up and Page Down move in larger steps.</p>
  </div>
}

// Memoised: the explorer re-renders on every time tick (slider, play); this panel does not depend on time.
export default memo(TimeMilestones)
