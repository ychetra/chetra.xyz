# chetra.xyz

Personal portfolio — systematic day trader in Phnom Penh who builds the machines that keep him disciplined. **Live at [chetra.xyz](https://chetra.xyz).**

## Stack

Astro 5 · Tailwind CSS 4 · GSAP (ScrollTrigger) · static output on Cloudflare Pages. Fonts self-hosted via Fontsource (Fraunces / Instrument Sans / JetBrains Mono). No client framework — total JS under 130 KB.

## Structure

- `src/pages/` — homepage, `/work` (+ per-project pages), `/notes` (+ posts), `/tearsheet`, 404
- `src/content/projects/` — one markdown file per project (two tiers: `featured` get detail pages, `archive` get index rows)
- `src/content/notes/` — writeups
- `src/components/` — one file per homepage section; the animated cockpit lives in `Factory.astro` + `src/scripts/cockpit.js`
- `src/pages/og-card/` + `scripts/gen-og.mjs` — build-time social-image generation (`npm run og`)
- `docs/` — build specs and the runbook

## Commands

```sh
npm run dev        # dev server
npm run build      # static build → dist/
npm run og         # regenerate social images (needs a preview server, see script header)
npx wrangler pages deploy dist --project-name=chetra-xyz --branch=main   # deploy
```

## Principles

Every performance number on the site comes from validated runs — real-spread revalidation, a deflated-Sharpe gate, and locked holdout data. No live results are claimed until they exist. See [the writeup](https://chetra.xyz/notes/anti-overfit-gates/).
