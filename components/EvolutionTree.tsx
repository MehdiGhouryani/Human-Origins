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

const CANONICAL_MAIN_IDS = new Set(['common', 'sahelanthropus', 'ardipithecus', 'afarensis', 'africanus', 'boisei', 'habilis', 'erectus', 'heidelbergensis', 'neanderthal', 'denisovan', 'sapiens'])

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
      .filter((event:{type:string;ctrlKey?:boolean;metaKey?:boolean;button?:number;touches?:{length:number}})=>{
        if(event.type==='wheel') return Boolean(event.ctrlKey||event.metaKey)
        if(event.type.startsWith('touch')) return (event.touches?.length??0)>1
        return !event.ctrlKey&&!event.button
      })
      .scaleExtent([.8,3]).on('zoom',(event:{transform:ZoomTransform})=>root.attr('transform',event.transform.toString()))
    zoomRef.current=behavior
    svg.call(behavior)
    return ()=>{svg.on('.zoom',null)}
  },[])

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
    shell.scrollTo({
      left:inX?shell.scrollLeft:Math.max(0,shell.scrollLeft+nodeX-shell.clientWidth/2),
      top:inY?shell.scrollTop:Math.max(0,shell.scrollTop+nodeY-shell.clientHeight/2),
      behavior:reduce?'auto':'smooth',
    })
  },[selected])

  const zoomBy=useCallback((factor:number)=>{if(svgRef.current&&zoomRef.current) select(svgRef.current).call(zoomRef.current.scaleBy,factor)},[])
  const resetZoom=useCallback(()=>{if(svgRef.current&&zoomRef.current) select(svgRef.current).call(zoomRef.current.transform,zoomIdentity)},[])

  const allSpecies=getExplorerSpeciesList(bootstrap)
  const rawLinks=getExplorerRelationships(bootstrap)
  const species=useMemo(()=>allSpecies.filter(s=>CANONICAL_MAIN_IDS.has(s.id)),[allSpecies])
  const links=useMemo(()=>rawLinks.filter(l=>CANONICAL_MAIN_IDS.has(String(l.from))&&CANONICAL_MAIN_IDS.has(String(l.to))),[rawLinks])
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
          {species.map(s=>{
            const g=layout[s.id];if(!g)return null;
            const alive=age<=s.start&&age>=s.end;
            const isSelected=s.id===selected;
            const onLineage=lineage.has(s.id);
            const barWidth=Math.max(4,g.endX-g.x);
            if(barWidth<=6) return null;
            const op=isSelected?0.85:alive?0.75:onLineage?0.55:0.3;
            return <g key={s.id} className="species-lifespan-track">
              <rect className={`tree-bar ${alive?'alive':''} ${isSelected?'is-selected':''}`} x={g.x} y={g.y-2.5} width={barWidth} height={5} rx={2.5} fill={colorFor(s)} opacity={op}/>
              <line x1={g.endX} x2={g.endX} y1={g.y-4.5} y2={g.y+4.5} stroke={colorFor(s)} strokeWidth={1.8} opacity={Math.min(1,op+0.25)} strokeLinecap="round"/>
            </g>
          })}
        </g>

        <g className="tree-links" aria-hidden="true">
          {links.filter(link=>link.type!=='gene-flow').map(link=>{
            const parent=byId.get(String(link.from)),child=byId.get(String(link.to))
            const pg=parent&&layout[parent.id],cg=child&&layout[child.id]
            if(!parent||!child||!pg||!cg) return null
            const onLineage=lineage.has(parent.id)&&lineage.has(child.id)
            const isPossible=link.type==='possible'
            const d=branchPath({...parent,...pg},{...child,...cg})
            return <g key={String(link.id)} className="branch-edge">
              <path d={d} fill="none" stroke="#061214" strokeWidth={onLineage?6.5:4.5} strokeLinecap="round" strokeDasharray={isPossible?'5 5':undefined}/>
              <path d={d} fill="none" stroke={colorFor(child)} strokeWidth={onLineage?3.2:1.8} strokeLinecap="round" strokeDasharray={isPossible?'5 5':undefined} opacity={onLineage?1:0.78}/>
            </g>
          })}
          {links.filter(link=>link.type==='gene-flow').map(link=>{
            const a=layout[String(link.from)],b=layout[String(link.to)]
            if(!a||!b) return null
            const flowAge=link.eventAgeMa??GENE_FLOW_AGE_MA
            const x=xForAge(flowAge),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y)
            const active=partners.size>0&&(String(link.from)===selected||String(link.to)===selected)
            const midY=(top+bottom)/2
            const arcOffset=28
            const pathD=`M${x} ${top+6} C${x+arcOffset} ${top+(bottom-top)*0.28} ${x+arcOffset} ${top+(bottom-top)*0.72} ${x} ${bottom-6}`
            return <g key={String(link.id)} className={`gene-flow ${active?'active':''}`} opacity={active?1:0.85}>
              <path d={pathD} fill="none" stroke="#061214" strokeWidth={active?5.5:3.8} strokeLinecap="round"/>
              <path d={pathD} fill="none" stroke={relationshipColors['gene-flow']} strokeWidth={active?2.8:1.8} strokeDasharray="3 4" strokeLinecap="round"/>
              <circle cx={x} cy={top} r={4.5} fill={relationshipColors['gene-flow']}/>
              <circle cx={x} cy={bottom} r={4.5} fill={relationshipColors['gene-flow']}/>
              <g transform={`translate(${x+arcOffset+4}, ${midY})`}>
                <rect x={0} y={-9} width={74} height={18} rx={9} fill="rgba(6, 17, 19, 0.94)" stroke={relationshipColors['gene-flow']} strokeWidth={1}/>
                <text x={37} y={3.5} textAnchor="middle" fill="#f472b6" fontSize={9} fontWeight={600} fontFamily="var(--font-ui)">⇄ ~{Math.round(flowAge*1000)} ka</text>
              </g>
            </g>
          })}
        </g>

        <line className="tree-cursor" x1={cursorX} x2={cursorX} y1={TREE_PLOT.top-14} y2={TREE_PLOT.bottom} aria-hidden="true"/>

        {species.map(s=>{
          const g=layout[s.id]; if(!g) return null
          const active=s.id===selected
          const alive=age<=s.start&&age>=s.end
          const onLineage=lineage.has(s.id)
          const media=findMedia(s.media,s.treeIconId)
          const showIcon=media&&!failedIcons.has(s.id)
          const r=s.id==='common'?TREE_NODE_RADIUS+2:TREE_NODE_RADIUS
          const clipId=`tree-node-clip-${s.id}`
          const nodeColor=colorFor(s)
          return <g key={s.id} tabIndex={0} role="button" aria-pressed={active} aria-label={`${s.name}, ${s.date}${alive?', alive at the selected time':''}`}
            className={`node ${active?'selected':''} ${alive?'in-time':'out-time'} ${onLineage?'on-lineage':''} ${partners.has(s.id)?'gene-partner':''}`}
            transform={`translate(${g.x} ${g.y})`} onClick={()=>setSelected(s.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(s.id)}}}>
            <circle className="node-halo" r={active?r+8:0}/>
            <clipPath id={clipId}><circle r={r-2}/></clipPath>
            <circle className="node-circle" r={r} stroke={nodeColor} strokeWidth={active?2.8:1.5} fill="#09181a"/>
            {showIcon
              ? <image href={resolveMediaSrc(media,'icon',256)} x={-(r-2)} y={-(r-2)} width={(r-2)*2} height={(r-2)*2} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} onError={()=>setFailedIcons(prev=>new Set(prev).add(s.id))}/>
              : <text className="node-initials" textAnchor="middle" dominantBaseline="central">{initials(s.short)}</text>}
            <circle className="node-ring" r={r} stroke={active?'#f1d29a':nodeColor} strokeWidth={active?2.5:1.2} fill="none"/>
            <g className="node-label" transform={`translate(0, ${r+4})`}>
              <rect x={-52} y={0} width={104} height={26} rx={5} fill="rgba(6, 17, 19, 0.85)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.8}/>
              <text className="node-name" y={11} textAnchor="middle">{s.short}</text>
              <text className="node-date" y={21} textAnchor="middle">{s.date}</text>
            </g>
          </g>
        })}
      </g>
    </svg>
    <div className="time-overlay">{formatAgeMa(age)}</div>
    <div className="tree-zoom-controls"><button type="button" onClick={()=>zoomBy(1.3)} aria-label="Zoom in"><Plus size={14}/></button><button type="button" onClick={()=>zoomBy(1/1.3)} aria-label="Zoom out"><Minus size={14}/></button><button type="button" onClick={resetZoom} aria-label="Reset zoom"><RotateCcw size={14}/></button></div>
    <div className="zoom-hint">Ctrl/⌘ + scroll or pinch to zoom · drag to pan · Tab to move between species</div>
  </div>
}
