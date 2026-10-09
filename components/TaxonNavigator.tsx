'use client'
import {memo,useEffect,useMemo,useRef,useState} from 'react'
import {Bookmark,ChevronLeft,ChevronRight} from 'lucide-react'
import MediaImage from './MediaImage'
import type {ExplorerSpecies} from '../features/explorer/types'
import {adjacentTaxon,groupTaxaByClade,isInferredNode,orderTaxa,taxonPosition} from '../domain/taxon-model'
import {compactDate} from '../presentation/treeLayout'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'
import {groupColors} from '../presentation/palette'

export const taxonInitials=(short:string)=>short.replace(/[^A-Za-z ]/g,' ').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()

type Props={species:readonly ExplorerSpecies[];selectedId:string;onSelect:(id:string)=>void;savedIds:ReadonlySet<string>}

/**
 * Clade-grouped taxon navigator. Everything comes from the catalogue: groups, order, counts. One tab stop (roving
 * tabindex); arrow keys move through taxa oldest → youngest, Home/End jump to the ends.
 */
function TaxonNavigator({species,selectedId,onSelect,savedIds}:Props){
  const [onlySaved,setOnlySaved]=useState(false)
  const scrollRef=useRef<HTMLDivElement>(null)
  const ordered=useMemo(()=>orderTaxa(species),[species])
  const visible=useMemo(()=>onlySaved?ordered.filter(t=>savedIds.has(t.id)):ordered,[ordered,onlySaved,savedIds])
  const groups=useMemo(()=>groupTaxaByClade(visible),[visible])
  const {index,total}=taxonPosition(species,selectedId)
  const selected=species.find(t=>t.id===selectedId)
  const selectedVisible=visible.some(t=>t.id===selectedId)
  const older=adjacentTaxon(species,selectedId,-1),younger=adjacentTaxon(species,selectedId,1)

  useEffect(()=>{
    const box=scrollRef.current;const el=box?.querySelector<HTMLElement>('[aria-current="true"]')
    if(!box||!el) return
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    box.scrollTo({left:Math.max(0,el.offsetLeft-box.clientWidth/2+el.offsetWidth/2),behavior:reduce?'auto':'smooth'})
  },[selectedId,onlySaved])

  const move=(event:React.KeyboardEvent,from:number)=>{
    const key=event.key
    const to=key==='ArrowRight'||key==='ArrowDown'?from+1:key==='ArrowLeft'||key==='ArrowUp'?from-1:key==='Home'?0:key==='End'?visible.length-1:null
    if(to===null||to<0||to>=visible.length) return
    event.preventDefault()
    onSelect(visible[to].id)
    requestAnimationFrame(()=>scrollRef.current?.querySelector<HTMLElement>(`[data-taxon="${visible[to].id}"]`)?.focus())
  }

  return <nav className="taxon-nav" aria-label="Taxa, oldest to youngest">
    <div className="taxon-nav-bar">
      <p className="taxon-nav-count" aria-live="polite">{onlySaved?`${visible.length} saved of ${total}`:selected?`${index} of ${total} · ${selected.group}`:`${total} taxa`}</p>
      <div className="taxon-nav-actions">
        <button type="button" onClick={()=>older&&onSelect(older.id)} disabled={!older} aria-label={older?`Previous, older taxon: ${older.short}`:'No older taxon'}><ChevronLeft size={16}/></button>
        <button type="button" onClick={()=>younger&&onSelect(younger.id)} disabled={!younger} aria-label={younger?`Next, younger taxon: ${younger.short}`:'No younger taxon'}><ChevronRight size={16}/></button>
        <button type="button" className={`taxon-nav-saved ${onlySaved?'on':''}`} aria-pressed={onlySaved} onClick={()=>setOnlySaved(v=>!v)}><Bookmark size={14} fill={onlySaved?'currentColor':'none'}/> Saved ({savedIds.size})</button>
      </div>
    </div>
    <div className="taxon-nav-scroll" ref={scrollRef} role="group" aria-label="Taxa grouped by clade">
      {onlySaved&&!visible.length&&<p className="empty-state">No saved taxa yet. Use the bookmark button in a taxon’s details to save it here.</p>}
      {groups.map(group=><section className="taxon-group" key={group.name} aria-label={`${group.name}, ${group.taxa.length} ${group.taxa.length===1?'taxon':'taxa'}`}>
        <h3 style={{color:groupColors[group.name as keyof typeof groupColors]??undefined}}>{group.name}</h3>
        <ul>{group.taxa.map(taxon=>{
          const flat=visible.indexOf(taxon);const isSelected=taxon.id===selectedId;const tabStop=isSelected||(!selectedVisible&&flat===0)?0:-1;const media=findMedia(taxon.media,taxon.treeIconId)
          return <li key={taxon.id}><button type="button" data-taxon={taxon.id} className={`taxon-chip ${isSelected?'selected':''} ${isInferredNode(taxon)?'inferred':''}`} aria-current={isSelected?'true':undefined} tabIndex={tabStop} onClick={()=>onSelect(taxon.id)} onKeyDown={e=>move(e,flat)}>
            <span className="taxon-chip-thumb">{media&&<MediaImage src={resolveMediaSrc(media,'icon',256)} alt="" loading="lazy" sizes="48px" className="species-thumb-image" fallbackText={taxonInitials(taxon.short)}/>}</span>
            <span className="taxon-chip-text"><strong>{taxon.short}</strong><small>{compactDate(taxon.date)}</small></span>
            {isInferredNode(taxon)&&<span className="taxon-chip-tag">Inferred</span>}
            {savedIds.has(taxon.id)&&<Bookmark size={12} fill="currentColor" className="taxon-chip-saved" aria-label="Saved"/>}
          </button></li>})}
        </ul>
      </section>)}
    </div>
  </nav>
}

// Memoised: the explorer re-renders on every time tick (slider, play); this panel does not depend on time.
export default memo(TaxonNavigator)
