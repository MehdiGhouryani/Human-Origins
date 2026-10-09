import {parseRichText,type ReferenceNumbering} from '../../domain/species-page-render'

/** Text with `*italic*` markup. */
export function RichText({text}:{text:string}){
  return <>{parseRichText(text).map((segment,index)=>segment.italic?<em key={index}>{segment.text}</em>:<span key={index}>{segment.text}</span>)}</>
}

/** Superscript citation numbers for the given references. The first citation of a reference carries the anchor the list links back to. */
export function Cite({refs,numbering,where}:{refs:readonly string[];numbering:ReferenceNumbering;where:string}){
  const numbers=refs.map(ref=>({ref,n:numbering.numbers.get(ref)})).filter((item):item is {ref:string;n:number}=>item.n!==undefined).sort((a,b)=>a.n-b.n)
  if(!numbers.length) return null
  return <sup className="sp-cite" aria-label={`References ${numbers.map(item=>item.n).join(', ')}`}>
    {numbers.map((item,index)=><span key={item.ref}>
      {index>0&&<span className="sp-cite-sep" aria-hidden="true">,</span>}
      <a href={`#ref-${item.n}`} id={numbering.firstAt.get(item.ref)===where?`cite-${item.n}`:undefined}>{item.n}</a>
    </span>)}
  </sup>
}
