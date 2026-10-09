import {memo} from 'react'
import {RELATION_LEGEND_ORDER,RELATION_SEMANTICS} from '../domain/relationship-semantics'
import {relationshipColors} from '../presentation/palette'

/** One swatch per relationship class, drawn with the same dash/marker the graph uses so the legend can never drift from it. */
export function RelationSwatch({relation,width=44}:{relation:keyof typeof RELATION_SEMANTICS;width?:number}){
  const {stroke}=RELATION_SEMANTICS[relation]
  const color=relation==='gene-flow'?relationshipColors['gene-flow']:'currentColor'
  return <svg className="rel-swatch" width={width} height={14} viewBox={`0 0 ${width} 14`} aria-hidden="true" focusable="false">
    <line x1={2} x2={width-(stroke.marker==='none'?2:10)} y1={7} y2={7} stroke={color} strokeWidth={2} strokeDasharray={stroke.dash} strokeLinecap="round"/>
    {stroke.marker==='arrow'&&<path d={`M${width-11} 2L${width-2} 7L${width-11} 12Z`} fill={color}/>}
    {stroke.marker==='open-arrow'&&<path d={`M${width-11} 2L${width-3} 7L${width-11} 12`} fill="none" stroke={color} strokeWidth={1.6}/>}
    {stroke.marker==='double-arrow'&&<><path d={`M${width-9} 3L${width-2} 7L${width-9} 11`} fill="none" stroke={color} strokeWidth={1.6}/><path d="M9 3L2 7L9 11" fill="none" stroke={color} strokeWidth={1.6}/></>}
    {stroke.marker==='question'&&<text x={width-9} y={11} fontSize={12} fontWeight={700} fill={color} textAnchor="middle">?</text>}
  </svg>
}

function RelationshipLegend({present}:{present?:ReadonlySet<string>}){
  const classes=RELATION_LEGEND_ORDER.filter(key=>!present||present.has(key))
  return <section className="rel-legend" aria-labelledby="rel-legend-title">
    <h3 id="rel-legend-title">What the lines mean</h3>
    <ul>{classes.map(key=>{const s=RELATION_SEMANTICS[key];return <li key={key}>
      <RelationSwatch relation={key}/>
      <span><strong>{s.label}.</strong> {s.meaning} <em>{s.doesNotClaim}</em></span>
    </li>})}</ul>
  </section>
}

// Memoised: the explorer re-renders on every time tick (slider, play); this panel does not depend on time.
export default memo(RelationshipLegend)
