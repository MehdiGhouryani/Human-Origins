import {expect,test,type Page} from '@playwright/test'

// The mobile menu is a native <details> disclosure in the served HTML. The framework JS chunks are blocked
// for the whole test, so the page never hydrates and what runs here is exactly what a reader gets before
// React attaches (and with scripts blocked): no click handler, only the browser's own disclosure. CSS chunks
// must keep loading (Turbopack ships stylesheets from the same directory), so only .js is blocked.
//
// The header is a single server-rendered element (there is no streamed Suspense fallback copy next to the
// resolved header), so the plain .topbar locator is used on purpose: strict mode fails if a second header
// with duplicate ids ever appears in the document again.
async function blockFrameworkChunks(page:Page){
  await page.route(/\/_next\/static\/chunks\/[^?]*\.js(\?.*)?$/,route=>route.abort())
}

function servedHeader(page:Page){return page.locator('.topbar')}

const WIDTHS=[320,360,390,768] as const

test.describe('mobile navigation before hydration',()=>{
  for(const width of WIDTHS){
    test(`toggle opens a keyboard-operable menu that navigates at ${width}px`,async({page})=>{
      await blockFrameworkChunks(page)
      await page.setViewportSize({width,height:800})
      await page.goto('/',{waitUntil:'domcontentloaded'})

      const header=servedHeader(page)
      const details=header.locator('details.mobile-menu')
      const summary=header.locator('summary.mobile-menu-toggle')
      const menu=header.locator('#mobile-navigation')

      await expect(summary).toBeVisible()
      await expect(summary).toHaveAccessibleName('Open navigation')
      await expect(menu).toBeHidden()

      // Keyboard opens the native disclosure; the toggle shows a visible focus ring.
      await summary.focus()
      await page.keyboard.press('Enter')
      await expect(details).toHaveAttribute('open',/.*/)
      await expect(menu).toBeVisible()
      const outline=await summary.evaluate(el=>getComputedStyle(el).outlineStyle)
      expect(outline).not.toBe('none')

      // A menu link navigates with a real URL change (full server render, no scripts).
      await menu.getByRole('link',{name:'About',exact:true}).click()
      await expect(page).toHaveURL(/\/about$/)

      // On the new page the disclosure is closed again, and a second click closes it after opening.
      const summaryAbout=servedHeader(page).locator('summary.mobile-menu-toggle')
      await summaryAbout.click()
      await expect(servedHeader(page).locator('#mobile-navigation')).toBeVisible()
      await summaryAbout.click()
      await expect(servedHeader(page).locator('#mobile-navigation')).toBeHidden()
    })
  }

  test('the pre-hydration menu mirrors the hydrated destinations',async({page})=>{
    await blockFrameworkChunks(page)
    await page.setViewportSize({width:390,height:800})
    await page.goto('/',{waitUntil:'domcontentloaded'})
    const header=servedHeader(page)
    const details=header.locator('details.mobile-menu')
    const summary=header.locator('summary.mobile-menu-toggle')
    await summary.focus()
    await page.keyboard.press('Enter')
    await expect(details).toHaveAttribute('open',/.*/)
    await expect(header.locator('#mobile-navigation nav')).toHaveAccessibleName('Mobile navigation')
    for(const name of ['Species','Journey','Evidence','About']){
      await expect(header.locator('#mobile-navigation').getByRole('link',{name,exact:true})).toBeVisible()
    }
  })
})

