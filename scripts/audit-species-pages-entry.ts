import {speciesPages} from '../content/species-pages'
import {taxa} from '../content'
import {publicationsById} from '../content/publications'
import {validateSpeciesPage} from '../infrastructure/validation/species-pages'

const context={
  taxonIds:new Set(taxa.map(taxon=>String(taxon.id))),
  publications:publicationsById,
  scientificNames:Object.fromEntries(taxa.map(taxon=>[String(taxon.id),taxon.taxonomy.scientificName])),
  now:new Date(),
}
let errors=0
let warnings=0
const entries=Object.entries(speciesPages)
for(const [key,page] of entries){
  if(page.taxonId!==key){ errors++; console.log(`ERROR ${key}: the page is registered under "${key}" but declares taxon "${page.taxonId}"`) }
  for(const issue of validateSpeciesPage(page,context)){
    if(issue.severity==='error') errors++; else warnings++
    console.log(`${issue.severity.toUpperCase()} ${issue.code} ${issue.path}: ${issue.message}`)
  }
}
console.log(`Species page audit ${errors?'FAILED':'passed'}: ${entries.length} page(s), ${errors} error(s), ${warnings} warning(s).`)
if(errors) process.exitCode=1
