# Media sources

How to obtain and prepare moon phase media from NASA.

## Download

Frames come from [NASA SVS 4310](https://svs.gsfc.nasa.gov/4310/).

From the repo:

```bash
cd media
./download.sh
```

Scripts and helpers in `media/`:

| File | Purpose |
|------|---------|
| `download.sh` | Fetch frames from NASA |
| `phases/image.py` | Transform / processing helper |

After download, copy or symlink processed assets into:

- `src/assets/phases/` — verified at build time
- `public/phases/` — served at runtime (`/phases/moon.0001.jpg`, etc.)

## Expected layout

```
src/assets/phases/
  moon.0001.jpg … moon.0236.jpg
  moon_720p30.webm          # Hourly Timeline video

public/phases/              # mirror for runtime serving
  moon.0001.jpg …
  moon_720p30.webm
```

Run `npm run verify-images` after adding or updating files.

## Related

- [Moon images](./images.md) — loader, mapping, build pipeline
