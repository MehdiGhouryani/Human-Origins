import 'server-only'

/**
 * Canonical public origin, used for metadataBase, canonical links, the sitemap and JSON-LD.
 * Set SITE_URL in production (e.g. https://humanorigins.example). Falls back to localhost for dev.
 */
export function getSiteUrl():URL{
  const raw=process.env.SITE_URL?.trim()
  if(raw){
    try{
      const parsed=new URL(raw.endsWith('/')?raw:`${raw}/`)
      if(process.env.NODE_ENV==='production' && parsed.protocol!=='https:') throw new Error('SITE_URL must use HTTPS in production.')
      return parsed
    }catch(error){
      if(process.env.NODE_ENV==='production') throw new Error(`Invalid SITE_URL in production: ${error instanceof Error?error.message:String(error)}`)
    }
  }
  if(process.env.NODE_ENV==='production') throw new Error('SITE_URL must be set in production.')
  return new URL('http://localhost:3000/')
}

export const absoluteUrl=(path:string)=>new URL(path.replace(/^\//,''),getSiteUrl()).toString()
