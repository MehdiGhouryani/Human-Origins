'use client'

export default function Error({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <main className="route-error" role="alert">
    <div className="route-error-card"><span className="eyebrow">RECOVERABLE VIEW ERROR</span><h1>The atlas view could not be prepared.</h1><p>The current route failed before the interactive explorer was ready. Resetting the view is safe; the underlying source records are not modified.</p><button type="button" onClick={reset}>Retry explorer</button></div>
  </main>
}
