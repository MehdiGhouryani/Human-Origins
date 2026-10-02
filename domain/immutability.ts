/** Runtime immutability helper for canonical data snapshots. */
export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T extends object
      ? {readonly [K in keyof T]: DeepReadonly<T[K]>}
      : T

export function deepFreeze<T>(value: T): T {
  if(value===null || typeof value!=='object' || Object.isFrozen(value)) return value
  const target=value as object
  Reflect.ownKeys(target).forEach(key=>{
    const child=(target as Record<PropertyKey, unknown>)[key]
    if(child!==null && typeof child==='object') deepFreeze(child)
  })
  return Object.freeze(value)
}
