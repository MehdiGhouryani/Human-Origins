import {spawnSync} from 'node:child_process'
import {existsSync,mkdtempSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {afterEach,describe,expect,it} from 'vitest'

const root=resolve(import.meta.dirname,'..')
const svgPath=join(root,'tools/images/drafts/afarensis-scale.svg')
const generator=join(root,'tools/images/generate-afarensis-scale.mjs')
const tempDirs:string[]=[]
afterEach(()=>{for(const dir of tempDirs.splice(0))rmSync(dir,{recursive:true,force:true})})

describe('A. afarensis S09 scale-reference draft',()=>{
  it('includes accessible labels, sourced estimates and the specimen-specific uncertainty interval',()=>{
    const svg=readFileSync(svgPath,'utf8')
    expect(svg).toContain('<title id="title">Australopithecus afarensis body-size estimates</title>')
    expect(svg).toContain('<desc id="desc">')
    for(const value of ['105 cm','151 cm','170 cm','29 kg','45 kg','20.4 kg','13.5 kg','30.9 kg','95% prediction interval']){
      expect(svg).toContain(value)
    }
    expect(svg).toContain('One individual')
    expect(svg).toContain('not direct measurements')
    expect(svg).not.toContain('TODO')
  })

  it('is reproducible from its committed generator',()=>{
    const outputDir=mkdtempSync(join(tmpdir(),'afarensis-scale-'))
    tempDirs.push(outputDir)
    const output=join(outputDir,'scale.svg')
    const result=spawnSync(process.execPath,[generator,output],{cwd:root,encoding:'utf8'})
    expect(result.status,result.stderr).toBe(0)
    expect(existsSync(output)).toBe(true)
    expect(readFileSync(output,'utf8')).toBe(readFileSync(svgPath,'utf8'))
  })

  it('keeps its scientific source trail in the draft notes',()=>{
    const notes=readFileSync(join(root,'tools/images/drafts/afarensis-scale-notes.md'),'utf8')
    for(const url of [
      'https://pubmed.ncbi.nlm.nih.gov/1882979/',
      'https://pubmed.ncbi.nlm.nih.gov/1580350/',
      'https://pubmed.ncbi.nlm.nih.gov/28838563/',
    ]) expect(notes).toContain(url)
    expect(notes).toContain('not a female species mean')
    expect(notes).toContain('not yet assigned to the CMS slot')
  })
})
