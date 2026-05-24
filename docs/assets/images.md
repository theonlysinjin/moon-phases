# Moon images

How phase images are stored, mapped, verified, and loaded at runtime.

## Overview

The app uses **236** NASA-derived moon phase JPGs (`moon.0001.jpg` … `moon.0236.jpg`) as the source set, plus a lunar-cycle WebM for the Hourly Timeline theme.

| Stage | Location | Role |
|-------|----------|------|
| **Source (build input)** | `src/assets/phases/` | 236 JPGs + `moon_720p30.webm`; verified at build |
| **Runtime (bundled)** | `src/assets/phases.inline.ts` | 30 daily frame data URIs + video data URI (generated) |

There is no `public/phases/` directory — static export embeds images as data URIs so the app works on GitHub Pages without extra asset fetches.

- **Attribution:** [NASA Scientific Visualization Studio](https://svs.gsfc.nasa.gov/4310/)

See [Media sources](./media-sources.md) for downloading and preparing frames.

## Frame mapping

Build time selects 30 frames from the 236-frame set (every 8th frame, days 0–29):

```ts
// scripts/generate-inline-phases.js
const dailyIndices = Array.from({ length: 30 }, (_, d) => 1 + d * 8);
```

Runtime maps moon age to one of those 30 frames:

```ts
// src/utils/moonPhaseImageLoader.ts
const index = Math.min(29, Math.max(0, Math.round(moon_age_days)));
return MOON_PHASE_DATA_URIS[index];
```

Poster/CLI tools that reference the full 236-frame set use `fullSetFrame()` in `src/utils/moonFrameMapping.ts`:

```ts
return 1 + dailyFrameIndex(moonAgeDays) * 8; // clamped 1..233
```

Rendered with optional rotation in `src/utils/getMoonPhaseVisual.tsx` using `entry.rotation_angle`.

## Pipeline components

| Piece | File | Role |
|-------|------|------|
| Image loader | `src/utils/moonPhaseImageLoader.ts` | Age → inline data URI |
| Frame mapping | `src/utils/moonFrameMapping.ts` | Age → daily index / full-set frame |
| Visual helper | `src/utils/getMoonPhaseVisual.tsx` | React `<Image>` + rotation |
| Preloader | `src/components/MoonPhaseImagePreloader.tsx` | No-op with inline URIs |
| Build verify | `scripts/verify-moon-images.js` | Fail build if frames missing |
| Inline embed | `scripts/generate-inline-phases.js` | Data URIs for static export |
| Prune | `scripts/prune-unneeded-phases.js` | Remove unused frames |

## Build integration

```bash
npm run verify-images          # manual check
npm run build                  # verify → inline phases → next build
```

`next.config.ts` sets `images.unoptimized: true` for static export.

## Approximate sizes

| Asset | Size (approx.) |
|-------|----------------|
| 236 JPG frames (source) | ~19 MB total (~82 KB each) |
| 30 inline JPG data URIs | ~4.5 MB in `phases.inline.ts` |
| Lunar cycle WebM (inline) | ~0.85 MB |

## Troubleshooting

**Verification fails**

1. Confirm all 236 files exist under `src/assets/phases/`
2. Check naming: `moon.0001.jpg` … `moon.0236.jpg`
3. Ensure files are non-empty

**Slow loads**

1. First load parses the large `phases.inline.ts` bundle — this is expected for static hosting
2. Confirm `basePath` / `assetPrefix` env vars in CI if deploying to GitHub Pages subpaths

## Future improvements

- WebP / compression
- Progressive loading for very large ranges
- CDN for global distribution
