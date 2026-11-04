import './globals.css'
import './atlas.css'
import './migration-atlas.css'
import type {Metadata,Viewport} from 'next'
import type {ReactNode} from 'react'
import localFont from 'next/font/local'
import {getSiteUrl} from '../infrastructure/site/url'

// Self-hosted (SIL OFL, see app/fonts/LICENSE-*). next/font serves them from /_next/static, which the CSP font-src 'self' allows.
// Only the weights the stylesheets use are shipped; --font-display / --font-ui in globals.css read these variables.
const display=localFont({
  src:[
    {path:'./fonts/cormorant-garamond-latin-400-normal.woff2',weight:'400',style:'normal'},
    {path:'./fonts/cormorant-garamond-latin-600-normal.woff2',weight:'600',style:'normal'},
    {path:'./fonts/cormorant-garamond-latin-400-italic.woff2',weight:'400',style:'italic'},
  ],
  variable:'--font-display-face',
  display:'swap',
  fallback:['ui-serif','Georgia','Times New Roman','serif'],
})
const ui=localFont({
  src:'./fonts/inter-latin-wght-normal.woff2',
  weight:'100 900',
  variable:'--font-ui-face',
  display:'swap',
  fallback:['ui-sans-serif','system-ui','-apple-system','Segoe UI','sans-serif'],
})

export const metadata:Metadata={
  metadataBase:getSiteUrl(),
  title:'Human Origins — Interactive Human Evolution Atlas',
  description:'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
  applicationName:'Human Origins',
  openGraph:{
    type:'website',
    siteName:'Human Origins',
    title:'Human Origins — Interactive Human Evolution Atlas',
    description:'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
  },
  twitter:{
    card:'summary_large_image',
    title:'Human Origins — Interactive Human Evolution Atlas',
    description:'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
  },
}

// Explicit mobile viewport: device width, notch-aware (viewport-fit=cover pairs with the safe-area padding in globals.css)
// and a browser-chrome colour matching the atlas background.
export const viewport:Viewport={
  width:'device-width',
  initialScale:1,
  viewportFit:'cover',
  themeColor:'#050d0f',
  colorScheme:'dark',
}

export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="en" className={`${display.variable} ${ui.variable}`} suppressHydrationWarning><body suppressHydrationWarning>{children}</body></html>
}
