import {expect,test} from '@playwright/test'

// Phase 5. The comparison is a mode of the explorer: it is shareable, bounded to three taxa, drawn on a fixed scale,
// and makes no claim that its sources do not carry.
test('the old compare route lands on the comparison with the featured trio', async({page})=>{
  await page.goto('/compare')
  await expect(page).toHaveURL(/mode=compare/)
  await expect(page.getByRole('heading',{name:/Comparative Anatomy/})).toBeVisible()
  await expect(page.locator('.compare-chip.active')).toHaveCount(3)
  await expect(page.locator('.topbar')).toBeVisible()          // the site header is present (BUG-23)
})

test('the comparison is shareable: a link selects the named taxa', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=compare&cmp=erectus,habilis')
  await expect(page.locator('.compare-chip.active')).toHaveCount(2)
  await expect(page.locator('.compare-card-header')).toHaveCount(2)
})

test('a fourth taxon waits for a removal, and nothing is dropped silently', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal,erectus')
  const extra=page.locator('.compare-chip:not(.active)').first()
  await expect(extra).toHaveAttribute('aria-disabled','true')
  // Playwright treats aria-disabled as disabled and would wait; force the click to prove the attempt changes nothing.
  await extra.click({force:true})
  await expect(page.locator('.compare-chip.active')).toHaveCount(3)
  await expect(page.locator('.compare-limit')).toContainText('Remove one to add another')
  await page.locator('.compare-remove-btn').first().click()
  await expect(page.locator('.compare-chip.active')).toHaveCount(2)
  await extra.click()
  await expect(page.locator('.compare-chip.active')).toHaveCount(3)
})

test('the cranial scale keeps every bar on its track, and claims come from records', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal,erectus')
  // Compare is a deferred view chunk; wait for its cards and data bars before measuring the scale.
  await expect(page.locator('.compare-card-header')).toHaveCount(3)
  await expect(page.locator('.compare-cc-bar').first()).toBeVisible()
  const bars=await page.locator('.compare-cc-bar').evaluateAll(els=>els.map(el=>({
    left:parseFloat((el as HTMLElement).style.left),
    width:parseFloat((el as HTMLElement).style.width),
  })))
  expect(bars.length).toBeGreaterThan(0)
  for(const bar of bars){
    expect(bar.left).toBeGreaterThanOrEqual(0)
    expect(bar.left+bar.width).toBeLessThanOrEqual(100.01)
  }
  await expect(page.getByText('Direct ancient genome sequences recovered.')).toHaveCount(0)
  await expect(page.getByText('Morphological and fossil record evidence.')).toHaveCount(0)
  await expect(page.locator('.compare-temporal-callout:visible')).not.toContainText('documented in fossil records')
})

test('overlapping date ranges are reported as dating only', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=compare&cmp=neanderthal,erectus')
  const callout=page.locator('.compare-temporal-callout:visible')
  await expect(callout).toHaveCount(1)
  await expect(callout).toContainText('recorded date ranges overlap')
  await expect(callout).toContainText('They do not imply contact, descent or interbreeding')
})

test('on a phone the matrix scrolls inside its own region, not the page', async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal,erectus')
  // The view is deferred and can briefly reconcile a hidden shell; measure the one accessible, visible region.
  await expect(page.locator('.compare-card-header:visible')).toHaveCount(3)
  const scrollRegion=page.getByRole('region',{name:'Comparison matrix. Scroll sideways to see every selected taxon.'})
  await expect(scrollRegion).toHaveCount(1)
  await expect(scrollRegion).toBeVisible()
  const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
  expect(pageOverflow).toBeLessThanOrEqual(1)
  const regionScrolls=await scrollRegion.evaluate(el=>el.scrollWidth>el.clientWidth)
  expect(regionScrolls).toBe(true)
})

test('on a phone the first taxon sits beside the narrow labels and the chosen chips are in view', async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal,erectus')
  const cardHeaders=page.locator('.compare-card-header')
  // Compare is an on-demand chunk; wait until its selected cards have hydrated before measuring layout.
  await expect(cardHeaders).toHaveCount(3)
  await expect(cardHeaders.first()).toBeVisible()
  const header=cardHeaders.first()
  // The lazy chunk can hydrate/reconcile once after its first visible paint; poll the measured geometry.
  await expect.poll(async()=>{const box=await header.boundingBox();return box?.x??999}).toBeLessThan(170) // label column ≈104px
  const chip=page.locator('.compare-chip.active').first()
  await expect.poll(async()=>{const box=await chip.boundingBox();return box?.x??-1}).toBeGreaterThanOrEqual(0)
  await expect.poll(async()=>{const box=await chip.boundingBox();return box?box.x+box.width:999}).toBeLessThanOrEqual(390)
})


// UX pass: Compare is never a dead end, its portraits stay avatars, and its controls are touch-sized on a phone.
test('compare keeps the explorer tab bar, one row on a phone, and leads back to the tree',async({page})=>{
  await page.setViewportSize({width:360,height:800})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal')
  const tabs=page.getByRole('tablist',{name:'Explorer views'}).getByRole('tab')
  await expect(tabs).toHaveCount(4)
  await expect(page.getByRole('tab',{name:'Compare',exact:true})).toHaveAttribute('aria-selected','true')
  const tops=await tabs.evaluateAll(els=>els.map(el=>Math.round(el.getBoundingClientRect().top)))
  expect(new Set(tops).size).toBe(1)
  const heights=await tabs.evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height))
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
  await page.getByRole('tab',{name:'Tree',exact:true}).click()
  await expect(page).not.toHaveURL(/mode=compare/)
  await expect(page.getByRole('tab',{name:'Tree',exact:true})).toHaveAttribute('aria-selected','true')
})

test('compare portraits are avatars and the chips are touch-sized',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal')
  const avatar=page.locator('.compare-avatar-img').first()
  await expect(avatar).toBeVisible()
  const box=await avatar.boundingBox()
  expect(box!.width).toBeLessThanOrEqual(80)
  expect(box!.height).toBeLessThanOrEqual(80)
  // A hidden reconciliation shell remains in the DOM; only user-visible picker buttons are touch targets.
  const small=await page.locator('.compare-chip:visible').evaluateAll(els=>els.filter(el=>el.getBoundingClientRect().height<44).length)
  expect(small).toBe(0)
})
