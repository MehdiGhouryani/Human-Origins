/**
 * Controlled vocabulary for taxon key facts. Facts are [label, value] pairs authored in content; this registry assigns
 * each known label a topic so views never guess meaning by pattern-matching free text. An unknown label resolves to
 * `other` (shown, never dropped) and the data test fails until the label is registered.
 */
export type FactTopic='time'|'geography'|'locomotion'|'anatomy'|'brain'|'diet'|'tools'|'evidence-status'|'relationship'|'other'
export type FactPair=readonly [label:string,value:string]

export const FACT_TOPIC_BY_LABEL:Readonly<Record<string,FactTopic>>={
  'Time window':'time','Time range':'time','Record':'time','Fossil age':'time',
  'Region':'geography','Range':'geography','Origin':'geography',
  'Locomotion':'locomotion',
  'Anatomy':'anatomy','Height':'anatomy','Weight':'anatomy',
  'Brain size':'brain',
  'Tools':'tools',
  'Diet':'diet',
  'Evidence':'evidence-status','Status':'evidence-status','Key fossils':'evidence-status',
  'Relationship':'relationship',
}

export const factTopic=(label:string):FactTopic=>FACT_TOPIC_BY_LABEL[label]??'other'
export const factsByTopic=(facts:readonly FactPair[],...topics:FactTopic[]):FactPair[]=>facts.filter(([label])=>topics.includes(factTopic(label)))
export const firstFact=(facts:readonly FactPair[],topic:FactTopic):FactPair|undefined=>facts.find(([label])=>factTopic(label)===topic)

/** Topics shown on the Lifestyle tab: how the taxon moved, what it ate, what it made, and where it lived. */
export const LIFESTYLE_TOPICS:readonly FactTopic[]=['locomotion','diet','tools','geography']
