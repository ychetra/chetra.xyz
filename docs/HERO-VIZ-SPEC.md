# Hero Trading Visualization — Build Spec (Loop 12)

Replace the hero's static equity-curve SVG with an animated, canvas-drawn **live equity curve with trade markers** — the visitor watches a track record form. Reads as *disciplined system output*, not retail chart noise. Simulated data, honestly labeled. Astro 5 + GSAP already present; the viz itself is vanilla `<canvas>` + `requestAnimationFrame`. NO new deps.

## What it replaces
Current hero (src/components/Hero.astro) has:
- `<div data-hero-curve>` wrapping an SVG equity path (`data-equity-line`, faded fill) + the crosshair overlay (`data-crosshair-v/h/chip`).
- motion.js: `initEquityCurve()` (SVG stroke draw-in) and `initHeroCrosshair()` (pointer crosshair).

Replace the SVG with a `<canvas data-hero-canvas>` in the same `[data-hero-curve]` wrapper (keep the wrapper's positioning classes + `data-curve-points` seed). Keep the crosshair feature but make it read the canvas curve (see §4). Remove `initEquityCurve()` (SVG-specific); add `initHeroViz()`.

## Behavior — the animation
A continuously-running equity simulation, GPU-friendly (canvas 2D, transforms via canvas transforms, requestAnimationFrame, frame-time throttled to ~60fps, capped delta so background-tab catch-up doesn't spike):

1. **Curve drawing**: an equity line advances left→right across the hero's lower area. Seed with a deterministic upward-drift-with-2-dips series (reuse the shape sense of the existing `equityPoints`). New points append at the right edge every ~500ms; the view scrolls so the newest point rides near the right. Line = accent color, ~2px, subtle glow via a second faint wide stroke (no CSS shadow — canvas shadowBlur is fine, cheap here).
2. **Fill**: faint accent gradient under the line to the baseline (matches current faded fill).
3. **Trade markers**: as the curve extends, occasionally (~1 in 4 new points) drop a trade marker at that point:
   - win = small up-triangle / dot in `--color-up`, loss = down in `--color-down`, weighted ~55/45 (matches the published 52.5% win rate loosely — DO NOT print an exact win-rate number on the hero).
   - markers fade in (scale+opacity over ~400ms) then persist; old markers scroll off the left with the curve.
   - a marker occasionally shows a tiny mono `+0.4R` / `−1.0R` label near it (R-multiples, generic, no equity-value claim). Keep sparse — 1 label visible at a time max, fades after ~1.5s.
4. **Now-dot**: a pulsing accent dot rides the newest point (like the cockpit's).
5. **Grid**: very faint horizontal gridlines (line color, low alpha) + a baseline. No axis labels (it's ambient, not a real chart).
6. **Honesty label**: a tiny mono tag, bottom-corner of the hero viz area, `--color-muted`, ~10px: `simulated · illustrative`. Always visible (same ethos as cockpit DEMO tag). Must not overlap the hero headline/CTAs.

The whole thing sits BEHIND the hero text (z below the content grid), low opacity so text stays readable — match the current `opacity-50 md:opacity-100` + it lives in the bottom ~half/two-thirds. Text contrast over it must stay AA (verify: headline + body over the busiest part of the curve).

## §4 Crosshair (keep, adapt)
Keep the terminal crosshair on desktop pointer:fine. It currently reads SVG curve points; now it should read the canvas curve's current in-memory points array (expose the live series from initHeroViz so the crosshair maps cursor-x → nearest sample y). Chip still shows `equity NN.N%` self-referential (0–100% of the visible curve's own min/max — NOT a fabricated return). If wiring the crosshair to the live scrolling series is fiddly, it's acceptable to compute y from the same sample buffer the canvas draws. Reduced-motion / touch: crosshair absent as today.

## Hard requirements
- **Canvas sizing**: handle devicePixelRatio (crisp on retina) and window resize (re-fit; debounced). Use the wrapper's client size.
- **Lifecycle** (this codebase runs Astro ClientRouter — non-negotiable): init in motion.js on `astro:page-load` via `initHeroViz()` inside the existing structure; register the rAF loop + resize listener so they're torn down on `astro:before-swap` (cancelAnimationFrame, remove listener). Follow the exact pattern of the existing tracked-timer/`ctx` teardown. No leaks across home→work→home (verify: one rAF loop, not stacking).
- **Visibility gating**: pause the rAF loop when the hero is scrolled out of view (IntersectionObserver) AND when the tab is hidden (visibilitychange) — save battery. Resume cleanly.
- **prefers-reduced-motion**: NO animation. Draw ONE static frame of the full seed curve + a few markers (representative), then stop (no rAF). Everything visible, nothing moving. (Canvas static draw once.)
- **Theme-aware**: read colors from CSS custom properties at draw time via `getComputedStyle(document.documentElement).getPropertyValue('--color-accent')` etc., re-read on `astro:after-swap`/theme change so a light/dark toggle recolors the canvas. (Cheap — cache per-frame, refresh the cache on a `theme` change; simplest: re-read the small set once per second or on a custom event. Pick the clean approach and note it.)
- Zero border-radius aesthetic (canvas shapes: triangles/thin rects/dots — no rounded unless a dot). No layout thrash. JS budget: whole site < 200KB raw (this adds maybe 3-5KB; report).
- Keep it subtle and premium — quiet quant, not flashing casino. Low alpha, restrained marker frequency, smooth easing.

## Files
- src/components/Hero.astro — swap SVG block for `<canvas data-hero-canvas>`; keep wrapper + crosshair markup + `data-curve-points` seed. Update the comment.
- src/scripts/motion.js — remove `initEquityCurve()`, add `initHeroViz()` (canvas engine) + adapt `initHeroCrosshair()` to the live series; wire teardown + IO + visibility gating.
- No other files unless strictly needed.

## Verification (report each)
- 60fps: DevTools/Playwright perf trace or rAF delta logging — mean frame ≤ ~17ms, no long tasks from the loop.
- Leak check: home→work→home ×3, confirm exactly ONE rAF loop running (instrument requestAnimationFrame/cancelAnimationFrame counts) and one resize listener.
- Visibility: scroll hero out → loop pauses (rAF stops); scroll back → resumes. Tab hidden → pauses.
- Reduced-motion: static frame drawn, zero rAF scheduled, curve + markers visible.
- Theme: toggle light/dark → canvas recolors (accent/up/down/line follow tokens), no stale dark-on-light.
- Retina: crisp (dpr scaling), correct after resize (shrink/grow window).
- Contrast: hero headline + body text remain AA over the viz (spot-check the busiest region).
- Mobile 375px: no overflow, viz fits, still readable behind text; touch has no crosshair, animation still runs (or is it too heavy on mobile? — if perf dips, halve marker density / point cadence on small screens; note the choice).
- `npm run build` clean; JS delta reported.
