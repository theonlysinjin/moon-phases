# Moon images

How phase images are stored, mapped, verified, and loaded at runtime.

## Overview

The app uses **236** NASA-derived moon phase JPGs (`moon.0001.jpg` … `moon.0236.jpg`) plus a lunar-cycle WebM for the Hourly Timeline theme.

- **Source (build verification):** `src/assets/phases/`
- **Runtime (served):** `public/phases/`
- **Attribution:** [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/4310/)

See [Media sources](./media-sources.md) for downloading and preparing frames.

## Frame mapping

Moon age (days since new moon) selects the image:

```ts
const nearestFrame = Math.round(moon_age_days * 8) + 1; // clamped to 1..236
```

Implemented in `src/utils/moonPhaseImageLoader.ts`. Rendered with optional rotation in `src/utils/getMoonPhaseVisual.tsx` using `entry.rotation_angle`.

## Pipeline components

| Piece | File | Role |
|-------|------|------|
| Image loader | `src/utils/moonPhaseImageLoader.ts` | Age → frame → path |
| Visual helper | `src/utils/getMoonPhaseVisual.tsx` | React `<Image>` + rotation |
| Preloader | `src/components/MoonPhaseImagePreloader.tsx` | Warm cache on app init |
| Build verify | `scripts/verify-moon-images.js` | Fail build if frames missing |
| Inline video | `scripts/generate-inline-phases.js` | Data URI for static Hourly Timeline |
| Prune | `scripts/prune-unneeded-phases.js` | Remove unused frames |

## Build integration

```bash
npm run verify-images          # manual check
npm run build                  # verify → inline phases → next build
```

`next.config.ts` sets `images.unoptimized: true` for static export and adds webpack rules for JPG/WebM assets.

## Approximate sizes

| Asset | Size (approx.) |
|-------|----------------|
| 236 JPG frames | ~19 MB total (~82 KB each) |
| Lunar cycle WebM | ~0.85 MB |

## Troubleshooting

**Verification fails**

1. Confirm all 236 files exist under `src/assets/phases/`
2. Check naming: `moon.0001.jpg` … `moon.0236.jpg`
3. Ensure files are non-empty

**Slow loads**

1. Preloader should run on first paint — check network tab
2. Static export bundles paths under `public/phases/` — confirm `basePath` in CI if on GitHub Pages

## Future improvements

- WebP / compression
- Progressive loading for very large ranges
- CDN for global distribution

Moved from root `MOON_IMAGE_OPTIMIZATION.md`; details may drift from code — prefer source files when in doubt.
