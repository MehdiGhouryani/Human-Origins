import {readFileSync} from 'node:fs'
import {join} from 'node:path'
const root=process.cwd()
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8'))
const catalog=readFileSync(join(root,'content/catalog.ts'),'utf8')
const manifest=JSON.parse(readFileSync(join(root,'public/assets/catalog-runtime-manifest.json'),'utf8'))
const readme=readFileSync(join(root,'README.md'),'utf8')
const failures=[]
const version=pkg.version
if(!catalog.includes(`release:'${version}'`)) failures.push(`content catalog release does not match package version ${version}`)
if(manifest.release!==version) failures.push(`runtime manifest release ${manifest.release} does not match package version ${version}`)
if(!readme.includes(`**${version}**`)) failures.push(`README current-release marker does not match ${version}`)
if(!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) failures.push(`package version is not semver-like: ${version}`)
if(failures.length){for(const item of failures) console.error('FAIL',item);process.exit(1)}
console.log(`Version consistency audit passed: ${version}`)
