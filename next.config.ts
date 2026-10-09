import type {NextConfig} from 'next'

const securityHeaders=[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  {key:'X-DNS-Prefetch-Control',value:'on'},
  {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors *; form-action 'self'"},
  // HSTS only in production: on a plain-http dev server it would be ignored at best, sticky at worst.
  ...(process.env.NODE_ENV==='production'?[{key:'Strict-Transport-Security',value:'max-age=31536000'}]:[]),
]

const nextConfig:NextConfig={
  ...(process.env.NEXT_OUTPUT==='standalone'?{output:'standalone' as const}:{}),
  poweredByHeader:false,
  reactStrictMode:true,
  allowedDevOrigins:['*.run.app','localhost:3000'],
  images:{
    minimumCacheTTL:60,
    // Fully self-hosted: no remote image host is allowed.
    remotePatterns:[],
  },
  // A malformed percent-escape (e.g. /species/%E0%A4%A) is a client error. Send it to the not-found page (404)
  // instead of letting the dynamic-segment decoder answer 500.
  async rewrites(){
    return {beforeFiles:[{source:'/species/:id(.*%(?![0-9A-Fa-f]{2}).*)',destination:'/species/not-found'}],afterFiles:[],fallback:[]}
  },
  async headers(){
    return [
      {source:'/(.*)',headers:securityHeaders},
      // The admin panel may never be framed by another site (clickjacking protection).
      {source:'/admin/:path*',headers:[{key:'X-Frame-Options',value:'SAMEORIGIN'},{key:'Content-Security-Policy',value:securityHeaders.find(h=>h.key==='Content-Security-Policy')!.value.replace('frame-ancestors *','frame-ancestors \'self\'')}]},
    ]
  },
}

export default nextConfig
