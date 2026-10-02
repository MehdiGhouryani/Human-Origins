import type {NextConfig} from 'next'

const securityHeaders=[
  {key:'X-Content-Type-Options',value:'nosniff'},
  {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
  {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},
  {key:'X-DNS-Prefetch-Control',value:'on'},
  {key:'Content-Security-Policy',value:"default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://upload.wikimedia.org; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors *; form-action 'self'"},
  // HSTS only in production: on a plain-http dev server it would be ignored at best, sticky at worst.
  ...(process.env.NODE_ENV==='production'?[{key:'Strict-Transport-Security',value:'max-age=31536000'}]:[]),
]

const nextConfig:NextConfig={
  output:'standalone',
  poweredByHeader:false,
  reactStrictMode:true,
  allowedDevOrigins:['*.run.app','localhost:3000'],
  images:{
    minimumCacheTTL:60,
    remotePatterns:[
      {protocol:'https',hostname:'upload.wikimedia.org',pathname:'/wikipedia/commons/**'},
    ],
  },
  async headers(){
    return [{source:'/(.*)',headers:securityHeaders}]
  },
}

export default nextConfig
