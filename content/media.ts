import type {MediaAsset} from '../domain/contracts'
import {asTaxonId,asMediaAssetId} from '../domain/ids'
import {taxa} from './taxa'
import {samplePortraitId,sampleIconId} from '../domain/media-slots'

/**
 * Built-in media: one self-hosted SAMPLE portrait and one SAMPLE tree icon per taxon (under /assets/species/samples/).
 *
 * The site never hotlinks or calls an external image service. Samples are honest schematics, flagged `placeholder`,
 * and are hidden automatically as soon as an admin publishes a real portrait / tree icon for that taxon in the CMS
 * (see `mergeCmsIntoCatalog`). Real photographs or reconstructions are added through the CMS, never hard-coded here.
 */
export const SAMPLE_MEDIA_DIR='/assets/species/samples'

export const media:MediaAsset[]=taxa.map(taxon=>({taxonId:String(taxon.id),name:taxon.name,date:taxon.date})).flatMap(item=>{
  const base={
    subject:{type:'taxon' as const,id:asTaxonId(item.taxonId)},
    kind:'context-schematic' as const,
    sourceUrl:'',
    credit:'Human Origins · sample illustration (self-hosted)',
    note:`Sample schematic only: it does not depict the fossils or the appearance of ${item.name}. Replace it from the admin panel (CMS → Media).`,
    publicationStatus:'schematic' as const,
    rightsStatus:'clear' as const,
    sourceLinks:[],
    placeholder:true as const,
  }
  return [
    {...base,id:asMediaAssetId(samplePortraitId(item.taxonId)),roles:['profile-portrait'] as const,src:`${SAMPLE_MEDIA_DIR}/${item.taxonId}.webp`,
      alt:`Sample schematic plate for ${item.name} (${item.date}); not a depiction of the fossils`,
      variants:[{purpose:'detail' as const,src:`${SAMPLE_MEDIA_DIR}/${item.taxonId}.webp`,width:1000,height:1250,format:'webp' as const}]},
    {...base,id:asMediaAssetId(sampleIconId(item.taxonId)),roles:['tree-thumbnail'] as const,src:`${SAMPLE_MEDIA_DIR}/${item.taxonId}-icon.webp`,
      alt:`Sample tree icon for ${item.name}`,
      variants:[{purpose:'icon' as const,src:`${SAMPLE_MEDIA_DIR}/${item.taxonId}-icon.webp`,width:512,height:512,format:'webp' as const}]},
  ]
})
