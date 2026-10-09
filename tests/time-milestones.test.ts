import {describe,expect,it} from 'vitest'
import {contentCatalog} from '../content/catalog'
import {buildMilestones,scaleExplanation,scaleSegments} from '../domain/time-milestones'
import type {TaxonLike} from '../domain/taxon-model'

const taxa:TaxonLike[]=contentCatalog.taxa.map(t=>({id:String(t.id),name:t.name,short:t.short,group:t.group,date:t.date,start:t.start,end:t.end,status:t.status,taxonomy:t.taxonomy,inferred:t.inferred}))

describe('time milestones',()=>{
  it('derive one milestone per clade plus the present, oldest first',()=>{
    const m=buildMilestones(taxa);const clades=new Set(taxa.filter(t=>!t.inferred).map(t=>t.group))
    expect(m.length).toBe(clades.size+1);expect(m[m.length-1].id).toBe('present');expect(m.map(x=>x.ageMa)).toEqual([...m.map(x=>x.ageMa)].sort((a,b)=>b-a))
  })
  it('does not let the inferred common ancestor set a clade milestone',()=>{
    const withNode=buildMilestones(taxa);const oldestRecorded=Math.max(...taxa.filter(t=>!t.inferred).map(t=>t.start))
    expect(Math.max(...withNode.map(x=>x.ageMa))).toBe(oldestRecorded)
  })
  it('gives a newly added clade its own milestone with no other change',()=>{
    const added:TaxonLike={id:'new',name:'Novus',short:'Novus',group:'Brand-new clade',date:'~1 Ma',start:1,end:0.9,status:'extinct',taxonomy:{rank:'species',taxonomicStatus:'accepted'}}
    expect(buildMilestones([...taxa,added]).some(x=>x.label==='Brand-new clade'&&x.ageMa===1)).toBe(true)
  })
  it('scale segments cover the whole bar and the explanation is generated from them',()=>{
    const segs=scaleSegments();expect(segs.reduce((n,s)=>n+s.sharePercent,0)).toBeGreaterThanOrEqual(99);expect(segs.reduce((n,s)=>n+s.sharePercent,0)).toBeLessThanOrEqual(101)
    expect(scaleExplanation()).toContain(`${segs[0].sharePercent}%`);expect(scaleExplanation()).toContain(`${segs[segs.length-1].sharePercent}%`);expect(scaleExplanation()).toMatch(/Not a linear scale/)
  })
})
