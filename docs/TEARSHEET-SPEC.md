# Strategy Tearsheet — Build Spec

Institutional one-page tearsheet for the validated strategy, at route `/tearsheet`. Two jobs: (1) look sharp on screen in the site's dark theme, (2) print to a clean PDF (light/print stylesheet). Add a "Download tearsheet" affordance from the metrics strip on the homepage.

## Files
- New page: `src/pages/tearsheet.astro` (uses the existing `Base.astro` layout — pass a distinct title/description).
- Edit `src/components/Metrics.astro`: add a small mono link under/after the metrics grid: `↓ DOWNLOAD TEARSHEET` → `/tearsheet` (mono, uppercase, tracking-[0.15em], text-accent underline on hover). Don't disturb the 5 metric cells or their count-up.
- Do NOT touch Factory.astro (another task owns it), motion.js, tokens, or other components.

## Real data (use verbatim — all validated, from the factory)
- Strategy: **ORB_SESSION** (Opening-Range Breakout, session-gated)
- Instrument: **XAUUSD**, timeframe **H1**
- Parameters: buffer_atr `0.1`, session_hour `7`, or_bars `4`, tp_ratio `2.0`, trend_ema `200`
- Screen Sharpe (pre-cost): **2.50**
- **Real-spread Sharpe (MT5 validation): 1.53** — headline number
- Sharpe retained after real costs: **61%**
- Holdout Sharpe (locked 2026-H1, unseen): **3.75**
- Deflated Sharpe Ratio: **0.909** (gate ≥ 0.90 — PASS)
- Win rate: **52.5%** · Trades: **512** · Max drawdown: **11.07%**
- Holdout trades/week: **1.21**
- Pipeline funnel: **3,911** parameter trials → **2,192** ranked → **20** overfit-audited → **1** passed every gate
- Universe: 19 strategy modules, 8 symbols (EURUSD, GBPUSD, XAUUSD, USDJPY, AUDUSD, USDCAD, BTCUSD, ETHUSD)
- Status: **preparing HolaPrime 2-step challenge** (not yet live)

## On-screen layout (dark theme, matches site)
Max-width ~880px, centered, generous padding, mono for data / Fraunces for headings. Sections:
1. **Header**: left `CHETRA` wordmark + `STRATEGY TEARSHEET`; right issue date `AS OF 2026-07-03` and `DEMO / VALIDATED BACKTEST` tag. Thin accent rule under.
2. **Strategy identity**: big Fraunces title `ORB_SESSION`, subtitle `Opening-Range Breakout · XAUUSD · H1`. Parameter chips row (mono, bordered).
3. **Key metrics grid** (the meat): 2 columns of label/value rows, grouped:
   - *Return quality*: Real-spread Sharpe 1.53 (accent, big), Holdout Sharpe 3.75 (text-up), Screen Sharpe 2.50, Retained after costs 61%.
   - *Risk*: Max drawdown 11.07% (text-down), Win rate 52.5%, Trades 512, Holdout trades/wk 1.21.
   - *Robustness*: Deflated Sharpe 0.909 (with `gate ≥0.90 ✓`), Overfit audit PASS.
4. **Equity/holdout note**: a compact SVG equity curve (reuse a simple hand-authored path, accent stroke, faint grid) — static (no animation needed on tearsheet). Caption: `Illustrative equity path. Holdout tested on 5 months of locked, unseen data.`
5. **The funnel**: one horizontal row `3,911 → 2,192 → 20 → 1` with mini bars or arrowed mono, subtitle `The factory rejects 99.97% of candidates.`
6. **Methodology** (short prose, 3–4 lines): real-spread MT5 validation, deflated-Sharpe gate, locked holdout. Quiet, precise.
7. **Disclaimer** (mono, muted, small): `Backtested and validated results. Not live trading results. Past performance does not guarantee future results. Prepared for informational purposes. Figures derived from the author's strategy-factory pipeline.`
8. **Footer**: `chetra.xyz · hi@chetra.xyz · github.com/ychetra`. A `Print / Save as PDF` button (mono, bordered) that calls `window.print()` (button hidden in print via a `.no-print` class).

## Print stylesheet (critical)
Add `@media print` rules (in the page's `<style>` or a scoped block):
- Force a LIGHT print theme: white background, near-black text, accent kept as a print-safe darker amber (#B37E00 or similar for contrast on white). SVG strokes → dark.
- A4/Letter friendly: single page if possible, `@page { margin: 16mm; }`, no page-break inside metric groups.
- Hide: site nav/footer (if Base renders them — wrap tearsheet so global nav/footer get `.no-print` OR render this page without the global chrome; simplest: keep Base but add `@media print { header, footer.site-footer, .no-print { display:none } }`). The Print button and any back-to-site link get `.no-print`.
- Ensure `-webkit-print-color-adjust: exact; print-color-adjust: exact;` so backgrounds/accents render.

## Generated PDF file
After the page builds, ALSO produce a static `public/tearsheet.pdf` so there's a direct downloadable file:
- Use headless Chrome to print the built page to PDF. Command pattern (Chrome is at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`):
  serve the prod build, then `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --print-to-pdf="public/tearsheet.pdf" --print-to-pdf-no-header --no-pdf-header-footer http://localhost:<port>/tearsheet/`
- If headless print is flaky, note it and leave the on-page `window.print()` button as the reliable path (don't block the task on the static PDF). Prefer the on-page button working perfectly; the static file is a bonus.
- If you generate it, also add a second link on the tearsheet: `Download PDF` → `/tearsheet.pdf`.

## Acceptance
- `npm run build` clean; `/tearsheet` renders in dark theme, matches site.
- Metrics-strip link navigates to it.
- Browser print preview (or generated PDF) is a clean LIGHT one-pager, all numbers present, no dark-on-dark, nav/footer/buttons hidden.
- No horizontal overflow at 375px on screen.
- Report: build JS size, whether static PDF was generated, and any print-CSS caveats.
