import {readFileSync, existsSync, readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join, resolve} from 'node:path'

const root=resolve(import.meta.dirname,'..')
const errors=[]
const manifestPath=join(root,'public/assets/asset-manifest.json')

if(existsSync(manifestPath)){
  const data=JSON.parse(readFileSync(manifestPath,'utf8'))
  const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
  if(data.version!==(pkg.version||'').replace('0.','')) errors.push(`asset-manifest version is not aligned with package release ${pkg.version}`)
  const listed=new Set((data.assets||[]).map(item=>item.path))
  for(const item of data.assets||[]){
    const path=item.path||''
    const expected=item.sha256
    if(path.startsWith('/assets/')&&expected){
      const file=join(root,'public',path.slice(1))
      if(existsSync(file)){
        const actual=createHash('sha256').update(readFileSync(file)).digest('hex')
        if(actual!==expected) errors.push(`${path}: sha256 mismatch`)
      }else{
        errors.push(`${path}: missing from public assets`)
      }
    }
  }
  const sampleDir=join(root,'public/assets/species/samples')
  for(const file of readdirSync(sampleDir)){
    const path=`/assets/species/samples/${file}`
    if(!listed.has(path)) errors.push(`${path}: missing from asset manifest`)
  }
  const responsiveHero=['/assets/hero-mobile.webp','/assets/hero-tablet.webp','/assets/hero-desktop.webp']
  for(const path of responsiveHero) if(!existsSync(join(root,'public',path.slice(1)))) errors.push(`${path}: missing responsive hero variant`)
}

if(errors.length){
  for(const error of errors) console.error('ERROR',error)
  process.exit(1)
}
console.log('Asset audit passed.')
