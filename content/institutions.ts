import type {InstitutionRecord} from '../domain/contracts'
import {asInstitutionId} from '../domain/ids'

const rawInstitutions=[
  {id:'rheinisches-landesmuseum-bonn',name:'Rheinisches Landesmuseum Bonn',type:'museum',country:'Germany',website:'https://www.lvr-landesmuseum-bonn.lvr.de/',identifiers:[]},
  {id:'smithsonian-institution',name:'Smithsonian Institution',type:'museum',country:'United States',website:'https://www.si.edu/',identifiers:[]},
  {id:'max-planck-eva',name:'Max Planck Institute for Evolutionary Anthropology',type:'research-institute',country:'Germany',website:'https://www.eva.mpg.de/',identifiers:[]},
  {id:'natural-history-museum-london',name:'Natural History Museum, London',type:'museum',country:'United Kingdom',website:'https://www.nhm.ac.uk/',identifiers:[]},
  {id:'university-witwatersrand',name:'University of the Witwatersrand',type:'university',country:'South Africa',website:'https://www.wits.ac.za/',identifiers:[]},
  {id:'national-museum-tanzania',name:'National Museum of Tanzania',type:'museum',country:'Tanzania',website:'https://www.nmt.go.tz/',identifiers:[]},
  {id:'national-museum-ethiopia',name:'National Museum of Ethiopia',type:'museum',country:'Ethiopia',identifiers:[]},
  {id:'georgian-national-museum',name:'Georgian National Museum',type:'museum',country:'Georgia',website:'https://museum.ge/',identifiers:[]},
  {id:'institut-paleontologie-humaine',name:'Institut de Paléontologie Humaine',type:'research-institute',country:'France',website:'https://www.fondationiph.org/',identifiers:[]},
  {id:'centre-national-appui-recherche-chad',name:'Centre National d’Appui à la Recherche',type:'research-institute',country:'Chad',identifiers:[],note:'Institutional identity is retained from the Smithsonian specimen record context; exact organizational hierarchy should be enriched before external identifier assignment.'},
] as const

export const institutionRecords:InstitutionRecord[]=rawInstitutions.map(item=>({
  ...item,
  id:asInstitutionId(item.id),
  type:item.type,
  identifiers:item.identifiers.length?item.identifiers:('website' in item && item.website)?[{scheme:'uri' as const,value:item.website,uri:item.website,preferred:true,verification:'asserted' as const,origin:'curatorial' as const}]:[],
}))
export const institutionsById=Object.fromEntries(institutionRecords.map(item=>[String(item.id),item])) as Record<string,InstitutionRecord>
