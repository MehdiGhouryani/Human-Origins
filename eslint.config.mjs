import {defineConfig,globalIgnores} from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  ...nextVitals,
  ...tseslint.configs.recommended,
  {
    rules:{
      '@typescript-eslint/no-explicit-any':'error',
      '@typescript-eslint/consistent-type-imports':['error',{prefer:'type-imports'}],
    },
  },
  globalIgnores(['.next/**','out/**','build/**','public/**','docs/**','scripts/**','tsconfig.tsbuildinfo','node_modules/**']),
])
