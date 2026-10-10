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
})
