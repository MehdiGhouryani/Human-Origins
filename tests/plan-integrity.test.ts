import {describe,expect,it} from 'vitest'
import {existsSync,readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'

/**
 * Keeps docs/IMPLEMENTATION-PLAN.md alive and machine-readable for AI agents:
 * correct version, valid statuses, resolvable dependencies, no stale documents.
 */
const root=process.cwd()
const planPath=join(root,'docs/IMPLEMENTATION-PLAN.md')
const STATUSES=new Set(['TODO','IN-PROGRESS','DONE','BLOCKED-OWNER','NEEDS-REVIEW','OPTIONAL','DROPPED'])
const plan=readFileSync(planPath,'utf8')
const pkg=JSON.parse(readFileSync(join(root,'package.json'),'utf8')) as {version:string}

type Task={id:string;status:string;size:string;depends:string;hasAcceptance:boolean}
const tasks:Task[]=[]
const lines=plan.split('\n')
lines.forEach((line,index)=>{
  const match=/^#### (T\d+\.\d+) — /.exec(line)
  if(!match) return
  const block=lines.slice(index+1,index+12)
  const field=(name:string)=>block.find(item=>item.startsWith(`- **${name}:**`))?.replace(`- **${name}:**`,'').trim()??''
  tasks.push({id:match[1],status:field('Status'),size:field('Size'),depends:field('Depends'),hasAcceptance:block.some(item=>item.startsWith('- **Acceptance:**'))})
})
const board=new Map<string,string>()
for(const line of lines){
  const match=/^\| (P\d+) \| .* \| .* \| ([A-Z-]+) \|$/.exec(line)
  if(match) board.set(match[1],match[2])
}

describe('docs/IMPLEMENTATION-PLAN.md',()=>{
  it('exists and is the only plan; obsolete documents are gone',()=>{
    expect(existsSync(planPath)).toBe(true)
    expect(readdirSync(join(root,'docs')).sort()).toEqual(['ARCHITECTURE.md','IMPLEMENTATION-PLAN.md','mobile-qa','reference-ui.png'])
    expect(readFileSync(join(root,'README.md'),'utf8')).not.toMatch(/PHASED-PLAN|REVIEW-0\.29|CHANGES-0\.30/)
    expect(existsSync(join(root,'AGENTS.md'))).toBe(true)
  })

  it('declares the current package version in its snapshot',()=>{
    expect(/\*\*Snapshot version:\*\* (\S+)/.exec(plan)?.[1]).toBe(pkg.version)
  })

  it('has a status board with valid statuses for phases P0–P16',()=>{
    expect([...board.keys()]).toEqual(Array.from({length:17},(_,i)=>`P${i}`))
    for(const [phase,status] of board) expect(STATUSES.has(status),`${phase}: ${status}`).toBe(true)
  })

  it('gives every task a unique id, valid status, size and acceptance',()=>{
    expect(tasks.length).toBeGreaterThan(40)
    expect(new Set(tasks.map(task=>task.id)).size).toBe(tasks.length)
    for(const task of tasks){
      expect(STATUSES.has(task.status),`${task.id} status "${task.status}"`).toBe(true)
      expect(['S','M','L'],`${task.id} size`).toContain(task.size)
      expect(task.hasAcceptance,`${task.id} acceptance`).toBe(true)
    }
  })

  it('resolves every dependency to a known task or phase',()=>{
    const taskIds=new Set(tasks.map(task=>task.id))
    for(const task of tasks){
      for(const ref of task.depends.match(/T\d+\.\d+|P\d+/g)??[]){
        expect(taskIds.has(ref)||board.has(ref),`${task.id} depends on unknown ${ref}`).toBe(true)
      }
    }
  })

  it('never marks a task DONE before its dependencies, nor a phase DONE with open tasks',()=>{
    const status=new Map(tasks.map(task=>[task.id,task.status]))
    const finished=(value?:string)=>value==='DONE'||value==='DROPPED'
    for(const task of tasks.filter(item=>item.status==='DONE')){
      for(const ref of task.depends.match(/T\d+\.\d+/g)??[]) expect(finished(status.get(ref)),`${task.id} is DONE but ${ref} is not`).toBe(true)
    }
    for(const [phase,value] of board){
      if(value!=='DONE') continue
      const open=tasks.filter(task=>task.id.startsWith(`T${phase.slice(1)}.`)&&!finished(task.status)&&task.status!=='OPTIONAL')
      expect(open.map(task=>task.id),`${phase} is DONE with open tasks`).toEqual([])
    }
  })

  it('is the only strategy file: other documents hold no plan, status or TODO headings',()=>{
    const others=['README.md','AGENTS.md','docs/ARCHITECTURE.md',...readdirSync(join(root,'tools/images/prompts')).filter(name=>name.endsWith('.md')).map(name=>`tools/images/prompts/${name}`)]
    for(const file of others){
      const text=readFileSync(join(root,file),'utf8')
      expect(/^#{1,6}\s+(roadmap|to-?do|milestones?|phases?|status board|implementation plan)\b/im.test(text),`${file} has a plan-like heading`).toBe(false)
    }
  })

  it('keeps required sections',()=>{
    for(const heading of ['## 1. Update protocol','## 2. Snapshot','## 3. Decisions','## 4. Status board','## 5. Non-negotiable invariants','## 9. Completeness contract','## 9a. Species page specification','## 14. Changelog']){
      expect(plan.includes(heading),heading).toBe(true)
    }
  })
})
