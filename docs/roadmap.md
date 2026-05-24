# Roadmap

Living checklist — update as features ship.

## Shipped

- [x] Location-based moon phase calendar (city dropdown)
- [x] Infinite scroll (6-month chunks) — Calendar and Lunar Cycle
- [x] Responsive, full-screen calendar grid
- [x] Themes: Calendar, Lunar Cycle, Hourly Timeline, Poster
- [x] Poster mode with year navigation
- [x] Static export for GitHub Pages
- [x] Client-side generation (`astronomy-engine`)
- [x] Parallactic moon orientation (location-aware rotation)
- [x] Build-time moon image verification
- [x] Vitest snapshots for phase generation (select cities)

## Planned

- [ ] Poster PDF export (deps installed: `@react-pdf/renderer`, `html2canvas`, `jspdf`)
- [ ] Integrate location search (map / geolocation)
- [ ] Expand city / location options
- [ ] More themes (Dark, Solarized, …)
- [ ] User accounts for saving favorites
- [ ] Enhanced design customization
- [ ] Visual regression tests for calendar layout
- [ ] Data flow diagram in docs (expand [data-flow.md](./data-flow.md))

## Notes

When picking up a feature, check [Architecture](./architecture.md) and [Themes](./themes.md) first so new work fits existing patterns.
