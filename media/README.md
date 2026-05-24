# Media download scripts

This directory holds scripts for downloading and preparing NASA moon phase source material.

## Quick start

```bash
./download.sh
```

Downloads 5760×3240 TIF frames from NASA SVS 4310 into `media/frames/` (gitignored).

## What goes where

| Directory | Purpose |
|-----------|---------|
| `media/frames/` | Raw downloaded TIFs (gitignored) |
| `media/phases/` | Reference numbered images (`1.jpg` … `28.jpg`) — not used by the app build |
| `src/assets/phases/` | **App source assets** — 236 JPGs (`moon.0001.jpg` …) + WebM, verified and embedded at build |

After processing frames, copy them into `src/assets/phases/` and run:

```bash
npm run verify-images
npm run build
```

Full details: **[docs/assets/media-sources.md](../docs/assets/media-sources.md)**
