# Live Cockpit Mock — Build Spec

Replace the placeholder `<figure>` in `src/components/Factory.astro` (the "THE COCKPIT" block, ~line 161, the `[ cockpit screenshots — incoming ]` figure) with a self-contained animated trading terminal. All motion vanilla JS + the already-installed GSAP. NO new dependencies, NO canvas libs, NO chart libs — hand-built SVG. Must stay in JS budget (whole site <200KB).

## Design language (match site)

Tokens (Tailwind classes already wired): bg-bg #0B0A08 · bg-surface #141210 · bg-elevated #1C1916 · border-line #2A251F · text-fg #EDE6DA · text-muted #8F8577 · text-accent #F0B429 · text-up #3FCF8E · text-down #E5484D. Fonts: font-mono (JetBrains Mono) for ALL cockpit text/data, font-display only if a big number needs it. Zero border-radius. No shadows. 1px borders + surface steps for depth.

## Layout — a 16:9 terminal, CSS grid inside the figure

Keep the outer `<figure class="... aspect-video border border-line bg-elevated" data-reveal-item>` wrapper (16:9). Inside, build a terminal with a thin top status bar + a 3-region body grid:

```
┌───────────────────────────────────────────────────────────┐
│ ● LIVE  ORB_SESSION · XAUUSD · H1        DEMO — SIMULATED  │  <- status bar
├──────────────────────────────────┬────────────────────────┤
│                                  │  OPEN RISK   0.50%      │
│     EQUITY (animated line,       │  [risk gauge bar]       │
│      moving now-dot, grid)       │  DAY P&L    +0.82%      │  <- stat rail
│                                  │  SHARPE      1.53       │
│                                  │  WIN RATE    52.5%      │
├──────────────────────────────────┴────────────────────────┤
│ RESEARCH ▸ SCREEN ▸ VALIDATE ▸[AUDIT]▸ COMPARE ▸ LIVE      │  <- pipeline strip (active pulses)
├───────────────────────────────────────────────────────────┤
│ 14:32:07  gate DSR=0.909 ✓ pass    (streaming log ticker)  │  <- log line, rotates
└───────────────────────────────────────────────────────────┘
```

Mobile (<640px): stat rail drops below the equity panel (stack), pipeline strip scrolls horizontally (overflow-x-auto, no page overflow), log stays. Keep it legible at 375px — shrink font to 10px mono there.

## Animated pieces (all pausable via prefers-reduced-motion — see rules)

1. **Status bar**: `● LIVE` dot pulses (opacity yoyo). A clock `HH:MM:SS` ticks every second (JS setInterval, start from a fixed seed time so SSR/hydration match — begin at 14:32:00 and increment client-side). `DEMO — SIMULATED` in muted, right-aligned, always visible (honesty).

2. **Equity panel** (the star): an SVG equity curve on a faint grid.
   - Pre-authored base path (~60 points, realistic upward-drift with 2 drawdown dips), stroke accent, 1.5px, `vector-effect: non-scaling-stroke`.
   - On reveal: draw left→right (stroke-dashoffset, pathLength=1, ~2s).
   - After drawn: a "now dot" (small accent circle, 3px square to honor zero-radius — use a tiny rotated square or just a 4px accent rect) rides the last point with a soft pulse. Optionally append 1 new point every ~2.5s so the line visibly extends (shift viewBox or keep a rolling window of ~60 pts). Keep it cheap — rAF or GSAP, transform/opacity only where possible.
   - Faint horizontal grid lines (border-line color, 0.4 opacity) + a baseline.
   - Y axis implied, no labels needed; one small mono label top-left `EQUITY` and a live value bottom-right like `+4.7%` that counts as the line grows.

3. **Stat rail** (right, mono): OPEN RISK `0.50%` with a thin horizontal gauge bar (accent-dim track, accent fill ~25%). DAY P&L `+0.82%` in text-up (flip a value occasionally: every ~4s nudge it, green if ≥0 else red). SHARPE `1.53`. WIN RATE `52.5%`. Values right-aligned, labels left, mono 11–12px, rows separated by 1px border-line.

4. **Pipeline strip**: 6 stages `RESEARCH ▸ SCREEN ▸ VALIDATE ▸ AUDIT ▸ COMPARE ▸ LIVE`. One stage "active" at a time, cycling every ~1.8s: active = text-accent + subtle bg-surface box; others muted. A small accent dash flows along the ▸ connectors (reuse the existing pipeline connector idea).

5. **Log ticker**: a single mono line (11px) that rotates through ~6 plausible lines every ~2.2s with a quick fade. Lines (use these, real-flavored):
   - `14:32:07  screen  vwap_reversion  Sharpe~1.59  queued`
   - `14:32:09  mt5     real-spread charge applied  −39%`
   - `14:32:11  audit   DSR 0.909 ≥ 0.90  ✓ pass`
   - `14:32:14  audit   breakout_xauusd  ✗ fail (overfit)`
   - `14:32:16  holdout locked 2026-H1  Sharpe 3.75`
   - `14:32:19  compare firm/real/crypto  1 survivor`
   Prefix timestamps continue from the clock loosely. Use text-up for ✓, text-down for ✗, text-muted for the rest, accent for numbers if easy.

## Caption

Under the terminal keep a `<figcaption>` (mono, muted, 11px): `Simulated cockpit — live instance runs behind auth at trading.chetra.xyz.` (honesty: it's a mock).

## Motion rules (hard)

- Put cockpit JS in a new file `src/scripts/cockpit.js`, import it once (module) from Factory.astro or Base — match how motion.js is loaded. Keep motion.js untouched except if you must register the reveal.
- `prefers-reduced-motion: reduce` → NO loops/intervals/rAF. Render a static representative frame: equity line fully drawn, clock shows a fixed time, active stage = AUDIT, one log line shown, dot solid (no pulse). Set any JS-hidden states so nothing is invisible. Early-return the animation setup.
- 60fps: transforms/opacity + the one SVG stroke draw. No layout thrash. Throttle any per-frame work. Clear intervals on nothing (single page) but guard against duplicate init.
- No hydration mismatch: seed clock/values deterministically, mutate only after mount.

## Acceptance

- `npm run build` clean.
- At 1440px and 375px: terminal readable, no horizontal page overflow, looks alive.
- Reduced-motion: full static frame, everything visible, zero running timers.
- Total site client JS still <200KB (report the build's JS number).
