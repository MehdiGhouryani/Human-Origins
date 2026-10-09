import {contentCatalog as baseCatalog} from '../../content/catalog'
import type {ContentCatalog} from '../../domain/contracts'
import {foundationalSourceIds} from '../../content/foundation'
import {TIME_DOMAIN} from '../../domain/time'
import {isEntityId} from '../../domain/ids'
import {featured,MAIN_PATH_SIZE} from '../../content/featured'
import {buildMainPathGraph} from '../../domain/main-path'
import {MEDIA_SLOTS} from '../../content/media-slots.generated'
import {findSlot,validateSlotMedia} from '../../domain/media-slots'
import {REFERENCE_KINDS,REFERENCE_VERIFICATIONS} from '../../domain/research-model'
import {isIsoDate} from '../../domain/references'

export type ValidationSeverity='error'|'warning'
export type ValidationIssue={severity:ValidationSeverity;code:string;path:string;message:string}
export type ValidationReport={ok:boolean;errors:number;warnings:number;issues:ValidationIssue[];summary:Record<string,number>}

type Bucket='taxa'|'taxonNames'|'media'|'sources'|'publications'|'institutions'|'collections'|'materialEntities'|'occurrences'|'evidence'|'specimens'|'claims'|'interpretationSets'|'interpretationPositions'|'sites'|'siteContexts'
const issue=(issues:ValidationIssue[],severity:ValidationSeverity,code:string,path:string,message:string)=>issues.push({severity,code,path,message})
const isHttp=(value:string)=>/^https?:\/\//.test(value)
const isHttps=(value:string)=>/^https:\/\//.test(value)
const isDoi=(value:string)=>/^10\.\d{4,9}\/\S+$/.test(value.trim())
/** The site is fully self-hosted: no remote image host is approved. Every image lives under /assets/ or /cms-media/. */
const approvedRemoteHosts=new Set<string>()
const approvedLocalPrefixes=['/assets/','/cms-media/']
const finite=(value:number)=>Number.isFinite(value)
const unique=(values:readonly string[],path:string,code:string,label:string,issues:ValidationIssue[])=>{if(new Set(values).size!==values.length) issue(issues,'error',code,path,`${label} references must be unique.`)}

export function validateCatalog(catalog:ContentCatalog=baseCatalog):ValidationReport{
  const contentCatalog=catalog
  const issues:ValidationIssue[]=[]
  const sets:Record<Bucket,Set<string>>={
    taxa:new Set(),taxonNames:new Set(),media:new Set(),sources:new Set(),publications:new Set(),institutions:new Set(),collections:new Set(),materialEntities:new Set(),occurrences:new Set(),evidence:new Set(),specimens:new Set(),claims:new Set(),interpretationSets:new Set(),interpretationPositions:new Set(),sites:new Set(),siteContexts:new Set(),
  }
  const register=(bucket:Bucket,id:string,path:string)=>{
    if(!id.trim()) issue(issues,'error','EMPTY_ID',path,`${bucket} id is empty.`)
    else if(!isEntityId(id)) issue(issues,'error','INVALID_ID_FORMAT',path,`${bucket} id does not match the canonical identifier policy.`)
    if(sets[bucket].has(id)) issue(issues,'error','DUPLICATE_ID',path,`Duplicate ${bucket} id: ${id}`)
    sets[bucket].add(id)
  }
  const has=(bucket:Bucket,id:string)=>sets[bucket].has(id)

const validateSourceLinks=(
  issues:ValidationIssue[],
  bucket:string,
  id:string,
  sourceIds:readonly string[],
  links:readonly {sourceId:string;role:string}[]|undefined,
  required:boolean,
)=>{
  if(required && (!links || links.length===0)) issue(issues,'error','MISSING_SOURCE_LINKS',`${bucket}.${id}.sourceLinks`,'Source-bearing records must expose role-aware source links.')
  if(!links) return
  const compositeKeys=links.map(link=>`${String(link.sourceId)}:${String(link.role)}`)
  unique(compositeKeys,`${bucket}.${id}.sourceLinks`,'DUPLICATE_SOURCE_LINKS','Source link role pair',issues)
  unique(sourceIds.map(String),`${bucket}.${id}.sourceIds`,'DUPLICATE_SOURCE_IDS','Source',issues)
  const allowed=new Set(sourceIds.map(String))
  const linked=new Set<string>()
  for(const link of links){
    const sourceId=String(link.sourceId)
    if(!has('sources',sourceId)) issue(issues,'error','BROKEN_SOURCE_LINK',`${bucket}.${id}.sourceLinks`,`Source ${sourceId} is missing.`)
    if(!allowed.has(sourceId)) issue(issues,'error','SOURCE_LINK_OUTSIDE_SOURCE_IDS',`${bucket}.${id}.sourceLinks`,`Source link ${sourceId} is not present in sourceIds.`)
    if(!String(link.role).trim()) issue(issues,'error','EMPTY_SOURCE_LINK_ROLE',`${bucket}.${id}.sourceLinks`,'Source link role must not be empty.')
    linked.add(sourceId)
  }
  const sourceSet=new Set(sourceIds.map(String))
  if(linked.size!==sourceSet.size || [...linked].some(value=>!sourceSet.has(value))) issue(issues,'error','SOURCE_LINK_PARITY',`${bucket}.${id}.sourceLinks`,'sourceIds and sourceLinks must reference the same source set.')
}

const validateIdentifiers=(issues:ValidationIssue[],bucket:string,id:string,identifiers:readonly {scheme:string;value:string;uri?:string;preferred?:boolean}[])=>{
  const keys=new Set<string>()
  const preferredByScheme=new Set<string>()
  for(const identifier of identifiers){
    const value=String(identifier.value).trim()
    const scheme=String(identifier.scheme).trim()
    if(!scheme || !value) issue(issues,'error','EMPTY_IDENTIFIER',`${bucket}.${id}.identifiers`,'Identifier scheme and value are required.')
    const key=`${scheme}:${value.toLowerCase()}`
    if(keys.has(key)) issue(issues,'error','DUPLICATE_IDENTIFIER',`${bucket}.${id}.identifiers`,`Duplicate identifier ${scheme}:${value}.`)
    keys.add(key)
    if(identifier.uri){
      try{const url=new URL(identifier.uri); if(url.protocol!=='https:') issue(issues,'error','NON_HTTPS_IDENTIFIER_URI',`${bucket}.${id}.identifiers`, 'Identifier URI must use HTTPS.')}
      catch{issue(issues,'error','INVALID_IDENTIFIER_URI',`${bucket}.${id}.identifiers`,'Identifier URI is not a valid URL.')}
    }
    if(identifier.preferred){
      if(preferredByScheme.has(scheme)) issue(issues,'error','MULTIPLE_PREFERRED_IDENTIFIERS',`${bucket}.${id}.identifiers`,`More than one preferred identifier exists for scheme ${scheme}.`)
      preferredByScheme.add(scheme)
    }
    if(scheme==='doi' && !isDoi(value)) issue(issues,'error','INVALID_IDENTIFIER_DOI',`${bucket}.${id}.identifiers`,`Invalid DOI identifier ${value}.`)
  }
}

  if(contentCatalog.metadata.schemaVersion!=='4.2.0') issue(issues,'error','UNSUPPORTED_CATALOG_SCHEMA','catalog.metadata.schemaVersion',`Unsupported catalog schema ${contentCatalog.metadata.schemaVersion}.`)
  if(contentCatalog.metadata.modelVersion!=='4.2.0') issue(issues,'error','UNSUPPORTED_MODEL_VERSION','catalog.metadata.modelVersion',`Unsupported research model version ${contentCatalog.metadata.modelVersion}.`)
  if(!contentCatalog.metadata.release.trim()) issue(issues,'error','MISSING_CATALOG_RELEASE','catalog.metadata.release','Catalog release must be declared.')
  if(contentCatalog.metadata.snapshotKind!=='curated') issue(issues,'error','INVALID_SNAPSHOT_KIND','catalog.metadata.snapshotKind','Phase 2 canonical catalog must be a curated snapshot.')
  for(const standard of ['Darwin Core','CIDOC CRM','W3C PROV-O']) if(!contentCatalog.metadata.conceptualStandards.includes(standard)) issue(issues,'error','MISSING_MODEL_STANDARD',`catalog.metadata.conceptualStandards`,`Missing ${standard}.`)

  for(const item of contentCatalog.taxa) register('taxa',String(item.id),'taxa')
  for(const item of contentCatalog.taxonNames) register('taxonNames',String(item.id),'taxonNames')
  for(const item of contentCatalog.media) register('media',String(item.id),'media')
  for(const item of contentCatalog.sources) register('sources',String(item.id),'sources')
  for(const item of contentCatalog.publications) register('publications',String(item.id),'publications')
  for(const item of contentCatalog.institutions) register('institutions',String(item.id),'institutions')
  for(const item of contentCatalog.collections) register('collections',String(item.id),'collections')
  for(const item of contentCatalog.materialEntities) register('materialEntities',String(item.id),'materialEntities')
  for(const item of contentCatalog.occurrences) register('occurrences',String(item.id),'occurrences')
  for(const item of contentCatalog.sites) register('sites',String(item.id),'sites')
  for(const item of contentCatalog.siteContexts) register('siteContexts',String(item.id),'siteContexts')
  for(const item of contentCatalog.evidence) register('evidence',String(item.id),'evidence')
  for(const item of contentCatalog.specimens) register('specimens',String(item.id),'specimens')
  for(const item of contentCatalog.claims) register('claims',String(item.id),'claims')
  for(const item of contentCatalog.interpretationSets) register('interpretationSets',String(item.id),'interpretationSets')
  for(const item of contentCatalog.interpretationPositions) register('interpretationPositions',String(item.id),'interpretationPositions')

  for(const taxon of contentCatalog.taxa){
    const id=String(taxon.id)
    if(!taxon.name.trim()) issue(issues,'error','MISSING_NAME',`taxa.${id}.name`,'Taxon display name is empty.')
    if(!(taxon.start>=taxon.end && taxon.start<=TIME_DOMAIN.oldestMa && taxon.end>=TIME_DOMAIN.youngestMa)) issue(issues,'error','INVALID_TIME_RANGE',`taxa.${id}.time`,'Taxon interval is outside the project time domain or reversed.')
    if(taxon.chronology.olderMa!==taxon.start || taxon.chronology.youngerMa!==taxon.end) issue(issues,'error','CHRONOLOGY_MISMATCH',`taxa.${id}.chronology`,'Canonical chronology must match the current explorer interval.')
    if(!taxon.taxonomy.scientificName.trim()) issue(issues,'error','MISSING_SCIENTIFIC_NAME',`taxa.${id}.taxonomy.scientificName`,'Taxonomic identity is empty.')
    if(!taxon.taxonomy.nameUsageIds.length) issue(issues,'error','MISSING_TAXON_NAME_USAGE',`taxa.${id}.taxonomy.nameUsageIds`,'Every taxon must point to at least one taxon-name usage record.')
    for(const nameId of taxon.taxonomy.nameUsageIds) if(!has('taxonNames',String(nameId))) issue(issues,'error','BROKEN_TAXON_NAME_USAGE',`taxa.${id}.taxonomy.nameUsageIds`,`Taxon name ${String(nameId)} is missing.`)
    const linkedNames=contentCatalog.taxonNames.filter(name=>taxon.taxonomy.nameUsageIds.some(nameId=>String(nameId)===String(name.id)))
    const acceptedNames=linkedNames.filter(name=>name.usage==='accepted')
    if(taxon.taxonomy.rank!=='informal-node' && acceptedNames.length!==1) issue(issues,'error','INVALID_ACCEPTED_NAME_CARDINALITY',`taxa.${id}.taxonomy.nameUsageIds`,'A formal taxon must have exactly one accepted taxon-name usage in its linked name records.')
    if(acceptedNames.length===1 && acceptedNames[0].name!==taxon.taxonomy.scientificName) issue(issues,'error','ACCEPTED_NAME_MISMATCH',`taxa.${id}.taxonomy.scientificName`,'Taxon scientificName must match its accepted taxon-name record.')
    if(!taxon.mediaIds.length || !taxon.mediaIds.includes(taxon.defaultMediaId)) issue(issues,'error','INVALID_PRIMARY_MEDIA',`taxa.${id}.mediaIds`,'Default media must be present in mediaIds.')
    unique(taxon.mediaIds.map(String),`taxa.${id}.mediaIds`,'DUPLICATE_TAXON_MEDIA','Taxon media',issues)
    if(taxon.treeIconMediaId!==undefined && !taxon.mediaIds.includes(taxon.treeIconMediaId)) issue(issues,'error','INVALID_TREE_ICON_MEDIA',`taxa.${id}.treeIconMediaId`,'Tree avatar media must be one of the taxon media ids.')
    validateIdentifiers(issues,'taxa',id,taxon.taxonomy.identifiers)
    unique(taxon.sourceIds.map(String),`taxa.${id}.sourceIds`,'DUPLICATE_TAXON_SOURCES','Taxon source',issues)
    if(!taxon.sourceIds.length) issue(issues,'error','NO_TAXON_SOURCES',`taxa.${id}.sourceIds`,'Every taxon record needs at least one source reference.')
    for(const mediaId of taxon.mediaIds){
      if(!has('media',String(mediaId))) issue(issues,'error','BROKEN_TAXON_MEDIA',`taxa.${id}.mediaIds`,`Media ${String(mediaId)} is missing.`)
      else {
        const record=contentCatalog.media.find(item=>String(item.id)===String(mediaId))
        if(record && (record.subject.type!=='taxon' || String(record.subject.id)!==id)) issue(issues,'error','MEDIA_SUBJECT_MISMATCH',`taxa.${id}.mediaIds`,`Media ${String(mediaId)} does not target this taxon.`)
        if(record && (record.publicationStatus==='legacy'||record.publicationStatus==='retired')) issue(issues,'error','RETIRED_TAXON_MEDIA',`taxa.${id}.mediaIds`,`Taxon references ${record.publicationStatus} media ${String(mediaId)}.`)
      }
    }
    for(const sourceId of taxon.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_TAXON_SOURCE',`taxa.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'taxa',id,taxon.sourceIds,taxon.sourceLinks,true)
  }

  for(const name of contentCatalog.taxonNames){
    const id=String(name.id)
    if(!has('taxa',String(name.taxonId))) issue(issues,'error','BROKEN_TAXON_NAME_TAXON',`taxonNames.${id}.taxonId`,`Taxon ${String(name.taxonId)} is missing.`)
    if(!name.name.trim()) issue(issues,'error','EMPTY_TAXON_NAME',`taxonNames.${id}.name`,'Taxon name must not be empty.')
    validateIdentifiers(issues,'taxonNames',id,name.identifiers)
    for(const sourceId of name.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_TAXON_NAME_SOURCE',`taxonNames.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'taxonNames',id,name.sourceIds,name.sourceLinks,true)
  }

  for(const media of contentCatalog.media){
    const id=String(media.id)
    if(media.subject.type==='taxon' && !has('taxa',String(media.subject.id))) issue(issues,'error','BROKEN_MEDIA_SUBJECT',`media.${id}.subject.id`,`Taxon ${String(media.subject.id)} is missing.`)
    if(media.subject.type==='specimen' && !has('specimens',String(media.subject.id))) issue(issues,'error','BROKEN_MEDIA_SUBJECT',`media.${id}.subject.id`,`Specimen ${String(media.subject.id)} is missing.`)
    if(media.subject.type==='material' && !has('materialEntities',String(media.subject.id))) issue(issues,'error','BROKEN_MEDIA_SUBJECT',`media.${id}.subject.id`,`Material entity ${String(media.subject.id)} is missing.`)
    if(media.subject.type==='site' && !has('sites',String(media.subject.id))) issue(issues,'error','BROKEN_MEDIA_SUBJECT',`media.${id}.subject.id`,`Site ${String(media.subject.id)} is missing.`)
    if(!media.src.trim()) issue(issues,'error','MISSING_MEDIA_SRC',`media.${id}.src`,'Media source is empty.')
    if(!approvedLocalPrefixes.some(prefix=>media.src.startsWith(prefix)) && !isHttp(media.src)) issue(issues,'error','INVALID_MEDIA_SRC',`media.${id}.src`,'Media source must be an HTTP(S) URL or an approved local path (/assets/ or /cms-media/).')
    if(isHttp(media.src)){
      try { const url=new URL(media.src); if(url.protocol!=='https:') issue(issues,'error','INSECURE_MEDIA_SRC',`media.${id}.src`,'Remote media sources must use HTTPS.'); if(!approvedRemoteHosts.has(url.hostname)) issue(issues,'error','UNAPPROVED_MEDIA_HOST',`media.${id}.src`,`Remote media host ${url.hostname} is not approved by the current image policy.`) }
      catch { issue(issues,'error','INVALID_MEDIA_URL',`media.${id}.src`,'Remote media source is not a valid URL.') }
    }
    if(media.sourceUrl && !isHttps(media.sourceUrl)) issue(issues,'error','NON_HTTPS_MEDIA_SOURCE',`media.${id}.sourceUrl`,'Media source URL must use HTTPS.')
    if(!media.note.trim()) issue(issues,'warning','MISSING_MEDIA_NOTE',`media.${id}.note`,'Media should carry a scientific limitation note.')
    if(!media.alt.trim()) issue(issues,'error','MISSING_MEDIA_ALT',`media.${id}.alt`,'Canonical media must have an accessible alternative description.')
    if(media.publicationStatus==='approved' && !media.license && !media.sourceUrl) issue(issues,'error','APPROVED_MEDIA_WITHOUT_PROVENANCE',`media.${id}.publicationStatus`,'Approved media needs licensing or source provenance.')
    if(media.publicationStatus==='legacy' || media.publicationStatus==='retired') issue(issues,'error','NON_PUBLISHABLE_MEDIA',`media.${id}.publicationStatus`,`Media ${id} cannot remain publishable.`)
    if(media.publicationStatus==='review-required' && !media.sourceUrl) issue(issues,'error','REVIEW_MEDIA_WITHOUT_SOURCE',`media.${id}.sourceUrl`,'Media requiring review must retain a source URL.')
    // A slot image of evidence class D is labelled on the page by its class (“Reconstruction”), so it needs no text label;
    // free-standing reconstructions keep the textual rule.
    if(media.kind==='reconstruction' && media.evidenceClass!=='D' && !/reconstruction|reconstruct|illustrative|inferred/i.test(`${media.note} ${media.alt}`)) issue(issues,'error','UNLABELED_RECONSTRUCTION',`media.${id}`,'Reconstructions must be explicitly labeled.')
    if(!media.roles.length) issue(issues,'error','MISSING_MEDIA_ROLE',`media.${id}.roles`,'Canonical media must declare at least one role.')
    const roleSet=new Set(media.roles)
    if(roleSet.has('tree-thumbnail')||roleSet.has('profile-portrait')||roleSet.has('dossier-hero')||roleSet.has('comparative-morphology')||roleSet.has('anatomy-plate')) { if(media.subject.type!=='taxon') issue(issues,'error','INVALID_TAXON_MEDIA_ROLE',`media.${id}.roles`,'Taxon portrait/analysis roles must target a taxon subject.') }
    if(roleSet.has('specimen-reference') && media.subject.type!=='specimen' && media.subject.type!=='material' && media.subject.type!=='taxon') issue(issues,'error','INVALID_SPECIMEN_MEDIA_ROLE',`media.${id}.roles`,'Specimen-reference media must target specimen, material, or a taxon explicitly used as a specimen proxy.')
    validateSourceLinks(issues,'media',id,media.sourceLinks.map(link=>String(link.sourceId)),media.sourceLinks,false)
    if(media.slotId) for(const violation of validateSlotMedia(media,findSlot(MEDIA_SLOTS,String(media.slotId)))) issue(issues,'error',violation.code,`media.${id}.slotId`,violation.message)
    else if(media.evidenceClass) issue(issues,'error','EVIDENCE_CLASS_WITHOUT_SLOT',`media.${id}.evidenceClass`,'An evidence class is only valid on an image that fills a slot.')
  }
  const liveBySlot=new Map<string,string[]>()
  for(const media of contentCatalog.media) if(media.slotId) liveBySlot.set(String(media.slotId),[...(liveBySlot.get(String(media.slotId))??[]),String(media.id)])
  for(const [slotId,ids] of liveBySlot) if(ids.length>1) issue(issues,'error','SLOT_DUPLICATE_LIVE',`media.slotId`,`Slot ${slotId} has more than one live image: ${ids.join(', ')}.`)

  for(const publication of contentCatalog.publications){
    const id=String(publication.id)
    if(!publication.title.trim()) issue(issues,'error','EMPTY_PUBLICATION_TITLE',`publications.${id}.title`,'Publication title is empty.')
    if(publication.doi && !isDoi(publication.doi)) issue(issues,'error','INVALID_DOI',`publications.${id}.doi`,`Invalid DOI ${publication.doi}.`)
    validateIdentifiers(issues,'publications',id,publication.identifiers)
    if(!publication.url.startsWith('https://')) issue(issues,'error','NON_HTTPS_PUBLICATION_URL',`publications.${id}.url`,'Publication URL must use HTTPS.')
    for(const institutionId of publication.institutionIds) if(!has('institutions',String(institutionId))) issue(issues,'error','BROKEN_PUBLICATION_INSTITUTION',`publications.${id}.institutionIds`,`Institution ${String(institutionId)} is missing.`)
    for(const contributor of publication.contributors??[]) {
      if(!contributor.name.trim()) issue(issues,'error','EMPTY_CONTRIBUTOR_NAME',`publications.${id}.contributors`,'Contributor name is empty.')
      for(const institutionId of contributor.institutionIds) if(!has('institutions',String(institutionId))) issue(issues,'error','BROKEN_CONTRIBUTOR_INSTITUTION',`publications.${id}.contributors`,`Institution ${String(institutionId)} is missing.`)
    }
    if(publication.doi && !publication.identifiers.some(identifier=>identifier.scheme==='doi'&&identifier.value===publication.doi)) issue(issues,'error','PUBLICATION_DOI_IDENTIFIER_MISMATCH',`publications.${id}.identifiers`,'Publication DOI must also be represented as a DOI identifier.')
    if(publication.kind && !REFERENCE_KINDS.includes(publication.kind)) issue(issues,'error','INVALID_REFERENCE_KIND',`publications.${id}.kind`,`Unknown reference kind ${String(publication.kind)}.`)
    if(publication.verification && !REFERENCE_VERIFICATIONS.includes(publication.verification)) issue(issues,'error','INVALID_REFERENCE_VERIFICATION',`publications.${id}.verification`,`Unknown verification method ${String(publication.verification)}.`)
    if(publication.verifiedOn && !isIsoDate(publication.verifiedOn)) issue(issues,'error','INVALID_VERIFIED_ON',`publications.${id}.verifiedOn`,'verifiedOn must be a real date written YYYY-MM-DD.')
    if(publication.verifiedOn && !publication.verification) issue(issues,'error','REFERENCE_VERIFICATION_MISSING',`publications.${id}.verification`,'A verified reference must say how it was verified.')
    if(publication.verification && !publication.verifiedOn) issue(issues,'error','REFERENCE_VERIFIED_ON_MISSING',`publications.${id}.verifiedOn`,'A verification method needs the date it was applied.')
    if(publication.verification==='doi-resolved' && !publication.doi) issue(issues,'error','DOI_VERIFICATION_WITHOUT_DOI',`publications.${id}.doi`,'doi-resolved verification requires a DOI.')
    if((publication.kind==='primary'||publication.kind==='review') && publication.type==='journal-article' && !publication.doi) issue(issues,'error','REFERENCE_WITHOUT_DOI',`publications.${id}.doi`,'A primary or review journal article must carry its DOI.')
    if(publication.kind && !publication.verifiedOn) issue(issues,'warning','REFERENCE_NOT_VERIFIED',`publications.${id}.verifiedOn`,'This reference has a kind but was never verified; it cannot be cited on a species page.')
  }
  for(const institution of contentCatalog.institutions){
    const id=String(institution.id)
    if(!institution.name.trim()) issue(issues,'error','EMPTY_INSTITUTION_NAME',`institutions.${id}.name`,'Institution name is empty.')
    validateIdentifiers(issues,'institutions',id,institution.identifiers)
    if(institution.website && !isHttps(institution.website)) issue(issues,'error','NON_HTTPS_INSTITUTION_URL',`institutions.${id}.website`,'Institution website must use HTTPS.')
  }
  for(const collection of contentCatalog.collections){
    const id=String(collection.id)
    if(!has('institutions',String(collection.institutionId))) issue(issues,'error','BROKEN_COLLECTION_INSTITUTION',`collections.${id}.institutionId`,`Institution ${String(collection.institutionId)} is missing.`)
    validateIdentifiers(issues,'collections',id,collection.identifiers)
  }
  for(const source of contentCatalog.sources){
    const id=String(source.id)
    if(!source.title.trim()||!source.publisher.trim()) issue(issues,'error','INCOMPLETE_SOURCE',`sources.${id}`,'Source title and publisher are required.')
    if((source.type==='primary-study'||source.type==='peer-reviewed-paper') && !source.publicationId) issue(issues,'error','SCHOLARLY_SOURCE_WITHOUT_PUBLICATION',`sources.${id}.publicationId`,'Scholarly source types must link to a PublicationRecord.')
    if(source.publicationId && !has('publications',String(source.publicationId))) issue(issues,'error','BROKEN_SOURCE_PUBLICATION',`sources.${id}.publicationId`,`Publication ${String(source.publicationId)} is missing.`)
    if(source.institutionId && !has('institutions',String(source.institutionId))) issue(issues,'error','BROKEN_SOURCE_INSTITUTION',`sources.${id}.institutionId`,`Institution ${String(source.institutionId)} is missing.`)
    validateIdentifiers(issues,'sources',id,source.identifiers)
    if(!isHttps(source.url)) issue(issues,'error','NON_HTTPS_SOURCE_URL',`sources.${id}.url`,'Source URL must use HTTPS.')
    for(const identifier of source.identifiers){ if(identifier.scheme==='doi' && !isDoi(identifier.value)) issue(issues,'error','INVALID_SOURCE_DOI',`sources.${id}.identifiers`,`Invalid DOI ${identifier.value}.`) }
  }

  for(const material of contentCatalog.materialEntities){
    const id=String(material.id)
    if(material.taxonId && !has('taxa',String(material.taxonId))) issue(issues,'error','BROKEN_MATERIAL_TAXON',`materialEntities.${id}.taxonId`,`Taxon ${String(material.taxonId)} is missing.`)
    if(material.institutionId && !has('institutions',String(material.institutionId))) issue(issues,'error','BROKEN_MATERIAL_INSTITUTION',`materialEntities.${id}.institutionId`,`Institution ${String(material.institutionId)} is missing.`)
    if(material.collectionId && !has('collections',String(material.collectionId))) issue(issues,'error','BROKEN_MATERIAL_COLLECTION',`materialEntities.${id}.collectionId`,`Collection ${String(material.collectionId)} is missing.`)
    if(material.collectionId){ const collection=contentCatalog.collections.find(item=>String(item.id)===String(material.collectionId)); if(collection && material.institutionId && String(collection.institutionId)!==String(material.institutionId)) issue(issues,'error','MATERIAL_COLLECTION_INSTITUTION_MISMATCH',`materialEntities.${id}.collectionId`,'Material institution and collection institution must agree.') }
    validateIdentifiers(issues,'materialEntities',id,material.identifiers)
    if(!material.sourceIds.length) issue(issues,'error','NO_MATERIAL_SOURCES',`materialEntities.${id}.sourceIds`,'Material entities need at least one source reference.')
    for(const sourceId of material.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_MATERIAL_SOURCE',`materialEntities.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    if(material.viewerUrl && !isHttps(material.viewerUrl)) issue(issues,'error','NON_HTTPS_MATERIAL_VIEWER',`materialEntities.${id}.viewerUrl`,'Material viewer URL must use HTTPS.')
    validateSourceLinks(issues,'materialEntities',id,material.sourceIds,material.sourceLinks,true)
  }

  for(const site of contentCatalog.sites){
    const id=String(site.id)
    if(!finite(site.lat)||site.lat<-90||site.lat>90) issue(issues,'error','INVALID_SITE_LATITUDE',`sites.${id}.lat`,'Latitude must be within -90..90.')
    if(!finite(site.lon)||site.lon<-180||site.lon>180) issue(issues,'error','INVALID_SITE_LONGITUDE',`sites.${id}.lon`,'Longitude must be within -180..180.')
    for(const sourceId of site.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_SITE_SOURCE',`sites.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateIdentifiers(issues,'sites',id,site.identifiers)
    validateSourceLinks(issues,'sites',id,site.sourceIds,site.sourceLinks,true)
  }
  for(const context of contentCatalog.siteContexts){
    const id=String(context.id)
    if(!has('sites',String(context.siteId))) issue(issues,'error','BROKEN_SITE_CONTEXT_SITE',`siteContexts.${id}.siteId`,`Site ${String(context.siteId)} is missing.`)
    for(const taxonId of context.relatedTaxonIds) if(!has('taxa',String(taxonId))) issue(issues,'error','BROKEN_SITE_CONTEXT_TAXON',`siteContexts.${id}.relatedTaxonIds`,`Taxon ${String(taxonId)} is missing.`)
    for(const sourceId of context.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_SITE_CONTEXT_SOURCE',`siteContexts.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'siteContexts',id,context.sourceIds,context.sourceLinks,true)
    if(context.timeInterval){
      if(context.timeInterval.youngerMa>context.timeInterval.olderMa) issue(issues,'error','INVALID_SITE_CONTEXT_TIME',`siteContexts.${id}.timeInterval`,'Site-context interval is reversed.')
      if(context.timeInterval.uncertaintyMa!=null && context.timeInterval.uncertaintyMa<0) issue(issues,'error','INVALID_SITE_CONTEXT_UNCERTAINTY',`siteContexts.${id}.timeInterval.uncertaintyMa`,'Uncertainty cannot be negative.')
      if(!context.timeInterval.datingClass) issue(issues,'error','MISSING_SITE_CONTEXT_DATING_CLASS',`siteContexts.${id}.timeInterval.datingClass`,'Site context resolves a time interval but does not declare a dating method.')
      for(const sourceId of context.timeInterval.sourceIds??[]) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_SITE_CONTEXT_TIME_SOURCE',`siteContexts.${id}.timeInterval.sourceIds`,`Source ${String(sourceId)} is missing.`)
      const uncertainty=context.timeInterval.uncertaintyMa??0
      const siteOlder=context.timeInterval.olderMa+uncertainty
      const siteYounger=Math.max(0,context.timeInterval.youngerMa-uncertainty)
      for(const taxonId of context.relatedTaxonIds){
        const taxon=contentCatalog.taxa.find(item=>String(item.id)===String(taxonId))
        if(taxon && (siteOlder<taxon.end || siteYounger>taxon.start)){
          issue(issues,'error','SITE_TAXON_CHRONOLOGY_MISMATCH',`siteContexts.${id}.relatedTaxonIds`,`Dated interval for ${context.ageLabel} does not overlap the registered range of ${taxon.name}, including dating uncertainty.`)
        }
      }
      const ageLabel=context.ageLabel.toLowerCase()
      const period=ageLabel.match(/\b(early|middle|late)\s+pleistocene\b/)
      if(period){
        const bounds=period[1]==='early'?{older:2.58,younger:0.774}:period[1]==='middle'?{older:0.774,younger:0.129}:{older:0.129,younger:0.0117}
        if(siteOlder<bounds.younger || siteYounger>bounds.older){
          issue(issues,'error','SITE_PERIOD_LABEL_MISMATCH',`siteContexts.${id}.ageLabel`,`The numeric age interval does not overlap the ${period[1]} Pleistocene.`)
        }
      }
    }
  }

  for(const specimen of contentCatalog.specimens){
    const id=String(specimen.id)
    if(!has('taxa',String(specimen.taxonId))) issue(issues,'error','BROKEN_SPECIMEN_TAXON',`specimens.${id}.taxonId`,`Taxon ${String(specimen.taxonId)} is missing.`)
    if(specimen.siteId && !has('sites',String(specimen.siteId))) issue(issues,'error','BROKEN_SPECIMEN_SITE',`specimens.${id}.siteId`,`Site ${String(specimen.siteId)} is missing.`)
    if(!has('materialEntities',String(specimen.materialEntityId))) issue(issues,'error','BROKEN_SPECIMEN_MATERIAL',`specimens.${id}.materialEntityId`,`Material entity ${String(specimen.materialEntityId)} is missing.`)
    if(!specimen.sourceIds.length) issue(issues,'error','NO_SPECIMEN_SOURCES',`specimens.${id}.sourceIds`,'A specimen record must retain at least one source reference.')
    for(const sourceId of specimen.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_SPECIMEN_SOURCE',`specimens.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    if(specimen.occurrenceId && !has('occurrences',String(specimen.occurrenceId))) issue(issues,'error','BROKEN_SPECIMEN_OCCURRENCE',`specimens.${id}.occurrenceId`,`Occurrence ${String(specimen.occurrenceId)} is missing.`)
    const material=contentCatalog.materialEntities.find(item=>String(item.id)===String(specimen.materialEntityId))
    if(material?.taxonId && String(material.taxonId)!==String(specimen.taxonId)) issue(issues,'error','SPECIMEN_MATERIAL_TAXON_MISMATCH',`specimens.${id}.materialEntityId`,'Specimen and material taxon IDs must agree.')
    if(specimen.occurrenceId){
      const occurrence=contentCatalog.occurrences.find(item=>String(item.id)===String(specimen.occurrenceId))
      if(occurrence && (!occurrence.specimenId || String(occurrence.specimenId)!==id)) issue(issues,'error','SPECIMEN_OCCURRENCE_RECIPROCITY',`specimens.${id}.occurrenceId`,'Specimen occurrence link must point back to the specimen.')
      if(occurrence && (String(occurrence.taxonId)!==String(specimen.taxonId) || String(occurrence.siteId)!==String(specimen.siteId))) issue(issues,'error','SPECIMEN_OCCURRENCE_CONTEXT_MISMATCH',`specimens.${id}.occurrenceId`,'Specimen and occurrence taxon/site context must agree.')
    }
    validateSourceLinks(issues,'specimens',id,specimen.sourceIds,specimen.sourceLinks,true)
  }

  for(const occurrence of contentCatalog.occurrences){
    const id=String(occurrence.id)
    if(!has('taxa',String(occurrence.taxonId))) issue(issues,'error','BROKEN_OCCURRENCE_TAXON',`occurrences.${id}.taxonId`,`Taxon ${String(occurrence.taxonId)} is missing.`)
    if(!has('sites',String(occurrence.siteId))) issue(issues,'error','BROKEN_OCCURRENCE_SITE',`occurrences.${id}.siteId`,`Site ${String(occurrence.siteId)} is missing.`)
    if(occurrence.specimenId && !has('specimens',String(occurrence.specimenId))) issue(issues,'error','BROKEN_OCCURRENCE_SPECIMEN',`occurrences.${id}.specimenId`,`Specimen ${String(occurrence.specimenId)} is missing.`)
    if(!occurrence.sourceIds.length) issue(issues,'error','NO_OCCURRENCE_SOURCES',`occurrences.${id}.sourceIds`,'An occurrence record must retain at least one source reference.')
    validateIdentifiers(issues,'occurrences',id,occurrence.identifiers)
    for(const sourceId of occurrence.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_OCCURRENCE_SOURCE',`occurrences.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'occurrences',id,occurrence.sourceIds,occurrence.sourceLinks,true)
    if(occurrence.timeInterval){
      if(occurrence.timeInterval.youngerMa>occurrence.timeInterval.olderMa) issue(issues,'error','INVALID_OCCURRENCE_TIME',`occurrences.${id}.timeInterval`,'Occurrence interval is reversed.')
      for(const sourceId of occurrence.timeInterval.sourceIds??[]) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_OCCURRENCE_TIME_SOURCE',`occurrences.${id}.timeInterval.sourceIds`,`Source ${String(sourceId)} is missing.`)
    }
  }

  for(const evidence of contentCatalog.evidence){
    const id=String(evidence.id)
    if(!has('taxa',String(evidence.taxonId))) issue(issues,'error','BROKEN_EVIDENCE_TAXON',`evidence.${id}.taxonId`,`Taxon ${String(evidence.taxonId)} is missing.`)
    if(!has('sites',String(evidence.siteId))) issue(issues,'error','BROKEN_EVIDENCE_SITE',`evidence.${id}.siteId`,`Site ${String(evidence.siteId)} is missing.`)
    if(!evidence.sourceIds.length) issue(issues,'error','NO_EVIDENCE_SOURCES',`evidence.${id}.sourceIds`,'Evidence records must have source references.')
    validateIdentifiers(issues,'evidence',id,evidence.identifiers??[])
    for(const sourceId of evidence.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_EVIDENCE_SOURCE',`evidence.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    for(const specimenId of evidence.specimenIds??[]) {
      if(!has('specimens',String(specimenId))) issue(issues,'error','BROKEN_EVIDENCE_SPECIMEN',`evidence.${id}.specimenIds`,`Specimen ${String(specimenId)} is missing.`)
      else { const specimen=contentCatalog.specimens.find(item=>String(item.id)===String(specimenId)); if(specimen && String(specimen.taxonId)!==String(evidence.taxonId)) issue(issues,'error','EVIDENCE_SPECIMEN_TAXON_MISMATCH',`evidence.${id}.specimenIds`,'Evidence and specimen taxon IDs must agree.') }
    }
    for(const occurrenceId of evidence.occurrenceIds??[]) {
      if(!has('occurrences',String(occurrenceId))) issue(issues,'error','BROKEN_EVIDENCE_OCCURRENCE',`evidence.${id}.occurrenceIds`,`Occurrence ${String(occurrenceId)} is missing.`)
      else { const occurrence=contentCatalog.occurrences.find(item=>String(item.id)===String(occurrenceId)); if(occurrence && String(occurrence.taxonId)!==String(evidence.taxonId)) issue(issues,'error','EVIDENCE_OCCURRENCE_TAXON_MISMATCH',`evidence.${id}.occurrenceIds`,'Evidence and occurrence taxon IDs must agree.') }
    }
    validateSourceLinks(issues,'evidence',id,evidence.sourceIds,evidence.sourceLinks,true)
  }

  for(const claim of contentCatalog.claims){
    const id=String(claim.id)
    if(!has('taxa',String(claim.taxonId))) issue(issues,'error','BROKEN_CLAIM_TAXON',`claims.${id}.taxonId`,`Taxon ${String(claim.taxonId)} is missing.`)
    for(const evidenceId of claim.evidenceIds) {
      if(!has('evidence',String(evidenceId))) issue(issues,'error','BROKEN_CLAIM_EVIDENCE',`claims.${id}.evidenceIds`,`Evidence ${String(evidenceId)} is missing.`)
      else { const evidence=contentCatalog.evidence.find(item=>String(item.id)===String(evidenceId)); if(evidence && String(evidence.taxonId)!==String(claim.taxonId)) issue(issues,'error','CLAIM_EVIDENCE_TAXON_MISMATCH',`claims.${id}.evidenceIds`,'Claim and evidence taxon IDs must agree.') }
    }
    for(const sourceId of claim.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_CLAIM_SOURCE',`claims.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    for(const specimenId of claim.specimenIds??[]) if(!has('specimens',String(specimenId))) issue(issues,'error','BROKEN_CLAIM_SPECIMEN',`claims.${id}.specimenIds`,`Specimen ${String(specimenId)} is missing.`)
    for(const siteId of claim.siteIds??[]) if(!has('sites',String(siteId))) issue(issues,'error','BROKEN_CLAIM_SITE',`claims.${id}.siteIds`,`Site ${String(siteId)} is missing.`)
    if(!claim.statement.trim()||!claim.scope.trim()) issue(issues,'error','INCOMPLETE_CLAIM',`claims.${id}`,'Claims need a statement and scope.')
    if(!claim.sourceIds.length) issue(issues,'error','NO_CLAIM_SOURCES',`claims.${id}.sourceIds`,'Claims must cite at least one source.')
    unique(claim.sourceIds.map(String),`claims.${id}.sourceIds`,'DUPLICATE_CLAIM_SOURCES','Claim source',issues)
    validateSourceLinks(issues,'claims',id,claim.sourceIds,claim.sourceLinks,true)
    const uncertaintyDimensions=new Set<string>()
    for(const assessment of claim.uncertaintyProfile){
      if(uncertaintyDimensions.has(assessment.dimension)) issue(issues,'error','DUPLICATE_UNCERTAINTY_DIMENSION',`claims.${id}.uncertaintyProfile`,`Duplicate uncertainty dimension ${assessment.dimension}.`)
      uncertaintyDimensions.add(assessment.dimension)
      if(!assessment.note.trim()) issue(issues,'error','INCOMPLETE_UNCERTAINTY',`claims.${id}.uncertaintyProfile`,`Uncertainty ${assessment.dimension} needs a note.`)
      if(assessment.sourceIds.length===0 && assessment.evidenceIds.length===0) issue(issues,'error','UNSUPPORTED_UNCERTAINTY',`claims.${id}.uncertaintyProfile`,`Uncertainty ${assessment.dimension} must reference a source or evidence record.`)
      for(const sourceId of assessment.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_UNCERTAINTY_SOURCE',`claims.${id}.uncertaintyProfile`,`Source ${String(sourceId)} is missing.`)
      for(const evidenceId of assessment.evidenceIds) if(!has('evidence',String(evidenceId))) issue(issues,'error','BROKEN_UNCERTAINTY_EVIDENCE',`claims.${id}.uncertaintyProfile`,`Evidence ${String(evidenceId)} is missing.`)
    }
    for(const setId of claim.interpretationSetIds){
      if(!has('interpretationSets',String(setId))) issue(issues,'error','BROKEN_INTERPRETATION_SET',`claims.${id}.interpretationSetIds`,`Interpretation set ${String(setId)} is missing.`)
    }
  }

  for(const set of contentCatalog.interpretationSets){
    const id=String(set.id)
    if(!has('claims',String(set.claimId))) issue(issues,'error','BROKEN_INTERPRETATION_CLAIM',`interpretationSets.${id}.claimId`,`Claim ${String(set.claimId)} is missing.`)
    if(!set.positionIds.length) issue(issues,'error','EMPTY_INTERPRETATION_SET',`interpretationSets.${id}.positionIds`,'Interpretation set must contain at least one position.')
    if(set.status==='multiple-positions' && set.positionIds.length<2) issue(issues,'error','INSUFFICIENT_INTERPRETATION_POSITIONS',`interpretationSets.${id}.positionIds`,'Multiple-position interpretation sets require at least two positions.')
    if(!set.sourceIds.length) issue(issues,'error','NO_INTERPRETATION_SOURCES',`interpretationSets.${id}.sourceIds`,'Interpretation sets require provenance sources.')
    unique(set.positionIds.map(String),`interpretationSets.${id}.positionIds`,'DUPLICATE_INTERPRETATION_POSITIONS','Interpretation position',issues)
    for(const positionId of set.positionIds) if(!has('interpretationPositions',String(positionId))) issue(issues,'error','BROKEN_INTERPRETATION_POSITION',`interpretationSets.${id}.positionIds`,`Position ${String(positionId)} is missing.`)
    for(const sourceId of set.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_INTERPRETATION_SOURCE',`interpretationSets.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'interpretationSets',id,set.sourceIds,set.sourceLinks,true)
  }

  for(const position of contentCatalog.interpretationPositions){
    const id=String(position.id)
    if(!has('interpretationSets',String(position.setId))) issue(issues,'error','BROKEN_INTERPRETATION_SET_LINK',`interpretationPositions.${id}.setId`,`Interpretation set ${String(position.setId)} is missing.`)
    if(!position.label.trim() || !position.summary.trim()) issue(issues,'error','INCOMPLETE_INTERPRETATION_POSITION',`interpretationPositions.${id}`,'Interpretation positions need a label and summary.')
    if(!position.sourceIds.length) issue(issues,'error','NO_POSITION_SOURCES',`interpretationPositions.${id}.sourceIds`,'Interpretation positions require source provenance.')
    for(const sourceId of position.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_POSITION_SOURCE',`interpretationPositions.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    for(const evidenceId of position.evidenceIds) if(!has('evidence',String(evidenceId))) issue(issues,'error','BROKEN_POSITION_EVIDENCE',`interpretationPositions.${id}.evidenceIds`,`Evidence ${String(evidenceId)} is missing.`)
    validateSourceLinks(issues,'interpretationPositions',id,position.sourceIds,position.sourceLinks,true)
  }

  unique(contentCatalog.publications.flatMap(publication=>publication.doi?[publication.doi.toLowerCase()]:[]),'publications.doi','DUPLICATE_PUBLICATION_DOI','Publication DOI',issues)
  const relationshipKeys=new Set<string>()
  for(const relation of contentCatalog.relationships){
    const id=String(relation.id)
    const key=`${String(relation.from)}→${String(relation.to)}:${relation.type}`
    if(relationshipKeys.has(key)) issue(issues,'error','DUPLICATE_RELATIONSHIP',`relationships.${id}`,'Duplicate relationship record.')
    relationshipKeys.add(key)
    if(!has('taxa',String(relation.from))) issue(issues,'error','BROKEN_RELATION_FROM',`relationships.${id}`,`Taxon ${String(relation.from)} is missing.`)
    if(!has('taxa',String(relation.to))) issue(issues,'error','BROKEN_RELATION_TO',`relationships.${id}`,`Taxon ${String(relation.to)} is missing.`)
    if(String(relation.from)===String(relation.to)) issue(issues,'error','SELF_RELATIONSHIP',`relationships.${id}`,'A taxon cannot relate to itself.')
    for(const sourceId of relation.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_RELATION_SOURCE',`relationships.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'relationships',id,relation.sourceIds,relation.sourceLinks,true)
  }

  // Descent lines must run forward in time: the source taxon cannot first appear after the taxon drawn from it.
  const taxonStart=new Map(contentCatalog.taxa.map(taxon=>[String(taxon.id),taxon.start]))
  for(const relation of contentCatalog.relationships){
    if(relation.type==='gene-flow') continue
    const fromStart=taxonStart.get(String(relation.from)),toStart=taxonStart.get(String(relation.to))
    if(fromStart!==undefined&&toStart!==undefined&&fromStart<toStart) issue(issues,'error','ANACHRONISTIC_RELATIONSHIP',`relationships.${String(relation.id)}`,`${String(relation.from)} first appears after ${String(relation.to)}; a descent line cannot run backwards in time.`)
  }
  // The curated 11-taxon main path (home-page graph) must be a single connected, acyclic, chronological graph.
  const mainPath=buildMainPathGraph(contentCatalog.taxa.map(taxon=>({id:String(taxon.id),short:taxon.short,start:taxon.start,end:taxon.end,inferred:taxon.inferred})),contentCatalog.relationships,featured.mainPathTaxonIds.map(String),MAIN_PATH_SIZE)
  for(const problem of mainPath.issues) issue(issues,'error',problem.code,`featured.mainPathTaxonIds${problem.taxonId?`.${problem.taxonId}`:''}`,problem.message)
  const relationshipIds=new Set(contentCatalog.relationships.map(relation=>String(relation.id)))
  const relationshipHypothesisPositionIds=new Set(contentCatalog.relationshipHypothesisPositions.map(position=>String(position.id)))
  for(const set of contentCatalog.relationshipHypothesisSets){
    const id=String(set.id)
    if(!relationshipIds.has(String(set.relationshipId))) issue(issues,'error','BROKEN_RELATIONSHIP_HYPOTHESIS_RELATIONSHIP',`relationshipHypothesisSets.${id}.relationshipId`,`Relationship ${String(set.relationshipId)} is missing.`)
    if(set.positionIds.length<2) issue(issues,'error','INSUFFICIENT_RELATIONSHIP_HYPOTHESIS_POSITIONS',`relationshipHypothesisSets.${id}.positionIds`,'Relationship hypothesis sets require at least two competing positions.')
    if(!set.sourceIds.length) issue(issues,'error','NO_RELATIONSHIP_HYPOTHESIS_SOURCES',`relationshipHypothesisSets.${id}.sourceIds`,'Relationship hypothesis sets require provenance sources.')
    unique(set.positionIds.map(String),`relationshipHypothesisSets.${id}.positionIds`,'DUPLICATE_RELATIONSHIP_HYPOTHESIS_POSITIONS','Relationship hypothesis position',issues)
    for(const positionId of set.positionIds) if(!relationshipHypothesisPositionIds.has(String(positionId))) issue(issues,'error','BROKEN_RELATIONSHIP_HYPOTHESIS_POSITION',`relationshipHypothesisSets.${id}.positionIds`,`Position ${String(positionId)} is missing.`)
    for(const sourceId of set.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_RELATIONSHIP_HYPOTHESIS_SOURCE',`relationshipHypothesisSets.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'relationshipHypothesisSets',id,set.sourceIds,set.sourceLinks,true)
  }
  const relationshipHypothesisSetIds=new Set(contentCatalog.relationshipHypothesisSets.map(set=>String(set.id)))
  for(const position of contentCatalog.relationshipHypothesisPositions){
    const id=String(position.id)
    if(!relationshipHypothesisSetIds.has(String(position.setId))) issue(issues,'error','BROKEN_RELATIONSHIP_HYPOTHESIS_SET_LINK',`relationshipHypothesisPositions.${id}.setId`,`Relationship hypothesis set ${String(position.setId)} is missing.`)
    if(!position.label.trim() || !position.summary.trim()) issue(issues,'error','INCOMPLETE_RELATIONSHIP_HYPOTHESIS_POSITION',`relationshipHypothesisPositions.${id}`,'Relationship hypothesis positions need a label and summary.')
    if(!position.sourceIds.length) issue(issues,'error','NO_RELATIONSHIP_HYPOTHESIS_POSITION_SOURCES',`relationshipHypothesisPositions.${id}.sourceIds`,'Relationship hypothesis positions require source provenance.')
    for(const sourceId of position.sourceIds) if(!has('sources',String(sourceId))) issue(issues,'error','BROKEN_RELATIONSHIP_HYPOTHESIS_POSITION_SOURCE',`relationshipHypothesisPositions.${id}.sourceIds`,`Source ${String(sourceId)} is missing.`)
    validateSourceLinks(issues,'relationshipHypothesisPositions',id,position.sourceIds,position.sourceLinks,true)
  }

  const referencedSourceIds=new Set<string>()
  for(const taxon of contentCatalog.taxa) taxon.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const name of contentCatalog.taxonNames) name.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const relation of contentCatalog.relationships) relation.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const site of contentCatalog.sites) site.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const context of contentCatalog.siteContexts) context.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const evidence of contentCatalog.evidence) evidence.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const specimen of contentCatalog.specimens) specimen.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const material of contentCatalog.materialEntities) material.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const occurrence of contentCatalog.occurrences) occurrence.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const claim of contentCatalog.claims){ claim.sourceIds.forEach(id=>referencedSourceIds.add(String(id))); claim.uncertaintyProfile.forEach(assessment=>assessment.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))) }
  for(const set of contentCatalog.interpretationSets) set.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const position of contentCatalog.interpretationPositions) position.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const set of contentCatalog.relationshipHypothesisSets) set.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const position of contentCatalog.relationshipHypothesisPositions) position.sourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const media of contentCatalog.media) media.sourceLinks.forEach(link=>referencedSourceIds.add(String(link.sourceId)))
  foundationalSourceIds.forEach(id=>referencedSourceIds.add(String(id)))
  for(const source of contentCatalog.sources) if(!referencedSourceIds.has(String(source.id))) issue(issues,'warning','ORPHAN_SOURCE',`sources.${String(source.id)}`,'Source is currently not referenced by a canonical content record.')

  const summary={taxa:contentCatalog.taxa.length,taxonNames:contentCatalog.taxonNames.length,media:contentCatalog.media.length,sources:contentCatalog.sources.length,publications:contentCatalog.publications.length,institutions:contentCatalog.institutions.length,collections:contentCatalog.collections.length,materialEntities:contentCatalog.materialEntities.length,occurrences:contentCatalog.occurrences.length,evidence:contentCatalog.evidence.length,specimens:contentCatalog.specimens.length,claims:contentCatalog.claims.length,interpretationSets:contentCatalog.interpretationSets.length,interpretationPositions:contentCatalog.interpretationPositions.length,relationshipHypothesisSets:contentCatalog.relationshipHypothesisSets.length,relationshipHypothesisPositions:contentCatalog.relationshipHypothesisPositions.length,uncertaintyAssessments:contentCatalog.claims.reduce((sum,claim)=>sum+claim.uncertaintyProfile.length,0),sites:contentCatalog.sites.length,siteContexts:contentCatalog.siteContexts.length,siteViews:contentCatalog.siteViews.length,relationships:contentCatalog.relationships.length}
  const errors=issues.filter(i=>i.severity==='error').length
  const warnings=issues.filter(i=>i.severity==='warning').length
  return {ok:errors===0,errors,warnings,issues,summary}
}
