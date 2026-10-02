import './species.css'
import type {ReactNode} from 'react'
import SiteHeader from '../../components/SiteHeader'

export default function SpeciesLayout({children}:{children:ReactNode}){
  return <div className="site species-site">
    <SiteHeader/>
    {children}
  </div>
}
