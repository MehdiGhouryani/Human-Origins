import type {EvidenceKind} from '../../domain/contracts'

export type Shape='circle'|'diamond'|'triangle'|'square'
/** Shape AND colour carry the evidence kind, so the map still reads for people who cannot tell the colours apart. */
export const KIND_META:Record<EvidenceKind,{label:string;color:string;shape:Shape}>={
  fossil:{label:'Fossil',color:'#f1c776',shape:'circle'},
  archaeology:{label:'Archaeology',color:'#5ad6c4',shape:'diamond'},
  genetics:{label:'Genetics',color:'#b79cff',shape:'triangle'},
  dating:{label:'Dating',color:'#7db8ff',shape:'square'},
}
export const KIND_ORDER:EvidenceKind[]=['fossil','archaeology','genetics','dating']

/** Path centred on 0,0 with radius r. */
export function shapePath(shape:Shape,r:number):string{
  if(shape==='diamond') return `M0 ${-r*1.2}L${r*1.2} 0L0 ${r*1.2}L${-r*1.2} 0Z`
  if(shape==='triangle') return `M0 ${-r*1.15}L${r*1.1} ${r*.85}L${-r*1.1} ${r*.85}Z`
  if(shape==='square') return `M${-r*.9} ${-r*.9}H${r*.9}V${r*.9}H${-r*.9}Z`
  return `M${-r} 0A${r} ${r} 0 1 0 ${r} 0A${r} ${r} 0 1 0 ${-r} 0Z`
}

export function KindGlyph({kind,size=14}:{kind:EvidenceKind;size?:number}){
  const meta=KIND_META[kind]
  const half=size/2
  return <svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`} aria-hidden="true" focusable="false"><path d={shapePath(meta.shape,size*.34)} fill={meta.color} stroke="#031013" strokeWidth="1"/></svg>
}
