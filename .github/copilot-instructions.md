# Copilot Instructions for Moon Calendar

This project uses **TypeScript** and **React** (with Next.js) for the frontend, and a **Flask (Python)** backend for moon phase data. The backend provides a REST API that returns detailed moon phase information by city and date.

## Coding Conventions

- **TypeScript:**
  - Use types and interfaces for props and data models, matching the backend response shape.
  - Prefer `type` for simple shapes, `interface` for components/objects.
  - Use `any` only as a last resort.
- **React:**
  - Use functional components (`function MyComponent() { ... }`).
  - Use hooks (e.g., `useState`, `useEffect`) for state and side effects.
  - Keep components small and focused.
- **Styling:**
  - Use Tailwind CSS utility classes for layout and design.
  - Keep print styles in mind (e.g., `@media print`).

## Backend API

- The backend is in `backend/moon_phase_api.py` (Flask + ephem).
- Endpoints:
  - `GET /moon-phase?city=London` (current day)
  - `GET /moon-phases?city=London&date_from=YYYYMMDD&date_to=YYYYMMDD` (date range)
- Cities are hardcoded in the backend; to add more, edit the `CITY_COORDS` dict.

### Example Response (`/moon-phases`):
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

### TypeScript Type
```ts
export type MoonPhaseEntry = {
  city: string;
  date_utc: string;
  illuminated_fraction: number;
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

## File & Component Structure

- Place components in `/components`.
- Pages go in `/pages` (Next.js convention).
- Types and interfaces in `/types`.
- Utilities/helpers in `/utils`.
- Backend code in `/backend`.

## Copilot Prompting Tips

- **Be explicit:** When starting a new file or component, describe what you want (e.g., "Create a MoonPhaseGrid component that displays weeks in a scrollable grid").
- **Type-first:** Define the type/interface for your data before generating logic. Use the `MoonPhaseEntry` type above for moon data.
- **Iterate:** Let Copilot scaffold, then refine and add types as needed.
- **Ask for examples:** Copilot can generate sample data, API calls, and more.

## Example: Minimal TypeScript Component

```tsx
import React from 'react';
import type { MoonPhaseEntry } from '../types/moonPhase';

export function MoonPhase({ entry }: { entry: MoonPhaseEntry }) {
  return (
    <div className="moon-phase">
      <span>{entry.date_utc}</span>
      <span>{entry.major_phase ?? '—'}</span>
    </div>
  );
}
```

## General Advice

- Keep types simple and focused on what matters for UI/data.
- Use Copilot to generate repetitive code, but always review and refine.
- Don’t hesitate to ask Copilot for help with types, hooks, or API integration.

## Documentation Structure

- **README.md**: Project overview, features, setup, and backend API documentation.
- **copilot-instructions.md** (this file): Coding conventions, Copilot usage, and developer workflow.
- **TECHNICAL.md**: Technical specifications, backend API, and data models.

## How to Start a New Feature
- Review the relevant sections in TECHNICAL.md
- Create or update types/interfaces first (see above)
- Scaffold the component in /components or page in /pages
- Use Tailwind CSS for all UI styling
- Write minimal, clear types for all props and data
- Test locally before submitting a PR

## Review Checklist (for PRs)
- [ ] All new code uses TypeScript types/interfaces
- [ ] Components are functional and use hooks
- [ ] Tailwind CSS classes are used for styling
- [ ] No unused variables or imports
- [ ] Code is readable and commented where needed
- [ ] All tests (if any) pass

## Common Pitfalls
- Forgetting to type component props
- Not using Tailwind for layout/design
- Overcomplicating types (keep them minimal)
- Not checking TECHNICAL.md for requirements
- Not matching the backend data shape in frontend types

## How to Ask Copilot for Help
- "Create a LocationSelector component with a dropdown for cities."
- "Generate a TypeScript type for a moon phase entry."
- "Add Tailwind classes for a responsive grid layout."
- "Show me how to fetch data from an API in Next.js."

## Where to Find Things
- `/components`: UI components (e.g., LocationSelector, CalendarGrid)
- `/pages`: Next.js pages (entry points)
- `/types`: TypeScript types and interfaces
- `/utils`: API calls and helpers
- `/backend`: Flask backend for moon phase data
- `TECHNICAL.md`: Specs, architecture, and data models
- `README.md`: Project overview and backend API

---

Happy coding! 🚀 