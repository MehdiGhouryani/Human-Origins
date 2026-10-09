import type {NavItem} from '../../domain/species-page-render'

/** “On this page” navigation: a horizontal strip on phones, a sticky column on wide screens. */
export default function SectionNav({items}:{items:readonly NavItem[]}){
  return <nav className="sp-nav" aria-label="On this page">
    <p className="sp-nav-title" aria-hidden="true">On this page</p>
    <ul>{items.map(item=><li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ul>
  </nav>
}
