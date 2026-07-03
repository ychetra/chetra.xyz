# Light/Dark Theme Toggle — Build Spec (Loop 11)

Add a light theme + toggle to the Amber Terminal design system. Dark stays the default and the identity; light is a deliberate "amber terminal printed on paper" variant — NOT a generic white theme.

## 1. Token architecture

`src/styles/global.css` already defines the palette as `--color-*` under `@theme`, and every component uses Tailwind classes bound to those vars — so theming = overriding the vars.

- Keep `@theme` as-is (dark values = default, also used by Tailwind for class generation).
- Add an override block:

```css
html[data-theme='light'] {
  --color-bg: #F4EFE6;        /* warm paper */
  --color-surface: #EBE4D6;
  --color-elevated: #E2D9C6;
  --color-line: #CFC4AC;
  --color-fg: #211D14;
  --color-muted: #6E6353;
  --color-accent: #8A6510;    /* darker amber — must pass contrast on paper */
  --color-accent-dim: #B08A2E;
  --color-up: #177A4E;
  --color-down: #B92C31;
}
```

- Tune values as needed for contrast: body text ≥ 4.5:1, muted mono labels ≥ 4.5:1 at their sizes, accent-on-bg ≥ 4.5:1 for text uses. Check accent-as-button (`bg-accent text-bg`): in light mode that's dark-amber bg with paper text — verify ≥ 4.5:1 or flip button text to a fixed dark ink.
- `theme-color` meta in Base.astro must follow the theme (set both via JS on toggle; SSR default stays dark).
- `::selection` and scrollbar behavior inherit vars — verify.

## 2. Deliberate exceptions — terminal surfaces STAY DARK

These are "screens within the page" and keep the dark look in light mode (like code blocks in docs):
- The cockpit terminal (Factory.astro figure) — it's a simulated monitor.
- The inline SVG architecture diagrams in llm-trading/polymarket markdown (they hardcode dark hexes; do NOT edit content files).
- The hero equity curve + crosshair chip can follow the theme (they use hardcoded hexes today — switch strokes/fills to `style="stroke: var(--color-accent)"` etc. where trivial in Hero.astro; the faint grid lines too).
- Tearsheet page: keep as-is (it has its own print logic); on-screen it may stay dark even in light mode — acceptable, it's a document preview. Just ensure nav/footer around it follow the theme.
- OG cards & generated images: untouched (build-time, always dark brand).
- Scope guard: wrap dark-locked surfaces with a `data-theme-lock="dark"` attribute + CSS that re-declares the needed `--color-*` vars back to dark values inside it. That way their internals keep resolving dark without editing content markdown.

## 3. Toggle UI

- Nav (desktop + mobile overlay): a square icon button after the links — mono aesthetic, zero-radius, 1px border-line, shows a sun glyph in dark mode / moon in light (inline SVG, stroke currentColor, 14px). `aria-label="Switch to light theme"` / dark, `aria-pressed` semantics or just the label flip. Hover: border-accent.
- Command palette: add a `theme: toggle light/dark` command that calls the same function.

## 4. Behavior / persistence (ClientRouter-safe)

- New tiny inline script in Base.astro `<head>` BEFORE anything paints (is:inline, not bundled):
  `const t = localStorage.getItem('theme'); if (t === 'light') document.documentElement.dataset.theme = 'light';`
  Dark default (brand-first). No `prefers-color-scheme` auto-switch — the brand default is dark; only explicit user choice changes it. (Simpler + on-brand.)
- Toggle logic in a small module (can live in motion.js or new theme.js loaded from Base): set/remove `html[data-theme]`, write localStorage, update the icon + aria-label + `meta[name=theme-color]` (#0B0A08 dark / light bg hex).
- ClientRouter: `<html>` attributes are preserved on swaps in Astro's router EXCEPT edge cases — re-assert theme on `astro:after-swap` from localStorage (cheap, idempotent, also fixes the persisted-header icon state). Wire listener once (module scope), plus re-bind the button (it lives in the persisted header — verify whether re-query is needed like the nav-overlay pattern; follow motion.js conventions).
- View transitions between themes are irrelevant (theme doesn't change on nav); but toggling theme should NOT animate every element — instant switch is correct terminal behavior. Optional: a ~120ms opacity micro-fade on html, skip under reduced-motion.
- No-FOUC acceptance: hard-reload in light mode shows zero dark flash (script inline in head before CSS-dependent paint).

## 5. Audit pass (the risky part — hardcoded colors)

Grep the codebase for hardcoded hexes OUTSIDE the allowed dark-locked surfaces: `#0B0A08|#141210|#1C1916|#2A251F|#EDE6DA|#8F8577|#F0B429|#9C7418|#3FCF8E|#E5484D` in src/. For each hit decide: (a) inside a dark-locked surface → leave; (b) page chrome (hero curve, funnel bars, pipeline connectors, scroll-progress, palette, tape, 404 terminal block, crosshair) → convert to var()-based so it themes. SVG presentation attributes don't accept var() — use `style="stroke: var(--color-line)"` instead of attributes where conversion is needed. The 404's terminal block may stay dark-locked (it's a terminal) — taste call, note it.
- favicon stays as-is.

## 6. Verification (report each)
- Toggle in nav works; choice survives: hard reload, soft navs (home→work→notes), browser back/forward. No FOUC on hard reload in light mode.
- Light mode visual pass at 1440 + 375 on: home (hero, metrics, factory incl. dark-locked cockpit, projects, tape), /work, a project detail (dark diagram visible + page chrome light), /notes post, 404. Screenshot each; no unreadable text (report any contrast < 4.5:1 you spot-check with a contrast tool/calc for: body, muted labels, accent text, buttons).
- Palette theme command works; icon + aria-label swap correctly; `aria-pressed`/label state correct after soft navs.
- Reduced-motion: toggle is instant, no fade.
- Lighthouse home in LIGHT mode ≥ 95 all categories (a11y contrast will catch failures).
- `npm run build` clean; JS delta reported (< 2KB expected).
