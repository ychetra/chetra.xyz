# chetra.xyz — Build Spec (Phase 2)

Single-page portfolio + notes stub. Astro 5, Tailwind 4 (via @tailwindcss/vite, already configured), GSAP ScrollTrigger. Static output. Audience: prop firms / funds. Tone: quiet, precise, zero hype. ALL copy below is final — use verbatim, no lorem ipsum, no invented numbers.

## Tokens (already in src/styles/global.css @theme)

bg #0B0A08 · surface #141210 · elevated #1C1916 · line #2A251F · fg #EDE6DA · muted #8F8577 · accent #F0B429 · accent-dim #9C7418 · up #3FCF8E · down #E5484D
Tailwind classes: `bg-bg`, `bg-surface`, `text-fg`, `text-muted`, `text-accent`, `border-line`, `text-up`, `text-down`, `font-display`, `font-body`, `font-mono`.

## Fonts

Self-hosted via fontsource variable packages (already installed): import in Base layout:
```js
import '@fontsource-variable/fraunces';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
```
Fraunces = display only (h1/h2/big numbers, weight 600–900, tight tracking, line-height ≤1.0 on hero). Instrument Sans = body/UI. JetBrains Mono = labels/data/kickers (11–13px, uppercase, letter-spacing 0.15–0.25em). NEVER use Inter, Roboto, Arial, Space Grotesk.

## Layout DNA (variance 8, motion 7, density 4)

Asymmetric editorial: 12-col grid, content blocks deliberately off-center (7/5, 8/4 splits), generous whitespace, full-bleed 1px `line` dividers between sections. Section kickers in mono: `// SECTION NAME` with the `//` in accent. Zero border-radius everywhere. No box shadows — depth via borders + surface steps only.

## Files to create

- `src/layouts/Base.astro` — html shell, fonts, global.css, meta/OG/canonical, favicon, nav, footer
- `src/pages/index.astro` — composes all sections
- `src/pages/notes/index.astro` — stub page
- `src/components/Nav.astro`, `Hero.astro`, `Metrics.astro`, `About.astro`, `Factory.astro`, `Projects.astro`, `Stack.astro`, `Contact.astro`, `Footer.astro`
- `src/scripts/motion.js` — all GSAP code, imported once in Base with `<script>` (bundled, type module)
- `public/favicon.svg` — minimal: amber `▲` over `C` or mono "C." on dark square, geometric
- `public/robots.txt`

## Meta (Base.astro)

- title: `Chetra — Discipline, engineered.`
- description: `Systematic day trader in Phnom Penh. I build autonomous trading systems: a strategy factory with anti-overfit gates, real-spread validation, and a risk ladder that never negotiates.`
- OG: og:title, og:description, og:image `/og.png` (1200×630 — file added later, wire the tag now), og:url https://chetra.xyz, twitter:card summary_large_image
- canonical https://chetra.xyz · lang="en" · theme-color #0B0A08

## Nav

Fixed top, bg-bg/90 backdrop-blur, border-b border-line. Left: mono wordmark `chetra.xyz` (fg, accent dot). Right links (mono, 12px, uppercase): Work `#factory` · Projects `#projects` · Notes `/notes` · Contact `#contact`. Mobile <768px: hamburger → full-screen overlay (bg-bg), links stacked in Fraunces 2.5rem, staggered fade-in. Hamburger = 2 lines animating to X (CSS transform).

## Sections

### 1. Hero (100svh, grid 7/5, items-end, pb big)

Left:
- kicker: `// CHETRA — PHNOM PENH · SYSTEMATIC DAY TRADER`
- h1 Fraunces 900, clamp(3.5rem,9vw,7.5rem), line-height 0.95: `Discipline,` newline `engineered.` — "engineered." italic weight 600 in accent.
Right (aligned to baseline):
- paragraph: `I build the machines that keep me disciplined. An autonomous strategy factory — thousands of trials, anti-overfit gates, locked holdout data — and a risk ladder that never negotiates.`
- CTAs: primary `View track record` → `#factory` (mono uppercase, bg-accent text-bg, magnetic hover); ghost `Contact` → `#contact` (border border-line, hover border-accent).

Background motion: full-width SVG equity curve anchored to bottom third, stroke accent at 35% opacity, drawn left→right over ~2.5s on load (stroke-dashoffset via GSAP). Path: plausible jagged upward equity curve (hand-author ~24 points, includes 2 visible drawdown dips — realism matters). Below curve a subtle vertical-gradient fill accent→transparent at 4% opacity. Static (already drawn) if prefers-reduced-motion.

### 2. Metrics strip (id="metrics", border-y border-line, grid 5 cols, gap-px bg-line, cells bg-surface)

Cells (label mono muted 11px / value Fraunces 2.5rem / note 12px muted):
1. `SHARPE — REAL SPREAD` / `1.53` / `MT5 validation, 512 trades`
2. `HOLDOUT SHARPE` / `3.75` (text-up) / `locked data, 2026 H1`
3. `DEFLATED SHARPE` / `0.91` / `gate ≥ 0.90 — passed`
4. `MAX DRAWDOWN` / `11.1%` (text-down) / `real-spread backtest`
5. `TRIALS → SURVIVORS` / `3,911 → 1` (the "1" in accent) / `the factory rejects 99.97%`

Numbers count up from 0 when scrolled into view (GSAP, once, skip if reduced-motion). Mobile: 2 cols, last cell spans 2.

### 3. About (id="about", grid 5/7 — kicker column left, text right; asymmetric opposite of hero)

kicker: `// WHY DISCIPLINE`
Body (Fraunces 600 1.75rem lead sentence, rest Instrument Sans 1.125rem muted, key phrases in fg with accent underline):
Lead: `Most traders lose to themselves before they lose to the market.`
Then: `I treat that as an engineering problem. My risk ladder is hard-coded: 1% risk drops to 0.5% after a loss. Two losses and the day is over. A kill-switch is always armed. The rules live in code because code doesn't renegotiate at 2 a.m.`
Then: `Self-taught in Phnom Penh. The market doesn't care where you sit — only whether your process holds.`

### 4. Factory — flagship case study (id="factory", bg-surface, border-y border-line)

kicker: `// CASE STUDY — THE STRATEGY FACTORY`
h2 Fraunces: `A factory that fires strategies.`
Intro: `An autonomous pipeline that researches, tests, and rejects trading strategies without me in the loop. MT5 runs in Docker behind a Wine bridge; a vectorbt engine backtests against real spread costs; every candidate faces anti-overfit gates before it earns a forward test. 19 strategy modules. 8 symbols. One survivor so far — and that's the point.`

**Pipeline diagram**: 6 stages horizontally (vertical on mobile): `Research → Screen → Validate → Audit → Compare → Live`. Each stage = bordered mono label cell; connectors are SVG lines with a small accent dash flowing along them (GSAP repeat, subtle, pausable via reduced-motion; on scroll into view stages fade in staggered). Under each stage a 1-line mono 11px note: Research `idea → parameter space` · Screen `vectorbt, 3,911 trials` · Validate `MT5 real spreads` · Audit `DSR gate ≥ 0.90 + locked holdout` · Compare `3 profiles: firm / real / crypto` · Live `paper first. always.`

**Funnel block** (h3 mono: `THE FUNNEL`): 4 rows, each row = mono label + horizontal bar (bar widths log-scaled: 100% / 56% / 9% / 2%, min-width so "1" stays visible; bars accent-dim, final row accent):
`3,911 parameter trials` → `2,192 combos ranked` → `20 audited for overfit` → `1 passed every gate`
Bars grow on scroll-in (GSAP scaleX, transform-origin left).

**Survivor block** (h3 mono: `THE SURVIVOR — ORB_SESSION · XAUUSD H1`): two-col. Left: definition list mono (label muted / value fg): Screen Sharpe `2.50` · Real-spread Sharpe `1.53` · Retained after costs `61%` · Holdout Sharpe (locked) `3.75` · Win rate `52.5%` · Max drawdown `11.1%` · Trades `512`. Right: pull-quote style paragraph (Fraunces 600 1.5rem): `Screen numbers flatter. The factory publishes what survives real spreads — 2.50 became 1.53, and 1.53 is the number that matters.` Below in muted body: `Nineteen of twenty audited candidates failed the deflated-Sharpe gate. The one that passed was retested on five months of locked holdout data it had never seen.`

**Status line** (mono, 13px, border border-line p-4, dot pulse in accent): `STATUS: preparing HolaPrime 2-step challenge under the validated strategy and risk ladder. Live results will replace this line when they exist — not before.`

**Cockpit strip**: h3 mono `THE COCKPIT`; one-line: `A real-time dashboard watches every stage — equity, open risk, pipeline state — backed by MongoDB Atlas.` Then a 16:9 placeholder frame (bg-elevated, border border-line, centered mono text `[ cockpit screenshots — incoming ]`). Build it as an `<figure>` easy to swap.

### 5. Projects grid (id="projects", 2×2, gap-px bg-line, cells bg-bg p-8)

kicker: `// PROJECTS`. Each card: mono index (`01`–`04`, accent), h3 Fraunces 1.5rem, body muted 0.95rem, mono footer tag. Hover: bg-surface + title→accent + index slides 4px right (GPU transform only). Cards scroll-reveal staggered.
1. `Strategy Factory` / `Autonomous research-to-rejection pipeline. MT5 in Docker, vectorbt screening, DSR audit, locked holdouts, three judging profiles.` / tag `PYTHON · DOCKER · VECTORBT` — links `#factory`
2. `Trading Cockpit` / `Real-time command view of the factory: equity, open risk, stage-by-stage pipeline state. MongoDB Atlas backend, animated pipeline UI.` / tag `FASTAPI · MONGODB · ECHARTS`
3. `Claude-brain` / `A self-evolving memory system for AI-assisted work: knowledge graphs, an Obsidian vault, and multi-agent orchestration with cost-tiered model routing.` / tag `MCP · KNOWLEDGE GRAPHS` — links https://github.com/ychetra/claude-brain (new tab)
4. `The Risk Ladder` / `Prop-firm discipline as code: 1% → 0.5% step-down sizing, two-loss daily stop, hard kill-switch. Encoded once, enforced always.` / tag `RISK · MQL5 · PYTHON`

### 6. Stack strip (id="stack", border-y border-line, py-6)

Single row (wraps), mono 12px uppercase muted, separated by ` · ` with accent dots: `Python` `vectorbt` `pandas` `FastAPI` `JavaScript` `ECharts` `D3` `Docker` `MongoDB` `MQL5` `MCP / multi-agent`

### 7. Contact (id="contact", tall py, centered, max-w-2xl)

kicker centered: `// CONTACT`
h2 Fraunces clamp(2.5rem,6vw,4.5rem): `The numbers are validated.` newline `The discipline is built.` (second line muted)
Body: `If you fund traders — or want trading systems built with the same rigor — get in touch.`
Primary CTA: `hi@chetra.xyz` → mailto (big, mono, bg-accent text-bg, magnetic hover). Secondary link: `GitHub — ychetra` → https://github.com/ychetra (mono, underline accent).

### Footer

border-t border-line, mono 11px muted, flex between: `© 2026 CHETRA · CHETRA.XYZ` — right: `EVERY NUMBER FROM VALIDATED RUNS.`

### Notes stub (/notes)

Same Base layout. kicker `// NOTES`, h1 Fraunces `Notes`, body muted: `Writeups are coming: the anti-overfit gate design, and why the risk ladder never negotiates. No schedule promised — they'll be published when they're true.` Link back home (mono).

## Motion rules (src/scripts/motion.js)

- gsap + ScrollTrigger registered once. ALL animations: transform/opacity only (GPU), never layout properties.
- Global: sections' children reveal on scroll — y:24→0, opacity:0→1, stagger 0.08, duration 0.7, ease power2.out, once.
- `prefers-reduced-motion: reduce` → skip ALL gsap (early return; content must be fully visible without JS — set initial hidden states VIA GSAP ONLY, never in CSS, so no-JS/reduced-motion users see everything).
- Magnetic hover on `.magnetic` CTAs: translate toward cursor max 6px, spring back on leave (desktop pointer:fine only).
- 60fps: no scroll-linked scrubbing except the pipeline connector dash; throttle mousemove with rAF.

## Hard constraints

- Total JS < 200KB (gsap core+ScrollTrigger ~80KB min — fine; no Three.js, no other libs)
- No horizontal overflow 375px→4K. Test grid collapses: hero→1col stack, metrics→2col, factory survivor→1col, projects→1col at <640px.
- Keyboard navigable: skip-to-content link, focus-visible outlines (accent), nav overlay traps focus properly, all interactive elements real `<a>`/`<button>`.
- Semantic landmarks: header/nav/main/section[aria-labelledby]/footer. Headings strictly h1→h2→h3.
- Contrast: muted #8F8577 on #0B0A08 ≈ 5.5:1 — OK for body; never use muted below 12px except uppercase mono labels ≥11px with wide tracking.
- `npm run build` must pass clean. Verify with `npm run build` before finishing.
