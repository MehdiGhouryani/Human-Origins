import './globals.css'
import './atlas.css'
import type {Metadata,Viewport} from 'next'
import type {ReactNode} from 'react'
import {getSiteUrl} from '../infrastructure/site/url'

export const metadata:Metadata={
  metadataBase:getSiteUrl(),
  title:'Human Origins — Interactive Human Evolution Atlas',
  description:'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
  applicationName:'Human Origins',
  openGraph:{
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
  return <html lang="en"><body>{children}</body></html>
}
