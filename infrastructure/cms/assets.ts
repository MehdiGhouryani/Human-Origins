import 'server-only'
import sharp, {type Metadata} from 'sharp'
import {mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import type {MediaVariant} from '../../domain/contracts'

const MAX_UPLOAD_BYTES=20*1024*1024 // 20 MB
const MAX_DIMENSION=8000 // guards against decompression-bomb style uploads
const MAX_PIXELS=36_000_000
/**
 * Uploaded media lives beside the CMS database (not under public/): Next.js indexes public/ at server start, so files
 * added later would 404 until a restart. They are served through app/cms-media/[id]/[file]/route.ts instead.
 */
export const CMS_MEDIA_DIR=process.env.CMS_MEDIA_DIR ?? join(process.cwd(),'.cms-data','media')

const VARIANT_WIDTHS:{purpose:MediaVariant['purpose'];width:number}[]=[
  {purpose:'thumbnail',width:320},
  {purpose:'card',width:640},
  {purpose:'detail',width:1400},
]

const ICON_SIZE=512

export class InvalidImageError extends Error{}

/**
 * Validates and processes an uploaded image into WebP variants under CMS_MEDIA_DIR/<id>/ (thumbnail/card/detail + a square icon).
 * Returns the variants (as MediaVariant records, web-servable at /cms-media/...) plus the
 * original decoded dimensions. Throws InvalidImageError for anything that isn't a genuine,
 * safely-sized raster image -- callers should turn that into a 400 response, not a 500.
 */
/** Largest centred rectangle of the given aspect ratio (width / height) inside a width×height image. */
export function centreCropBox(width:number,height:number,aspect:number):{left:number;top:number;width:number;height:number}{
  const current=width/height
  const cropWidth=current>aspect?Math.max(1,Math.round(height*aspect)):width
  const cropHeight=current>aspect?height:Math.max(1,Math.round(width/aspect))
  return {left:Math.floor((width-cropWidth)/2),top:Math.floor((height-cropHeight)/2),width:cropWidth,height:cropHeight}
}

/** `options.aspect`: centre-crop the upload to this width/height ratio first (named image slots); within 2 % nothing is cropped. */
export async function processUploadedImage(id:string,buffer:Buffer,options:{aspect?:number|null}={}):Promise<{variants:readonly MediaVariant[];width:number;height:number}>{
  if(buffer.byteLength===0) throw new InvalidImageError('Uploaded file is empty.')
  if(buffer.byteLength>MAX_UPLOAD_BYTES) throw new InvalidImageError(`Uploaded file exceeds the ${MAX_UPLOAD_BYTES/1024/1024} MB limit.`)

  let metadata:Metadata
  try{
    metadata=await sharp(buffer,{failOn:'error',limitInputPixels:MAX_PIXELS}).metadata()
  }catch{
    throw new InvalidImageError('File is not a readable image.')
  }
  let {width,height}=metadata
  const {format}=metadata
  if(!width || !height) throw new InvalidImageError('Could not determine image dimensions.')
  if(width>MAX_DIMENSION || height>MAX_DIMENSION || width*height>MAX_PIXELS) throw new InvalidImageError(`Image dimensions exceed the ${MAX_DIMENSION}px limit.`)
  if(!format || !['jpeg','png','webp','gif','avif','tiff'].includes(format)) throw new InvalidImageError(`Unsupported image format: ${format ?? 'unknown'}.`)
  // Sharp's metadata dimensions describe encoded pixels; served variants are EXIF-rotated.
  if(metadata.orientation && metadata.orientation>=5 && metadata.orientation<=8) [width,height]=[height,width]

  let source:Buffer=buffer
  if(options.aspect&&Math.abs(width/height-options.aspect)/options.aspect>0.02){
    const box=centreCropBox(width,height,options.aspect)
    // Orient first so the crop box is computed on the pixels the visitor sees.
    const oriented=await sharp(buffer,{failOn:'error'}).rotate().toBuffer()
    source=await sharp(oriented,{failOn:'error'}).extract(box).toBuffer()
    width=box.width
    height=box.height
  }

  const dir=join(/*turbopackIgnore: true*/ CMS_MEDIA_DIR,id)
  mkdirSync(dir,{recursive:true})

  const variants:MediaVariant[]=[]
  for(const {purpose,width:targetWidth} of VARIANT_WIDTHS){
    if(targetWidth>width && variants.length>0) continue // don't upscale past the source; still always emit at least one variant
    const pipeline=sharp(source,{failOn:'error'}).rotate().resize({width:Math.min(targetWidth,width),withoutEnlargement:true}).webp({quality:82})
    const outBuffer=await pipeline.toBuffer()
    const outMeta=await sharp(outBuffer).metadata()
    const fileName=`${purpose}.webp`
    writeFileSync(join(dir,fileName),outBuffer)
    variants.push({purpose,src:`/cms-media/${id}/${fileName}`,width:outMeta.width ?? Math.min(targetWidth,width),height:outMeta.height ?? 0,format:'webp'})
  }
  // Square avatar for tree nodes and species chips: centre-weighted "attention" crop, never upscaled past the short edge.
  const iconSize=Math.min(ICON_SIZE,width,height)
  const iconBuffer=await sharp(source,{failOn:'error'}).rotate().resize({width:iconSize,height:iconSize,fit:'cover',position:sharp.strategy.attention}).webp({quality:84}).toBuffer()
  writeFileSync(join(dir,'icon.webp'),iconBuffer)
  variants.push({purpose:'icon',src:`/cms-media/${id}/icon.webp`,width:iconSize,height:iconSize,format:'webp'})
  return {variants,width,height}
}

export function deleteProcessedImage(id:string):void{
  rmSync(join(/*turbopackIgnore: true*/ CMS_MEDIA_DIR,id),{recursive:true,force:true})
}
