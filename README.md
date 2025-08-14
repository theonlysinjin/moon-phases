# Moon Calendar

## Features

- [x] Location-based moon phase calendar (city dropdown)
- [x] Infinite scroll for calendar data (6-month chunks) in Calendar and Lunar Cycle themes
- [x] Responsive, full-screen calendar grid
- [x] Theme support: Calendar, Lunar Cycle, Hourly Timeline, Poster
- [x] Poster mode: year navigation
- [x] Static export ready (GitHub Pages compatible)
- [ ] PDF/print export for Poster
- [ ] Integrate location search (map/geolocation)
- [ ] Integrate with external print-on-demand services
- [ ] Add more themes (e.g., Dark, Solarized, etc)
- [ ] User accounts for saving favorites
- [ ] Expand city/location options
- [ ] Enhanced design customization

This project is a [Next.js](https://nextjs.org) app that generates moon phase data on the client using `astronomy-engine`. An optional Python/Flask backend is included for API-based data, but the frontend does not depend on it by default.

## Getting Started

### 1. Run the Frontend (Next.js)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

- City selection is via dropdown (top of page)
- Theme selection: Calendar, Lunar Cycle, Hourly Timeline, Poster
- Calendar and Lunar Cycle support infinite scroll (loads more data as you scroll). Poster loads an entire year with year navigation. Hourly Timeline does not use infinite scroll.

### 2. (Optional) Run the Backend API

The backend is a Flask app using the `ephem` library. It can provide moon phase data via REST, but the current UI uses client-side generation instead.

```bash
cd backend
pip install flask ephem
python moon_phase_api.py
```

By default, the API runs at `http://127.0.0.1:5000`.

#### API Endpoints (reference)

- GET `/moon-phase?city=London`
  - Returns the current moon phase data for a city.
- GET `/moon-phases?city=London&date_from=YYYYMMDD&date_to=YYYYMMDD`
  - Returns daily (or generated hourly) moon phase data between two dates (inclusive).

Response fields generally match the frontend `MoonPhaseEntry` type; the backend additionally includes `date_local`, `previous_next_new_moon_*` fields. `next_major_phase.name`/`date_utc` may be `null` depending on the query window.

##### Supported Cities

- UI dropdown: Cape Town, New York, London, Hong Kong, Melbourne
- Backend supports additional: San Francisco, Tokyo

### Assets

- Source moon phase images are in `src/assets/phases/` (verified at build time).
- Images and the lunar-cycle video are served at runtime from `public/phases/` (e.g., `/phases/moon.0001.jpg`, `/phases/moon_720p30.webm`).

## Deployment (GitHub Pages)

This repo includes a GitHub Actions workflow to build and deploy a static export to GitHub Pages.

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: Push to `main` or manual run
- Steps:
  - Verifies moon phase images (`scripts/verify-moon-images.js` expects `src/assets/phases/`)
  - Builds static export (`out/`) with Next.js (`output: export`)
  - Uploads and deploys `out/` to GitHub Pages

Notes:

- The workflow sets `NEXT_BASE_PATH` and `NEXT_ASSET_PREFIX` so assets work under `https://<owner>.github.io/<repo>/`.
- Ensure Pages is enabled in repo settings with source "GitHub Actions".

Local static export:

```bash
npm run build
# output in ./out
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [PyEphem Documentation](https://rhodesmill.org/pyephem/)
