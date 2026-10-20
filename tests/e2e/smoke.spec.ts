import {expect,test} from '@playwright/test'

test('atlas shell renders the primary research surface',async({page})=>{
  await page.goto('/')
  await expect(page.getByRole('heading',{name:/Evolutionary Tree of Humans/i})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Homo neanderthalensis'})).toBeVisible()
  await expect(page.getByRole('tab',{name:/Tree/i})).toBeVisible()
})

test('deep-linked explorer state survives direct navigation',async({page})=>{
  await page.goto('/?species=sapiens&mode=timeline&time=91.0')
  await expect(page.getByRole('heading',{name:'Homo sapiens'})).toBeVisible()
  await expect(page.getByRole('tab',{name:/Timeline/i})).toHaveClass(/selected/)
})
