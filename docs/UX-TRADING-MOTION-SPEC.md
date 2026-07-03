# UX Fixes + Trading-Logic Motion — Build Spec (Loop 10)

Three parts: (A) two functional UX fixes found by inspection, (B) the "candidate journey" — an animation that *narrates the factory's logic*, (C) trading-terminal micro-interactions. All motion must read as *the system thinking*, not decoration: everything animates data or process that's real and already published.

## A. Functional UX fixes

### A1. Kill the 308s — trailing-slash internal links
Cloudflare Pages 308-redirects `/work` → `/work/` (directory output). Every internal href must carry the trailing slash so clicks and prefetches skip the redirect hop.
- Sweep ALL internal hrefs in: Nav.astro, CommandPalette.astro (+ its commands data in palette.js if any), Projects.astro ("view all" + card links), work/index.astro (card + archive + "More on GitHub" stays external), work/[slug].astro (back/prev/next/all-work), notes/index.astro, notes/[slug].astro (back link), 404.astro, Metrics.astro (tearsheet link), Footer.astro if any, tearsheet.astro (back-to-site). Pattern: `/work` → `/work/`, `/work/${slug}` → `/work/${slug}/`, `/notes` → `/notes/`, `/tearsheet` → `/tearsheet/`. Leave `/` alone; leave `/#contact` and `/tearsheet.pdf` (file) alone.
- Also set `trailingSlash: 'always'` in astro.config.mjs so dev matches prod behavior and future links fail loudly in dev if wrong. VERIFY the sitemap + canonical URLs still emit correctly after this (canonical should end with `/` for pages; check Base.astro's canonical builder handles it).

### A2. Nav active state
Current section must be visible in the nav (desktop + mobile overlay):
- In Nav.astro compute current section from `Astro.url.pathname`: `/work*` → Work, `/notes*` → Notes (Contact is an anchor — never active).
- Active link: `aria-current="page"` + accent color + existing underline offset style (border-b or underline, accent). Subtle, mono aesthetic preserved.
- Because the header is `transition:persist`, the active state must ALSO update on client-side navs: small addition in motion.js's `astro:page-load` init — read `location.pathname`, toggle `aria-current`/active class on header links. (SSR sets it right for hard loads; the JS keeps the persisted header honest after soft navs.)

## B. The candidate journey (flagship — the factory visibly thinking)

In Factory.astro's pipeline diagram (the 6-stage RESEARCH→…→LIVE strip): animate **candidates flowing through and mostly dying** — the system's real logic, dramatized with real proportions.

- A small 4px square "candidate" spawns at RESEARCH every ~3.5s, slides along the connector line stage to stage (GSAP x-tween along the strip; on mobile vertical layout, y-tween).
- Fate per candidate, weighted like the real funnel (published: 3,911 → 2,192 ranked → 20 audited → 1 passed):
  - ~44% die at SCREEN (square flashes #E5484D, drops 4px, fades out)
  - ~54% of survivors die at VALIDATE/AUDIT (same death, at those stages — bias to AUDIT: it's the DSR gate)
  - ~1 in 12 spawns reaches COMPARE; only rarely (~1 in 25 overall) reaches LIVE — flashes #3FCF8E, then fades.
  - Deaths should feel matter-of-fact, not celebratory. The occasional green survivor is the payoff.
- Implementation: one reusable element pool (max 3 concurrent candidates), transforms/opacity only, module in cockpit.js or a new src/scripts/factory-flow.js following the SAME lifecycle pattern (init on astro:page-load, teardown intervals/tweens on astro:before-swap, IntersectionObserver-gated so it only runs while the pipeline is on screen, hard-stop when tab hidden via document.visibilitychange).
- Reduced motion: no journey animation at all (static diagram as today).
- A tiny mono caption under the strip (muted, 10px): `simulation — proportions from the real funnel` (honesty label, same spirit as the cockpit's DEMO tag).

## C. Terminal micro-interactions

### C1. Hero curve crosshair
On the hero equity SVG (desktop pointer:fine only): hovering shows a trading-terminal crosshair — 1px vertical + horizontal hairlines (line color, 0.6 opacity) tracking the cursor, plus a small mono readout chip near the cursor (bg-elevated border border-line, 10px mono) showing a % value derived from the curve's y-at-cursor (map y linearly to the hero's published +% range — the readout is illustrative; label it `equity` only, no fake precision claims beyond the existing curve). rAF-throttled mousemove, transforms only, elements pre-created hidden. Touch/reduced-motion: feature absent.

### C2. Factory tape (above footer, homepage only)
A single-line scrolling mono tape (11px, muted, border-y border-line, py-2) of factory events — reuse the cockpit's log-line content style, ~10 items, seamless CSS marquee loop (duplicated track, `transform: translateX` keyframes, GPU only, ~40s loop, pauses on hover). Items are process facts already published (screen counts, gate results, survivor line, "paper first. always."). ✓/✗ colored. Reduced motion: static single row showing the first 3 items, no scroll. `aria-hidden="true"` on the duplicate track; the tape itself gets an aria-label describing it.

## Constraints
- JS budget stays < 200KB total (currently 144KB; these add ~4-6KB).
- No new deps. Zero-radius, no shadows, tokens only. All new timers/tweens follow the astro lifecycle teardown pattern — provably no leaks after nav round-trips.
- `npm run build` clean; all pages generate; no console errors.

## Verification (report each)
- Zero 308s: crawl built HTML internal hrefs → every one curls 200 directly on the preview server (and spot-check 3 on production after deploy).
- Nav active state correct on hard load AND after soft navs (home→work→notes→home), desktop + mobile overlay.
- Candidate journey: run 60s, count deaths/survivals roughly match weights; no accumulation of DOM nodes (pool reused); teardown proven after home↔work round-trips (no orphan tweens/intervals); paused when scrolled away and when tab hidden.
- Crosshair: tracks smoothly (no jank in performance trace), absent on touch + reduced-motion.
- Tape: loops seamlessly (no visible jump), pauses on hover, static under reduced motion.
- Lighthouse home ≥ 95 all categories. 375px: no overflow, tape readable, journey runs on vertical pipeline.
