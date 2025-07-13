# TECHNICAL.md

This document details the technical specifications, architecture, and implementation plan for the Moon Calendar project.

For a high-level overview, see [README.md]. For coding conventions and Copilot usage, see [copilot-instructions.md].

---

## 1. Core Features & Flow

### 1.1. Location-Based Moon Calendar
- On first visit, user is prompted with a “Select Location” screen.
- Initial city options (hardcoded for MVP):
  - Cape Town
  - New York
  - London
  - Tokyo
  - San Francisco
- (Future) Integrate with a map/geolocation service for broader city selection.

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

---

## 2. Backend Architecture

- **Language:** Python 3
- **Framework:** Flask
- **Astronomy Library:** ephem
- **File:** `backend/moon_phase_api.py`
- **Cities Supported:** Hardcoded in `CITY_COORDS` dict
- **Endpoints:** `/moon-phase`, `/moon-phases`
- **Deployment:** Run with `python moon_phase_api.py`

---

## 3. Frontend Integration

- The Next.js frontend fetches data from the Flask backend.
- API URL may need to be configured depending on deployment (e.g., proxy or CORS).
- Data is fetched for the selected city and date range to render the calendar grid.

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

## 5. Component & File Structure (Draft)

- `/components`
  - `LocationSelector.tsx`
  - `CalendarGrid.tsx`
  - `MoonPhaseIcon.tsx`
- `/pages`
  - `index.tsx` (main entry)
- `/types`
  - `moonPhase.ts`
- `/utils`
  - `api.ts` (API calls)
- `/backend`
  - `moon_phase_api.py` (Flask backend)

---

## 6. Future Technical Roadmap
- Integrate print-on-demand service
- Add user accounts for saving favorites
- Expand city/location options
- Enhanced design customization

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