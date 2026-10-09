import {expect,test} from '@playwright/test'

// Visual regression baselines. First run (or after an intended UI change): `npm run test:visual:update`,
// review the PNGs under tests/e2e/__screenshots__/ and commit them. Remote (Wikimedia) images are blocked
// and replaced by the neutral fallback so baselines never depend on the network.
const SHOTS=[['atlas-tree','/'],['atlas-timeline','/?mode=timeline'],['atlas-migration','/?mode=migration'],['atlas-evidence','/?mode=evidence'],['atlas-journey','/?journey=1'],['species-index','/species'],['species-neanderthal','/species/neanderthal']] as const

for(const [name,path] of SHOTS){
  test(`visual: ${name}`,async({page})=>{
    await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort())
    await page.goto(path,{waitUntil:'networkidle'})
    await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important}'})
    await page.waitForTimeout(400)
    await expect(page).toHaveScreenshot(`${name}.png`,{fullPage:true})
  })
}
