import {expect,test,type Page} from '@playwright/test'

// The header's own navigation; the evidence view also has links named Evidence.
const headerNav=(page:Page)=>page.getByRole('navigation',{name:'Modes'})

test.describe('navigation: each destination is reachable once', ()=>{
  test('the header lists four destinations and the tab bar holds the explorer views', async({page})=>{
    await page.goto('/')
    const header=await page.locator('.topbar nav[aria-label="Modes"] a').allTextContents()
    expect(header.map(text=>text.trim())).toEqual(['Species','Journey','Evidence','About'])
    const tabs=await page.getByRole('tablist',{name:'Explorer views'}).getByRole('tab').allTextContents()
    expect(tabs.map(text=>text.trim())).toEqual(['Tree','Timeline','Migration','Compare'])
  })

  test('arrow keys move focus between tabs without selecting, Enter selects, Home and End jump', async({page})=>{
    await page.goto('/')
    const tree=page.getByRole('tab',{name:'Tree',exact:true})
    const timeline=page.getByRole('tab',{name:'Timeline',exact:true})
    await tree.focus()
    await page.keyboard.press('ArrowRight')
    await expect(timeline).toBeFocused()
    await expect(tree).toHaveAttribute('aria-selected','true')
    await page.keyboard.press('Enter')
    await expect(timeline).toHaveAttribute('aria-selected','true')
    await page.keyboard.press('End')
    await expect(page.getByRole('tab',{name:'Compare',exact:true})).toBeFocused()
    await page.keyboard.press('Home')
    await expect(tree).toBeFocused()
  })

  test('Journey and Evidence open from the header and keep the species', async({page})=>{
    await page.goto('/')
    await page.locator('.taxon-chip[data-taxon="sapiens"]').click()
    await headerNav(page).getByRole('link',{name:'Journey',exact:true}).click()
    await expect(page.locator('.journey-view')).toBeVisible()
    await expect(page).toHaveURL(/journey=1/)
    await expect(page).toHaveURL(/species=sapiens/)
    await expect(headerNav(page).getByRole('link',{name:'Journey',exact:true})).toHaveAttribute('aria-current','page')
    await headerNav(page).getByRole('link',{name:'Evidence',exact:true}).click()
    await expect(page.locator('.evidence-library-view')).toBeVisible()
    await expect(page).toHaveURL(/mode=evidence/)
    await expect(headerNav(page).getByRole('link',{name:'Evidence',exact:true})).toHaveAttribute('aria-current','page')
  })

  test('the About header link opens the About page', async({page})=>{
    await page.goto('/')
    await headerNav(page).getByRole('link',{name:'About',exact:true}).click()
    await expect(page).toHaveURL(/\/about$/)
    await expect(page.getByRole('heading',{name:'About Human Origins'})).toBeVisible()
    await expect(headerNav(page).getByRole('link',{name:'About',exact:true})).toHaveAttribute('aria-current','page')
  })

  test('the Compare tab opens the comparison page', async({page})=>{
    await page.goto('/')
    await page.getByRole('tab',{name:'Compare',exact:true}).click()
    await expect(page).toHaveURL(/mode=compare/)
    await expect(page.getByRole('heading',{name:/Comparative Anatomy/})).toBeVisible()
  })

  test('the Species link opens the species list', async({page})=>{
    await page.goto('/')
    await headerNav(page).getByRole('link',{name:'Species',exact:true}).click()
    await expect(page).toHaveURL(/\/species$/)
    await expect(page.getByRole('heading',{level:1,name:'Species of the atlas'})).toBeVisible()
  })

  test('the Journey back link returns to the same species on the tree', async({page})=>{
    await page.goto('/?journey=1&species=sapiens')
    await expect(page.locator('.journey-view')).toBeVisible()
    await expect(page.getByRole('link',{name:/Back to atlas context/})).toHaveAttribute('href','/?species=sapiens')
  })
})
