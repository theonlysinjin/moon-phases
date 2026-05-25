# Architecture

High-level map of how the repo is organized.

## Layer diagram

```
┌─────────────────────────────────────────────────────────┐
│  Presentation          src/components/                  │
│  CitySearch, CalendarGrid, HourlyTimeline, …            │
├─────────────────────────────────────────────────────────┤
│  Orchestration         src/app/page.tsx                 │
│  city, theme, viewHour, infinite scroll, poster cache   │
├─────────────────────────────────────────────────────────┤
│  Data facade           src/utils/api.ts                 │
│  → generateMoonPhases.ts, moonOrientation.ts, time.ts   │
├─────────────────────────────────────────────────────────┤
│  Visual assets         moonPhaseImageLoader,            │
│                        getMoonPhaseVisual,              │
│                        phases.inline.ts (data URIs)     │
└─────────────────────────────────────────────────────────┘

Optional (not used by UI):  backend/moon_phase_api.py
```

## Directory map

### Frontend (`src/`)

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Main entry — state, fetching, theme switching, infinite scroll |
| `src/app/layout.tsx` | Root layout, fonts, globals |
| `src/config/cities.ts` | City list — label, slug, lat/lon, IANA timezone |
| `src/components/CitySearch.tsx` | City search combobox + geolocation |
| `src/utils/geocoding.ts` | Open-Meteo search, Nominatim reverse, browser TZ |
| `src/components/CalendarGrid.tsx` | Theme router — calendar, lunar-cycle, poster layouts |
| `src/components/HourlyTimeline.tsx` | Video-based lunar cycle view with optional parallactic rotation |
| `src/components/TimeOfDaySlider.tsx` | Viewing-time control (0–23 local hour) |
| `src/components/MoonPhaseImagePreloader.tsx` | Preloads phase images on app init (no-op with inline URIs) |
| `src/utils/generateMoonPhases.ts` | Core astronomy generator (`astronomy-engine`) |
| `src/utils/moonOrientation.ts` | Parallactic rotation angle per location/time |
| `src/utils/time.ts` | Local date arithmetic, UTC conversion, rotation interpolation |
| `src/utils/synodicRotation.ts` | Synodic progress → rotation for Hourly Timeline |
| `src/utils/hourlyTimelineTransform.ts` | Video playback rate and transform helpers |
| `src/utils/moonFrameMapping.ts` | Moon age → daily frame index / full-set frame number |
| `src/utils/moonImageStyle.ts` | Shared CSS clip-path for circular moon display |
| `src/utils/api.ts` | Facade — calls `generateMoonPhases` directly (no HTTP) |
| `src/utils/getMoonPhaseVisual.tsx` | Entry → rotated `<Image>` |
| `src/utils/moonPhaseImageLoader.ts` | Moon age → inline data URI |
| `src/types/moonPhase.ts` | `MoonPhaseEntry` type |
| `src/types/api.ts` | `FetchOptions`, `DEFAULT_VIEW_HOUR` |
| `src/assets/phases/` | Source images (236 JPGs + WebM; verified at build) |
| `src/assets/phases.inline.ts` | Generated — 30 daily frame data URIs + video for static export |

### Backend (`backend/`)

| Path | Purpose |
|------|---------|
| `backend/moon_phase_api.py` | Flask + PyEphem REST API (optional) |

### Build scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `verify-moon-images.js` | Ensures all 236 frames exist before build |
| `generate-inline-phases.js` | Embeds 30 daily frames + video as data URIs |
| `prune-unneeded-phases.js` | Trims unused phase frames |
| `generate-poster-markdown.js` | CLI poster table (markdown) |
| `generate-poster-csv.js` / `.ts` | CLI poster table (CSV) |
| `fetch-timeanddate-phases.js` | Fetch reference phase dates from timeanddate.com |
| `spot-check-year.ts` | Cross-year phase spot-check against fixtures |
| `round-moon-frame.js` | Crop/round individual moon frames |
| `lib/timeanddate-cities.js` | City slugs for timeanddate fetcher |
| `lib/timeanddate-phases.js` | Parse timeanddate HTML into phase rows |

### Tests (`test/`)

| Path | Purpose |
|------|---------|
| `test/generateMoonPhases.test.ts` | Core generator behaviour |
| `test/moonOrientation.test.ts` | Parallactic angle calculations |
| `test/timeanddatePhases.test.ts` | Phase dates vs timeanddate fixtures (all cities) |
| `test/time.test.ts` | Local date/time utilities |
| `test/hourlyTimeline*.test.ts` | Hourly Timeline rotation and transforms |
| `test/poster*.test.ts` | Poster cache key and CSV export |
| `test/fixtures/timeanddate/` | Reference TSV fixtures per city/year |

Run with `npm run test` (Vitest, config in `vitest.config.ts`).

### Config

| File | Purpose |
|------|---------|
| `next.config.ts` | Static export, `basePath` / `assetPrefix` for GitHub Pages |
| `package.json` | Scripts; build runs verify + inline generation before `next build` |

## Data-loading strategy (by theme)

| Theme | Initial load | More data |
|-------|--------------|-----------|
| Calendar | 6 months from today | Infinite scroll → +6 months |
| Lunar Cycle | 6 months from today | Infinite scroll → +6 months |
| Hourly Timeline | No grid fetch (video only) | Fixed window (no scroll) |
| Poster | Full current year | Year nav; years cached in state |

See [Data flow](./data-flow.md) for the step-by-step path.
