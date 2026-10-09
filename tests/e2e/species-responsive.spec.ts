import {expect,test} from '@playwright/test'

// Runs on the phone, iPhone SE and tablet projects (file name matches the responsive/visual pattern).
for(const id of ['afarensis','sahelanthropus']){
  test(`${id}: no horizontal page scroll and reachable navigation`,async({page})=>{
    await page.goto(`/species/${id}`)
    await expect(page.getByRole('heading',{level:1})).toBeVisible()
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)
    expect(overflow,'horizontal overflow in px').toBeLessThanOrEqual(1)
    const nav=page.getByRole('navigation',{name:'On this page'})
    await expect(nav).toBeVisible()
    const links=nav.getByRole('link')
    await expect(links.first()).toBeVisible()
    const box=await links.first().boundingBox()
    expect(box?.height??0,'touch target height').toBeGreaterThanOrEqual(44)
  })

  test(`${id}: sections collapse on phones and open on demand`,async({page})=>{
    await page.goto(`/species/${id}`)
    const sectionSummary=page.locator('#locomotion > summary')
    await expect(sectionSummary).toBeVisible()
    const isPhone=(page.viewportSize()?.width??1024)<640
    if(isPhone){
      await expect(page.locator('#locomotion')).not.toHaveJSProperty('open',true)
      await sectionSummary.click()
      await expect(page.locator('#locomotion')).toHaveJSProperty('open',true)
    }else{
      await expect(page.locator('#locomotion')).toHaveJSProperty('open',true)
    }
  })
}
