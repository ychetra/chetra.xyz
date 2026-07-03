# chetra.xyz — project context

Personal portfolio of Chetra (ychetra) — systematic day trader, Phnom Penh. Live at https://chetra.xyz (Cloudflare Pages, project `chetra-xyz`). Audience: prop firms who verify claims.

## The one inviolable rule
**Never invent metrics, results, dates, or capabilities.** Every number on this site comes from validated runs (see docs/BUILD-SPEC.md + /tearsheet). Gaps are written around honestly or marked for the owner — never guessed. Raw pipeline JSONs in ~/trading-agent/backtests/ are overwritten by the live factory; published numbers are a user-approved snapshot. Do not re-source without a fresh approved snapshot.

## Stack & commands
- Astro 5 + Tailwind 4 (@tailwindcss/vite) + GSAP. Static output, `trailingSlash: 'always'` (internal hrefs must end with `/`).
- `npm run dev` · `npm run build` · `npm run og` (regenerate OG cards; needs a preview server, see scripts/gen-og.mjs header)
- Deploy: `npm run build && npx wrangler pages deploy dist --project-name=chetra-xyz --branch=main --commit-dirty=true`
- JS budget: < 200KB raw total. No new npm deps without strong reason.

## Architecture notes (hard-won)
- **ClientRouter lifecycle**: all scripts init on `astro:page-load`, tear down on `astro:before-swap` (kill ScrollTriggers, clear tracked intervals). DOMContentLoaded init breaks after the first soft nav. Elements outside the persisted `<header>` are replaced each swap — re-query at use time, never cache.
- Header/footer are `transition:persist`; project/note titles carry slug-scoped `transition:name` morphs.
- Fontsource variable fonts register as "<Name> Variable" — Base.astro re-points the `--font-*` tokens.
- `.project-prose` markdown styles are duplicated in work/[slug].astro and notes/[slug].astro (Astro inlines is:global per page). Third consumer → extract to global.css.
- Design tokens live in src/styles/global.css `@theme`; components use token classes only (bg-bg, text-fg, text-accent, border-line, text-up/down). Zero border-radius, no shadows, mono for data/labels.
- Content: src/content/projects/*.md (tier: featured|archive) + src/content/notes/*.md. Featured slugs need an OG card (`npm run og`).

## Conventions
- Copy voice: quiet, precise, zero hype. Short declarative sentences.
- Reduced-motion: every animation path needs a static-complete fallback; initial hidden states set via JS only, never CSS.
- Verify with a real browser (playwright) before claiming done: 375px + 1440px, no horizontal overflow, Lighthouse ≥95 all categories.
- Cockpit + inline SVG diagrams are honest simulations — keep their DEMO/simulation labels.

## Pointers
- Specs for every major system: docs/*.md (BUILD-SPEC, TRANSITIONS-SPEC, THEME-SPEC, …) · runbook: docs/RUNBOOK.md
- Session memory: ~/.claude/projects/-Users-mac-Desktop-Me--portfolio/memory/ · vault notes: ~/claude-brain/claude-code-vault/sessions/
