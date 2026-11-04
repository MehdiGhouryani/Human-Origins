export type Pin={id:string;x:number;y:number;/** Never merged into a cluster (e.g. the selected site). */sticky?:boolean}
export type Cluster={id:string;x:number;y:number;ids:string[]}

type Working={x:number;y:number;ids:string[];sticky:boolean}

/**
 * Greedy screen-space clustering. Deterministic (sorted by id), O(n^2), fine for a few hundred pins.
 * A pin closer than `radius` px to a cluster's centroid joins it; sticky pins always stay alone.
 */
export function clusterPins(pins:readonly Pin[],radius:number):Cluster[]{
  const sorted=[...pins].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)
  const working:Working[]=[]
  for(const pin of sorted){
    const target=pin.sticky?undefined:working.find(cluster=>!cluster.sticky&&Math.hypot(cluster.x-pin.x,cluster.y-pin.y)<radius)
    if(target){
      const count=target.ids.length
      target.x=(target.x*count+pin.x)/(count+1)
      target.y=(target.y*count+pin.y)/(count+1)
      target.ids.push(pin.id)
    }else working.push({x:pin.x,y:pin.y,ids:[pin.id],sticky:Boolean(pin.sticky)})
  }
  return working.map(cluster=>({id:cluster.ids.length===1?cluster.ids[0]:`cluster:${cluster.ids.join('+')}`,x:cluster.x,y:cluster.y,ids:cluster.ids}))
}
