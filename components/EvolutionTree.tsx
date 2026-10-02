'use client'
import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {select} from 'd3-selection'
import {zoom,zoomIdentity,type ZoomBehavior,type ZoomTransform} from 'd3-zoom'
import {Minus,Plus,RotateCcw} from 'lucide-react'
import {TIME_AXIS_ANCHORS_MA,formatAgeMa,formatAxisAnchor,sliderToAgeMa} from '../domain/time'
import {getExplorerRelationships,getExplorerSpeciesList} from '../features/explorer/selectors'
import type {ExplorerBootstrap} from '../features/explorer/bootstrap'
import type {ExplorerSpecies} from '../features/explorer/types'
import {groupColors,relationshipColors} from '../presentation/palette'
import {geneFlowPartners,relatedTaxa} from '../presentation/treeSelectors'
import {GENE_FLOW_AGE_MA,TREE_NODE_RADIUS,branchPath,computeTreeLayout,xForAge} from '../presentation/treeLayout'
import {findMedia,resolveMediaSrc} from '../presentation/mediaDelivery'

const colorFor=(species:ExplorerSpecies)=>groupColors[species.group as keyof typeof groupColors] ?? '#28a9ff'
const initials=(short:string)=>short.replace(/[^A-Za-z ]/g,' ').split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()

type Props={bootstrap:ExplorerBootstrap;selected:string;setSelected:(id:string)=>void;time:number}

export default function EvolutionTree({bootstrap,selected,setSelected,time}:Props){
  const svgRef=useRef<SVGSVGElement|null>(null)
  const zoomRef=useRef<ZoomBehavior<SVGSVGElement,unknown>|null>(null)
  const [failedIcons,setFailedIcons]=useState<ReadonlySet<string>>(()=>new Set())

  useEffect(()=>{
    if(!svgRef.current) return
    const svg=select(svgRef.current)
    const root=svg.select('.zoom-root')
    const behavior=zoom<SVGSVGElement,unknown>()
      // Plain wheel scrolls the page; Ctrl/⌘+wheel (and trackpad pinch, which sends ctrlKey) zooms.
      .filter((event:{type:string;ctrlKey?:boolean;metaKey?:boolean;button?:number;touches?:{length:number}})=>{
        if(event.type==='wheel') return Boolean(event.ctrlKey||event.metaKey)
        // Touch: one finger is left to the browser so the panel scrolls natively (and the page never gets trapped);
        // two fingers pinch-zoom the tree.
        if(event.type.startsWith('touch')) return (event.touches?.length??0)>1
        return !event.ctrlKey&&!event.button
      })
      .scaleExtent([.8,3]).on('zoom',(event:{transform:ZoomTransform})=>root.attr('transform',event.transform.toString()))
    zoomRef.current=behavior
    svg.call(behavior)
    return ()=>{svg.on('.zoom',null)}
  },[])
  // Small screens show the tree inside a horizontally scrollable panel. Keep the selected taxon in view
  // (it is often far right, e.g. the default Neanderthal) without ever scrolling the page vertically.
  useEffect(()=>{
    const svgEl=svgRef.current
    const shell=svgEl?.closest<HTMLElement>('.tree-shell')
    if(!svgEl||!shell||(shell.scrollWidth<=shell.clientWidth+4&&shell.scrollHeight<=shell.clientHeight+4)) return
    const node=svgEl.querySelector<SVGGElement>('.node.selected')
    if(!node) return
    const shellBox=shell.getBoundingClientRect(),nodeBox=node.getBoundingClientRect()
    const nodeX=nodeBox.left+nodeBox.width/2-shellBox.left
    const nodeY=nodeBox.top+nodeBox.height/2-shellBox.top
    const inX=nodeX>40&&nodeX<shell.clientWidth-40
    const inY=shell.scrollHeight<=shell.clientHeight+4||(nodeY>40&&nodeY<shell.clientHeight-40)
    if(inX&&inY) return
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // Only the panel scrolls (scrollTo on the shell), never the page.
    shell.scrollTo({
      left:inX?shell.scrollLeft:Math.max(0,shell.scrollLeft+nodeX-shell.clientWidth/2),
      top:inY?shell.scrollTop:Math.max(0,shell.scrollTop+nodeY-shell.clientHeight/2),
      behavior:reduce?'auto':'smooth',
    })
  },[selected])
  const zoomBy=useCallback((factor:number)=>{if(svgRef.current&&zoomRef.current) select(svgRef.current).call(zoomRef.current.scaleBy,factor)},[])
  const resetZoom=useCallback(()=>{if(svgRef.current&&zoomRef.current) select(svgRef.current).call(zoomRef.current.transform,zoomIdentity)},[])

  const species=getExplorerSpeciesList(bootstrap)
  const links=getExplorerRelationships(bootstrap)
  const age=sliderToAgeMa(time)
  const treeLayout=useMemo(()=>computeTreeLayout(species),[species])
  const layout=treeLayout.nodes
  const TREE_PLOT=treeLayout.plot
  const TREE_VIEWBOX=treeLayout.viewBox
  const byId=useMemo(()=>new Map(species.map(item=>[item.id,item])),[species])
  const lineage=useMemo(()=>relatedTaxa(selected,links),[selected,links])
  const partners=useMemo(()=>geneFlowPartners(selected,links),[selected,links])
  const cursorX=xForAge(age)
  const common=layout.common

  return <div className="tree-wrap">
    <svg ref={svgRef} viewBox={`0 0 ${TREE_VIEWBOX.width} ${TREE_VIEWBOX.height}`} role="group" aria-labelledby="evolution-tree-title evolution-tree-desc">
      <title id="evolution-tree-title">Interactive human evolutionary tree on a deep-time axis</title>
      <desc id="evolution-tree-desc">Each taxon sits at its first appearance on the time axis; the bar behind it spans its documented time range. Solid branches show lineage context, dashed branches show possible or debated relationships, and pink connectors mark documented gene flow between Neanderthals, Denisovans and modern humans. Select a taxon to inspect it.</desc>
      <g className="zoom-root">
        <g className="tree-axis" aria-hidden="true">
          {TIME_AXIS_ANCHORS_MA.map(anchor=>{const x=xForAge(anchor);return <g key={anchor}><path className="tree-grid" d={`M${x} ${TREE_PLOT.top-14}V${TREE_PLOT.bottom}`}/><text className="tree-tick" x={x} y={TREE_PLOT.bottom+24} textAnchor="middle">{formatAxisAnchor(anchor)}</text></g>})}
        </g>

        {common&&<g className="pan-stub" aria-hidden="true">
          <path d={`M${common.endX} ${common.y} V${TREE_PLOT.top-10} H${TREE_PLOT.right}`}/>
          <text x={common.endX+10} y={TREE_PLOT.top-16}>Pan lineage → chimpanzees &amp; bonobos (not shown)</text>
        </g>}

        <g className="tree-bars" aria-hidden="true">
          {species.map(s=>{const g=layout[s.id];if(!g)return null;const alive=age<=s.start&&age>=s.end;return <rect key={s.id} className={`tree-bar ${alive?'alive':''}`} x={g.x} y={g.y-4} width={Math.max(4,g.endX-g.x)} height={8} rx={4} fill={colorFor(s)} opacity={lineage.has(s.id)?(alive?.75:.42):.14}/>})}
        </g>

        <g className="tree-links" aria-hidden="true">
          {links.filter(link=>link.type!=='gene-flow').map(link=>{
            const parent=byId.get(String(link.from)),child=byId.get(String(link.to))
            const pg=parent&&layout[parent.id],cg=child&&layout[child.id]
            if(!parent||!child||!pg||!cg) return null
            const onLineage=lineage.has(parent.id)&&lineage.has(child.id)
            return <path key={String(link.id)} d={branchPath({...parent,...pg},{...child,...cg})} fill="none" stroke={colorFor(child)} strokeWidth={onLineage?2.8:1.7} strokeLinecap="round" strokeDasharray={link.type==='possible'?'6 6':undefined} opacity={onLineage?.95:.32}/>
          })}
          {links.filter(link=>link.type==='gene-flow').map(link=>{
            const a=layout[String(link.from)],b=layout[String(link.to)]
            if(!a||!b) return null
            const flowAge=link.eventAgeMa??GENE_FLOW_AGE_MA
            const x=xForAge(flowAge),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y)
            const active=partners.size>0&&(String(link.from)===selected||String(link.to)===selected)
            return <g key={String(link.id)} className="gene-flow" opacity={active?1:.7}>
              <path d={`M${x} ${top+6}V${bottom-6}`} stroke={relationshipColors['gene-flow']} strokeWidth={active?3:2.2} strokeDasharray="2 5" strokeLinecap="round"/>
              <circle cx={x} cy={top} r={4} fill={relationshipColors['gene-flow']}/><circle cx={x} cy={bottom} r={4} fill={relationshipColors['gene-flow']}/>
              <text x={x-8} y={(top+bottom)/2} textAnchor="end" className="gene-flow-label">gene flow ~{Math.round(flowAge*1000)} ka</text>
            </g>
          })}
        </g>

        <line className="tree-cursor" x1={cursorX} x2={cursorX} y1={TREE_PLOT.top-14} y2={TREE_PLOT.bottom} aria-hidden="true"/>

        {species.map(s=>{
          const g=layout[s.id]; if(!g) return null
          const active=s.id===selected
          const alive=age<=s.start&&age>=s.end
          const media=findMedia(s.media,s.treeIconId)
          const showIcon=media&&!failedIcons.has(s.id)
          const r=s.id==='common'?TREE_NODE_RADIUS+2:TREE_NODE_RADIUS
          const clipId=`tree-node-clip-${s.id}`
          return <g key={s.id} tabIndex={0} role="button" aria-pressed={active} aria-label={`${s.name}, ${s.date}${alive?', alive at the selected time':''}`}
            className={`node ${active?'selected':''} ${alive?'in-time':'out-time'} ${lineage.has(s.id)?'':'dim-lineage'} ${partners.has(s.id)?'gene-partner':''}`}
            transform={`translate(${g.x} ${g.y})`} onClick={()=>setSelected(s.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(s.id)}}}>
            <circle className="node-halo" r={active?r+9:0}/>
            <clipPath id={clipId}><circle r={r-2}/></clipPath>
            <circle className="node-circle" r={r} stroke={colorFor(s)}/>
            {showIcon
              ? <image href={resolveMediaSrc(media,'icon',256)} x={-(r-2)} y={-(r-2)} width={(r-2)*2} height={(r-2)*2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} onError={()=>setFailedIcons(prev=>new Set(prev).add(s.id))}/>
              : <text className="node-initials" textAnchor="middle" dominantBaseline="central">{initials(s.short)}</text>}
            <circle className="node-ring" r={r} stroke={colorFor(s)} fill="none"/>
            <text className="node-name" y={r+15} textAnchor="middle">{s.short}</text>
            <text className="node-date" y={r+29} textAnchor="middle">{s.date}</text>
          </g>
        })}
      </g>
    </svg>
    <div className="time-overlay">{formatAgeMa(age)}</div>
    <div className="tree-zoom-controls"><button type="button" onClick={()=>zoomBy(1.3)} aria-label="Zoom in"><Plus size={14}/></button><button type="button" onClick={()=>zoomBy(1/1.3)} aria-label="Zoom out"><Minus size={14}/></button><button type="button" onClick={resetZoom} aria-label="Reset zoom"><RotateCcw size={14}/></button></div>
    <div className="zoom-hint">Ctrl/⌘ + scroll or pinch to zoom · drag to pan · Tab to move between species</div>
  </div>
}
