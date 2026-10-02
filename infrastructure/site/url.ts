import 'server-only'

/**
 * Canonical public origin, used for metadataBase, canonical links, the sitemap and JSON-LD.
 * Set SITE_URL in production (e.g. https://humanorigins.example). Falls back to localhost for dev.
 */
export function getSiteUrl():URL{
  const raw=process.env.SITE_URL?.trim() || process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if(raw){
    try{
      const parsed=new URL(raw.endsWith('/')?raw:`${raw}/`)
      return parsed
    }catch(error){
      if(process.env.NODE_ENV==='production') console.warn(`Invalid SITE_URL: ${error instanceof Error?error.message:String(error)}`)
    }
  }
  return new URL('http://localhost:3000/')
}

export const absoluteUrl=(path:string)=>new URL(path.replace(/^\//,''),getSiteUrl()).toString()
