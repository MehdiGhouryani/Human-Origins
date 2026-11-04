import {readdirSync,readFileSync,statSync} from 'node:fs'
import {join} from 'node:path'
import {describe,expect,it} from 'vitest'

// A plain <a href="/..."> to another route of this app forces a full page reload and throws away client state.
// Public UI must use next/link. Admin-only affordances (/admin...) are allowed.
const roots=['app','components']
const walk=(dir:string):string[]=>readdirSync(dir).flatMap(name=>{
  const path=join(dir,name)
  if(path.replace(/\\/g,'/').startsWith('app/admin')) return []
  return statSync(path).isDirectory()?walk(path):path.endsWith('.tsx')?[path]:[]
})
const internalAnchor=/<a\s[^>]*href=(?:"\/(?!\/|admin)|\{`\/(?!\/|admin)|\{"\/(?!\/|admin))/

describe('internal navigation',()=>{
  it('never uses a plain <a> for same-app routes in public UI',()=>{
    const offenders:string[]=[]
    for(const file of roots.flatMap(walk)){
      readFileSync(file,'utf8').split('\n').forEach((line,index)=>{if(internalAnchor.test(line)) offenders.push(`${file}:${index+1}`)})
    }
    expect(offenders).toEqual([])
  })
})
