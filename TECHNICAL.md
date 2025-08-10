# TECHNICAL.md

## Features Checklist

- [x] Location-based moon phase calendar (city dropdown)
- [x] Infinite scroll for calendar data (6-month chunks)
- [x] Responsive, full-screen calendar grid
- [x] Theme support (Traditional, Minimal, Lunar Cycle, Poster)
- [x] Poster mode: year navigation and PDF export (Poster theme only)
- [ ] Integrate location search (map/geolocation)
- [ ] Integrate with external print-on-demand services
- [ ] Add more themes (e.g., Dark, Solarized, etc)
- [ ] User accounts for saving favorites
- [ ] Expand city/location options
- [ ] Enhanced design customization

---

## 1. Core Features & Flow

### 1.1. Location-Based Moon Calendar
- On first visit, user is prompted with a “Select Location” screen (city dropdown).
- Initial city options (hardcoded):
  - Cape Town
  - New York
  - London
  - Hong Kong
  - Melbourne
  - San Francisco
  - Tokyo
- (Planned) Integrate with a map/geolocation service for broader city selection.

### 1.2. Moon Phase Data Integration
- The app uses a custom Flask backend (`backend/moon_phase_api.py`) to provide moon phase data by city.
- The backend uses the `ephem` library for astronomical calculations.
- API supports querying by city and date range.

#### API Endpoints
- `GET /moon-phase?city=London`
  - Returns current moon phase data for the city.
- `GET /moon-phases?city=London&date_from=YYYYMMDD&date_to=YYYYMMDD`
  - Returns daily moon phase data for the city between two dates (inclusive).

##### Example Request
```
GET /moon-phases?city=Cape%20Town&date_from=20250701&date_to=20250707
```

##### Example Response
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

## 2. Backend Architecture

- **Language:** Python 3
- **Framework:** Flask
- **Astronomy Library:** ephem
- **File:** `backend/moon_phase_api.py`
- **Cities Supported:** Hardcoded in `CITY_COORDS` dict (see above)
- **Endpoints:** `/moon-phase`, `/moon-phases`
- **Deployment:** Run with `python moon_phase_api.py`
- **CORS:** Enabled for all origins
- **Frontend Proxy:** Can proxy to Next.js dev server if needed

---

## 3. Frontend Integration

- The Next.js frontend fetches data from the Flask backend.
- API URL may need to be configured depending on deployment (e.g., proxy or CORS).
- Data is fetched for the selected city and date range to render the calendar grid.
- Infinite scroll is implemented: as the user scrolls, more moon phase data is fetched and appended (6-month chunks).
- Theme selection is available (Traditional, Minimal, Lunar Cycle, Poster).
- Poster mode supports year navigation and PDF export.

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
    name: string;
    date_utc: string;
  };
};
```

---

## 5. Component & File Structure

- `/components`
  - `LocationSelector.tsx` (city dropdown)
  - `CalendarGrid.tsx` (calendar grid with infinite scroll)
- `/app`
  - `page.tsx` (main entry, handles state, theme, infinite scroll, poster mode)
  - `layout.tsx`, `globals.css` (global styles and layout)
- `/types`
  - `moonPhase.ts`
- `/utils`
  - `api.ts` (API calls)
- `/assets/phases/`
  - Moon phase images (used for visual representation)
- `/backend`
  - `moon_phase_api.py` (Flask backend)

---

## 6. Future Technical Roadmap
- [ ] Integrate print-on-demand service
- [ ] Add user accounts for saving favorites
- [ ] Expand city/location options (map/geolocation)
- [ ] Enhanced design customization
- [ ] Add more themes (e.g., Dark, Solarized)

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
- Deploy frontend to Vercel (recommended) or Netlify
- Backend can be deployed to any Python-compatible host (e.g., Heroku, Render)
- Use environment variables for API URLs if needed

---

## 10. Data Flow Diagram
*Placeholder for future Mermaid or visual diagram of data flow and component interactions.*

---

For more, see [README.md] and [copilot-instructions.md]. 