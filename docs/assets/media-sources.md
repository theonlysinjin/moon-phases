# Media sources

How to obtain and prepare moon phase media from NASA.

## Two asset locations

| Directory | Contents | Used by |
|-----------|----------|---------|
| `src/assets/phases/` | 236 NASA frames (`moon.0001.jpg` …) + `moon_720p30.webm` | **App build** — verified and embedded at build time |
| `media/phases/` | Numbered reference images (`1.jpg` … `28.jpg`) + `image.py` | **Reference only** — not wired into the Next.js build |

The app runtime reads from build-generated `src/assets/phases.inline.ts`, not from either directory directly.

## Download NASA frames

Frames come from [NASA SVS 4310](https://svs.gsfc.nasa.gov/4310/).

From the repo:

```bash
cd media
./download.sh
```

This downloads 5760×3240 TIFs into `media/frames/` (gitignored). You then need to convert, crop, and copy the processed JPGs into `src/assets/phases/` with NASA naming (`moon.0001.jpg` … `moon.0236.jpg`).

Scripts in `media/`:

| File | Purpose |
|------|---------|
| `download.sh` | Fetch TIF frames from NASA |
| `phases/image.py` | Batch JPG → PNG conversion for reference assets |

Additional processing scripts live under `scripts/`:

| Script | Purpose |
|--------|---------|
| `round-moon-frame.js` | Crop/round individual frames |
| `verify-moon-images.js` | Verify the 236-frame set before build |
| `generate-inline-phases.js` | Embed 30 daily frames + video into TypeScript |

## Expected build layout

```
src/assets/phases/
  moon.0001.jpg … moon.0236.jpg
  moon_720p30.webm          # Hourly Timeline video

src/assets/phases.inline.ts   # generated — do not edit
  MOON_PHASE_DATA_URIS[]      # 30 daily frame data URIs
  MOON_VIDEO_DATA_URI         # embedded WebM
```

After adding or updating source files:

```bash
npm run verify-images
npm run generate-inline-phases   # or npm run build
```

## Related

- [Moon images](./images.md) — loader, mapping, build pipeline
