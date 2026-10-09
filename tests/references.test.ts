import {describe,expect,it} from 'vitest'
import {citationParts,formatCitation,isCitable,isIsoDate,isRecent} from '../domain/references'
import {compareWithCrossref} from '../infrastructure/validation/crossref'
import {publicationRecords,publicationsById} from '../content/publications'
import {validateCatalog} from '../infrastructure/validation/audit'
import {contentCatalog} from '../content/catalog'
import type {PublicationRecord} from '../domain/research-model'

const seeds=['pub-shoaee-2021','pub-vahdati-nasab-2019','pub-shoaee-2023','pub-shoaee-2024']
const withPublication=(pub:PublicationRecord)=>({...contentCatalog,publications:[...contentCatalog.publications.filter(item=>item.id!==pub.id),pub]})

describe('reference registry',()=>{
  it('contains the four verified Iranian Plateau papers with DOIs, kinds and verification',()=>{
    for(const id of seeds){
      const pub=publicationsById[id]
      expect(pub,id).toBeDefined()
      expect(isCitable(pub),id).toBe(true)
      expect(pub.doi,id).toMatch(/^10\.\d{4,9}\/\S+$/)
      expect(pub.identifiers.some(identifier=>identifier.scheme==='doi'&&identifier.value===pub.doi),id).toBe(true)
    }
    expect(publicationsById['pub-shoaee-2021'].kind).toBe('review')
    expect(publicationsById['pub-shoaee-2024'].doi).toBe('10.3389/feart.2024.1352099')
    expect(publicationsById['pub-vahdati-nasab-2019'].pages).toBe('465–478')
  })

  it('contains the three verified papers of the Sahelanthropus bipedalism exchange (2022, 2024, 2026)',()=>{
    const ids=['pub-daver-2022','pub-cazenave-2024','pub-williams-2026']
    for(const id of ids){ expect(isCitable(publicationsById[id]),id).toBe(true); expect(publicationsById[id].kind,id).toBe('primary') }
    expect(publicationsById['pub-daver-2022'].doi).toBe('10.1038/s41586-022-04901-z')
    expect(publicationsById['pub-cazenave-2024'].doi).toBe('10.1016/j.jhevol.2024.103557')
    expect(publicationsById['pub-williams-2026'].doi).toBe('10.1126/sciadv.adv0130')
    expect(publicationsById['pub-williams-2026'].pages).toBeUndefined() // page range not confirmed; not recorded
    expect(ids.map(id=>publicationsById[id].year)).toEqual([2022,2024,2026])
  })

  it('has unique publication ids and never marks a record verified without a method',()=>{
    expect(new Set(publicationRecords.map(pub=>String(pub.id))).size).toBe(publicationRecords.length)
    for(const pub of publicationRecords){
      expect(!!pub.verifiedOn,String(pub.id)).toBe(!!pub.verification)
      if(pub.verifiedOn) expect(isIsoDate(pub.verifiedOn),String(pub.id)).toBe(true)
    }
  })

  it('passes the release audit with the new records (no errors)',()=>{
    expect(validateCatalog(contentCatalog).errors).toBe(0)
  })
})

describe('reference audit rules',()=>{
  const base=publicationsById['pub-shoaee-2023']
  const codes=(pub:PublicationRecord)=>validateCatalog(withPublication(pub)).issues.filter(item=>item.path.startsWith(`publications.${String(pub.id)}`)).map(item=>item.code)

  it('rejects a verified reference without a method, and a method without a date',()=>{
    expect(codes({...base,verification:undefined})).toContain('REFERENCE_VERIFICATION_MISSING')
    expect(codes({...base,verifiedOn:undefined})).toContain('REFERENCE_VERIFIED_ON_MISSING')
  })
  it('rejects invalid dates, kinds and methods',()=>{
    expect(codes({...base,verifiedOn:'2026-02-31'})).toContain('INVALID_VERIFIED_ON')
    expect(codes({...base,verifiedOn:'06/10/2026'})).toContain('INVALID_VERIFIED_ON')
    expect(codes({...base,kind:'blog' as never})).toContain('INVALID_REFERENCE_KIND')
    expect(codes({...base,verification:'trust-me' as never})).toContain('INVALID_REFERENCE_VERIFICATION')
  })
  it('requires a DOI for primary and review journal articles, and for doi-resolved verification',()=>{
    const noDoi={...base,doi:undefined,identifiers:[]}
    expect(codes(noDoi)).toContain('REFERENCE_WITHOUT_DOI')
    expect(codes({...noDoi,verification:'doi-resolved'})).toContain('DOI_VERIFICATION_WITHOUT_DOI')
  })
  it('only warns about a reference that has a kind but was never verified',()=>{
    const report=validateCatalog(withPublication({...base,verifiedOn:undefined,verification:undefined}))
    const item=report.issues.find(entry=>entry.code==='REFERENCE_NOT_VERIFIED')
    expect(item?.severity).toBe('warning')
  })
})

describe('citation helpers',()=>{
  it('formats a record with structured fields',()=>{
    const pub=publicationsById['pub-vahdati-nasab-2019']
    const parts=citationParts(pub)
    expect(parts.locator).toBe('18(4): 465–478')
    expect(parts.href).toBe('https://doi.org/10.1016/j.crpv.2019.02.005')
    expect(formatCitation(pub)).toBe('Hamed Vahdati Nasab et al. (2019). The open-air Paleolithic site of Mirak, northern edge of the Iranian Central Desert (Semnan, Iran): Evidence of repeated human occupations during the late Pleistocene. Comptes Rendus Palevol 18(4): 465–478. doi:10.1016/j.crpv.2019.02.005')
  })
  it('keeps older records that carry volume and pages inside the journal string',()=>{
    const old=publicationsById['pub-hublin-2017']
    expect(citationParts(old).locator).toBe('')
    expect(formatCitation(old)).toContain('Nature 546, 289–292')
  })
  it('falls back to the URL when there is no DOI',()=>{
    const pub:PublicationRecord={...publicationsById['pub-shoaee-2023'],doi:undefined,url:'https://example.org/paper'}
    expect(citationParts(pub).href).toBe('https://example.org/paper')
    expect(formatCitation(pub)).not.toContain('doi:')
  })
  it('tells recent references from old ones',()=>{
    const now=new Date(Date.UTC(2026,9,6))
    expect(isRecent({year:2019},8,now)).toBe(true)
    expect(isRecent({year:2018},8,now)).toBe(true)
    expect(isRecent({year:2017},8,now)).toBe(false)
    expect(isRecent({year:undefined},8,now)).toBe(false)
  })
})

describe('Crossref comparison (offline)',()=>{
  const pub=publicationsById['pub-shoaee-2021']
  const good={DOI:'10.1016/J.JAA.2021.101292',title:['The Paleolithic of the Iranian Plateau: Hominin occupation history and implications for human dispersals across southern Asia'],'container-title':['Journal of Anthropological Archaeology'],author:[{given:'Mohammad Javad',family:'Shoaee'}],issued:{'date-parts':[[2021,6]]},volume:'62'}
  it('accepts matching metadata, ignoring case, markup and accents',()=>{
    expect(compareWithCrossref(pub,good)).toEqual([])
    expect(compareWithCrossref(pub,{...good,title:['The <i>Paleolithic</i> of the Iranian Plateau: Hominin occupation history and implications for human dispersals across southern Asia']})).toEqual([])
  })
  it('reports each kind of mismatch',()=>{
    expect(compareWithCrossref(pub,{...good,title:['Something else']})[0]).toMatch(/Title differs/)
    expect(compareWithCrossref(pub,{...good,issued:{'date-parts':[[2020]]}})[0]).toMatch(/Year differs/)
    expect(compareWithCrossref(pub,{...good,'container-title':['Nature']})[0]).toMatch(/Journal differs/)
    expect(compareWithCrossref(pub,{...good,author:[{family:'Smith'}]})[0]).toMatch(/First author/)
    expect(compareWithCrossref(pub,{...good,volume:'63'})[0]).toMatch(/Volume differs/)
    expect(compareWithCrossref(pub,{...good,DOI:'10.1016/other'})[0]).toMatch(/DOI differs/)
    expect(compareWithCrossref(pub,{})).toContain('Crossref returned no title')
  })
})
