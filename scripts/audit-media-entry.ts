import {contentCatalog,getMediaForTaxon} from '../content/catalog'

const failures:string[]=[]
/** Fully self-hosted: no remote media host is approved. */
const remoteHosts=new Set<string>()
const seenSrc=new Map<string,string[]>()
const taxonIds=new Set(contentCatalog.taxa.map(t=>String(t.id)))
const mediaIds=new Set<string>()

for(const media of contentCatalog.media){
  const id=String(media.id)
  if(mediaIds.has(id)) failures.push(`duplicate media id: ${id}`)
  mediaIds.add(id)
  if(media.subject.type==='taxon' && !taxonIds.has(String(media.subject.id))) failures.push(`${id}: unknown subject taxon ${String(media.subject.id)}`)
  if(!media.alt.trim()) failures.push(`${id}: missing alt text`)
  if(!media.note.trim()) failures.push(`${id}: missing media note`)
  if(media.publicationStatus==='retired'||media.publicationStatus==='legacy') failures.push(`${id}: retired/legacy media cannot remain in canonical catalog`)

  const url=media.src
  if(url.startsWith('http://')) failures.push(`${id}: insecure remote media URL`)
  if(url.startsWith('https://')){
    try{
      const parsed=new URL(url)
      if(parsed.protocol!=='https:') failures.push(`${id}: remote media must use HTTPS`)
      if(!remoteHosts.has(parsed.hostname)) failures.push(`${id}: remote media host not approved: ${parsed.hostname}`)
      if(!media.sourceUrl) failures.push(`${id}: remote media requires a source URL`)
      if(!media.license) failures.push(`${id}: remote approved media requires license metadata`)
    }catch{ failures.push(`${id}: invalid remote media URL`) }
  }else if(!url.startsWith('/assets/')) failures.push(`${id}: local media must live under /assets/`)

  if(media.kind==='reconstruction'){
    const note=`${media.note} ${media.alt}`.toLowerCase()
    if(!note.includes('reconstruct')) failures.push(`${id}: reconstruction media must explicitly disclose reconstruction status`)
  }
  if(media.kind==='context-schematic' && media.publicationStatus!=='schematic') failures.push(`${id}: context-schematic media must have schematic status`)
  if(media.publicationStatus==='review-required' && media.kind!=='reconstruction') failures.push(`${id}: review-required status currently reserved for reconstructions`)

  const list=seenSrc.get(media.src)??[]
  if(media.subject.type==='taxon') list.push(String(media.subject.id)); seenSrc.set(media.src,list)
}

for(const [src,subjects] of seenSrc){
  if(new Set(subjects).size<subjects.length){
    // exact same source is allowed only when the catalog explicitly points to different taxa through a shared specimen.
    const unique=[...new Set(subjects)]
    if(unique.length>1) failures.push(`shared media source across taxa requires explicit review: ${src}`)
  }
}

for(const taxon of contentCatalog.taxa){
  const media=getMediaForTaxon(taxon)
  if(media.length===0) failures.push(`${String(taxon.id)}: no media records`)
  const defaultMedia=media.find(item=>String(item.id)===String(taxon.defaultMediaId))
  if(!defaultMedia) failures.push(`${String(taxon.id)}: defaultMediaId does not resolve`)
  if(defaultMedia?.publicationStatus==='retired'||defaultMedia?.publicationStatus==='legacy') failures.push(`${String(taxon.id)}: retired/legacy media cannot be default`)
  // A taxon whose only image is an honest schematic placeholder is allowed (it is reported as an incomplete record
  // by the completeness tier); any real photo/reconstruction used as the default must still carry the tree role.
  if(defaultMedia && defaultMedia.kind!=='context-schematic' && !defaultMedia.roles.includes('tree-thumbnail')) failures.push(`${String(taxon.id)}: default media should carry the tree-thumbnail role while the visual atlas still depends on it`)
}

if(failures.length) throw new Error(failures.map(item=>`FAIL ${item}`).join('\n'))
console.log(`Media quality audit passed: ${contentCatalog.taxa.length} taxa, ${contentCatalog.media.length} media assets, ${seenSrc.size} unique sources.`)
