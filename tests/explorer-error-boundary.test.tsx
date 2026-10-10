import {describe,expect,it} from 'vitest'
import {renderToStaticMarkup} from 'react-dom/server'
import type {ReactElement} from 'react'
import ExplorerErrorBoundary from '../components/ExplorerErrorBoundary'

describe('ExplorerErrorBoundary',()=>{
  it('renders its children when nothing fails',()=>{
    const boundary=new ExplorerErrorBoundary({children:'explorer'})
    expect(boundary.render()).toBe('explorer')
  })

  it('switches to a recoverable notice when a child throws',()=>{
    const state=ExplorerErrorBoundary.getDerivedStateFromError()
    expect(state).toEqual({failed:true})
    const boundary=new ExplorerErrorBoundary({children:'explorer'})
    boundary.state=state
    const html=renderToStaticMarkup(boundary.render() as ReactElement)
    expect(html).toContain('could not be displayed')
    expect(html).toContain('Try again')
  })
})
