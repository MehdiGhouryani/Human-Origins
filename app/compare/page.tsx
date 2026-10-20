import {redirect} from 'next/navigation'

// The comparison is a mode of the explorer now. Old links keep working and land on the same selection.
export const dynamic='force-dynamic'

export default async function ComparePage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const params=await searchParams
  const cmp=typeof params.cmp==='string'?params.cmp:''
  redirect(`/?mode=compare${cmp?`&cmp=${encodeURIComponent(cmp)}`:''}`)
}
