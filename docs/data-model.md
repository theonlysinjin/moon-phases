# Data model

The frontend generates moon phase observations client-side. All astronomy uses **UTC instants**; display uses **city-local calendar days**.

## Moon-time vs observer-time

| Concept | Meaning | Stored as |
|---------|---------|-----------|
| **Moon-time** | Astronomical state at a UTC instant | `date_utc`, `moon_age_days`, `illuminated_fraction` |
| **Observer-time** | When the user views the moon | City TZ + lat/lon + `viewHour` (default 21 = 9pm local) |

Daily samples: one entry per **local calendar day** at `viewHour` in the selected city's timezone. The UTC instant may fall on an adjacent UTC date.

## `MoonPhaseEntry`

Defined in `src/types/moonPhase.ts`:

```ts
export type MoonPhaseEntry = {
  city: string;
  date_utc: string;              // ISO 8601 UTC — source of truth for astronomy
  date_local: string;            // YYYY-MM-DD in city TZ — for display/grouping
  illuminated_fraction: number;
  is_waxing: boolean;
  latitude: number;
  longitude: number;
  major_phase: string | null;
  moon_age_days: number;
  rotation_angle: number;
  next_major_phase: {
    name: string | null;
    date_utc: string | null;
  };
};
```

## Field reference

| Field | Meaning |
|-------|---------|
| `city` | Display name (must match `CITY_BY_LABEL` in `src/config/cities.ts`) |
| `date_utc` | Observer sample instant as ISO UTC |
| `date_local` | Local calendar day in city TZ for grid cells and labels |
| `illuminated_fraction` | Lit fraction of the disc (0 = new, 1 = full) |
| `is_waxing` | `true` if phase angle &lt; 180° |
| `latitude`, `longitude` | Observer coordinates |
| `major_phase` | Name if this **local** calendar day is a quarter/new/full, else `null` |
| `moon_age_days` | Drives image frame selection |
| `rotation_angle` | Parallactic angle at `date_utc` for observer lat/lon |
| `next_major_phase` | Next major phase after this UTC instant |

## Fetch options

`src/types/api.ts`:

```ts
export type FetchOptions = {
  resolution?: 'daily' | '3h';
  viewHour?: number;  // 0–23, default 21 (9pm local)
};
```

- **`daily`** — one entry per local calendar day at `viewHour`.
- **`3h`** — every 3 hours from local midnight; used by Hourly Timeline.

`dateFrom` / `dateTo` (`YYYYMMDD`) are **local calendar bounds** in the city's timezone.

## Image frame mapping

```ts
const nearestFrame = Math.round(moon_age_days * 8) + 1; // clamped to 1..236
```

See [Moon images](./assets/images.md).

## Example (daily, New York, 9pm local)

```json
{
  "city": "New York",
  "date_utc": "2025-07-02T01:00:00.000Z",
  "date_local": "2025-07-01",
  "illuminated_fraction": 0.33,
  "is_waxing": true,
  "latitude": 40.7128,
  "longitude": -74.006,
  "major_phase": null,
  "moon_age_days": 5.56,
  "rotation_angle": 142.3,
  "next_major_phase": {
    "name": "First Quarter",
    "date_utc": "2025-07-02T19:30:07.000+00:00"
  }
}
```
