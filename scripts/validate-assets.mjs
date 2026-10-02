import {readFileSync, existsSync, readdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {join, resolve} from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const checks = [
  ['public/assets/hero-evolution.webp', [1920, 440]],
  ['public/assets/neanderthal.webp', [1024, 1024]],
  ['public/assets/neanderthal-768.webp', [768, 768]],
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
}

const mediaManifestPath = join(root, 'public/assets/media-manifest-v22.json')
if (existsSync(mediaManifestPath)) {
  const media = JSON.parse(readFileSync(mediaManifestPath, 'utf8'))
  const items = media.items || []
  const ids = items.map(item => item.mediaId)
  if (ids.length !== new Set(ids).size) errors.push('media-manifest contains duplicate media IDs')
  for (const item of items) {
    const src = item.src || ''
    const status = item.status
    if (status === 'legacy') errors.push(`legacy media appears in production media manifest: ${item.mediaId}`)
    if (src.startsWith('/assets/') && !existsSync(join(root, 'public', src.replace(/^\//, '')))) {
      errors.push(`missing canonical media asset: ${src}`)
    } else if (src && !src.startsWith('https://') && !src.startsWith('http://') && !src.startsWith('/assets/')) {
      errors.push(`invalid media src: ${src}`)
    }
  }
} else {
  errors.push('missing media-manifest-v22.json')
}

const legacyDir = join(root, 'public/assets/legacy/v21-plates')
if (!existsSync(legacyDir) || readdirSync(legacyDir).length === 0) {
  errors.push('legacy v21 plate quarantine directory is empty')
}

if (errors.length) {
  for (const e of errors) console.error('ERROR', e)
  process.exit(1)
}
console.log('Asset audit passed.')
