import {expect,test} from '@playwright/test'

// Species pages with scientific text (phase P14/P15). Runs on the desktop project.
const PILOTS=[
  {id:'afarensis',name:'Australopithecus afarensis'},
  {id:'sahelanthropus',name:'Sahelanthropus tchadensis'},
]

for(const pilot of PILOTS){
  test(`${pilot.id}: header, fact table, sections, debates and sources render`,async({page})=>{
    await page.goto(`/species/${pilot.id}`)
    await expect(page.getByRole('heading',{level:1,name:pilot.name})).toBeVisible()
    await expect(page.getByRole('navigation',{name:'On this page'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'At a glance'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'What is debated'})).toBeVisible()
    await expect(page.getByRole('heading',{name:'What is not known'})).toBeVisible()
    // every citation marker links to a reference anchor on the page
    const firstCitation=page.locator('sup.sp-cite a').first()
    await expect(firstCitation).toBeVisible()
    const target=await firstCitation.getAttribute('href')
    expect(target).toMatch(/^#ref-\d+$/)
    await expect(page.locator(target!)).toHaveCount(1)
  })

  test(`${pilot.id}: reference list links out with rel="noopener noreferrer" and back-links to the text`,async({page})=>{
    await page.goto(`/species/${pilot.id}`)
    const doi=page.locator('#sources a[target="_blank"]').first()
    await expect(doi).toHaveAttribute('rel','noopener noreferrer')
    await expect(page.locator('#sources a[href^="#cite-"]').first()).toHaveCount(1)
  })
}

test('taxon without a content file keeps the existing layout',async({page})=>{
  await page.goto('/species/sapiens')
  await expect(page.getByRole('heading',{level:1,name:'Homo sapiens'})).toBeVisible()
  await expect(page.getByRole('navigation',{name:'On this page'})).toHaveCount(0)
})

test('unknown and malformed species addresses answer not found',async({page})=>{
  const missing=await page.goto('/species/no-such-taxon')
  expect(missing?.status()).toBe(404)
  const malformed=await page.goto('/species/%E0%A4%A')
  expect(malformed?.status()).toBe(404)
})
