import {validateCatalog} from '../infrastructure/validation/audit'
const report=validateCatalog()
for(const [key,value] of Object.entries(report.summary)) console.log(`${key}: ${value}`)
for(const item of report.issues) console.log(`${item.severity.toUpperCase()} ${item.code} ${item.path} — ${item.message}`)
console.log(`RESULT errors=${report.errors} warnings=${report.warnings}`)
if(!report.ok) throw new Error(`Data audit failed with ${report.errors} errors.`)
