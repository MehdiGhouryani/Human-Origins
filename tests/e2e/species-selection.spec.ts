import {expect,test,type Page} from '@playwright/test'

// Phase 4. Every species control selects its own profile. The graph keeps its eleven main-path taxa; the other
// seven are labelled, and their chips work like the rest.
const profileHref=(page:Page)=>page.locator('.inspector .inspector-actions a.primary-cta').getAttribute('href')

test('all eighteen species chips select their own profile', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/')
  const chips=page.locator('.taxon-chip')
  await expect(chips).toHaveCount(18)
  const ids=await chips.evaluateAll(els=>els.map(el=>el.getAttribute('data-taxon')??''))
  for(const id of ids){
    const chip=page.locator(`.taxon-chip[data-taxon="${id}"]`)
    await chip.click()
    await expect(chip).toHaveAttribute('aria-current','true')
    await expect.poll(()=>profileHref(page)).toBe(`/species/${id}`)
  }
})

test('all eleven main-path taxa on the graph select their own profile', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/')
  const nodes=page.locator('.atlas-graph-node')
  await expect(nodes).toHaveCount(11)
  const ids=await nodes.evaluateAll(els=>els.map(el=>el.getAttribute('data-taxon')??''))
  for(const id of ids){
    const node=page.locator(`.atlas-graph-node[data-taxon="${id}"]`)
    await node.click()
    await expect(node).toHaveAttribute('aria-pressed','true')
    await expect.poll(()=>profileHref(page)).toBe(`/species/${id}`)
  }
})

test('the seven taxa outside the main graph are labelled, and the graph still shows eleven', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/')
  const outside=page.locator('.taxon-chip:has(.taxon-chip-off)')
  await expect(outside).toHaveCount(7)
  const offIds=await outside.evaluateAll(els=>els.map(el=>el.getAttribute('data-taxon')??''))
  const graphIds=await page.locator('.atlas-graph-node').evaluateAll(els=>els.map(el=>el.getAttribute('data-taxon')??''))
  expect(graphIds).toHaveLength(11)
  expect(offIds.filter(id=>graphIds.includes(id))).toEqual([])
})

test('with a taxon outside the graph selected, one graph node stays reachable from the keyboard', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?species=common')
  const reachable=page.locator('.atlas-graph-node[tabindex="0"]')
  await expect(reachable).toHaveCount(1)
  await reachable.focus()
  await page.keyboard.press('ArrowRight')
  const pressed=page.locator('.atlas-graph-node[aria-pressed="true"]')
  await expect(pressed).toHaveCount(1)
  const id=await pressed.getAttribute('data-taxon')
  await expect.poll(()=>profileHref(page)).toBe(`/species/${id}`)
})

test('a timeline row selects its species and keeps the reader in the timeline', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=timeline')
  await page.locator('.timeline-rows button').first().click()
  await expect(page.getByRole('tab',{name:'Timeline',exact:true})).toHaveAttribute('aria-selected','true')
  await expect(page.locator('.inspector h2')).toBeVisible()
})

test('a taxon search result selects the species on this page', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?q=erectus')
  const result=page.locator('button.search-taxon',{hasText:/erectus/i}).first()
  await expect(result).toBeVisible()
  await result.click()
  await expect(page.locator('.taxon-chip[data-taxon="erectus"]')).toHaveAttribute('aria-current','true')
  await expect(page.locator('.search-page')).toHaveCount(0)
  await expect(page).toHaveURL(/species=erectus/)
  await expect(page).not.toHaveURL(/q=/)
})

test('corridors are drawn for Homo sapiens only', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?species=neanderthal&mode=migration')
  await expect(page.locator('.migration-view')).toBeVisible()
  await expect(page.locator('.migration-route')).toHaveCount(0)
  await page.goto('/?species=sapiens&mode=migration')
  await expect(page.locator('.migration-view')).toBeVisible()
  await expect(page.locator('.map-info')).not.toContainText('Corridors show Homo sapiens dispersals only')
})
