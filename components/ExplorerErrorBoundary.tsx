'use client'

import {Component,type ReactNode} from 'react'

type Props={children:ReactNode}
type State={failed:boolean}

/** Keeps a render failure inside the explorer from blanking the whole page; the visitor can retry without reloading. */
export default class ExplorerErrorBoundary extends Component<Props,State>{
  state:State={failed:false}

  static getDerivedStateFromError():State{return {failed:true}}

  componentDidCatch(error:Error){
    console.error('[explorer] render failed', error)
  }

  render(){
    if(!this.state.failed) return this.props.children
    return <section className="explorer-fallback" role="alert">
      <h2>The explorer could not be displayed.</h2>
      <p>The rest of the site is still available. Try again, or reload the page.</p>
      <button type="button" onClick={()=>this.setState({failed:false})}>Try again</button>
    </section>
  }
}
