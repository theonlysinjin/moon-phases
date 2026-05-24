# Architecture

High-level map of how the repo is organized. Details will grow here over time.

## Layer diagram

```
┌─────────────────────────────────────────────────────────┐
│  Presentation          src/components/                  │
│  LocationSelector, CalendarGrid, HourlyTimeline, …      │
├─────────────────────────────────────────────────────────┤
│  Orchestration         src/app/page.tsx                 │
│  city, theme, date range, infinite scroll, poster cache│
├─────────────────────────────────────────────────────────┤
│  Data facade           src/utils/api.ts                 │
│  → generateMoonPhases.ts, moonOrientation.ts            │
├─────────────────────────────────────────────────────────┤
│  Visual assets         moonPhaseImageLoader,            │
│                        getMoonPhaseVisual, public/phases│
└─────────────────────────────────────────────────────────┘

Optional (not used by UI):  backend/moon_phase_api.py
```

## Directory map

### Frontend (`src/`)

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Main entry — state, fetching, theme switching, infinite scroll |
| `src/app/layout.tsx` | Root layout, fonts, globals |
| `src/components/LocationSelector.tsx` | City dropdown |
| `src/components/CalendarGrid.tsx` | Theme router — calendar, lunar-cycle, poster layouts |
| `src/components/HourlyTimeline.tsx` | Video-based lunar cycle view |
| `src/components/MoonPhaseImagePreloader.tsx` | Preloads phase images on app init |
| `src/utils/generateMoonPhases.ts` | Core astronomy generator (`astronomy-engine`) |
| `src/utils/moonOrientation.ts` | Parallactic rotation angle per location/time |
| `src/utils/api.ts` | Facade — calls `generateMoonPhases` directly (no HTTP) |
| `src/utils/getMoonPhaseVisual.tsx` | Entry → rotated `<Image>` |
| `src/utils/moonPhaseImageLoader.ts` | Moon age → frame number → image path |
| `src/types/moonPhase.ts` | `MoonPhaseEntry` type |
| `src/types/api.ts` | `FetchOptions` (e.g. `resolution: '3h'`) |
| `src/assets/phases/` | Source images (verified at build) |
| `src/assets/phases.inline.ts` | Generated — video data URI for Hourly Timeline |

### Backend (`backend/`)

| Path | Purpose |
|------|---------|
| `backend/moon_phase_api.py` | Flask + PyEphem REST API (optional) |

### Build scripts (`scripts/`)

| Script | Purpose |
|--------|---------|
| `verify-moon-images.js` | Ensures all 236 frames exist before build |
| `generate-inline-phases.js` | Embeds lunar-cycle video for static export |
| `prune-unneeded-phases.js` | Trims unused phase frames |
| `generate-poster-markdown.js` | CLI poster table (markdown) |
| `generate-poster-csv.js` | CLI poster table (CSV) |

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
| Hourly Timeline | ~90 days at 3h resolution | Fixed window (no scroll) |
| Poster | Full current year | Year nav; years cached in state |

See [Data flow](./data-flow.md) for the step-by-step path.

## TBD

- Component interaction diagram (Mermaid)
- State machine for `page.tsx` fetch logic
- Test coverage map (`test/`)
