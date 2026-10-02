import {existsSync} from 'node:fs'
import {execFileSync} from 'node:child_process'

execFileSync(process.execPath,['scripts/audit-code.mjs'],{stdio:'inherit'})
execFileSync(process.execPath,['scripts/audit-ui-contract.mjs'],{stdio:'inherit'})
const eslintBin='node_modules/eslint/bin/eslint.js'
if(existsSync(eslintBin)){
  execFileSync(process.execPath,[eslintBin,'.'],{stdio:'inherit'})
}else{
  console.log('ESLint dependency tree is not installed in this sandbox; architecture + UI contract audits are the active local lint gate.')
}
