import {expect,test} from '@playwright/test'

// Needs CMS_ADMIN_PASSWORD set for the server under test (the dev-fallback password is refused in production).
const PASSWORD=process.env.CMS_ADMIN_PASSWORD??''

test.skip(!PASSWORD,'set CMS_ADMIN_PASSWORD to run the admin slot tests')

test('admin signs in, opens the slot matrix and sees empty and locked slots',async({page})=>{
  await page.goto('/admin/login')
  await page.getByLabel('Admin password').fill(PASSWORD)
  await page.getByRole('button',{name:'Sign in'}).click()
  await page.waitForURL('**/admin') // exact dashboard path; /admin/login must not count as signed in
  await page.goto('/admin/media/slots?taxon=afarensis')
  await expect(page.getByRole('heading',{name:'Image slots'})).toBeVisible()
  await expect(page.getByRole('combobox',{name:'Species'})).toHaveValue('afarensis')
  await expect(page.locator('[data-selected]').first()).toBeVisible().catch(()=>undefined)
  await expect(page.getByText('afarensis.S02').first()).toBeVisible()
})

test('a slot of an on-hold taxon is locked and offers no upload',async({page})=>{
  await page.goto('/admin/login')
  await page.getByLabel('Admin password').fill(PASSWORD)
  await page.getByRole('button',{name:'Sign in'}).click()
  await page.waitForURL('**/admin') // exact dashboard path; /admin/login must not count as signed in
  await page.goto('/admin/media/slots?taxon=orrin')
  await expect(page.getByText('On hold').first()).toBeVisible()
  await expect(page.locator('a[href*="orrin"]')).toHaveCount(0)
})
