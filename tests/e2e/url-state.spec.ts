import {expect,test,type Page} from '@playwright/test'

// The header's own navigation; the evidence view also has links named Evidence.
const headerNav=(page:Page)=>page.getByRole('navigation',{name:'Modes'})

type ReloadMarker={__noReload?:number}
const markNoReload=(page:Page)=>page.evaluate(()=>{(window as unknown as ReloadMarker).__noReload=1})
const stillNoReload=(page:Page)=>page.evaluate(()=>(window as unknown as ReloadMarker).__noReload===1)

test.describe('the URL is the source of explorer state',()=>{
  test('a header link pressed right after tab changes still navigates (no pending write undoes it)', async({page})=>{
    await page.setViewportSize({width:1440,height:900})
    await page.goto('/')
    await page.getByRole('tab',{name:'Timeline',exact:true}).click()
    await page.waitForTimeout(60)
    await page.getByRole('tab',{name:'Migration',exact:true}).click()
    await page.waitForTimeout(60)
    await page.getByRole('tab',{name:'Tree',exact:true}).click()
    await page.waitForTimeout(40)
    await page.locator('nav[aria-label="Modes"]').getByRole('link',{name:'Journey',exact:true}).click()
    await expect(page.locator('.journey-view')).toBeVisible()
    await expect(page).toHaveURL(/journey=1/)
  })

  test('Map range and Return to tree change the view with the URL, without a reload', async({page})=>{
    await page.goto('/')
    await page.locator('.taxon-chip[data-taxon="sapiens"]').click()
    await markNoReload(page)
    await page.getByRole('link',{name:'Map range'}).click()
    await expect(page).toHaveURL(/mode=migration/)
    await expect(page.locator('.mode-tabs .selected')).toHaveText(/Migration/)
    await expect(page.locator('.migration-view')).toBeVisible()
    await page.getByRole('link',{name:'Return to tree'}).click()
    await expect(page).toHaveURL(/mode=tree/)
    await expect(page.locator('.mode-tabs .selected')).toHaveText(/Tree/)
    await expect(page.locator('.taxon-chip[data-taxon="sapiens"]')).toHaveAttribute('aria-current','true')
    expect(await stillNoReload(page)).toBe(true)
  })

  test('Back and Forward restore species, one history entry per species change', async({page})=>{
    await page.goto('/')
    await page.locator('.taxon-chip[data-taxon="sapiens"]').click()
    await page.locator('.taxon-chip[data-taxon="erectus"]').click()
    await expect(page).toHaveURL(/species=erectus/)
    await page.goBack()
    await expect(page).toHaveURL(/species=sapiens/)
    await expect(page.locator('.taxon-chip[data-taxon="sapiens"]')).toHaveAttribute('aria-current','true')
    await page.goBack()
    await expect(page.locator('.taxon-chip[data-taxon="neanderthal"]')).toHaveAttribute('aria-current','true')
    await page.goForward()
    await expect(page.locator('.taxon-chip[data-taxon="sapiens"]')).toHaveAttribute('aria-current','true')
    await page.goForward()
    await expect(page.locator('.taxon-chip[data-taxon="erectus"]')).toHaveAttribute('aria-current','true')
  })

  test('/#about keeps its hash through explorer changes', async({page})=>{
    await page.goto('/#about')
    await page.waitForTimeout(1200)
    expect(new URL(page.url()).hash).toBe('#about')
    await page.getByRole('tab',{name:'Timeline',exact:true}).click()
    await expect(page.getByRole('tab',{name:'Timeline',exact:true})).toHaveAttribute('aria-selected','true')
    expect(new URL(page.url()).hash).toBe('#about')
  })

  test('the header shows no active item on the tree view, and that holds after load', async({page})=>{
    await page.goto('/')
    await page.waitForTimeout(800)
    await expect(page.locator('.topbar nav[aria-label="Modes"] a[aria-current="page"]')).toHaveCount(0)
  })

  test('header links keep the species on screen and do not reload the page', async({page})=>{
    await page.goto('/')
    await page.locator('.taxon-chip[data-taxon="sapiens"]').click()
    await markNoReload(page)
    await page.getByRole('tab',{name:'Timeline',exact:true}).click()
    await expect(page).toHaveURL(/species=sapiens/)
    await expect(page).toHaveURL(/mode=timeline/)
    await headerNav(page).getByRole('link',{name:'Evidence',exact:true}).click()
    await expect(page).toHaveURL(/species=sapiens/)
    await expect(page).toHaveURL(/mode=evidence/)
    expect(await stillNoReload(page)).toBe(true)
  })

  test('browser Back and Forward restore temporal mode, species, and time correctly across history entries', async({page})=>{
    // 1. Start at /?species=sapiens&mode=migration&time=40
    await page.goto('/?species=sapiens&mode=migration&time=40')
    await expect(page.locator('.migration-view')).toBeVisible()
    const timeSlider=page.getByLabel('Time travel')
    await expect(timeSlider).toHaveValue('40')

    // 2. Select "Evidence near this time". The URL should contain tmode=window
    await page.getByRole('radio',{name:'Evidence near this time'}).click()
    await expect(page).toHaveURL(/tmode=window/)
    await expect(page.getByRole('radio',{name:'Evidence near this time'})).toHaveAttribute('aria-checked','true')

    // 3. Change selected species to erectus, creating a history entry (pushState)
    await page.locator('.taxon-chip[data-taxon="erectus"]').click()
    await expect(page).toHaveURL(/species=erectus/)
    await expect(page).toHaveURL(/tmode=window/)

    // 4. On the erectus entry, change actual time control to a different value (60) using the real UI
    await timeSlider.fill('60')
    await expect(page).toHaveURL(/time=60/)
    await expect(timeSlider).toHaveValue('60')

    // 5. Switch back to "Historical evidence trail"
    await page.getByRole('radio',{name:'Historical evidence trail'}).click()
    await expect(page).not.toHaveURL(/tmode=window/)
    await expect(page).toHaveURL(/time=60/)
    await expect(page.getByRole('radio',{name:'Historical evidence trail'})).toHaveAttribute('aria-checked','true')

    // 6. Press browser Back. Verify URL and UI restore sapiens, window mode, and original time 40
    await page.goBack()
    await expect(page).toHaveURL(/species=sapiens/)
    await expect(page).toHaveURL(/tmode=window/)
    await expect(page).toHaveURL(/time=40/)
    await expect(page.locator('.taxon-chip[data-taxon="sapiens"]')).toHaveAttribute('aria-current','true')
    await expect(page.getByRole('radio',{name:'Evidence near this time'})).toHaveAttribute('aria-checked','true')
    await expect(timeSlider).toHaveValue('40')

    // 7. Press browser Forward. Verify URL and UI restore erectus, trail mode, and changed time 60
    await page.goForward()
    await expect(page).toHaveURL(/species=erectus/)
    await expect(page).not.toHaveURL(/tmode=window/)
    await expect(page).toHaveURL(/time=60/)
    await expect(page.locator('.taxon-chip[data-taxon="erectus"]')).toHaveAttribute('aria-current','true')
    await expect(page.getByRole('radio',{name:'Historical evidence trail'})).toHaveAttribute('aria-checked','true')
    await expect(timeSlider).toHaveValue('60')
  })
})
