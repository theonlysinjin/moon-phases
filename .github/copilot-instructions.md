# Copilot Instructions for Moon Calendar

Next.js 15 + TypeScript frontend that generates moon phase data **client-side** via `astronomy-engine`. An optional Flask backend exists but is **not used by the UI**.

## Coding Conventions

- **TypeScript:**
  - Use types and interfaces for props and data models.
  - Prefer `type` for simple shapes, `interface` for components/objects.
  - Use `any` only as a last resort.
- **React:**
  - Functional components with hooks (`useState`, `useEffect`, `useCallback`, etc.).
  - Keep components small and focused.
- **Styling:**
  - Tailwind CSS utility classes for layout and design.
  - Dark themes use `bg-black text-white` for calendar/lunar-cycle/poster controls.

## Core data model

All moon data flows through `MoonPhaseEntry`:

```ts
export type MoonPhaseEntry = {
  city: string;
  date_utc: string;       // ISO UTC — astronomy source of truth
  date_local: string;     // YYYY-MM-DD in city TZ — display/grouping
  illuminated_fraction: number;
  is_waxing: boolean;
  latitude: number;
  longitude: number;
  major_phase: string | null;
  moon_age_days: number;
  rotation_angle: number; // parallactic angle in degrees
  next_major_phase: {
    name: string | null;
    date_utc: string | null;
  };
};
```

Cities are defined in `src/config/cities.ts` (label, slug, lat, lon, IANA tz).

Fetch options in `src/types/api.ts`:

```ts
export type FetchOptions = {
  resolution?: 'daily' | '3h';
  viewHour?: number;  // 0–23, default 21
};
```

## File & Component Structure

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Main orchestration — city, theme, viewHour, infinite scroll, poster cache |
| `src/components/LocationSelector.tsx` | City dropdown |
| `src/components/CalendarGrid.tsx` | Theme router (calendar, lunar-cycle, poster) |
| `src/components/HourlyTimeline.tsx` | Video lunar cycle + optional parallactic rotation |
| `src/components/TimeOfDaySlider.tsx` | Viewing-time slider (0–23 local hour) |
| `src/config/cities.ts` | City list |
| `src/types/` | `MoonPhaseEntry`, `FetchOptions` |
| `src/utils/generateMoonPhases.ts` | Core astronomy generator |
| `src/utils/moonOrientation.ts` | Parallactic rotation angle |
| `src/utils/time.ts` | Local date arithmetic, UTC conversion |
| `src/utils/api.ts` | Facade — calls `generateMoonPhases` (no HTTP) |
| `src/utils/getMoonPhaseVisual.tsx` | Entry → rotated moon image |
| `src/assets/phases/` | Source images (236 JPGs + WebM) |
| `src/assets/phases.inline.ts` | Generated data URIs for static export |
| `backend/moon_phase_api.py` | Optional Flask API (not used by UI) |
| `test/` | Vitest tests |
| `docs/` | Technical documentation |

## Documentation

- **README.md** — short entry point and quick start
- **docs/** — architecture, data model, themes, deployment, roadmap
- **This file** — coding conventions and Copilot workflow

Start at [docs/README.md](../docs/README.md) for full technical docs.

## How to Start a New Feature

1. Review relevant `docs/` sections (overview, architecture, data model, themes)
2. Create or update types/interfaces first
3. Add compute logic in `src/utils/` (pure functions, testable)
4. Wire into `page.tsx` or a component
5. Use Tailwind CSS for UI
6. Add Vitest tests in `test/` when behaviour is non-trivial
7. Run `npm run test` before submitting a PR

## Review Checklist (for PRs)

- [ ] TypeScript types for all props and data
- [ ] Functional components with hooks
- [ ] Tailwind CSS for styling
- [ ] No unused variables or imports
- [ ] `npm run test` passes
- [ ] Docs updated if behaviour or structure changed

## Common Pitfalls

- Forgetting `date_local` vs `date_utc` — grid cells group by local date
- Assuming images come from `public/` — runtime uses inline data URIs from `phases.inline.ts`
- Adding cities only to the backend — update `src/config/cities.ts` for UI
- Using hemisphere flip instead of `rotation_angle` for moon orientation

## Where to Find Things

- `src/components/` — UI components
- `src/app/` — pages and layout
- `src/config/` — city configuration
- `src/types/` — TypeScript types
- `src/utils/` — astronomy, time, image helpers
- `src/assets/phases/` — source moon images
- `scripts/` — build, poster, and validation scripts
- `test/` — Vitest tests and timeanddate fixtures
- `docs/` — technical documentation
- `backend/` — optional Flask API

---

Happy coding!
