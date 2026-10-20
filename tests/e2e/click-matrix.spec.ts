import {expect,test,type Page} from '@playwright/test'

/**
 * Click matrix (plan phase 0). Every control on the home explorer must respond to a real click at each viewport the
 * plan covers, and the page must raise no errors while doing so. All 18 species chips open their own inspector; the
 * 11 main-path taxa answer on the graph (nodes on wide screens, list rows on narrow ones). The graph itself is not
 * changed by this phase. Map range and Return to tree join the matrix in phase 1, when their URL sync is fixed.
 */
const VIEWPORTS=[360,390,768,820,1024,1280,1366,1440] as const
const SPECIES_CHIPS=18
const GRAPH_TAXA=11
// Dev server only: the HMR socket reports a connection error when it is refused. Production never opens it.
const DEV_SOCKET_NOISE=/_next\/hmr|WebSocket connection/

// Header links are a menu on narrow screens and a row on wide ones.
async function headerLink(page:Page,name:string){
  const toggle=page.locator('.mobile-menu-toggle')
  const narrow=await toggle.isVisible()
  if(narrow) await toggle.click()
  const scope=narrow?page.locator('#mobile-navigation'):page.locator('.topbar nav[aria-label="Modes"]')
  return scope.getByRole('link',{name,exact:true})
}

async function waitForHydration(page:Page){
  await page.waitForFunction(()=>{
    const el=document.querySelector('.mode-tabs button')
    return !!el && Object.keys(el).some(key=>key.startsWith('__react'))
  },undefined,{timeout:60_000})
}

for(const width of VIEWPORTS){
  test(`click matrix at ${width}px`,async({page,request})=>{
    test.setTimeout(240_000)
    await page.setViewportSize({width,height:900})
    const problems:string[]=[]
    page.on('pageerror',error=>problems.push(`pageerror: ${error.message}`))
    page.on('console',message=>{
      if(message.type()==='error' && !DEV_SOCKET_NOISE.test(message.text())) problems.push(`console: ${message.text()}`)
    })

    await page.goto('/')
    await waitForHydration(page)

    // explorer tabs: each one becomes the selected view
    for(const name of ['Timeline','Migration','Tree']){
      const tab=page.getByRole('tab',{name,exact:true})
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected','true')
    }
    // header views: Journey and Evidence
    await (await headerLink(page,'Journey')).click()
    await expect(page.locator('.journey-view')).toBeVisible()
    await (await headerLink(page,'Evidence')).click()
    await expect(page.locator('.evidence-library-view')).toBeVisible()
    // Compare is its own page
    await page.getByRole('tab',{name:'Compare',exact:true}).click()
    await expect(page.getByRole('heading',{name:/Comparative Anatomy/})).toBeVisible()
    await page.goto('/')
    await waitForHydration(page)
    await page.getByRole('tab',{name:'Tree',exact:true}).click()

    // species chips: each one selects itself, opens the inspector, and its profile link (if any) resolves
    const chips=page.locator('.taxon-chip')
    await expect(chips).toHaveCount(SPECIES_CHIPS)
    for(let i=0;i<SPECIES_CHIPS;i++){
      const chip=chips.nth(i)
      await chip.click()
      await expect(chip).toHaveAttribute('aria-current','true')
      await expect(page.locator('.taxon-chip[aria-current="true"]')).toHaveCount(1)
      await expect(page.locator('.inspector')).toBeVisible()
      const profile=page.locator('.inspector .inspector-actions a.primary-cta')
      if(await profile.count()){
        const href=await profile.getAttribute('href')
        expect(href,'profile link').toMatch(/^\/species\/[a-z0-9-]+$/)
        const response=await request.get(href!)
        expect(response.status(),`profile ${href}`).toBe(200)
      }
    }

    // inspector actions: Map range and Return to tree move the view with the URL (phase 1)
    await page.locator('.taxon-chip[data-taxon="sapiens"]').click()
    await page.getByRole('link',{name:'Map range'}).click()
    await expect(page.locator('.migration-view')).toBeVisible()
    await page.getByRole('link',{name:'Return to tree'}).click()
    await expect(page.locator('.mode-tabs .selected')).toHaveText(/Tree/)
    // On narrow screens the profile is a sheet over the lower part of the page: close it before the graph and time controls.
    const closeButton=page.locator('.inspector-close-btn')
    if(await closeButton.isVisible()) await closeButton.click()

    // graph: the 11 main-path taxa answer on nodes or list rows
    await page.locator('.mode-tabs button',{hasText:'Tree'}).click()
    const graphItems=page.locator('.atlas-graph-node, .atlas-graph-row')
    await expect(graphItems).toHaveCount(GRAPH_TAXA)
    for(let i=0;i<GRAPH_TAXA;i++){
      const item=graphItems.nth(i)
      await item.click()
      await expect(item).toHaveAttribute('aria-pressed','true')
    }

    // On narrow screens choosing a graph node opens the profile sheet again: close it before the time controls.
    if(await closeButton.isVisible()){await closeButton.click();await expect(page.locator('.inspector')).toBeHidden()}

    // time controls
    const play=page.locator('.timebar .play')
    await play.click()
    await expect(play).toHaveAttribute('aria-label','Pause time')
    await play.click()
    await expect(play).toHaveAttribute('aria-label','Play time')
    const scrubber=page.locator('input[aria-label="Time travel"]')
    await scrubber.fill('40')
    await expect(scrubber).toHaveValue('40')

    // globe
    await page.locator('.timebar .world').click()
    await expect(page.locator('.migration-view')).toBeVisible()
    await page.locator('.mode-tabs button',{hasText:'Tree'}).click()
    await expect(graphItems.first()).toBeVisible()

    expect(problems,'errors raised during the matrix').toEqual([])
  })
}
