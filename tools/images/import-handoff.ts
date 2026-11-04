// Imports an image hand-off package into the CMS as DRAFTS, through the same code the admin upload uses.
//
//   npx tsx --conditions=react-server tools/images/import-handoff.ts <package-dir> --dry-run
//   npx tsx --conditions=react-server tools/images/import-handoff.ts <package-dir> --db .cms-data/cms.sqlite --media .cms-data/media \
//       --generator-name "<tool that made the images>" --generator-date 2026-10-20
//
// What it never does: approve a review, publish a row, or invent who made the images. Class-D reconstructions go live only
// after a reviewer approves them in the admin; until then the site keeps showing its placeholders.
import {createHash,randomBytes} from 'node:crypto'
import {existsSync,readFileSync,writeFileSync} from 'node:fs'
import {dirname,join,resolve} from 'node:path'
import sharp from 'sharp'
import {CAPTION_NOTE,altTextFor,buildAssumptions,isDefaultPortraitSlot,needsCrop,parseBriefs,parseChecksums,parseInventory} from './handoff'

type Args={dir:string;dryRun:boolean;db?:string;media?:string;generatorName?:string;generatorDate?:string;generatorVersion?:string;credit:string;report?:string;only?:Set<string>}

function parseArgs(argv:string[]):Args{
  const args:Args={dir:'',dryRun:false,credit:'Human Origins illustration (AI-assisted)'}
  for(let index=0;index<argv.length;index++){
    const arg=argv[index]
    const next=()=>argv[++index]
    if(arg==='--dry-run') args.dryRun=true
    else if(arg==='--db') args.db=next()
    else if(arg==='--media') args.media=next()
    else if(arg==='--generator-name') args.generatorName=next()
    else if(arg==='--generator-date') args.generatorDate=next()
    else if(arg==='--generator-version') args.generatorVersion=next()
    else if(arg==='--credit') args.credit=next()
    else if(arg==='--report') args.report=next()
    else if(arg==='--only') args.only=new Set(next().split(',').map(item=>item.trim()).filter(Boolean))
    else if(!arg.startsWith('--')&&!args.dir) args.dir=arg
    else throw new Error(`Unknown argument: ${arg}`)
  }
  if(!args.dir) throw new Error('Usage: import-handoff.ts <package-dir> [--dry-run] [--db file --media dir --generator-name name --generator-date YYYY-MM-DD]')
  return args
}

const findRoot=(dir:string)=>[dir,join(dir,'Human-Origins')].find(candidate=>existsSync(join(candidate,'HANDOFF.md')))

type Outcome={slotId:string;action:'import'|'skip'|'error';reason:string;warnings:string[];sha256?:string;note:string;mediaId?:string}

async function main(){
  const args=parseArgs(process.argv.slice(2))
  const root=findRoot(resolve(args.dir))
  if(!root) throw new Error(`HANDOFF.md not found in ${args.dir}`)
  if(!args.dryRun){
    if(!args.db||!args.media) throw new Error('Importing needs --db and --media (use --dry-run to only check).')
    if(!args.generatorName||!args.generatorDate) throw new Error('Importing needs --generator-name and --generator-date: the hand-off does not record which tool made the images, and this tool will not guess.')
    process.env.CMS_DB_PATH=resolve(args.db)
    process.env.CMS_MEDIA_DIR=resolve(args.media)
  }
  const handoff=readFileSync(join(root,'HANDOFF.md'),'utf8')
  const reference=readFileSync(join(root,'REFERENCE.md'),'utf8')
  const rows=parseInventory(handoff)
  const checksums=parseChecksums(handoff)
  const briefs=parseBriefs(reference)

  const {MEDIA_SLOTS}=await import('../../content/media-slots.generated')
  const {findSlot,isSlotOpen,slotAspect}=await import('../../domain/media-slots')
  const {contentCatalog}=await import('../../content/catalog')
  const catalogRows=JSON.parse(readFileSync(join(dirname(new URL(import.meta.url).pathname),'catalog.json'),'utf8')) as {code:string;specimenRef?:string}[]
  const specimenOf=new Map(catalogRows.map(row=>[row.code,(row.specimenRef??'').trim()]))
  const store=args.dryRun?null:await import('../../infrastructure/cms/store')
  const assets=args.dryRun?null:await import('../../infrastructure/cms/assets')
  const input=args.dryRun?null:await import('../../infrastructure/cms/mediaInput')
  const occupied=new Set((store?.listMedia()??[]).map(item=>String(item.slotId??'')).filter(Boolean))

  const outcomes:Outcome[]=[]
  for(const row of rows){
    const outcome:Outcome={slotId:row.state==='alternate'?`${row.slotId} (alt)`:row.slotId,action:'skip',reason:'',warnings:[],note:row.note}
    outcomes.push(outcome)
    if(args.only&&!args.only.has(row.slotId)){outcome.reason='not selected (--only)';continue}
    if(row.state!=='import'){outcome.reason=`hand-off marks it ${row.state}`;continue}
    const slot=findSlot(MEDIA_SLOTS,row.slotId)
    if(!slot){outcome.reason='slot is not in the catalog';continue}
    if(!isSlotOpen(slot)){outcome.reason=`slot is closed: ${slot.holdReason||slot.notApplicableReason}`;continue}
    if(slot.evidenceClass!=='D'){outcome.reason=`class ${slot.evidenceClass} slots are not reconstructions`;continue}
    const file=join(root,row.path)
    if(!existsSync(file)){outcome.action='error';outcome.reason='file is missing';continue}
    const bytes=readFileSync(file)
    outcome.sha256=createHash('sha256').update(bytes).digest('hex')
    const expected=checksums.get(row.slotId)
    if(expected&&expected.sha256!==outcome.sha256){outcome.action='error';outcome.reason='SHA-256 differs from the hand-off table (file changed or damaged)';continue}
    if(!expected) outcome.warnings.push('no checksum in the hand-off table')
    const meta=await sharp(bytes).metadata()
    if(!meta.width||!meta.height){outcome.action='error';outcome.reason='not a readable image';continue}
    if(row.width&&row.height&&(meta.width!==row.width||meta.height!==row.height)) outcome.warnings.push(`size ${meta.width}x${meta.height} differs from the table (${row.width}x${row.height})`)
    const aspect=slotAspect(slot)
    if(aspect&&needsCrop(meta.width,meta.height,aspect)) outcome.warnings.push(`will be cropped to ${slot.ratio} (source ratio ${(meta.width/meta.height).toFixed(3)})`)
    if(slot.width&&meta.width<slot.width*0.9) outcome.warnings.push(`narrower than the slot target (${slot.width}px)`)
    const brief=briefs.get(row.slotId)
    if(!brief){outcome.action='error';outcome.reason='no prompt block in REFERENCE.md, so no assumptions sheet can be built';continue}
    if(occupied.has(row.slotId)){outcome.reason='the CMS already has a row for this slot';continue}

    const taxon=contentCatalog.taxa.find(item=>String(item.id)===row.taxonId)
    const name=taxon?.name??row.taxonId
    // The hand-off has no source URL, and the audit requires one for an image that still needs review. Use the taxon's
    // own catalogued source: the URL comes from content/sources, never from this script or from memory.
    const linked=(taxon?.sourceIds??[]).map(id=>contentCatalog.sources.find(source=>String(source.id)===String(id))).find(source=>source&&source.url)
    if(!linked){outcome.action='error';outcome.reason=`taxon ${row.taxonId} has no catalogued source with a URL`;continue}
    const specimenRef=specimenOf.get(row.slotId)??''
    outcome.action='import'
    outcome.reason=args.dryRun?'would import as a draft':'imported as a draft'
    if(args.dryRun||!store||!assets||!input) continue

    const generator=input.parseGenerator(JSON.stringify({name:args.generatorName,date:args.generatorDate,...(args.generatorVersion?{version:args.generatorVersion}:{})}))
    const id=`cms-media-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`
    try{
      const processed=await assets.processUploadedImage(id,bytes,{aspect})
      store.createMedia({
        id,subjectId:row.taxonId,roles:[slot.role],kind:slot.kind,filePath:`/cms-media/${id}`,width:processed.width,height:processed.height,variants:processed.variants,
        credit:args.credit,license:null,sourceUrl:linked.url!,linkedSourceId:String(linked.id),note:CAPTION_NOTE,alt:altTextFor(row.code,name,specimenRef),
        publicationStatus:'review-required',rightsStatus:'unknown',isDefault:isDefaultPortraitSlot(row.code),
        slotId:row.slotId,evidenceClass:'D',specimenRef,assumptions:buildAssumptions(brief),generator,review:null,
      })
      occupied.add(row.slotId)
      outcome.mediaId=id
    }catch(error){
      assets.deleteProcessedImage(id)
      outcome.action='error';outcome.reason=error instanceof Error?error.message:String(error)
    }
  }

  const pad=(text:string,width:number)=>text.length>=width?text.slice(0,width):text+' '.repeat(width-text.length)
  console.log(`${args.dryRun?'DRY RUN. ':''}Package: ${root}\n`)
  for(const item of outcomes) console.log(`${pad(item.action.toUpperCase(),7)} ${pad(item.slotId,26)} ${item.reason}${item.warnings.length?`  [${item.warnings.join('; ')}]`:''}`)
  const count=(action:Outcome['action'])=>outcomes.filter(item=>item.action===action).length
  console.log(`\n${count('import')} ${args.dryRun?'importable':'imported'}, ${count('skip')} skipped, ${count('error')} errors`)
  if(args.report) writeFileSync(resolve(args.report),JSON.stringify(outcomes,null,2))
  if(count('error')>0) process.exitCode=1
}

main().catch(error=>{console.error(error instanceof Error?error.message:error);process.exit(1)})
