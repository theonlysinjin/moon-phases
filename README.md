# Moon Calendar

## Features

- [x] Location-based moon phase calendar (city dropdown)
- [x] Infinite scroll for calendar data (6-month chunks)
- [x] Responsive, full-screen calendar grid
- [x] Theme support (Traditional, Minimal, Lunar Cycle, Poster, Poster Print)
- [x] Poster mode: year navigation and PDF export
- [ ] Integrate location search (map/geolocation)
- [ ] Integrate with external print-on-demand services
- [ ] Add more themes (e.g., Dark, Solarized, etc)
- [ ] User accounts for saving favorites
- [ ] Expand city/location options
- [ ] Enhanced design customization

This project is a [Next.js](https://nextjs.org) app with a custom Python backend for moon phase data. The backend provides location-based moon phase information via a REST API.

## Getting Started

### 1. Run the Backend API

The backend is a Flask app using the `ephem` library for astronomical calculations. To start the backend:

```bash
cd backend
pip install flask ephem
python moon_phase_api.py
```

By default, the API runs at [http://127.0.0.1:5000](http://127.0.0.1:5000).

#### API Endpoints

- **GET `/moon-phase?city=London`**
  - Returns the current moon phase data for a city.
- **GET `/moon-phases?city=London&date_from=20250701&date_to=20250707`**
  - Returns daily moon phase data for a city between two dates (inclusive).

##### Example Response (`/moon-phases`):

```json
[
  {
    "city": "Cape Town",
    "date_utc": "2025-07-01T00:00:00",
    "illuminated_fraction": 0.32931910820669275,
    "is_waxing": true,
    "latitude": -33.9249,
    "longitude": 18.4241,
    "major_phase": null,
    "moon_age_days": 5.5614236111111115,
    "next_major_phase": {
      "date_utc": "2025-07-02T19:30:07.108865",
      "name": "First Quarter"
    }
  },
  // ... more days
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

##### Supported Cities
- Cape Town
- New York
- London
- Hong Kong
- Melbourne
- San Francisco
- Tokyo

### 2. Run the Frontend (Next.js)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

The frontend fetches moon phase data from the backend API. You may need to configure the frontend to point to the backend URL if running separately (see `.env.local`).

- City selection is via dropdown (see top of page)
- Theme selection (Traditional, Minimal, Lunar Cycle, Poster, Poster Print) is available
- Calendar supports infinite scroll (loads more data as you scroll)
- Poster mode supports year navigation and PDF export

### Assets
- Moon phase images are located in `src/assets/phases/` and used for visual representation in the calendar.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [ephem Documentation](https://rhodesmill.org/pyephem/)
