import type {MigrationCorridorRecord} from '../domain/contracts'
import {asClaimId,asEvidenceId,asMigrationCorridorId,asSourceId,asTaxonId} from '../domain/ids'

const SPATIAL_LIMITATION_NOTE='Generalized corridor schematic for visualization. Coordinates represent illustrative geographic paths rather than surveyed migration routes, fossil locations, or specimen coordinates.'

export const migrationCorridorRecords:readonly MigrationCorridorRecord[]=Object.freeze([
  {
    id:asMigrationCorridorId('out-of-africa'),
    taxonId:asTaxonId('sapiens'),
    label:'Africa → Arabia → Eurasia',
    originLabel:'East Africa',
    destinationLabel:'Western Europe',
    coordinates:[[36,2],[48,25],[35,32],[35,39],[8,48]],
    temporalWindow:{
      startMa:0.060,
      endMa:0.005,
      label:'60–5 ka',
      note:'Schematic display window for population dispersal visualization.',
    },
    geometryKind:'schematic-corridor',
    spatialScale:'continent-scale',
    spatialLimitationNote:SPATIAL_LIMITATION_NOTE,
    claimIds:[asClaimId('claim-sapiens-dispersal')],
    evidenceIds:[asEvidenceId('migration-evidence')],
    sourceIds:[asSourceId('si-dispersal-summary'),asSourceId('si-human-evidence')],
    sourceLinks:[
      {
        sourceId:asSourceId('si-dispersal-summary'),
        role:'contextualizes',
        note:'Educational synthesis summarizing modern human expansion out of Africa.',
      },
      {
        sourceId:asSourceId('si-human-evidence'),
        role:'contextualizes',
        note:'Smithsonian evidence framework taxonomy for human dispersals.',
      },
    ],
    note:'Broad schematic corridor representing modern human expansion from East Africa into western Eurasia.',
  },
  {
    id:asMigrationCorridorId('eastern-route'),
    taxonId:asTaxonId('sapiens'),
    label:'Africa → South Asia → Sahul',
    originLabel:'East Africa',
    destinationLabel:'Sahul / Australia',
    coordinates:[[36,2],[48,20],[78,18],[105,12],[134,-25]],
    temporalWindow:{
      startMa:0.055,
      endMa:0.005,
      label:'55–5 ka',
      note:'Schematic display window for population dispersal visualization.',
    },
    geometryKind:'schematic-corridor',
    spatialScale:'continent-scale',
    spatialLimitationNote:SPATIAL_LIMITATION_NOTE,
    claimIds:[asClaimId('claim-sapiens-dispersal')],
    evidenceIds:[asEvidenceId('migration-evidence')],
    sourceIds:[asSourceId('si-dispersal-summary'),asSourceId('si-human-evidence')],
    sourceLinks:[
      {
        sourceId:asSourceId('si-dispersal-summary'),
        role:'contextualizes',
        note:'Educational synthesis summarizing coastal/southern Asian modern human expansion to Sahul.',
      },
      {
        sourceId:asSourceId('si-human-evidence'),
        role:'contextualizes',
        note:'Smithsonian evidence framework taxonomy for human dispersals.',
      },
    ],
    note:'Schematic corridor representing southern/coastal dispersal from East Africa towards Sahul/Australia.',
  },
  {
    id:asMigrationCorridorId('central-asia'),
    taxonId:asTaxonId('sapiens'),
    label:'Levant → Central Asia → Altai',
    originLabel:'Levant',
    destinationLabel:'Altai / Siberia',
    coordinates:[[35,32],[50,38],[67,43],[87,51]],
    temporalWindow:{
      startMa:0.050,
      endMa:0.005,
      label:'50–5 ka',
      note:'Schematic display window for population dispersal visualization.',
    },
    geometryKind:'schematic-corridor',
    spatialScale:'continent-scale',
    spatialLimitationNote:SPATIAL_LIMITATION_NOTE,
    claimIds:[asClaimId('claim-sapiens-dispersal')],
    evidenceIds:[asEvidenceId('migration-evidence')],
    sourceIds:[asSourceId('si-dispersal-summary'),asSourceId('si-human-evidence')],
    sourceLinks:[
      {
        sourceId:asSourceId('si-dispersal-summary'),
        role:'contextualizes',
        note:'Educational synthesis summarizing interior Asian modern human dispersals.',
      },
      {
        sourceId:asSourceId('si-human-evidence'),
        role:'contextualizes',
        note:'Smithsonian evidence framework taxonomy for human dispersals.',
      },
    ],
    note:'Broad schematic corridor representing population movement from the Levant through Central Asia into Siberia.',
  },
  {
    id:asMigrationCorridorId('americas'),
    taxonId:asTaxonId('sapiens'),
    label:'Northeast Asia → Americas',
    originLabel:'Siberia',
    destinationLabel:'South America',
    coordinates:[[87,51],[140,52],[170,55],[-165,55],[-130,50],[-105,40],[-65,-15]],
    temporalWindow:{
      startMa:0.025,
      endMa:0.005,
      label:'25–5 ka',
      note:'Schematic display window for population dispersal visualization.',
    },
    geometryKind:'schematic-corridor',
    spatialScale:'hypothesis-scale',
    spatialLimitationNote:SPATIAL_LIMITATION_NOTE,
    claimIds:[asClaimId('claim-sapiens-dispersal')],
    evidenceIds:[asEvidenceId('migration-evidence')],
    sourceIds:[asSourceId('si-dispersal-summary'),asSourceId('si-human-evidence')],
    sourceLinks:[
      {
        sourceId:asSourceId('si-dispersal-summary'),
        role:'contextualizes',
        note:'Educational synthesis summarizing modern human entry into the Americas.',
      },
      {
        sourceId:asSourceId('si-human-evidence'),
        role:'contextualizes',
        note:'Smithsonian evidence framework taxonomy for human dispersals.',
      },
    ],
    note:'Hypothesis-scale corridor representing movement from Northeast Asia into the Americas.',
  },
])

for(const corridor of migrationCorridorRecords){
  if(corridor.temporalWindow.startMa < corridor.temporalWindow.endMa){
    throw new Error(`Invalid temporal window for migration corridor ${corridor.id}`)
  }
  for(const [lon,lat] of corridor.coordinates){
    if(typeof lon !== 'number' || typeof lat !== 'number' || lon < -180 || lon > 180 || lat < -90 || lat > 90){
      throw new Error(`Invalid coordinate [${lon}, ${lat}] in corridor ${corridor.id}`)
    }
  }
}

export const migrationCorridorsById=Object.fromEntries(
  migrationCorridorRecords.map(c=>[String(c.id),c])
) as Record<string,MigrationCorridorRecord>
