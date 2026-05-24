# Backend (optional)

Flask API in `backend/moon_phase_api.py`. Provides moon phase data via REST using **PyEphem** (`ephem`).

**The Next.js UI does not call this API.** The frontend generates data client-side via `src/utils/generateMoonPhases.ts`. The backend is useful for comparison, standalone API consumers, or future server-side generation.

## Run locally

```bash
cd backend
pip install flask ephem flask-cors
python moon_phase_api.py
```

Default: `http://127.0.0.1:5000`

Optional: `--proxy-frontend` to proxy to the Next.js dev server instead of serving static export from `backend/app`.

## Endpoints

### `GET /moon-phase?city=London`

Current moon phase for the city.

### `GET /moon-phases?city=London&date_from=YYYYMMDD&date_to=YYYYMMDD`

Moon phase entries between two dates (inclusive).

**Example request:**

```
GET /moon-phases?city=Cape%20Town&date_from=20250701&date_to=20250707
```

Response shape largely matches [Data model](./data-model.md) with additional fields such as `date_local` and new-moon boundary helpers. `next_major_phase` may be `null` depending on the query window.

## Supported cities

Hardcoded in `CITY_COORDS` / `CITY_TIMEZONES`:

- Cape Town, New York, London, Hong Kong, Melbourne
- San Francisco, Tokyo (backend only — not in the UI dropdown)

To add a city, update both the backend dicts and `CITY_MAP` in `generateMoonPhases.ts` (and the UI list in `page.tsx`).

## CORS

Enabled for all origins.

## TBD

- OpenAPI / example responses aligned with current frontend type
- Decision doc: when (if ever) to switch UI to API vs client-side gen
