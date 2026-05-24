# Overview

Moon Calendar is a **Next.js 15 static web app** that shows moon phases for selected cities. It computes astronomy data in the browser, renders it in several visual themes, and ships as a GitHub Pages–compatible static export.

An optional Flask backend exists but is **not wired to the UI** — the frontend generates all data client-side.

## What users see

| Piece | Role |
|-------|------|
| **City picker** | Choose from Cape Town, New York, London, Hong Kong, Melbourne |
| **Theme picker** | Calendar, Lunar Cycle, Hourly Timeline, or Poster |
| **Viewing time slider** | Set the local hour (0–23, default 9pm) used for daily themes |
| **Parallactic rotation** | Hourly Timeline checkbox — slow rotation matched to observer lat/lon |
| **Infinite scroll** | Calendar and Lunar Cycle load 6-month chunks as you scroll |
| **Poster year nav** | Poster loads a full year; prev/next year buttons |
| **Perf ticker** | Small overlay showing generation time per fetch (dev aid) |

## Three concentric rings

Think of the codebase in three rings:

1. **Compute** — Pure functions: astronomy math, parallactic rotation, image frame mapping. Testable, no UI. Lives in `src/utils/`.
2. **Orchestration** — When to fetch, how much data, poster year caching, infinite scroll. Lives mainly in `src/app/page.tsx`.
3. **Presentation** — Theme-specific layouts consuming the same `MoonPhaseEntry` shape. Lives in `src/components/`.

The optional Flask backend is a parallel compute path (ring 1) that mirrors the frontend generator but is not connected to rings 2–3.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Astronomy | `astronomy-engine` (client), `ephem` (optional backend) |
| Timezones | Luxon |
| Tests | Vitest (`test/`) |
| Deploy | Static export → GitHub Pages |

## Related docs

- [Architecture](./architecture.md) — file and layer breakdown
- [Data flow](./data-flow.md) — step-by-step fetch and render path
- [Themes](./themes.md) — what each view mode does
- [Roadmap](./roadmap.md) — what's shipped vs planned
