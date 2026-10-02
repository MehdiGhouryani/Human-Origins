export type MigrationDisposition='preserve'|'transform'|'derive'|'quarantine'|'defer'

export type MigrationRule={
  id:string
  legacyModel:'v21'|'v20-v21'|'v18-v21'
  sourcePath:string
  targetPath:string
  disposition:MigrationDisposition
  lossless:boolean
  note:string
}

export const v21ToV23MigrationRules:readonly MigrationRule[]=[
  {id:'taxon-id',legacyModel:'v21',sourcePath:'species.id',targetPath:'taxa[].id',disposition:'preserve',lossless:true,note:'Stable entity IDs are retained; no renumbering.'},
  {id:'taxon-name',legacyModel:'v21',sourcePath:'species.name',targetPath:'taxa[].name + taxa[].taxonomy.scientificName + taxonNames[]',disposition:'transform',lossless:true,note:'Name is normalized into taxonomic identity and a first-class taxon-name record.'},
  {id:'taxon-short',legacyModel:'v21',sourcePath:'species.short',targetPath:'taxa[].short',disposition:'preserve',lossless:true,note:'Display short name remains presentation-safe content.'},
  {id:'taxon-group',legacyModel:'v21',sourcePath:'species.group',targetPath:'taxa[].group',disposition:'preserve',lossless:true,note:'Editorial grouping is retained as descriptive content, not taxonomy.'},
  {id:'taxon-dates',legacyModel:'v21',sourcePath:'species.date/start/end',targetPath:'taxa[].chronology + domain/time',disposition:'transform',lossless:true,note:'Age units are normalized; ambiguous labels are not converted into invented intervals.'},
  {id:'taxon-status',legacyModel:'v21',sourcePath:'species.status',targetPath:'taxa[].status',disposition:'preserve',lossless:true,note:'Living/extinct display status is preserved separately from taxonomicStatus.'},
  {id:'taxon-description',legacyModel:'v21',sourcePath:'species.description',targetPath:'taxa[].description',disposition:'preserve',lossless:true,note:'Narrative is preserved; later evidence/provenance is attached separately.'},
  {id:'taxon-facts',legacyModel:'v21',sourcePath:'species.facts',targetPath:'taxa[].facts',disposition:'preserve',lossless:true,note:'Facts remain content until promoted to claim/evidence records with explicit provenance.'},
  {id:'taxon-evidence-types',legacyModel:'v21',sourcePath:'species.evidence',targetPath:'taxa[].evidence',disposition:'preserve',lossless:true,note:'High-level evidence category is retained as a summary projection.'},
  {id:'legacy-x',legacyModel:'v21',sourcePath:'species.x',targetPath:'presentation/treeLayout',disposition:'quarantine',lossless:true,note:'Screen geometry is never migrated into scientific canonical data.'},
  {id:'legacy-y',legacyModel:'v21',sourcePath:'species.y',targetPath:'presentation/treeLayout',disposition:'quarantine',lossless:true,note:'Screen geometry is never migrated into scientific canonical data.'},
  {id:'legacy-image',legacyModel:'v21',sourcePath:'species.image',targetPath:'media[]',disposition:'quarantine',lossless:true,note:'Legacy placeholder/plate assets are never promoted to approved scientific media without MediaAsset review and provenance checks.'},
  {id:'legacy-image-kind',legacyModel:'v21',sourcePath:'species.imageKind',targetPath:'media[].kind',disposition:'transform',lossless:true,note:'Image kind is normalized to the controlled media vocabulary.'},
  {id:'legacy-image-credit',legacyModel:'v21',sourcePath:'species.imageCredit',targetPath:'media[].credit',disposition:'preserve',lossless:true,note:'Credits are retained, but rights status is independently evaluated.'},
  {id:'legacy-sources',legacyModel:'v21',sourcePath:'species.sources[]',targetPath:'sources[] + publications[] + institutions[]',disposition:'transform',lossless:true,note:'Source cards are normalized; publication/institution metadata are separated when supported.'},
  {id:'legacy-relationships',legacyModel:'v21',sourcePath:'species relationships[]',targetPath:'relationships[]',disposition:'transform',lossless:true,note:'Relationship type is explicit and does not imply direct ancestry.'},
  {id:'legacy-relationship-sources',legacyModel:'v21',sourcePath:'relationships[].sourceIds',targetPath:'relationships[].sourceLinks[]',disposition:'transform',lossless:true,note:'Role-aware provenance is added without discarding source references.'},
  {id:'legacy-fossil-record',legacyModel:'v18-v21',sourcePath:'specimen records',targetPath:'specimens[] + materialEntities[] + occurrences[]',disposition:'transform',lossless:true,note:'A single legacy specimen row is decomposed into physical material, specimen identity and documented occurrence.'},
  {id:'legacy-site-age',legacyModel:'v18-v21',sourcePath:'site.ageKa/ageLabel',targetPath:'siteContexts[].timeInterval',disposition:'transform',lossless:true,note:'Site place and chronological context are separated; uncertainty is preserved.'},
  {id:'legacy-site-location',legacyModel:'v18-v21',sourcePath:'site.lon/site.lat',targetPath:'sites[].lon/sites[].lat',disposition:'preserve',lossless:true,note:'Coordinates retain their explicit location precision and source.'},
  {id:'legacy-3d',legacyModel:'v18-v21',sourcePath:'specimen.viewerUrl',targetPath:'materialEntities[].viewerUrl',disposition:'preserve',lossless:true,note:'Official institutional viewer links remain first-class provenance, not mirrored meshes.'},
  {id:'legacy-claims',legacyModel:'v20-v21',sourcePath:'source/claim cards',targetPath:'claims[] + evidence[] + sourceLinks[]',disposition:'transform',lossless:true,note:'Claims are split from evidence and source assertions; status becomes explicit.'},
  {id:'legacy-catalog',legacyModel:'v21',sourcePath:'implicit content arrays',targetPath:'content/catalog.ts',disposition:'transform',lossless:true,note:'Catalog becomes the only canonical content assembly point.'},
  {id:'external-authorities',legacyModel:'v21',sourcePath:'unvalidated external identifiers',targetPath:'identifier reconciliation queue',disposition:'defer',lossless:true,note:'External authority identifiers are added only after independent reconciliation; no placeholder IDs are fabricated.'},
] as const

export const migrationPolicy={
  id:'v21-to-v23',
  from:'0.21.x',
  to:'0.23.x',
  strategy:'append-only-normalization',
  principles:[
    'Never recycle or rename stable entity IDs silently.',
    'Never migrate screen geometry into scientific domain records.',
    'Never collapse specimen, material and occurrence into one entity.',
    'Never fabricate missing chronology or provenance.',
    'Quarantine unverified media instead of deleting it silently.',
    'Preserve the legacy value whenever a deterministic transformation exists.',
    'Treat derived projections as rebuildable, not canonical.',
  ] as const,
} as const
