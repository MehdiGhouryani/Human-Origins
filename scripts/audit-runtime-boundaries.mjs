import {readFileSync,readdirSync,statSync} from 'node:fs'
import {join,relative} from 'node:path'

const root=process.cwd(); const failures=[]
function walk(dir){
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry); const st=statSync(full)
    if(st.isDirectory()){walk(full);continue}
    if(!/\.(ts|tsx)$/.test(full)) continue
    const text=readFileSync(full,'utf8'); const rel=relative(root,full)
    if(/^['\"]use client['\"]/.test(text.trim())){
      const forbidden=[/from ['\"].*\/infrastructure\//,/from ['\"].*features\/explorer\/bootstrap['\"](?!.*type)/,/from ['\"].*features\/explorer\/bootstrap['\"]/]
      for(const rx of forbidden){
        if(rx.test(text)){
          const offending=text.split(/\n/).find(line=>rx.test(line))
          if(offending && !/^import type /.test(offending.trim())) failures.push(`${rel}: client module imports server-bound module: ${offending.trim()}`)
        }
      }
    }
  }
}
for(const dir of ['app','components','features','presentation','domain']) walk(join(root,dir))
if(failures.length){for(const f of failures) console.error('FAIL',f);process.exit(1)}
console.log('Runtime boundary audit passed: no client module imports an infrastructure/server-bound runtime module.')
