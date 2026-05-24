# Moon Calendar

Beautiful lunar phases by city — infinite scroll calendar views and a year-at-a-glance poster.

Built with **Next.js 15** and **astronomy-engine** (client-side generation). Optional Flask backend included but not required to run the UI.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Pick a **city** and **theme** from the dropdowns. Calendar and Lunar Cycle scroll to load more months; Poster loads a full year with year navigation.

## Documentation

Full docs live in **[docs/](./docs/README.md)**:

- [Overview](./docs/overview.md) — what the app does
- [Architecture](./docs/architecture.md) — layers and file map
- [Data flow](./docs/data-flow.md) — fetch → render path
- [Themes](./docs/themes.md) — Calendar, Lunar Cycle, Hourly Timeline, Poster
- [Deployment](./docs/deployment.md) — GitHub Pages static export
- [Roadmap](./docs/roadmap.md) — features and plans

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server (Turbopack) |
| `npm run build` | Verify images, generate inline assets, static export → `out/` |
| `npm run test` | Vitest |
| `npm run poster:md` / `poster:csv` | CLI poster tables |

## Optional backend

```bash
cd backend && pip install flask ephem flask-cors && python moon_phase_api.py
```

See [docs/backend.md](./docs/backend.md).

## Learn more

- [Next.js](https://nextjs.org/docs)
- [Astronomy Engine](https://github.com/cosinekitty/astronomy)
- [NASA moon phase imagery](https://svs.gsfc.nasa.gov/4310/)
