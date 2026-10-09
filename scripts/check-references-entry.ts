import {publicationRecords} from '../content/publications'
import {compareWithCrossref,type CrossrefWork} from '../infrastructure/validation/crossref'

// Owner-run network check (not part of qa:release): resolves every publication DOI through Crossref and reports differences.
async function main(){
  const only=process.argv.slice(2).filter(arg=>!arg.startsWith('--'))
  const records=publicationRecords.filter(pub=>pub.doi&&(only.length===0||only.includes(String(pub.id))))
  let failures=0
  for(const pub of records){
    try{
      const response=await fetch(`https://api.crossref.org/works/${encodeURIComponent(pub.doi!)}`,{headers:{'User-Agent':'HumanOriginsAtlas/1.0 (reference check)'}})
      if(!response.ok){ failures++; console.log(`FAIL ${pub.id}: Crossref answered ${response.status} for ${pub.doi}`); continue }
      const work=((await response.json()) as {message:CrossrefWork}).message
      const problems=compareWithCrossref(pub,work)
      if(problems.length){ failures++; console.log(`FAIL ${pub.id}\n  - ${problems.join('\n  - ')}`) }
      else console.log(`ok   ${pub.id}`)
    }catch(error){ failures++; console.log(`FAIL ${pub.id}: ${(error as Error).message}`) }
  }
  console.log(`${records.length-failures}/${records.length} references consistent with Crossref.`)
  if(failures) process.exitCode=1
}
void main()
