import {describe,expect,it} from 'vitest'
import {createHash} from 'node:crypto'
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs'
import {extname,join,relative} from 'node:path'

/**
 * docs/HUMAN-ORIGINS-FIX-PLAN.md is the approved basis for all work. The file is pinned by SHA-256: changing it requires
 * an explicit owner decision and an updated hash in the same change. The other checks keep the repository consistent with it.
 */
const root=process.cwd()
const planRel='docs/HUMAN-ORIGINS-FIX-PLAN.md'
const APPROVED_SHA256='7b92be10614d9de6cc3d2a9a3d4cfe504551ca07cc49397095fef6710a558799'
const RETIRED_NAME='IMPLEMENTATION-PLAN'
const PERSIAN_DIGITS=['۰','۱','۲','۳','۴','۵','۶','۷','۸']
const TEXT_EXTENSIONS=new Set(['.md','.ts','.tsx','.mts','.mjs','.js','.json','.csv','.yml','.yaml','.css'])
const read=(rel:string)=>readFileSync(join(root,rel),'utf8')
const plan=read(planRel)
const pkg=JSON.parse(read('package.json')) as {version:string}

function listFiles(dir:string):string[]{
  const out:string[]=[]
  for(const entry of readdirSync(dir)){
    // Generated output is not source: skip it so the scan stays fast.
    if(['node_modules','.git','.next','.cms-data','test-results','playwright-report'].includes(entry)) continue
    const full=join(dir,entry)
    if(statSync(full).isDirectory()) out.push(...listFiles(full))
    else out.push(relative(root,full))
  }
  return out
}

describe('docs/HUMAN-ORIGINS-FIX-PLAN.md',()=>{
  it('is the approved basis: byte-identical to the pinned copy',()=>{
    expect(createHash('sha256').update(readFileSync(join(root,planRel))).digest('hex')).toBe(APPROVED_SHA256)
  })

  it('is the only plan: docs/ holds only the agreed set',()=>{
    expect(readdirSync(join(root,'docs')).sort()).toEqual(['ARCHITECTURE.md','HUMAN-ORIGINS-FIX-PLAN.md','mobile-qa','reference-ui.png'])
    expect(existsSync(join(root,'docs',`${RETIRED_NAME}.md`))).toBe(false)
  })

  it('declares the current package version',()=>{
    expect(plan).toContain(`human-origins@${pkg.version}`)
  })

  it('has phases 0 to 8, each with acceptance criteria',()=>{
    PERSIAN_DIGITS.forEach((digit,phase)=>{
      expect(plan,`phase ${phase} heading`).toMatch(new RegExp(`^### فاز ${digit}:`,'m'))
    })
    expect(plan.split('پذیرش:**').length-1).toBeGreaterThanOrEqual(PERSIAN_DIGITS.length)
  })

  it('is referenced by README and AGENTS, and no other file mentions the retired plan',()=>{
    expect(read('README.md')).toContain(planRel)
    expect(read('AGENTS.md')).toContain(planRel)
    const offenders=listFiles(root).filter(rel=>
      rel!==planRel && rel!=='tests/plan-integrity.test.ts' && TEXT_EXTENSIONS.has(extname(rel)) && read(rel).includes(RETIRED_NAME))
    expect(offenders).toEqual([])
  },20_000)

  it('other markdown documents hold no plan-like headings',()=>{
    const others=['README.md','AGENTS.md','docs/ARCHITECTURE.md',
      ...readdirSync(join(root,'tools/images/prompts')).filter(name=>name.endsWith('.md')).map(name=>`tools/images/prompts/${name}`)]
    for(const file of others){
      expect(/^#{1,6}\s+(roadmap|to-?do|milestones?|phases?|status board|implementation plan)\b/im.test(read(file)),`${file} has a plan-like heading`).toBe(false)
    }
  })

  it('keeps the README release marker read by the version audit, and no retired release notes',()=>{
    expect(read('README.md')).toContain(`**${pkg.version}**`)
    expect(read('README.md')).not.toMatch(/PHASED-PLAN|REVIEW-0\.29|CHANGES-0\.30/)
  })
})
