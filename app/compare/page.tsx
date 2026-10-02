import type {Metadata} from 'next'
import Link from 'next/link'
import {ArrowLeft} from 'lucide-react'
import {buildExplorerBootstrap} from '../../features/explorer/bootstrap'
import {getLiveContent} from '../../infrastructure/cms/live'
import CompareMatrix from '../../components/CompareMatrix'

export const dynamic='force-dynamic'

export const metadata:Metadata={
  title:'Comparative Anatomy & Chronology Matrix · Human Origins',
  description:'Compare hominin cranial capacities, tool industries, locomotion adaptations, and temporal overlap side-by-side.',
}

export default function ComparePage(){
  const live=getLiveContent()
  const bootstrap=buildExplorerBootstrap(live.catalog,live.copy)

  return (
    <div className="compare-page-wrapper">
      <header className="compare-nav-header">
        <Link href="/" className="compare-back-btn">
          <ArrowLeft size={16}/> Back to Tree &amp; Explorer
        </Link>
        <span className="brand-pill">HUMAN ORIGINS RESEARCH</span>
      </header>

      <main className="compare-main-content">
        <CompareMatrix bootstrap={bootstrap}/>
      </main>
    </div>
  )
}
