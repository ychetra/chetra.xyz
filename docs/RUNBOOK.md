# chetra.xyz — Runbook

1. **Dev:** `npm run dev` → http://localhost:4321 (currently on `--port 5173` so the forven.chetra.xyz tunnel serves it)
2. **Build:** `npm run build` → static site in `dist/`
3. **Deploy:** `npx wrangler pages deploy dist --project-name chetra-xyz` (first time: `npx wrangler login`, then add custom domain `chetra.xyz` under Pages → chetra-xyz → Custom domains). Alternative: connect the GitHub repo in Cloudflare Pages dashboard → auto-deploy on push (build command `npm run build`, output `dist`).
4. **Edit content:** copy lives in `src/components/*.astro` (one file per section); metrics in `Metrics.astro` + `Factory.astro`. Design tokens: `src/styles/global.css`. Full copy reference: `docs/BUILD-SPEC.md`.
5. **Add project:** duplicate a card block in `src/components/Projects.astro` (index, title, body, tag).

## Email (hi@chetra.xyz)
Cloudflare dashboard → chetra.xyz zone → Email → Email Routing → enable, add address `hi@chetra.xyz` → forward to chetra.storeit@gmail.com → confirm via the verification mail. MX/TXT records are added automatically.

## Before going live
- Replace cockpit placeholder in `src/components/Factory.astro` with real screenshots (drop files in `public/`, swap the `<figure>`)
- Update status line in `Factory.astro` when the HolaPrime challenge actually starts
- Remove `allowedHosts` from `astro.config.mjs` (tunnel-only convenience; harmless in static build but stale)
