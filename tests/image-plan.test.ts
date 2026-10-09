import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {buildCatalog,composePromptFiles,CORE_TAXA_ORDER} from '../tools/images/spec'
import {renderCatalogFiles} from '../tools/images/build'
import {TAXA} from '../tools/images/taxa'
import {specimenRecords,taxa} from '../content'
import {featured} from '../content/featured'

/**
 * Guards the image production plan (tools/images): the catalog is complete and consistent with the project data,
 * AI-style prompts exist ONLY for class D, every prompt is self-contained, and the committed outputs are up to date.
 */
const rows=buildCatalog()
const prompts=composePromptFiles()
const root=process.cwd()

describe('image catalog',()=>{
  it('covers exactly the 11 core taxa of the home graph, in path order',()=>{
    expect([...CORE_TAXA_ORDER].sort()).toEqual(featured.mainPathTaxonIds.map(String).sort())
    const known=new Set(taxa.map(taxon=>String(taxon.id)))
    for(const id of CORE_TAXA_ORDER) expect(known.has(id),id).toBe(true)
  })

  it('has 237 unique rows: 165 standard + 18 special + 33 stone-tool + 21 comparative',()=>{
    expect(rows).toHaveLength(237)
    expect(new Set(rows.map(row=>row.code)).size).toBe(237)
    expect(rows.filter(row=>/\.S\d+[ab]?$/.test(row.code))).toHaveLength(165)
    expect(rows.filter(row=>/\.X\d+$/.test(row.code))).toHaveLength(18)
    expect(rows.filter(row=>/\.L\d$/.test(row.code))).toHaveLength(33)
    expect(rows.filter(row=>row.code.startsWith('compare.'))).toHaveLength(21)
    for(const id of CORE_TAXA_ORDER){
      expect(rows.filter(row=>row.code.startsWith(`${id}.S`)),id).toHaveLength(15)
      expect(rows.filter(row=>row.code.startsWith(`${id}.L`)),id).toHaveLength(3)
    }
  })

  it('splits production waves 66 / 55 / 44 / 18 / 21 / 33',()=>{
    const count=(wave:number)=>rows.filter(row=>row.wave===wave).length
    expect([1,2,3,4,5,6].map(count)).toEqual([66,55,44,18,21,33])
  })

  it('never lets AI-style prompts or class D near stone tools: lithic rows are photographs (C) or diagrams (B)',()=>{
    for(const row of rows.filter(item=>/\.L\d$/.test(item.code))){
      expect(['B','C'],row.code).toContain(row.evidenceClass)
      expect(row.promptFile,row.code).toBe('')
    }
  })

  it('gives every actionable stone-tool row type sites, search terms and an attribution caution',()=>{
    for(const brief of TAXA){
      const l=brief.lithics
      const lithicRows=rows.filter(row=>row.code.startsWith(`${brief.id}.L`))
      if(!l){
        for(const row of lithicRows){expect(row.status,row.code).toBe('NOT-APPLICABLE');expect(row.statusReason.length,row.code).toBeGreaterThan(20)}
        continue
      }
      expect(l.kit.length,brief.id).toBeGreaterThanOrEqual(3)
      expect(l.typeSites.length,brief.id).toBeGreaterThanOrEqual(1)
      expect(l.searchTerms.length,brief.id).toBeGreaterThanOrEqual(2)
      expect(l.attribution.length,brief.id).toBeGreaterThan(40)
      expect(l.caution.length,brief.id).toBeGreaterThan(20)
      const byCode=(n:number)=>lithicRows.find(row=>row.code.endsWith(`.L${n}`))!
      expect(byCode(1).brief,`${brief.id}.L1`).toContain(l.searchTerms[0])
      expect(byCode(1).brief,`${brief.id}.L1`).toContain(l.kit[0])
      expect(byCode(2).brief,`${brief.id}.L2`).toContain(l.keyType)
      expect(byCode(3).brief,`${brief.id}.L3`).toContain(l.sequence)
    }
  })

  it('maps evidence classes and media kinds consistently',()=>{
    for(const row of rows){
      if(row.evidenceClass==='D') expect(row.mediaKind,row.code).toBe('reconstruction')
      if(row.evidenceClass==='C') expect(['specimen-photo','cast-photo'],row.code).toContain(row.mediaKind)
      if(row.evidenceClass==='A'||row.evidenceClass==='B') expect(row.mediaKind,row.code).toBe('context-schematic')
      expect(row.brief.length,row.code).toBeGreaterThan(20)
    }
  })

  it('references only specimens that exist, and blocks taxa that have none',()=>{
    const specimenIds=new Set(specimenRecords.map(item=>String(item.id)))
    for(const brief of TAXA){
      for(const id of brief.basis.catalogIds) expect(specimenIds.has(id),`${brief.id}: ${id}`).toBe(true)
      const blocked=rows.filter(row=>row.taxonId===brief.id&&row.status==='BLOCKED-NO-SPECIMEN')
      if(brief.basis.catalogIds.length===0) expect(blocked.length,brief.id).toBeGreaterThan(10)
      else expect(blocked,brief.id).toHaveLength(0)
    }
    const blockedTaxa=[...new Set(rows.filter(row=>row.status==='BLOCKED-NO-SPECIMEN').map(row=>row.taxonId))].sort()
    expect(blockedTaxa).toEqual(['heidelbergensis','orrin'])
  })

  it('marks behaviour and stone-tool slots not-applicable exactly where no evidence is registered',()=>{
    const na=rows.filter(row=>row.status==='NOT-APPLICABLE').map(row=>row.code).sort()
    const expected=[
      ...TAXA.filter(brief=>!brief.behavior).map(brief=>`${brief.id}.S11`),
      ...TAXA.filter(brief=>!brief.lithics).flatMap(brief=>[1,2,3].map(n=>`${brief.id}.L${n}`)),
    ].sort()
    expect(na).toEqual(expected)
  })
})

describe('image prompts',()=>{
  const classD=rows.filter(row=>row.evidenceClass==='D'&&row.status!=='NOT-APPLICABLE')

  it('exist for every actionable class-D row and for no other class (no AI for specimens, diagrams or maps)',()=>{
    expect(classD).toHaveLength(40)
    for(const row of rows){
      if(row.evidenceClass==='D'&&row.status!=='NOT-APPLICABLE') expect(row.promptFile,row.code).not.toBe('')
      else expect(row.promptFile,row.code).toBe('')
    }
  })

  it('is self-contained: every prompt carries format, evidence tiers, unknowns, prohibitions, self-check and assumptions',()=>{
    for(const row of classD){
      const file=prompts[row.promptFile]
      expect(file,row.promptFile).toBeDefined()
      const start=file.indexOf(`### ${row.code} —`)
      expect(start,`${row.code} heading`).toBeGreaterThanOrEqual(0)
      const section=file.slice(start,file.indexOf('\n### ',start+5)>0?file.indexOf('\n### ',start+5):undefined)
      for(const needle of ['OUTPUT:','MUST NOT include','silently verify','ASSUMPTIONS list','single image']){
        expect(section.includes(needle),`${row.code} lacks "${needle}"`).toBe(true)
      }
      expect(section.includes(row.ratio),`${row.code} lacks ratio ${row.ratio}`).toBe(true)
      // The habitat plate has no anatomy, so it carries no evidence-tier block.
      expect(section.includes('EVIDENCE TIERS')||row.series==='S10'||/silhouette/.test(section),`${row.code} lacks the evidence tiers`).toBe(true)
      expect(section.includes('DO NOT INVENT')||row.series==='S10'||row.series==='S03'||row.series==='S11',`${row.code} lacks DO NOT INVENT`).toBe(true)
      expect(section.includes('BONE-ANCHORED')||row.series==='S10'||/NO hominin figure appears/.test(section),`${row.code} lacks BONE-ANCHORED`).toBe(true)
      expect(section.includes('```text'),`${row.code} box`).toBe(true)
    }
  })

  it('never leaves placeholders or unresolved template tokens',()=>{
    for(const [name,text] of Object.entries(prompts)){
      expect(text,name).not.toMatch(/\[[A-Z_ ]{3,}\]|TODO|undefined|\{\{|\$\{/)
    }
  })

  it('keeps habitat plates free of hominins and the no-cranium taxon free of invented faces',()=>{
    for(const brief of TAXA){
      const file=prompts[`prompts/${brief.id}.md`]
      const habitat=file.slice(file.indexOf(`### ${brief.id}.S10`))
      expect(habitat).toMatch(/NO hominin figures/)
    }
    const orrorin=prompts['prompts/orrin.md']
    expect(orrorin).toMatch(/A face MUST NOT be invented/)
    expect(orrorin).toMatch(/NO face, NO eyes/)
  })

  it('states skin, hair and eye colour only as conventions, never as findings',()=>{
    for(const brief of TAXA){
      if(brief.noCranium) continue
      const file=prompts[`prompts/${brief.id}.md`]
      expect(file).toMatch(/CONVENTIONS FOR THIS TAXON \(not findings\)|CONVENTIONS \(not findings\)/)
    }
  })
})

describe('committed outputs',()=>{
  it('match what the generator produces (run `npm run images:build` after editing taxa.ts or spec.ts)',()=>{
    const expected={...renderCatalogFiles(),...prompts}
    for(const [name,content] of Object.entries(expected)){
      expect(readFileSync(join(root,'tools/images',name),'utf8'),name).toBe(content)
    }
  })
})
