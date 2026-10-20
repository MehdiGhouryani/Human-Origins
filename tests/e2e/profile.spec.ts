import {expect,test,type Page} from '@playwright/test'

// Phase 3 acceptance. Wide screens keep the profile beside the tree; narrow screens show it as a sheet.
const WIDE=[1440,1366,1280,1024] as const
const NARROW=[820,768,390,360] as const

const profileTabs=(page:Page)=>page.locator('.inspector [role="tab"]')
const profileCta=(page:Page)=>page.locator('.inspector a.primary-cta')

for(const width of WIDE){
  test(`profile is always open at ${width}px, with Neanderthal and the map graph`,async({page})=>{
    await page.setViewportSize({width,height:900})
    await page.goto('/')
    await expect(page.getByRole('heading',{level:2,name:'Homo neanderthalensis'})).toBeVisible()
    await expect(profileTabs(page)).toHaveCount(3)
    await expect(profileCta(page)).toHaveCount(1)
    await expect(page.locator('.atlas-graph-node')).toHaveCount(11)   // the map, not the list
    await expect(page.locator('.atlas-graph-row')).toHaveCount(0)
  })
}

for(const width of NARROW){
  test(`profile is a sheet at ${width}px: opens on choice, closes with its button and Escape`,async({page})=>{
    await page.setViewportSize({width,height:844})
    await page.goto('/')
    const sheet=page.locator('.inspector')
    await expect(sheet).toBeHidden()
    const chip=page.locator('.taxon-chip[data-taxon="sapiens"]')
    await chip.click()
    await expect(sheet).toBeVisible()
    await expect(sheet).toHaveClass(/is-open/)
    await expect(page.getByRole('heading',{level:2,name:'Homo sapiens'})).toBeFocused()
    await expect(page.locator('.inspector-close-btn')).toBeVisible()
    await page.locator('.inspector-close-btn').click()
    await expect(sheet).toBeHidden()
    await expect(chip).toBeFocused()             // focus returns to the element that opened the sheet
    await chip.click()
    await expect(sheet).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(sheet).toBeHidden()
  })
}

test('the profile keeps its place while the species changes (no remount, no blank)', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/')
  await page.evaluate(()=>{document.querySelector('.inspector')!.setAttribute('data-marker','kept')})
  await page.locator('.taxon-chip[data-taxon="erectus"]').click()
  await expect(page.getByRole('heading',{level:2,name:'Homo erectus'})).toBeVisible()
  await expect(page.locator('.inspector')).toHaveAttribute('data-marker','kept')
})

test('the three profile views switch, and the genetic evidence sits in Evidence', async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/')
  await page.getByRole('tab',{name:'Evidence',exact:true}).click()
  await expect(page.getByText('Documented gene flow')).toBeVisible()
  await page.getByRole('tab',{name:'Lifestyle',exact:true}).click()
  await expect(page.getByRole('tab',{name:'Lifestyle',exact:true})).toHaveAttribute('aria-selected','true')
})
