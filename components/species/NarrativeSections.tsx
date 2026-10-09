import {SECTION_TITLES,type PageBlock,type PageSection} from '../../domain/species-page'
import type {ReferenceNumbering} from '../../domain/species-page-render'
import {citationKey} from '../../domain/species-page-render'
import {Cite,RichText} from './Rich'
import ResponsiveDetails from './ResponsiveDetails'

function Block({block,sectionId,index,numbering}:{block:PageBlock;sectionId:string;index:number;numbering:ReferenceNumbering}){
  switch(block.type){
    case 'paragraph':
      return <p><RichText text={block.text}/><Cite refs={block.refs} numbering={numbering} where={citationKey.block(sectionId,index)}/>{block.singleSource&&<span className="sp-single" title="This statement rests on one study."> · single study</span>}</p>
    case 'note':
      return <aside className="sp-note" role="note"><RichText text={block.text}/><Cite refs={block.refs} numbering={numbering} where={citationKey.block(sectionId,index)}/>{block.singleSource&&<span className="sp-single"> · single study</span>}</aside>
    case 'list':
      return <ul>{block.items.map((item,itemIndex)=><li key={itemIndex}><RichText text={item.text}/><Cite refs={item.refs} numbering={numbering} where={citationKey.block(sectionId,index,itemIndex)}/></li>)}</ul>
    case 'table':
      return <table className="sp-table"><caption>{block.caption}</caption><tbody>{block.rows.map((row,rowIndex)=><tr key={rowIndex}><th scope="row">{row.label}</th><td><RichText text={row.value}/><Cite refs={row.refs} numbering={numbering} where={citationKey.block(sectionId,index,rowIndex)}/></td></tr>)}</tbody></table>
  }
}

/** The eight narrative sections; each is an accordion on phones and open on wide screens. */
export default function NarrativeSections({sections,numbering}:{sections:readonly PageSection[];numbering:ReferenceNumbering}){
  return <>{sections.map((section,sectionIndex)=><section key={section.id} className="sp-section" aria-labelledby={`${section.id}-h`}>
    <ResponsiveDetails id={section.id} keepOpenOnMobile={sectionIndex===0} summary={<h2 id={`${section.id}-h`}>{SECTION_TITLES[section.id]}</h2>}>
      <div className="sp-prose">{section.blocks.map((block,index)=><Block key={index} block={block} sectionId={section.id} index={index} numbering={numbering}/>)}</div>
    </ResponsiveDetails>
  </section>)}</>
}
