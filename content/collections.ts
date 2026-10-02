import type {CollectionRecord} from '../domain/contracts'

/** No canonical collection-level identifiers have been entered yet; keep the entity explicit so specimens can be linked without inventing collection metadata. */
export const collectionRecords:readonly CollectionRecord[]=[]
export const collectionsById:Record<string,CollectionRecord>={}
