# Deployment

The app is built as a **static export** suitable for GitHub Pages or any static host.

## Configuration

`next.config.ts`:

- `output: "export"` — no Node server required in production
- `images.unoptimized: true` — required for static export
- `basePath` / `assetPrefix` from env — set in CI for project Pages URLs

Environment variables (CI):

| Variable | Purpose |
|----------|---------|
| `NEXT_BASE_PATH` | e.g. `/moon-calendar` for `https://owner.github.io/moon-calendar/` |
| `NEXT_ASSET_PREFIX` | Same prefix for asset URLs |

## GitHub Pages (CI)

Workflow: `.github/workflows/deploy-pages.yml`

1. Trigger: push to `main` or manual dispatch
2. `npm run verify-images` — checks `src/assets/phases/`
3. `npm run build` — also runs `generate-inline-phases.js`, then `next build`
4. Upload and deploy `./out`

Enable Pages in repo settings with source **GitHub Actions**.

## Local static build

```bash
npm run build
# output in ./out
```

Serve `out/` with any static file server to preview.

## Build pipeline

```
verify-moon-images.js  →  generate-inline-phases.js  →  next build  →  out/
```

See [Moon images](./assets/images.md) for asset requirements.

## TBD

- Vercel notes (also supported; no basePath needed for root deploy)
- Backend deployment if API is revived
