import {memo,useCallback,useRef,useState} from 'react'
import {RELATION_LEGEND_ORDER,RELATION_SEMANTICS} from '../domain/relationship-semantics'
import {groupColors,relationshipColors} from '../presentation/palette'

export const DEFAULT_CLADE_NAMES = [
  'Early hominins',
  'Australopithecines',
  'Homo',
  'Paranthropus',
  'Neanderthals',
  'Modern humans',
  'Denisovans'
] as const

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

interface RelationshipLegendProps {
  present?: ReadonlySet<string>
  clades?: readonly { name: string }[]
}

function RelationshipLegend({present,clades}:RelationshipLegendProps){
  const detailsRef = useRef<HTMLDetailsElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const classes=RELATION_LEGEND_ORDER.filter(key=>!present||present.has(key))
  const cladeList = clades ? clades.map(c=>c.name) : DEFAULT_CLADE_NAMES
  const previewClades = cladeList.slice(0, 4)
  const remainingCount = Math.max(0, cladeList.length - previewClades.length)

  const handleCollapse = useCallback((e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setIsOpen(false)
    if (detailsRef.current) {
      detailsRef.current.open = false
      detailsRef.current.removeAttribute('open')
      detailsRef.current.querySelector('summary')?.focus()
    }
  }, [])

  return <details
    ref={detailsRef}
    className="rel-legend"
    open={isOpen}
    onToggle={(e) => setIsOpen(e.currentTarget.open)}
  >
    <summary className="rel-legend-summary" id="rel-legend-title">
      <div className="rel-legend-header">
        <div className="rel-legend-title-group">
          <span className="rel-legend-title">Tree Guide & Legend</span>
          <span className="rel-legend-badge">{cladeList.length} Groups · {classes.length} Line Types</span>
        </div>
        <span className="rel-legend-cta" aria-hidden="true">
          <span className="rel-legend-cta-text">{isOpen ? 'Click to collapse' : 'Click to explore'}</span>
          <span className="rel-legend-arrow">{isOpen ? '▴' : '▾'}</span>
        </span>
      </div>
      <div className="rel-legend-preview">
        {previewClades.map(name => (
          <span key={name} className="rel-legend-preview-item">
            <i className="rel-legend-preview-dot" style={{background: groupColors[name as keyof typeof groupColors] ?? '#28a9ff'}}/>
            <span>{name}</span>
          </span>
        ))}
        <span className="rel-legend-preview-more">+{remainingCount} more groups & all lines ▾</span>
      </div>
    </summary>

    <div className="rel-legend-body">
      <div className="rel-legend-section">
        <div className="rel-legend-section-title">Hominin Groups & Lineages (Color Coding)</div>
        <div className="rel-clades-grid" aria-label="Clade colours">
          {cladeList.map(name => (
            <span key={name} className="rel-clade-chip">
              <i style={{background: groupColors[name as keyof typeof groupColors] ?? '#28a9ff'}}/>
              <span>{name}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="rel-legend-section">
        <div className="rel-legend-section-title">Branch & Connection Semantics (Line Types)</div>
        <ul className="rel-legend-list">
          {classes.map(key => {
            const s = RELATION_SEMANTICS[key]
            return <li key={key}>
              <RelationSwatch relation={key} width={34}/>
              <span><strong>{s.label}:</strong> {s.meaning}</span>
            </li>
          })}
        </ul>
      </div>

      <div
        className="rel-legend-footer"
        onClick={(e) => handleCollapse(e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCollapse(e)
          }
        }}
        title="Click bar to collapse"
      >
        <span>Click a node in the tree to view fossils, dating, and primary source citations.</span>
        <button
          type="button"
          className="rel-legend-collapse-btn"
          onClick={(e) => handleCollapse(e)}
          aria-label="Collapse guide"
        >
          Click bar to collapse ▴
        </button>
      </div>
    </div>
  </details>
}

// Memoised: the explorer re-renders on every time tick (slider, play); this panel does not depend on time.
export default memo(RelationshipLegend)
