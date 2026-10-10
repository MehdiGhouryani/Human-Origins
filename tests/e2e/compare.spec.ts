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
  await expect(page.locator('.compare-temporal-callout')).not.toContainText('documented in fossil records')
})

test('overlapping date ranges are reported as dating only', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=compare&cmp=neanderthal,erectus')
  const callout=page.locator('.compare-temporal-callout')
  await expect(callout).toContainText('recorded date ranges overlap')
  await expect(callout).toContainText('They do not imply contact, descent or interbreeding')
})

test('on a phone the matrix scrolls inside its own region, not the page', async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/?mode=compare&cmp=sapiens,neanderthal,erectus')
  await expect(page.locator('.compare-scroll')).toBeVisible()
  const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
  expect(pageOverflow).toBeLessThanOrEqual(1)
  const regionScrolls=await page.locator('.compare-scroll').evaluate(el=>el.scrollWidth>el.clientWidth)
  expect(regionScrolls).toBe(true)
})
