import {fileURLToPath} from 'node:url'
import {configDefaults, defineConfig} from 'vitest/config'

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
  resolve: {
    alias: {
      'server-only': fileURLToPath(new URL('./tests/shims/server-only.ts', import.meta.url)),
    },
  },
})
