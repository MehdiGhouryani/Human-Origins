import {spawnSync} from 'node:child_process'
import {mkdtempSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {afterEach,describe,expect,it} from 'vitest'

const root=resolve(import.meta.dirname,'..')
const source=join(root,'tools/images/drafts/compare-time-ranges.svg')
const tempDirs:string[]=[]
afterEach(()=>{for(const dir of tempDirs.splice(0))rmSync(dir,{recursive:true,force:true})})

describe('compare.C13 main-path chronology diagram',()=>{
  it('renders all eleven catalogue taxa with recorded intervals and qualitative certainty',()=>{
    const svg=readFileSync(source,'utf8')
    const groups=[...svg.matchAll(/<g data-taxon="/g)]
    expect(groups).toHaveLength(11)
    for(const id of ['sahelanthropus','orrin','ardipithecus','anamensis','afarensis','africanus','habilis','erectus','heidelbergensis','neanderthal','sapiens']){
      expect(svg).toContain('data-taxon="'+id+'"')
    }
    expect(svg).toContain('DEBATED')
    expect(svg).toContain('MEDIUM')
    expect(svg).toContain('HIGH')
    expect(svg).toContain('not a probability')
    expect(svg).toContain('does not establish direct ancestry')
  })

  it('is reproducible from the canonical catalog',()=>{
    const outputDir=mkdtempSync(join(tmpdir(),'compare-time-ranges-'))
    tempDirs.push(outputDir)
    const svgPath=join(outputDir,'time-ranges.svg')
    const notesPath=join(outputDir,'time-ranges.md')
    const run=spawnSync(process.execPath,[resolve('tools/images/generate-main-path-timeline.mjs'),svgPath,notesPath],{cwd:root,encoding:'utf8'})
    expect(run.status,run.stderr).toBe(0)
    expect(readFileSync(svgPath,'utf8')).toBe(readFileSync(source,'utf8'))
    expect(readFileSync(notesPath,'utf8')).toContain('main-path time ranges')
  })
})
