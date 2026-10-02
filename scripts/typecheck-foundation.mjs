import {execFileSync} from 'node:child_process'

const files=[
  'content/*.ts','domain/*.ts','features/explorer/types.ts','features/explorer/state.ts','features/explorer/selectors.ts',
  'infrastructure/repository.ts','infrastructure/validation/audit.ts','presentation/*.ts','domain/research-graph.ts','migrations/v21-to-v23.ts','scripts/audit-data-entry.ts'
]
// Not a login shell: `bash -lc` reset PATH and lost node_modules/.bin, so `tsc` was not found outside CI.
execFileSync('bash',['-c',`"${process.cwd()}/node_modules/.bin/tsc" ${files.join(' ')} --outDir /tmp/human-origins-foundation-typecheck --module commonjs --target ES2020 --esModuleInterop --skipLibCheck --strict`],{stdio:'inherit'})
console.log('Foundation typecheck passed: canonical content/domain + explorer feature selectors.')
