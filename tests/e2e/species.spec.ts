import {expect,test} from '@playwright/test'

test('species dossier renders a source-backed page',async({page})=>{
  await page.goto('/species/neanderthal')
  await expect(page.getByRole('heading',{level:1,name:'Homo neanderthalensis'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Key facts'})).toBeVisible()
  await expect(page.getByRole('heading',{name:/Place in the tree/})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Record completeness'})).toBeVisible()
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1)
})

test('the Inspector call to action opens the species page',async({page})=>{
  await page.goto('/?species=sapiens&mode=tree')
  await page.getByRole('link',{name:/Open the full .* page/}).click()
  await expect(page).toHaveURL(/\/species\/sapiens$/)
  await expect(page.getByRole('heading',{level:1,name:'Homo sapiens'})).toBeVisible()
})

test('unknown species ids return the 404 surface',async({page})=>{
  const response=await page.goto('/species/not-a-real-taxon')
  expect(response?.status()).toBe(404)
})

test('species index lists every taxon',async({page})=>{
  await page.goto('/species')
  await expect(page.getByRole('heading',{level:1,name:'Species of the atlas'})).toBeVisible()
  await expect(page.locator('.species-index-group li')).toHaveCount(26)
})
