# TECHNICAL.md

## Features Checklist

- [x] Location-based moon phase calendar (city dropdown)
- [x] Infinite scroll for calendar data (6-month chunks) in Calendar and Lunar Cycle themes
- [x] Responsive, full-screen calendar grid
- [x] Theme support: Calendar, Lunar Cycle, Hourly Timeline, Poster
- [x] Poster mode: year navigation
- [x] Static export (Next.js `output: export`) for GitHub Pages
- [ ] Poster export
- [ ] Integrate location search (map/geolocation)
- [ ] Add more themes (e.g., Dark, Solarized, etc)
- [ ] User accounts for saving favorites
- [ ] Expand city/location options
- [ ] Enhanced design customization

---

## 1. Core Features & Flow

### 1.1. Location-Based Moon Calendar
- City dropdown on the home page.
- Initial city options (UI): Cape Town, New York, London, Hong Kong, Melbourne.
- Backend additionally supports: San Francisco, Tokyo.
- (Planned) Integrate map/geolocation for broader city selection.

### 1.2. Moon Phase Data Integration
- Default: client-side generation using `astronomy-engine` in `src/utils/generateMoonPhases.ts`.
- Optional: Flask backend (`backend/moon_phase_api.py`) powered by `ephem` for REST API access.
- The frontend currently calls `generateMoonPhases` directly via `src/utils/api.ts` and does not depend on the backend.

#### API Endpoints (Backend)
- `GET /moon-phase?city=London`
  - Current moon phase data for the city.
- `GET /moon-phases?city=London&date_from=YYYYMMDD&date_to=YYYYMMDD`
  - Daily or hourly (by generation) moon phase data between two dates (inclusive).

##### Example Request
```
GET /moon-phases?city=Cape%20Town&date_from=20250701&date_to=20250707
```

##### Example Response (shape)
```json
[
  {
    "city": "Cape Town",
    "date_utc": "2025-07-01T00:00:00Z",
    "illuminated_fraction": 0.33,
    "is_waxing": true,
    "latitude": -33.9249,
    "longitude": 18.4241,
    "major_phase": null,
    "moon_age_days": 5.56,
    "next_major_phase": { "name": "First Quarter", "date_utc": "2025-07-02T19:30:07Z" }
  }
]
```

##### Field Descriptions
- `city`: City name
- `date_utc`: ISO date string (UTC)
- `illuminated_fraction`: Fraction of the moon illuminated (0-1)
- `is_waxing`: Boolean, true if waxing, false if waning
- `latitude`, `longitude`: Coordinates used
- `major_phase`: Name of major phase if today is one (e.g., "Full Moon"), else null
- `moon_age_days`: Days since last new moon
- `next_major_phase`: Object with `name` and `date_utc` for the next major phase

---

## 2. Backend Architecture (Optional)

- Language: Python 3
- Framework: Flask
- Astronomy Library: PyEphem (`ephem`)
- File: `backend/moon_phase_api.py`
- Cities Supported: Hardcoded in `CITY_COORDS`
- Endpoints: `/moon-phase`, `/moon-phases`
- CORS: Enabled for all origins
- Can proxy to Next.js dev server when launched with `--proxy-frontend`

---

## 3. Frontend Integration

- Framework: Next.js 15 (React 19)
- Data source: `src/utils/generateMoonPhases.ts` (client-side via `astronomy-engine`)
- Entry: `src/app/page.tsx`
- Infinite scroll: implemented for Calendar and Lunar Cycle (IntersectionObserver on bottom trigger, loads next 6 months; manual load-previous for earlier months supported via helper).
- Themes:
  - Calendar: month-grouped weekly grid
  - Lunar Cycle: rows of 14-day chunks with month labels
  - Hourly Timeline: looping video with phase overlay, hemisphere-aware orientation
  - Poster: 12 columns (months) × 31 rows (days), with year navigation
- Assets: `public/phases/*` at runtime; build verifies presence in `src/assets/phases`.

---

## 4. Data Model

```ts
// TypeScript type for a moon phase entry (matches backend response)
export type MoonPhaseEntry = {
  city: string;
  date_utc: string; // ISO date
  illuminated_fraction: number; // 0-1
  is_waxing: boolean;
  latitude: number;
  longitude: number;
  major_phase: string | null;
  moon_age_days: number;
  next_major_phase: {
    name: string | null;
    date_utc: string | null;
  };
};
```

---

## 5. Component & File Structure (selected)

- `src/components/LocationSelector.tsx` (city dropdown)
- `src/components/CalendarGrid.tsx` (calendar grid; renders different themes)
- `src/components/HourlyTimeline.tsx` (video-based lunar cycle view)
- `src/components/MoonPhaseImagePreloader.tsx` (image preload hook)
- `src/app/page.tsx` (main entry; state, theme, infinite scroll, poster year nav)
- `src/utils/api.ts` (facade; calls `generateMoonPhases`)
- `src/utils/generateMoonPhases.ts` (astronomy-engine based generator)
- `src/utils/getMoonPhaseVisual.tsx`, `src/utils/moonPhaseImageLoader.ts` (asset helpers)
- `src/types/moonPhase.ts`, `src/types/api.ts`
- `src/assets/phases/*` (build verification source assets)
- `public/phases/*` (runtime-served assets)
- `backend/moon_phase_api.py` (optional Flask backend)

---

## 6. Future Technical Roadmap
- [ ] Add user accounts for saving favorites
- [ ] Expand city/location options (map/geolocation)
- [ ] Enhanced design customization
- [ ] Add more themes (e.g., Dark, Solarized)
- [ ] Poster export (likely via `@react-pdf/renderer` or `html2canvas` + `jspdf`)

---

## 7. Testing Strategy
- Unit tests for utility functions and data models
- Integration tests for API calls and data flow
- Visual regression tests for calendar layout (future)

---

## 8. Accessibility
- Ensure color contrast meets WCAG standards
- All interactive elements keyboard accessible
- Use semantic HTML and ARIA labels where needed

---

## 9. Deployment
- Frontend: Vercel (recommended) or GitHub Pages (static export configured)
- Backend: any Python-compatible host (Heroku, Render) if used
- Environment variables: `NEXT_BASE_PATH`, `NEXT_ASSET_PREFIX` used for Pages

---

## 10. Data Flow Diagram
*Placeholder for future Mermaid or visual diagram of data flow and component interactions.*

---

For more, see [README.md]. 