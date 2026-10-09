import type {ExplorerMedia} from '../features/explorer/types'

export type MediaRenderPurpose='thumbnail'|'card'|'detail'|'hero'|'icon'

function variantScore(variant:ExplorerMedia['variants'][number],width:number):number{
  const distance=variant.width-width
  return distance>=0 ? distance : Math.abs(distance)+10_000
}

const DEFAULT_WIDTH:Record<MediaRenderPurpose,number>={icon:256,thumbnail:320,card:640,detail:1024,hero:1600}

export function resolveMediaSrc(media:ExplorerMedia,purpose:MediaRenderPurpose,width?:number):string{
  const desiredWidth=width??DEFAULT_WIDTH[purpose]
  // An avatar prefers the square crop; if none exists (built-in media), the thumbnail is the next best thing.
  const purposes:readonly MediaRenderPurpose[]=purpose==='icon'?['icon','thumbnail','card']:[purpose]
  for(const wanted of purposes){
    const candidates=media.variants.filter(variant=>variant.purpose===wanted)
    if(candidates.length) return [...candidates].sort((a,b)=>variantScore(a,desiredWidth)-variantScore(b,desiredWidth))[0].src
  }
  // Self-hosted original: no remote resizing service is ever used.
  return media.src
}

export function findMedia(media:readonly ExplorerMedia[],id:string):ExplorerMedia|undefined{
  return media.find(item=>String(item.id)===id) ?? media[0]
}
