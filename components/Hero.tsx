import {getCopy} from '../content/copy-registry'

export default function Hero({release,copy}:{release:string;copy:Readonly<Record<string,string>>}){
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-art" aria-hidden="true"/>
    <div className="hero-shade" aria-hidden="true"/>
    <div className="hero-copy">
      <div className="eyebrow">8 MILLION YEARS AGO — PRESENT</div>
      <h1 id="hero-title">The Evolutionary<br/>Tree of Humans</h1>
      <p className="tagline">{getCopy(copy,'hero.tagline')}</p>
      <p className="intro">{getCopy(copy,'hero.intro')}</p>
    </div>
    <div className="quote">A branching history,<br/>reconstructed from evidence.</div>
    <div className="hero-meta"><span>RESEARCH ATLAS</span><b>v{release} · source-linked</b></div>
  </section>
}
