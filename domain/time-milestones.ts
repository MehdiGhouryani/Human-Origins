import {TIME_AXIS_ANCHORS_MA,ageMaToFraction,formatAgeMa} from './time'
import {groupTaxaByClade,isInferredNode,type TaxonLike} from './taxon-model'

export type Milestone={id:string;label:string;ageMa:number;detail:string}

/**
 * Jump-to moments derived from the catalogue: the first documented appearance of each clade, plus the present.
 * Nothing here names a taxon or a date, so a new clade added to the data gets its milestone automatically.
 */
export function buildMilestones(taxa:readonly TaxonLike[]):Milestone[]{
  const recorded=taxa.filter(t=>!isInferredNode(t))
  const milestones:Milestone[]=groupTaxaByClade(recorded).map(group=>({id:`clade:${group.name}`,label:group.name,ageMa:group.firstAppearanceMa,detail:`First documented ${group.name}, ${formatAgeMa(group.firstAppearanceMa)}`}))
  milestones.push({id:'present',label:'Today',ageMa:0,detail:'The present day'})
  return milestones.sort((a,b)=>b.ageMa-a.ageMa||a.label.localeCompare(b.label))
}

export type ScaleSegment={fromMa:number;toMa:number;sharePercent:number}
/** How much of the control each span of deep time occupies. This is what makes the scale non-linear. */
export function scaleSegments():ScaleSegment[]{
  const out:ScaleSegment[]=[]
  for(let i=0;i<TIME_AXIS_ANCHORS_MA.length-1;i++){
    const fromMa=TIME_AXIS_ANCHORS_MA[i],toMa=TIME_AXIS_ANCHORS_MA[i+1]
    out.push({fromMa,toMa,sharePercent:Math.round((ageMaToFraction(toMa)-ageMaToFraction(fromMa))*100)})
  }
  return out
}

/** One sentence explaining the non-linear axis, generated from the anchors so it cannot drift from the real scale. */
export function scaleExplanation():string{
  const segs=scaleSegments()
  const first=segs[0],last=segs[segs.length-1]
  const span=(ma:number)=>formatAgeMa(ma).replace(' ago','')
  return `Not a linear scale: ${span(first.fromMa)} to ${span(first.toMa)} takes ${first.sharePercent}% of the bar, while the most recent ${formatAgeMa(last.fromMa).replace(' ago','')} takes ${last.sharePercent}%, so recent time stays readable.`
}
