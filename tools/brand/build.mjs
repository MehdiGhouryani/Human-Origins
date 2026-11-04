// Regenerates the brand assets from the SVG definitions below. Run: node tools/brand/build.mjs
// Output is committed so builds never depend on this script. No scientific claims appear in any asset.
import sharp from 'sharp'
import {writeFileSync} from 'node:fs'

const GOLD='#e8bd70'
const BG='#050d0f'
// Four-point star, the same mark the header renders as a text glyph.
const STAR='M16 3C17.4 11 21 14.6 29 16C21 17.4 17.4 21 16 29C14.6 21 11 17.4 3 16C11 14.6 14.6 11 16 3Z'

const markSvg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="${BG}"/><path d="${STAR}" fill="${GOLD}"/></svg>`
writeFileSync('app/icon.svg',markSvg)

const square=(size,pad)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="${BG}"/><g transform="translate(${pad} ${pad}) scale(${(size-pad*2)/32})"><path d="${STAR}" fill="${GOLD}"/></g></svg>`
await sharp(Buffer.from(square(180,34))).png().toFile('app/apple-icon.png')
await sharp(Buffer.from(square(192,40))).png().toFile('public/icons/icon-192.png')
await sharp(Buffer.from(square(512,110))).png().toFile('public/icons/icon-512.png')

const og=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><radialGradient id="g" cx="78%" cy="30%" r="75%"><stop offset="0" stop-color="#1b4a47"/><stop offset=".55" stop-color="#0a2022"/><stop offset="1" stop-color="${BG}"/></radialGradient></defs>
<rect width="1200" height="630" fill="url(#g)"/>
<g transform="translate(84 92) scale(2.1)"><path d="${STAR}" fill="${GOLD}"/></g>
<text x="84" y="330" font-family="DejaVu Serif, Georgia, serif" font-size="104" font-weight="700" fill="#eee8dc">Human Origins</text>
<text x="88" y="402" font-family="DejaVu Sans, Arial, sans-serif" font-size="38" fill="${GOLD}">Interactive Human Evolution Atlas</text>
<text x="88" y="500" font-family="DejaVu Sans, Arial, sans-serif" font-size="27" fill="#aebbb8">Source-aware · evidence, specimens, time and migration</text>
<rect x="84" y="540" width="1032" height="2" fill="#2d5a56"/>
</svg>`
const png=await sharp(Buffer.from(og)).png({compressionLevel:9}).toBuffer()
writeFileSync('app/opengraph-image.png',png)
writeFileSync('app/twitter-image.png',png)
writeFileSync('app/opengraph-image.alt.txt','Human Origins — Interactive Human Evolution Atlas')
writeFileSync('app/twitter-image.alt.txt','Human Origins — Interactive Human Evolution Atlas')
console.log('brand assets written')
