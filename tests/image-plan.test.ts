import {describe,expect,it} from 'vitest'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {buildCatalog,composePromptFiles,CORE_TAXA_ORDER} from '../tools/images/spec'
import {renderCatalogFiles} from '../tools/images/build'
import {TAXA} from '../tools/images/taxa'
import {specimenRecords,taxa} from '../content'
import {featured} from '../content/featured'
import {LITHIC_EVIDENCE} from '../content/lithics'

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

  it('has 238 unique rows: 165 standard + 18 special + 34 photo slots + 21 comparative',()=>{
    expect(rows).toHaveLength(238)
    expect(new Set(rows.map(row=>row.code)).size).toBe(238)
    expect(rows.filter(row=>/\.S\d+[ab]?$/.test(row.code))).toHaveLength(165)
    expect(rows.filter(row=>/\.X\d+$/.test(row.code))).toHaveLength(18)
    expect(rows.filter(row=>/\.L\d$/.test(row.code))).toHaveLength(34)
    expect(rows.filter(row=>row.code.startsWith('compare.'))).toHaveLength(21)
    for(const id of CORE_TAXA_ORDER){
      expect(rows.filter(row=>row.code.startsWith(`${id}.S`)),id).toHaveLength(15)
      expect(rows.filter(row=>row.code.startsWith(`${id}.L`)),id).toHaveLength(2)
    }
  })

  it('splits production waves 66 / 55 / 44 / 18 / 21 / 34',()=>{
    const count=(wave:number)=>rows.filter(row=>row.wave===wave).length
    expect([1,2,3,4,5,6].map(count)).toEqual([66,55,44,18,21,34])
  })

  it('keeps per-taxon lithic photo rows free of AI prompts and blocks them until material provenance is catalogued',()=>{
    expect(rows.filter(row=>/\.L\d$/.test(row.code))).toHaveLength(34)
    for(const row of rows.filter(item=>/\.L\d$/.test(item.code))){
      expect(row.evidenceClass,row.code).toBe('C')
      expect(row.mediaKind,row.code).toBe('specimen-photo')
      expect(row.promptFile,row.code).toBe('')
      if(row.status==='BLOCKED-NO-MATERIAL-RECORD'){
        expect(row.statusReason,row.code).toMatch(/material entity/)
        expect(row.specimenRef,row.code).toContain('—')
        expect(row.brief,row.code).toMatch(/Authentic photograph/)
      }else{
        expect(row.status,row.code).toBe('NOT-APPLICABLE')
        expect(row.statusReason.length,row.code).toBeGreaterThan(20)
      }
    }
  })

  it('covers lithic evidence for all 17 named taxa without assigning unattributed or disputed industries',()=>{
    expect(LITHIC_EVIDENCE).toHaveLength(17)
    for(const record of LITHIC_EVIDENCE){
      const lithicRows=rows.filter(row=>row.taxonId===String(record.taxonId)&&/^L\\d$/.test(row.series))
      expect(lithicRows,String(record.taxonId)).toHaveLength(2)
      const attributable=record.status==='contextual-association'||record.status==='strong-contextual-association'
      for(const row of lithicRows) expect(row.status,row.code).toBe(attributable?'BLOCKED-NO-MATERIAL-RECORD':'NOT-APPLICABLE')
      for(const context of record.contexts){
        expect(context.site,context.id).not.toBe('')
        expect(context.ageLabel,context.id).not.toBe('')
        expect(context.relationship,context.id).not.toBe('none')
        expect(context.sources.length,context.id).toBeGreaterThan(0)
      }
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
      ...LITHIC_EVIDENCE.filter(record=>record.status!=='contextual-association'&&record.status!=='strong-contextual-association').flatMap(record=>[1,2].map(n=>`${record.taxonId}.L${n}`)),
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
