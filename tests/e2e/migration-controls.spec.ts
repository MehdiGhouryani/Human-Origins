import {expect,test} from '@playwright/test'

test('migration map controls are collapsed but usable on a phone',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/?mode=migration')
  const stage=page.locator('.atlas-stage.compact')
  await expect(stage).toBeVisible()

  await expect(page.locator('.atlas-zoom')).toHaveCount(0)
  const disclosure=page.locator('.atlas-mobile-map-controls')
  await expect(disclosure).toBeVisible()
  await expect(disclosure).not.toHaveAttribute('open','')

  const trigger=page.getByRole('button',{name:'Map controls'})
  await trigger.click()
  await expect(disclosure).toHaveAttribute('open','')
  const triggerSize=await trigger.boundingBox()
  expect(triggerSize?.width).toBeGreaterThanOrEqual(44)
  expect(triggerSize?.height).toBeGreaterThanOrEqual(44)
  const menu=page.getByRole('group',{name:'Map view controls'})
  await expect(menu).toBeVisible()
  // Evidence-cluster buttons also describe their action as “zoom in”; scope these controls by exact accessible name.
  const control=(name:string)=>page.getByRole('button',{name,exact:true})
  for(const name of ['Zoom in','Zoom out','Reset view','Switch to flat map']){
    await expect(control(name)).toBeVisible()
  }

  const actionSizes=await Promise.all(['Zoom in','Zoom out','Reset view','Switch to flat map'].map(name=>control(name).boundingBox()))
  expect(actionSizes.every(size=>Boolean(size&&size.width>=44&&size.height>=44))).toBe(true)

  await control('Zoom in').click()
  await expect(menu).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(disclosure).not.toHaveAttribute('open','')
  await expect(trigger).toBeFocused()

  await trigger.click()
  await expect(disclosure).toHaveAttribute('open','')
  await page.locator('.atlas-scene-chip').click()
  await expect(disclosure).not.toHaveAttribute('open','')
})

test('migration map keeps the full control rail on desktop',async({page})=>{
  await page.setViewportSize({width:1440,height:900})
  await page.goto('/?mode=migration')
  await expect(page.locator('.atlas-stage:not(.compact)')).toBeVisible()
  await expect(page.locator('.atlas-zoom')).toBeVisible()
  await expect(page.locator('.atlas-mobile-map-controls')).toHaveCount(0)
})
