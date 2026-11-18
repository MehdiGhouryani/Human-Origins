/**
 * 0.32.0 → 0.33.0: retire the unused single-size hero asset.
 *
 * The public Hero component now uses three viewport-specific files:
 * hero-mobile.webp, hero-tablet.webp and hero-desktop.webp. The old
 * hero-evolution.webp is not referenced by the component, stylesheet,
 * preload logic or build manifest, so it is removed from the deployable tree.
 *
 * Its digest and size are retained here as an append-only recovery record.
 */
export type RetiredV32Asset={path:string;sha256:string;bytes:number;reason:string}
export const v32ToV33RetiredAssets:readonly RetiredV32Asset[]=[
  {
    path:"/assets/hero-evolution.webp",
    sha256:"6830afdca25f921614c94126ad98ffedc92479755f1bf26dca3e77dae9b8aa55",
    bytes:68230,
    reason:"Retired unused single-size hero; replaced by viewport-specific hero-mobile.webp, hero-tablet.webp and hero-desktop.webp.",
  },
]
