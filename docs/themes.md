# Themes

Four view modes share the same `MoonPhaseEntry[]` data but lay it out differently.

## Summary

| Theme | Component | Layout | Infinite scroll |
|-------|-----------|--------|-----------------|
| Calendar | `CalendarGrid` | 7-column weeks, Monday start | Yes |
| Lunar Cycle | `CalendarGrid` | 15-column rows (~half synodic month) | Yes |
| Hourly Timeline | `HourlyTimeline` | Looping video + phase label | No |
| Poster | `CalendarGrid` | 12×31 table (months × days) | No (year nav) |

Theme is selected in `page.tsx` and passed as the `theme` prop to `CalendarGrid`.

---

## Calendar

- Weeks built with `buildCalendarWeeks()` — pads to full Mon–Sun rows.
- Month name shown when the week crosses into a new month.
- Each cell: moon image + day-of-month number; today highlighted.
- Black background, compact grid (`max-w-3xl`).

## Lunar Cycle

- Data split into rows of **15** entries (roughly half a ~29.5-day cycle).
- Month label on the left when the row starts a new month.
- Wider layout (`max-w-6xl`), slightly larger moon icons.

## Hourly Timeline

- Delegated to `HourlyTimeline` — not rendered by the grid layouts.
- Uses embedded WebM (`MOON_VIDEO_DATA_URI` from build-generated `phases.inline.ts`).
- **Default (checkbox off):** Phase name from video progress only; video plays at normal speed with no rotation transform.
- **Parallactic rotation (checkbox on):** Slow playback plus smoothed parallactic angle at the selected city’s lat/lon along a synodic month. Overlay shows local date/time for the sampled instant.
- Parallactic checkbox lives in the main controls (where viewing time appears for other themes). No viewing-time slider on this theme yet (planned for driving parallactic motion later). Observer timezone is the selected city’s IANA zone.
- Does not use the daily `fetchMoonPhases` grid for the video itself.

## Poster

- Transposed grid: **columns = months 1–12**, **rows = days 1–31**.
- Empty cells where a month has fewer than 31 days.
- Full year loaded at once; **Previous Year** / **Next Year** buttons in `page.tsx`.
- Years cached in `posterData` to avoid refetching.

## Visual rendering

All themes use `getMoonPhaseVisual(entry, size, className, theme)`:

- Picks JPG frame from `moon_age_days`
- Applies CSS `transform: rotate(rotation_angle deg)` for location-accurate orientation

## Planned

- PDF export for Poster (`@react-pdf/renderer`, `html2canvas`, `jspdf` are in dependencies but not wired)
- Additional themes (Dark, Solarized) — see [Roadmap](./roadmap.md)
