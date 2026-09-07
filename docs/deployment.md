# Deployment

The app is built as a **static export** suitable for GitHub Pages or any static host.

## Configuration

`next.config.ts`:

- `output: "export"` — no Node server required in production
- `images.unoptimized: true` — required for static export
- `basePath` / `assetPrefix` from env — leave unset for a custom domain at the site root; set only for project Pages URLs with no custom domain

Environment variables (CI, optional):

| Variable | Purpose |
|----------|---------|
| `NEXT_BASE_PATH` | e.g. `/moon-calendar` for `https://owner.github.io/moon-calendar/` with no custom domain |
| `NEXT_ASSET_PREFIX` | Absolute asset host; do **not** set this to `*.github.io/...` when a custom domain is in use — GitHub may 301 those URLs to `http://`, which HTTPS pages then block as mixed content |

## GitHub Pages (CI)

Workflow: `.github/workflows/deploy-pages.yml`

1. Trigger: push to `main` or manual dispatch
2. `npm run build` — runs `verify-moon-images.js`, `generate-inline-phases.js`, then `next build`
3. Upload and deploy `./out`
4. Parallel **test** job runs `npm run test` (Vitest, `test/` directory)

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
