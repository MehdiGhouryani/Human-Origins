import type {MetadataRoute} from 'next'

export default function manifest():MetadataRoute.Manifest{
  return {
    name:'Human Origins — Interactive Human Evolution Atlas',
    short_name:'Human Origins',
    description:'A source-aware interactive atlas of human evolution, evidence, specimens, time and migration.',
    start_url:'/',
    display:'standalone',
    background_color:'#050d0f',
    theme_color:'#050d0f',
    icons:[
      {src:'/icons/icon-192.png',sizes:'192x192',type:'image/png'},
      {src:'/icons/icon-512.png',sizes:'512x512',type:'image/png'},
    ],
  }
}
