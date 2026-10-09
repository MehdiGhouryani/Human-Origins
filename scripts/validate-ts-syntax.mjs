import {join} from 'node:path'
import {readdirSync,readFileSync,statSync} from 'node:fs'
import ts from 'typescript'

const roots=['app','components','content','domain','features','infrastructure','presentation','tests']
const errors=[]
function walk(dir){
  for(const entry of readdirSync(dir)){
    const full=join(dir,entry)
    const st=statSync(full)
    if(st.isDirectory()){walk(full);continue}
    if(!/\.(ts|tsx)$/.test(full)) continue
    const source=readFileSync(full,'utf8')
    const result=ts.transpileModule(source,{fileName:full,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX,strict:true},reportDiagnostics:true})
    for(const d of result.diagnostics??[]) errors.push(`${full}:${d.start??0} ${ts.flattenDiagnosticMessageText(d.messageText,' ')}`)
  }
}
for(const root of roots) walk(root)
if(errors.length){for(const e of errors) console.error('SYNTAX',e);process.exit(1)}
console.log(`TS/TSX syntax transpilation passed: ${roots.length} source roots checked.`)
