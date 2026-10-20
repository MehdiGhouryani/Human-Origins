import {expect,test} from '@playwright/test'

// Responsive review, phone widths: one flat list instead of a nested tree, no Map toggle that cannot show a map,
// and a brand target that a thumb can reliably hit.
test.describe('phone lineage and header',()=>{
  test.use({viewport:{width:390,height:844}})

  test('the phone shows one flat list of all taxa and no Map toggle', async({page})=>{
    await page.goto('/')
    await expect(page.locator('.atlas-graph-tree.is-flat')).toBeVisible()
    await expect(page.locator('.atlas-graph-tree-children')).toHaveCount(0)
    await expect(page.locator('.atlas-graph-tree-item')).toHaveCount(11)
    await expect(page.locator('.atlas-graph-views')).toHaveCount(0)
  })

  test('the brand target is at least 44px tall on phones', async({page})=>{
    await page.goto('/')
    const box=await page.locator('.brand').boundingBox()
    expect(box?.height??0).toBeGreaterThanOrEqual(44)
  })
})
