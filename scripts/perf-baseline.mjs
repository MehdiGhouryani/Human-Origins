#!/usr/bin/env node
// Phase 7.1 of docs/HUMAN-ORIGINS-FIX-PLAN.md: lab measurement protocol.
// Usage: npm run perf:baseline -- --base http://localhost:3000 --runs 5 --out tests/perf/baseline.json [--only home-mobile]
// Mobile scenarios: CPU x4 and a Fast 4G profile. Desktop scenarios: no throttling. Medians of N runs are reported.
// Absolute values depend on the machine; compare medians measured on the same machine only.
import {chromium} from '@playwright/test'
import {execSync} from 'node:child_process'
import {mkdirSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import {arch, cpus, platform} from 'node:os'

const opts = {base: process.env.PERF_BASE_URL || 'http://localhost:3000', runs: 5, out: 'tests/perf/baseline.json', only: null}
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i]
  if (a === '--base') opts.base = process.argv[++i]
  else if (a === '--runs') opts.runs = Number(process.argv[++i])
  else if (a === '--out') opts.out = process.argv[++i]
  else if (a === '--only') opts.only = process.argv[++i]
}

const SCENARIOS = [
  {id: 'home-mobile', path: '/', viewport: {width: 390, height: 844}, mobile: true},
  {id: 'home-desktop', path: '/', viewport: {width: 1440, height: 900}, mobile: false},
  {id: 'species-mobile', path: '/species/neanderthal', viewport: {width: 390, height: 844}, mobile: true},
  {id: 'species-desktop', path: '/species/neanderthal', viewport: {width: 1440, height: 900}, mobile: false},
  {id: 'compare-mobile', path: '/?mode=compare&cmp=sapiens,neanderthal', viewport: {width: 390, height: 844}, mobile: true},
  {id: 'migration-mobile', path: '/?mode=migration', viewport: {width: 390, height: 844}, mobile: true},
  {id: 'evidence-desktop', path: '/?mode=evidence', viewport: {width: 1440, height: 900}, mobile: false},
  {id: 'about-mobile', path: '/about', viewport: {width: 390, height: 844}, mobile: true},
]

// Collected inside the page before any script runs.
const INIT = `(() => {
  const m = (window.__perf = {lcp: null, cls: 0, tbt: 0, events: []});
  try {
    new PerformanceObserver((l) => { const e = l.getEntries().at(-1); m.lcp = Math.round(e.startTime); }).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) m.cls += e.value; }).observe({type: 'layout-shift', buffered: true});
    new PerformanceObserver((l) => { for (const e of l.getEntries()) m.tbt += Math.max(0, e.duration - 50); }).observe({type: 'longtask', buffered: true});
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'click') m.events.push(e.duration); }).observe({type: 'event', buffered: true, durationThreshold: 16});
  } catch (err) { m.error = String(err); }
})();`

const median = (xs) => {
  const v = xs.filter((x) => typeof x === 'number' && Number.isFinite(x)).sort((a, b) => a - b)
  if (!v.length) return null
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

async function runOnce(browser, scenario) {
  const context = await browser.newContext({viewport: scenario.viewport, hasTouch: scenario.mobile, deviceScaleFactor: 1})
  await context.addInitScript(INIT)
  const page = await context.newPage()
  if (scenario.mobile) {
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', {rate: 4})
    await cdp.send('Network.enable')
    await cdp.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular4g'})
  }
  const pending = []
  page.on('requestfinished', (req) => {
    pending.push(req.sizes().then(
      (s) => ({type: req.resourceType(), bytes: (s.responseBodySize || 0) + (s.responseHeadersSize || 0)}),
      () => ({type: req.resourceType(), bytes: 0}),
    ))
  })
  await page.goto(opts.base + scenario.path, {waitUntil: 'load', timeout: 120000})
  await page.waitForTimeout(1500)
  // Load metrics are read before any interaction, so the click's own work is not counted as page load.
  const data = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {}
    const fcp = performance.getEntriesByName('first-contentful-paint')[0]
    const m = window.__perf || {}
    const sel = 'button,a[href],input,select,textarea,summary,[role=tab],[role=button]'
    const visible = [...document.querySelectorAll(sel)].filter((e) => {
      const r = e.getBoundingClientRect()
      return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0
    })
    const inGraph = visible.filter((e) => e.closest('[class*="lineage"],[class*="graph"]')).length
    return {
      ttfb: typeof nav.responseStart === 'number' ? Math.round(nav.responseStart) : null,
      fcp: fcp ? Math.round(fcp.startTime) : null,
      lcp: m.lcp ?? null,
      cls: typeof m.cls === 'number' ? Number(m.cls.toFixed(4)) : null,
      tbt: typeof m.tbt === 'number' ? Math.round(m.tbt) : null,
      dom: document.getElementsByTagName('*').length,
      controlsAboveFold: visible.length,
      controlsNonGraph: visible.length - inGraph,
    }
  })
  const loadCount = pending.length
  // One interaction sample for INP: the first inactive tab, if the page has one. Measured after the load snapshot.
  const tab = page.locator('[role="tab"][aria-selected="false"]:visible').first()
  if (await tab.count()) {
    await tab.click({timeout: 5000}).catch(() => {})
    await page.waitForTimeout(800)
  }
  data.inp = await page.evaluate(() => {
    const m = window.__perf || {}
    return m.events && m.events.length ? Math.round(Math.max(...m.events)) : null
  })
  const sizes = await Promise.all(pending.slice(0, loadCount))
  const bytes = {document: 0, script: 0, stylesheet: 0, image: 0, font: 0, other: 0}
  for (const s of sizes) {
    const k = ['document', 'script', 'stylesheet', 'image', 'font'].includes(s.type) ? s.type : 'other'
    bytes[k] += s.bytes
  }
  bytes.total = Object.values(bytes).reduce((a, b) => a + b, 0)
  await context.close()
  return {...data, requests: sizes.length, bytes}
}

const commit = (() => { try { return execSync('git rev-parse --short HEAD').toString().trim() } catch { return 'unknown' } })()
const browser = await chromium.launch({executablePath: process.env.PW_CHROMIUM_PATH || undefined, headless: true})
const scenarios = {}
try {
  for (const scenario of SCENARIOS.filter((s) => !opts.only || s.id === opts.only)) {
    const runs = []
    for (let i = 0; i < opts.runs; i++) runs.push(await runOnce(browser, scenario))
    const pick = (f) => median(runs.map(f))
    const bytesOf = (k) => median(runs.map((r) => r.bytes[k]))
    scenarios[scenario.id] = {
      mobile: scenario.mobile,
      path: scenario.path,
      viewport: scenario.viewport,
      ttfb: pick((r) => r.ttfb), fcp: pick((r) => r.fcp), lcp: pick((r) => r.lcp), cls: pick((r) => r.cls),
      tbt: pick((r) => r.tbt), inp: pick((r) => r.inp), dom: pick((r) => r.dom),
      controlsAboveFold: pick((r) => r.controlsAboveFold), controlsNonGraph: pick((r) => r.controlsNonGraph),
      requests: pick((r) => r.requests),
      bytes: {document: bytesOf('document'), script: bytesOf('script'), stylesheet: bytesOf('stylesheet'), image: bytesOf('image'), font: bytesOf('font'), other: bytesOf('other'), total: bytesOf('total')},
      lcpRuns: runs.map((r) => r.lcp),
      tbtRuns: runs.map((r) => r.tbt),
    }
    const s = scenarios[scenario.id]
    console.log(`${scenario.id.padEnd(18)} LCP ${s.lcp}ms  CLS ${s.cls}  TBT ${s.tbt}ms  INP ${s.inp}ms  TTFB ${s.ttfb}ms  doc ${Math.round(s.bytes.document / 1024)}KB  js ${Math.round(s.bytes.script / 1024)}KB  img ${Math.round(s.bytes.image / 1024)}KB  font ${Math.round(s.bytes.font / 1024)}KB  controls ${s.controlsNonGraph}`)
  }
} finally {
  await browser.close()
}
const cpu = cpus()[0]?.model || 'unknown'
const report = {
  schema: 'perf-baseline/1',
  createdAt: new Date().toISOString(),
  commit,
  base: opts.base,
  runs: opts.runs,
  environment: {platform: platform(), arch: arch(), cpu, node: process.version},
  protocol: {
    mobile: 'CPU x4 (Emulation.setCPUThrottlingRate), network Fast 4G (150 ms latency, 1.6 Mbps down, 0.75 Mbps up)',
    desktop: 'no throttling; 1440x900',
    metrics: 'TTFB = navigation responseStart; LCP, CLS, TBT (long tasks minus 50 ms), INP approximated by the slowest click event after one tab click; bytes = wire size by resource type',
    controls: 'interactive elements inside the first viewport; controlsNonGraph excludes elements inside lineage or graph containers',
  },
  scenarios,
}
mkdirSync(dirname(opts.out), {recursive: true})
writeFileSync(opts.out, JSON.stringify(report, null, 2) + '\n')
console.log(`written ${opts.out}`)
