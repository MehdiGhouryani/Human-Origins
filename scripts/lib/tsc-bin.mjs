import {join} from 'node:path'

// TypeScript's own bin/tsc, run through the current Node binary. `tsc` alone is a shell shim that
// CreateProcess cannot exec on Windows (spawnSync ENOENT); this form is platform-independent.
export const tscBin=join(process.cwd(),'node_modules','typescript','bin','tsc')
