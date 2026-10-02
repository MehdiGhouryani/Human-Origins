import type {ExplorerMedia} from '../features/explorer/types'

export type MediaRenderPurpose='thumbnail'|'card'|'detail'|'hero'|'icon'

/** Wikimedia serves (and caches) a fixed set of thumbnail widths; arbitrary widths get throttled or rejected. */
const WIKIMEDIA_STEPS=[250,330,500,960,1280,1920] as const
const snapWikimediaWidth=(width:number)=>WIKIMEDIA_STEPS.find(step=>step>=width) ?? WIKIMEDIA_STEPS[WIKIMEDIA_STEPS.length-1]

export function wikimediaThumb(src:string,width:number):string{
  const prefix='https://upload.wikimedia.org/wikipedia/commons/'
  if(!src.startsWith(prefix) || src.startsWith(`${prefix}thumb/`)) return src
  const [hash1,hash2,filename,...rest]=src.slice(prefix.length).split('/')
  if(!hash1||!hash2||!filename||rest.length) return src
  const step=snapWikimediaWidth(width)
  // SVG/TIFF originals are rasterised by Wikimedia: the thumbnail needs an explicit raster extension.
  const suffix=/\.svg$/i.test(filename)?'.png':/\.tiff?$/i.test(filename)?'.jpg':''
  return `${prefix}thumb/${hash1}/${hash2}/${filename}/${step}px-${filename}${suffix}`
}

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
  return wikimediaThumb(media.src,desiredWidth)
}

export function findMedia(media:readonly ExplorerMedia[],id:string):ExplorerMedia|undefined{
  return media.find(item=>String(item.id)===id) ?? media[0]
}
