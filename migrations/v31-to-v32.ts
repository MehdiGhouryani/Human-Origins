/**
 * 0.31.0 → 0.32.0: one descent parent per taxon, and retirement of quarantined legacy files.
 *
 * Relationships
 * -------------
 * 0.31 added the chronological chain Sahelanthropus → Orrorin → Ardipithecus for the 11-species main path, but kept
 * the older edges that drew Orrorin and Ardipithecus straight from the inferred common-ancestor node. Each of those two
 * taxa therefore had two descent parents, which the tree layout resolved by picking the OLDEST one (the inferred node)
 * and the relationship-id contract test rejected. Both retired edges were "possible / debated" and carried no
 * evidence beyond the generic species index; the chain that replaces them is equally "possible / debated" and is
 * documented in its own notes. Nothing about direct ancestry is claimed either way.
 *
 * Retired ids below must never be reused (append-only identity).
 *
 * Legacy files
 * ------------
 * The V21 plates and the V22 media manifest were quarantined under public/assets/legacy and public/assets, where they
 * were still publicly downloadable although no catalog record, component or stylesheet referenced them. They are
 * removed from the deployable tree. Each file is listed with its SHA-256 so it can be recovered byte-for-byte from the
 * 0.31.0 release archive if a provenance review ever needs it. This is the disposition record the migration policy
 * requires ("never delete legacy content without a disposition record").
 */
export const v31ToV32RetiredRelationshipIds=['rel-common-orrin-2','rel-common-ardipithecus-29'] as const

export type RetiredAsset={path:string;sha256:string;bytes:number;reason:string}
export const v31ToV32RetiredAssets:readonly RetiredAsset[]=[
  {path:"/assets/legacy/v21-plates/afarensis.webp",sha256:'1ebd927036960fcf8009076967eb61e00217cc782f86dcbcf6f96c1da30b2705',bytes:18842,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/africanus.webp",sha256:'68ce1e5ef3f49a5d2843c0c65011b26bc35935917cf049ae65106da4b3dc12fe',bytes:17866,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/ardipithecus.webp",sha256:'a8ea824e451f07989ef45ce29f13e88439465d6a6c2a6909b4768a8b2c36f6a3',bytes:16610,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/boisei.webp",sha256:'adfcc2de91888ddc6b056271fb3aec6e931b4e84b085bec153122b387cc39526',bytes:17452,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/common.webp",sha256:'6c38fa337f117d2e0a4fb9ac9472ca0c288beed55d49463dde1d90aa152d5c9a',bytes:19470,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/erectus.webp",sha256:'6e355d3b240f74a7d69957019bd96b477b4bab6b6bbf36b740bf90a607054835',bytes:14790,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/ergaster.webp",sha256:'496be12e00db24de36b29a7da98007bcee9395e85cb9334f65bdab9923d3a66f',bytes:16418,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/habilis.webp",sha256:'fce84e4b9250e1c1f545a411364ec036ea6c04b505ec8dc78671e993820ad591',bytes:13994,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/heidelbergensis.webp",sha256:'8c667490b143def3f8acb511a8c8081d3f15ec8891f43d048f0ead78b3295959',bytes:16966,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/orrin.webp",sha256:'2634e0f60385c8483a798bbc856e2b391a8f6fcf6a2dec8faa0857e0780a23cd',bytes:17264,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/robustus.webp",sha256:'cf665c55b239b075efd47fc595907cb79594ed80f3209b6ab39b632d6eb0ee6f',bytes:17192,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/sahelanthropus.webp",sha256:'af6d448ba7293c2c69100cfcd7f00a47a3c9157833a030657147f79bcd6449c1',bytes:18634,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21-plates/sapiens.webp",sha256:'9391d05f84ac170d8ca8cba993925368391157eeaba07bf209e405b365e88c05',bytes:15668,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/legacy/v21/media-manifest-v21.json",sha256:'d511af0f4a16b264201c31485b660d0a95d1e59c2730d30ecef3174f45a69e08',bytes:1774,reason:"Quarantined V21 material; never referenced by the catalog since 0.23."},
  {path:"/assets/media-manifest-v22.json",sha256:'96c5d418f35ae71b610f5ebaf01c68838b3e17af97b710d501c734fda2b2b8cc',bytes:6449,reason:"V22.7 manifest describing Wikimedia hotlinks that 0.30 replaced with self-hosted samples."},
  {path:"/assets/neanderthal-768.webp",sha256:'7a1d1dee65a0ec01bc577d60dff46f570eb7d1f9a58fb63a4cb340c3c6887b39',bytes:46014,reason:"Pre-0.30 Neanderthal reconstruction; replaced by the self-hosted sample plate and the CMS."},
  {path:"/assets/neanderthal.webp",sha256:'bbc70dda31ef183807399de2d87b064d4ef83a566d3b3f987660776a59f609b6',bytes:62084,reason:"Pre-0.30 Neanderthal reconstruction; replaced by the self-hosted sample plate and the CMS."},
  {path:"/assets/species/anamensis-schematic.svg",sha256:'45f86297e74a6c5543020c1ba3d427fff972d8f4d8327dbc4927e005896e897d',bytes:1247,reason:"Pre-0.30 schematic; replaced by the self-hosted sample plates."},
  {path:"/assets/species/common-context.svg",sha256:'2aa28f4fe15eeb4e34ec80ea750b958a42bc42993ea8b6acc1d3204bf93aac3f',bytes:1454,reason:"Pre-0.30 common-ancestor schematic; replaced by the self-hosted sample plate."},
  {path:"/assets/species/denisovan-schematic.svg",sha256:'f1e45b29a382e3de6e08e4a985ab6f5cec390909cd23f7ec8642a75392a6384b',bytes:1240,reason:"Pre-0.30 schematic; replaced by the self-hosted sample plates."},
  {path:"/assets/species/floresiensis-schematic.svg",sha256:'996648c3b138e16a80d78e00dfe93d835ca58b79e090ee8c0934930c5b7f5eea',bytes:1238,reason:"Pre-0.30 schematic; replaced by the self-hosted sample plates."},
  {path:"/assets/species/naledi-schematic.svg",sha256:'498d89ef47b9140d61373d1743cae5b57233fbce7e4f6d23e37d9d58b6ac5cfc',bytes:1217,reason:"Pre-0.30 schematic; replaced by the self-hosted sample plates."},
]
