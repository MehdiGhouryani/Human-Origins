import {existsSync,readFileSync} from 'node:fs'
import {join} from 'node:path'

const root=process.cwd()
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
const declared={...pkg.dependencies,...pkg.devDependencies}
const missing=Object.keys(declared).filter(name=>!existsSync(join(root,'node_modules',name)))
const lockExists=existsSync(join(root,'package-lock.json'))

console.log(`Dependency preflight: ${Object.keys(declared).length} declared packages`)
console.log(`node_modules: ${existsSync(join(root,'node_modules'))?'present':'absent'}`)
console.log(`package-lock.json: ${lockExists?'present':'absent'}`)
if(missing.length) console.log(`missing packages: ${missing.join(', ')}`)
if(lockExists && missing.length===0){
  console.log('Dependency preflight passed: installed tree and lockfile are present.')
  process.exit(0)
}
console.log('Dependency preflight unresolved: install dependencies from the declared lockfile before running the production/installed test gate.')
if(process.argv.includes('--strict')) process.exit(1)
