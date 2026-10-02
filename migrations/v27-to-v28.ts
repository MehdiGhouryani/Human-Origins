/**
 * 0.27-dev → 0.28.0: curated tree (26 → 18 taxa).
 * Removed taxa: kadabba, platyops, garhi, aethiopicus, sediba, rudolfensis, antecessor, luzonensis
 * (with their exclusive specimens, evidence, claims, sites, sources, publications and schematic media).
 * Relationship IDs are now explicit in content/relationships.ts. Retired IDs below must never be reused.
 */
export const v27ToV28RetiredRelationshipIds=['rel-kadabba-ardipithecus-3','rel-aethiopicus-boisei-6','rel-common-kadabba-15','rel-anamensis-platyops-17','rel-afarensis-aethiopicus-18','rel-afarensis-garhi-19','rel-africanus-sediba-20','rel-afarensis-rudolfensis-21','rel-erectus-antecessor-22','rel-erectus-luzonensis-25','rel-common-ardipithecus-3','rel-ardipithecus-afarensis-4','rel-afarensis-boisei-6','rel-ardipithecus-boisei-6','rel-boisei-robustus-7','rel-ardipithecus-habilis-8'] as const
export const v27ToV28NewRelationshipIds=['rel-common-ardipithecus-29','rel-afarensis-boisei-30'] as const
