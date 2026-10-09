import {readFileSync, existsSync, readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join, resolve} from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const checks = [
  ['public/assets/hero-evolution.webp', [1920, 440]],
]

const errors = []
for (const [rel, [expectedW, expectedH]] of checks) {
  const p = join(root, rel)
  if (!existsSync(p)) {
    errors.push(`missing: ${rel}`)
    continue
  }
  const meta = await sharp(p).metadata()
  if (meta.width !== expectedW || meta.height !== expectedH) {
    errors.push(`${rel}: expected (${expectedW}, ${expectedH}), got (${meta.width}, ${meta.height})`)
  }
}

const manifestPath = join(root, 'public/assets/asset-manifest.json')
if (existsSync(manifestPath)) {
  const data = JSON.parse(readFileSync(manifestPath, 'utf8'))
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  if (data.version !== (pkg.version || '').replace('0.', '')) {
    errors.push(`asset-manifest version is not aligned with package release ${pkg.version}`)
  }
  const listed = new Set((data.assets || []).map(item => item.path))
  for (const item of data.assets || []) {
    const path = item.path || ''
    const expected = item.sha256
    if (path.startsWith('/assets/') && expected) {
      const fp = join(root, 'public', path.replace(/^\//, ''))
      if (existsSync(fp)) {
        const actual = createHash('sha256').update(readFileSync(fp)).digest('hex')
        if (actual !== expected) errors.push(`${path}: sha256 mismatch`)
      }
    }
  }
  for (const file of readdirSync(join(root, 'public/assets/species/samples'))) {
    const path = `/assets/species/samples/${file}`
    if (!listed.has(path)) errors.push(`${path}: missing from asset manifest`)
  }
}

// Legacy assets are intentionally absent after v31-to-v32; the migration disposition records their hashes.
if (errors.length) {
  for (const e of errors) console.error('ERROR', e)
  process.exit(1)
}
console.log('Asset audit passed.')
