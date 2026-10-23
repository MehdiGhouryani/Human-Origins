import {migrationCorridorRecords} from '../content/migration-corridors'

export type Route={
  id:string
  label:string
  color:string
  points:[number,number][]
  from:string
  to:string
  startKa:number
  endKa:number
  certainty:'broad'|'possible'
  sourceId?:string
}

export type Story={
  id:string
  title:string
  subtitle:string
  fromKa:number
  toKa:number
  focus:[number,number]
  route:string
  note:string
}

/** Presentation-only coast outlines used until the geographic engine phase replaces them with real datasets. */
export const continents:[string,[number,number][]][]=[
  ['Africa',[[-17,15],[-10,35],[5,37],[16,32],[28,30],[36,22],[43,12],[51,5],[46,-10],[40,-22],[31,-35],[17,-35],[7,-30],[-2,-18],[-9,-2],[-16,8]]],
  ['Eurasia',[[-10,36],[2,44],[14,48],[27,49],[38,55],[54,59],[70,61],[88,66],[110,70],[135,64],[155,57],[170,52],[177,42],[165,33],[148,31],[132,26],[115,22],[98,17],[83,19],[68,24],[53,29],[42,37],[28,38],[17,35],[6,35]]],
  ['Arabia',[[43,31],[51,29],[58,24],[55,14],[45,13],[41,20]]],
  ['India',[[68,25],[78,30],[88,27],[91,20],[83,8],[74,10]]],
  ['SE Asia',[[95,22],[108,21],[119,17],[126,9],[122,1],[112,4],[103,9]]],
  ['Australia',[[113,-11],[129,-10],[143,-14],[153,-23],[151,-35],[137,-39],[121,-34],[113,-25]]],
  ['North America',[[-168,55],[-150,67],[-130,70],[-110,67],[-94,60],[-82,50],[-76,42],[-90,30],[-105,25],[-118,29],[-130,38],[-145,45],[-160,48]]],
  ['South America',[[-81,10],[-72,6],[-62,7],[-51,2],[-43,-8],[-46,-21],[-52,-33],[-58,-46],[-67,-54],[-74,-45],[-77,-30],[-80,-14]]],
  ['Greenland',[[-73,59],[-45,60],[-20,70],[-27,82],[-50,83],[-67,74]]],
]

export const routeStyles:Record<string,{color:string;certainty:'broad'|'possible'}>={
  'out-of-africa':{color:'#e8bd70',certainty:'broad'},
  'eastern-route':{color:'#59c4b6',certainty:'possible'},
  'central-asia':{color:'#9b82e9',certainty:'broad'},
  'americas':{color:'#65a8e8',certainty:'possible'},
}

export const routes:Route[]=migrationCorridorRecords.map(corridor=>{
  const style=routeStyles[String(corridor.id)]??{color:'#e8bd70',certainty:'broad'}
  return {
    id:String(corridor.id),
    label:corridor.label,
    color:style.color,
    points:[...corridor.coordinates] as [number,number][],
    from:corridor.originLabel,
    to:corridor.destinationLabel,
    startKa:Math.round(corridor.temporalWindow.startMa*1000),
    endKa:Math.round(corridor.temporalWindow.endMa*1000),
    certainty:style.certainty,
    sourceId:corridor.sourceIds[0]?String(corridor.sourceIds[0]):undefined,
  }
})

export const stories:Story[]=[
  {id:'deep-africa',title:'Africa · deep-time context',subtitle:'8 Ma → 315 ka · African human-origins context',fromKa:8000,toKa:315,focus:[20,5],route:'',note:'This chapter provides geographic context across deep time. It does not claim that a single migration route applies to all early hominins.'},
  {id:'sapiens-africa',title:'Africa · Homo sapiens context',subtitle:'~315–120 ka · early Homo sapiens evidence',fromKa:315,toKa:120,focus:[20,5],route:'',note:'The earliest widely discussed Homo sapiens fossil evidence is African. This chapter establishes the source-region context before later dispersals.'},
  {id:'arabia',title:'Arabia · windows open and close',subtitle:'~120–60 ka · repeated dispersal opportunities',fromKa:120,toKa:60,focus:[46,27],route:'out-of-africa',note:'Climate and freshwater availability created changing opportunities for movement through the Sinai and Arabian Peninsula.'},
  {id:'eurasia',title:'Eurasia · populations meet',subtitle:'~60–45 ka · western and central corridors',fromKa:60,toKa:45,focus:[60,40],route:'central-asia',note:'The map shows broad corridors, not a single trek. Fossil, archaeological and genetic evidence record different populations and encounters.'},
  {id:'sahul',title:'Sahul · the sea becomes part of the story',subtitle:'~45–25 ka · Southeast Asia → Sahul chapter window',fromKa:45,toKa:25,focus:[112,-4],route:'eastern-route',note:'Reaching Sahul required maritime crossings. The chapter window is a narrative segment, not a claim that the entire dispersal happened within this exact interval.'},
  {id:'americas',title:'The Americas · routes remain debated',subtitle:'~25–5 ka · Northeast Asia → the Americas',fromKa:25,toKa:5,focus:[-125,45],route:'americas',note:'The timing and pathways into the Americas are still debated; the corridor is intentionally shown as a hypothesis-scale visualization.'},
]
