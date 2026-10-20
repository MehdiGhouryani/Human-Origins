import {getCopy} from '../content/copy-registry'

export default function Hero({copy}:{copy:Readonly<Record<string,string>>}){
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-art" aria-hidden="true"/>
    <div className="hero-shade" aria-hidden="true"/>
    <div className="hero-copy">
      <div className="eyebrow">{getCopy(copy,'hero.eyebrow')}</div>
      <h1 id="hero-title">{getCopy(copy,'hero.title.line1')} <br className="hero-br"/>{getCopy(copy,'hero.title.line2')}</h1>
      <p className="tagline">{getCopy(copy,'hero.tagline')}</p>
      <p className="intro">{getCopy(copy,'hero.intro')}</p>
    </div>
  </section>
}
