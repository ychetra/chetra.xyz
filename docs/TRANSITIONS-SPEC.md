# Page Transitions + Interactive Layer — Build Spec (Loop 9)

Four parts: (A) Astro View Transitions with shared-element morphs, (B) script-lifecycle refactor (REQUIRED for A — without it all GSAP animation dies after the first client-side nav), (C) ⌘K command palette, (D) scroll-progress hairline + interactive funnel tooltips. Astro 5 syntax: `ClientRouter` from `astro:transitions` (NOT the old `ViewTransitions` name).

## A. View-transition system

1. `src/layouts/Base.astro`: `import { ClientRouter } from 'astro:transitions';` and render `<ClientRouter />` in `<head>`.
2. Astro auto-handles `prefers-reduced-motion` (plain swap, no animation) — do not add extra guards for the transitions themselves.
3. Persistent chrome: `transition:persist` + `transition:name="site-nav"` on the `<header>` in Nav.astro; same idea for the footer (`site-footer`). They must not flicker or replay during navs.
4. **Shared-element morphs** (the wow):
   - Project card title (homepage `Projects.astro` card h3 AND `/work` index card h3) ↔ detail page h1: `transition:name={`project-title-${slug}`}`. Set on BOTH ends. Note: a name must be unique per page — the homepage shows only 4 featured cards and /work shows all; each card's name is slug-scoped so this holds.
   - Notes index post title ↔ note detail h1: `transition:name={`note-title-${slug}`}`.
   - Keep morphs to titles only — morphing whole cards looks mushy.
5. Default page animation: Astro's default fade is fine for everything else; if trivial, give `<main>` a slightly longer fade via `transition:animate` on main content — taste call, keep subtle, no slides that fight the morphs.
6. Prefetch: in `astro.config.mjs` add `prefetch: { prefetchAll: true, defaultStrategy: 'hover' }`. (Astro 5 has prefetch built in; no integration needed.)

## B. Script lifecycle refactor (blocker-grade)

Current `src/scripts/motion.js` and `src/scripts/cockpit.js` init on `DOMContentLoaded` — fires once per hard load, never on client-side navs. Also cockpit.js is imported from Factory.astro (only on `/`), motion.js from Base (all pages). With ClientRouter, module scripts execute ONCE for the whole session.

Refactor both to the Astro lifecycle:
- Replace the `ready()`/DOMContentLoaded pattern with `document.addEventListener('astro:page-load', init)` — `astro:page-load` fires on initial load AND after every client-side nav.
- `init()` must be idempotent per page: query current DOM fresh each time; no stale element refs.
- Teardown: on `astro:before-swap` kill everything from the outgoing page: `ScrollTrigger.getAll().forEach(t => t.kill())`, clear all `setInterval`s (keep interval ids in a module-level array, clear + reset it), kill any long-lived gsap tweens on removed nodes (`gsap.killTweensOf` or track created tweens). No leaked timers — verify cockpit clock/log/pipeline intervals don't stack after nav loops (home → work → home must show ONE ticking clock, not two speeds).
- cockpit.js import moves to Base.astro alongside motion.js (its init already no-ops when `[data-cockpit]` absent — verify, add guard if not). Rationale: Factory-scoped script tags don't reliably re-run under the client router; Base-level + event-driven is the stable pattern.
- The IntersectionObserver-gated cockpit start must also disconnect/re-arm per page-load.
- Reduced-motion early-returns stay exactly as they are (checked inside init, per invocation).

## C. ⌘K command palette (terminal DNA)

New `src/components/CommandPalette.astro` + `src/scripts/palette.js` (vanilla, ≤ ~8KB, no deps), included once in Base:
- Open: `⌘K` / `Ctrl+K` / pressing `/` when not in an input. Also a subtle mono hint in the nav: `⌘K` (desktop only, muted, right of links).
- UI: centered overlay (fixed, z above nav; backdrop bg-bg/80; panel bg-surface border border-line, zero-radius, max-w-lg). A mono `>` prompt input + list of commands. Terminal styling: JetBrains Mono 13px, selected row = bg-elevated + accent left edge (2px).
- Commands (static list, fuzzy-ish startsWith/includes filter): Home `/`, Work `/work`, each featured project (label `work/<slug>`), Notes `/notes`, the notes post, Tearsheet `/tearsheet`, Download tearsheet PDF `/tearsheet.pdf`, Contact `/#contact`, GitHub (external), Email (mailto).
- Keyboard: ↑/↓ move, Enter navigates, Esc closes, focus trapped in input, backdrop click closes. On nav: close first, then navigate (plays nice with view transitions).
- A11y: `role="dialog" aria-modal="true" aria-label="Command palette"`, input labeled, `inert` on background while open (same pattern as the mobile nav overlay), restore focus on close.
- Lifecycle-safe: init via `astro:page-load` with a module-level `initialized` guard so listeners bind once (document-level keydown survives swaps; the palette element itself is transition:persist OR re-queried per page — pick the simpler correct one and note it).
- Reduced-motion: no open/close animation, instant show/hide.

## D. Small interactive garnish

1. **Scroll-progress hairline**: a fixed 2px accent line at the very top (above nav border), width = scroll progress, only on long-form pages (notes detail + work detail): implement in those two page templates (a `<div data-scroll-progress>` + a few lines in motion.js's page-load init, rAF-throttled, transform scaleX — no layout writes). Hidden (or static full) under reduced motion. Zero on pages shorter than ~1.5 viewports.
2. **Interactive funnel** (`Factory.astro` funnel rows): hover/focus a row → a small mono tooltip (absolutely positioned, bg-elevated border border-line, 11px) with per-stage detail. Content (real, from published data):
   - 3,911 trials → `vectorbt screen — clean-fill Sharpe, fast pass`
   - 2,192 ranked → `ranked by screen Sharpe — obvious failures cut`
   - 20 audited → `full DSR + holdout audit — expensive, selective`
   - 1 passed → `ORB_SESSION · XAUUSD H1 — every gate cleared`
   Rows become focusable (`tabindex="0"`, `aria-describedby` the tooltip). Touch: tap toggles. No new numbers — this is existing published data, re-surfaced.

## Hard constraints
- JS budget: total site < 200KB raw (currently ~123KB + palette ~8KB — fine; report final).
- No new npm deps.
- Zero border-radius, no shadows, token classes only.
- `npm run build` clean. All 25 pages still generate.
- The og-card routes must NOT get ClientRouter side effects (they don't use Base — confirm untouched).

## Verification (report each)
- Click-path test in a real browser (preview server): home → work → project detail → back → notes post → home. Confirm: (a) nav doesn't flicker (persisted), (b) title morphs play, (c) scroll reveals fire on every page INCLUDING after navs, (d) cockpit runs correctly when returning home — exactly one clock cadence, no doubled log rotation, (e) no console errors.
- Timer-leak check: after 3 round-trips home↔work, count active intervals (patch setInterval in test or observe clock — must tick 1s cadence).
- Palette: open with ⌘K, arrow to a project, Enter → navigates with transition; Esc closes; works after several navs.
- Reduced-motion: navs are instant swaps, content all visible, no palette animation.
- 375px: palette usable, funnel tooltips tappable, no overflow.
- Lighthouse home + one detail ≥ 95 across categories.
