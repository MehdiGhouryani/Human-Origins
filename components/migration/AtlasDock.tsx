import type {CSSProperties} from 'react'
import {ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react'
import {SCENE_COUNT,scenes} from '../../presentation/migrationTimeline'

type Props={fraction:number;sceneIndex:number;playing:boolean;speed:number;readout:string;onPlay:()=>void;onSeek:(fraction:number)=>void;onScene:(index:number)=>void;onSpeed:()=>void}

/** Story timeline: every scene has the same width, and the readout is the exact moment the map is showing. */
export default function AtlasDock({fraction,sceneIndex,playing,speed,readout,onPlay,onSeek,onScene,onSpeed}:Props){
  const scene=scenes[sceneIndex]
  return <div className="atlas-dock" data-no-drag>
    <button type="button" onClick={onPlay} className="atlas-play" aria-label={playing?'Pause story':'Play story'}>{playing?<Pause size={20} aria-hidden="true"/>:<Play size={20} aria-hidden="true"/>}</button>
    <div className="atlas-track">
      <div className="atlas-readout"><strong>{readout}</strong><span>{scene.title}</span></div>
      <div className="atlas-scrub" style={{'--n':SCENE_COUNT} as CSSProperties}>
        <div className="atlas-pips">{scenes.map((item,index)=><button type="button" key={item.id} onClick={()=>onScene(index)} className={index===sceneIndex?'on':index<sceneIndex?'past':''} style={{left:`${((index+.5)/SCENE_COUNT)*100}%`}} aria-label={`Scene ${index+1}: ${item.title}`} aria-current={index===sceneIndex?'step':undefined}>{index+1}</button>)}</div>
        <input type="range" min={0} max={1000} step={1} value={Math.round(fraction*1000)} onChange={event=>onSeek(Number(event.target.value)/1000)} style={{'--p':`${(fraction*100).toFixed(2)}%`} as CSSProperties} aria-label="Story timeline" aria-valuetext={`${readout}, scene ${sceneIndex+1} of ${SCENE_COUNT}`}/>
      </div>
    </div>
    <div className="atlas-step">
      <button type="button" onClick={()=>onScene(Math.max(0,sceneIndex-1))} className="atlas-icon-btn" aria-label="Previous scene" disabled={sceneIndex===0}><ChevronLeft size={18} aria-hidden="true"/></button>
      <button type="button" onClick={()=>onScene(Math.min(SCENE_COUNT-1,sceneIndex+1))} className="atlas-icon-btn" aria-label="Next scene" disabled={sceneIndex===SCENE_COUNT-1}><ChevronRight size={18} aria-hidden="true"/></button>
      <button type="button" onClick={onSpeed} className="atlas-speed" aria-label={`Playback speed ${speed} times. Change speed`}>{speed}×</button>
    </div>
  </div>
}
