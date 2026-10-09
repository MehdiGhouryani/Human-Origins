import {expect,test,type Page} from '@playwright/test'

const WIDTHS=[320,360,390,768,1024] as const
const PAGES=['/','/?mode=timeline','/?mode=migration','/?mode=evidence','/?journey=1','/species','/species/neanderthal'] as const

async function blockRemote(page:Page){await page.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort())}

test.describe('responsive layout contract',()=>{
  test.skip(({browserName})=>browserName!=='chromium')
  for(const width of WIDTHS) for(const path of PAGES){
    test(`${path} @${width}px: no horizontal overflow, text ≥ 11px`,async({page})=>{
      await blockRemote(page)
      await page.setViewportSize({width,height:820})
      await page.goto(path,{waitUntil:'networkidle'})
      const result=await page.evaluate(()=>{
        const de=document.documentElement
        const tiny:string[]=[]
        for(const el of document.querySelectorAll<HTMLElement>('body *')){
          if(el instanceof SVGElement||el.closest('svg,.sr-only,.media-image-fallback')) continue
          if(![...el.childNodes].some(n=>n.nodeType===3&&n.textContent?.trim())) continue
          const cs=getComputedStyle(el),box=el.getBoundingClientRect()
          if(cs.display==='none'||cs.visibility==='hidden'||!box.width) continue
          if(parseFloat(cs.fontSize)<11) tiny.push(`${el.tagName}.${el.className} (${cs.fontSize})`)
        }
        return {overflow:de.scrollWidth-de.clientWidth,tiny:[...new Set(tiny)]}
      })
      expect(result.overflow,'horizontal page overflow (px)').toBeLessThanOrEqual(0)
      if(width<=820) expect(result.tiny,'text below the 11px legibility floor').toEqual([])
    })
  }

  test('only the tree uses a bounded inner scroll panel on phones',async({page})=>{
    await page.setViewportSize({width:390,height:820})
    for(const path of ['/?mode=timeline','/?mode=evidence','/?mode=migration']){
      await page.goto(path)
      const shell=page.locator('.tree-shell')
      await expect(shell).toHaveClass(/is-panel/)
      const trapped=await shell.evaluate(el=>el.scrollHeight>el.clientHeight+2&&getComputedStyle(el).overflowY!=='visible')
      expect(trapped,`${path} content trapped in a nested scroll box`).toBe(false)
    }
  })

  test('mobile menu: focus moves in, Tab is trapped, Escape closes and restores focus',async({page})=>{
    await page.setViewportSize({width:390,height:820})
    await page.goto('/')
    const toggle=page.getByRole('button',{name:'Open navigation'})
    await toggle.click()
    const menu=page.locator('#mobile-navigation')
    await expect(menu).toBeVisible()
    await expect(menu.locator('a:focus')).toHaveCount(1)
    for(let i=0;i<10;i++) await page.keyboard.press('Tab')
    expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('#mobile-navigation,.mobile-menu-toggle')))).toBe(true)
    const outline=await menu.locator('a:focus').evaluate(el=>getComputedStyle(el).outlineStyle).catch(()=> 'none')
    expect(outline).not.toBe('none')
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(page.getByRole('button',{name:'Open navigation'})).toBeFocused()
    await toggle.click(); await page.mouse.click(200,700)
    await expect(menu).toHaveCount(0)
  })

  test('primary touch targets are at least 36px',async({page})=>{
    await page.setViewportSize({width:390,height:820})
    await page.goto('/')
    const small=await page.$$eval('.mode-tabs button,.mobile-menu-toggle,.play,.world,.tabs [role=tab],.tree-zoom-controls button,.cta',els=>els.filter(el=>{const r=el.getBoundingClientRect();return r.width&&(r.height<36||r.width<36)}).map(el=>el.textContent||el.getAttribute('aria-label')))
    expect(small).toEqual([])
  })
})
