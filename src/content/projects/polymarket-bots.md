---
title: "Polymarket Bots"
slug: "polymarket-bots"
tagline: "Automated trading bots for Polymarket's short-duration crypto markets, built around a composite momentum signal."
year: "2026"
order: 5
tier: "featured"
category: "trading"
status: "active"
stack: ["Python", "Polymarket API", "Binance API", "Playwright"]
repo: "https://github.com/ychetra/polymarket"
isPrivate: false
draft: false
---

## The problem

Polymarket's BTC 5-minute markets resolve fast and need a bot that can time
entries, size stakes sensibly, and not get stuck holding an unfilled order
when the window closes.

## What I built

A live/dry-run trading loop (`bot.py`) driven by a 7-indicator composite
signal (`strategy.py`), plus the tooling around it:

- `backtest.py` pulls Binance history for offline analysis; `compare_runs.py`
  sweeps config grids and exports the results to Excel for comparison.
- `setup_creds.py` derives and persists Polymarket API credentials, and can
  drive the SDK's trading-approval setup.
- `auto_claim.py` is a Playwright worker that logs in once and then clicks
  through claim/redeem buttons on the portfolio page automatically.
- `reconcile_history.py` recomputes bankroll state from the logged trade
  history, so the local bankroll tracker doesn't drift from what actually
  filled.

An earlier, smaller version of the same idea lives in a companion repo,
`poly_bot` — a minimal `bot.py` + `polymarket_client.py` pair. This project
superseded it; this page links the current one.

### Bot loop

Each stage below is a real file in the repo:

<div style="overflow-x:auto; margin:2.5rem 0;">
<svg viewBox="0 0 340 540" width="100%" role="img" style="display:block; max-width:460px; margin:0 auto; height:auto;" aria-label="Polymarket bot loop: a market scan feeds a seven-indicator composite momentum signal, gated by order-book and per-mode confidence config, then executed via two live paths — momentum_live.py holding to resolution across five pairs, and sol_edge_live.py actively managing a SOL-only exit — with fills logged and reconciled, and offline backtest and edge-validation scripts confirming the entry windows those live paths use.">
  <defs>
    <marker id="pm-arrow" markerWidth="8" markerHeight="8" viewBox="0 0 10 10" refX="9" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#2A251F"></path>
    </marker>
  </defs>
  <line x1="170" y1="74" x2="170" y2="94" stroke="#2A251F" stroke-width="1.4" marker-end="url(#pm-arrow)"></line>
  <line x1="170" y1="171" x2="170" y2="191" stroke="#2A251F" stroke-width="1.4" marker-end="url(#pm-arrow)"></line>
  <polyline points="170,253 170,261 92,261 92,265" fill="none" stroke="#2A251F" stroke-width="1.2"></polyline>
  <polyline points="170,261 247,261 247,265" fill="none" stroke="#2A251F" stroke-width="1.2"></polyline>
  <polyline points="92,328 92,336 247,336 247,328" fill="none" stroke="#2A251F" stroke-width="1.2"></polyline>
  <line x1="170" y1="336" x2="170" y2="356" stroke="#2A251F" stroke-width="1.4" marker-end="url(#pm-arrow)"></line>
  <line x1="170" y1="418" x2="170" y2="438" stroke="#2A251F" stroke-width="1.4" marker-end="url(#pm-arrow)"></line>
  <rect x="20" y="12" width="300" height="62" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="33" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">MARKET SCAN</text>
  <text x="34" y="48" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">Gamma markets — slug-based discovery</text>
  <text x="34" y="63" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">Binance spot/kline — window open px</text>
  <rect x="20" y="94" width="300" height="77" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="115" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">COMPOSITE MOMENTUM SIGNAL</text>
  <text x="34" y="130" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">strategy.py analyze() — 7 indicators</text>
  <text x="34" y="145" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">additive score, own threshold each</text>
  <text x="34" y="160" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#F0B429">confidence = |score| / 16.5, capped 1</text>
  <rect x="20" y="191" width="300" height="62" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="212" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">ORDER-BOOK GATING / RISK CONFIG</text>
  <text x="34" y="227" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">botlib.py — confidence gate by mode</text>
  <text x="34" y="242" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">optional ask-gate: ENTRY_MIN/MAX_ASK</text>
  <rect x="20" y="265" width="145" height="63" fill="#141210" stroke="#2A251F"></rect>
  <text x="30" y="280" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="10" font-weight="600" fill="#EDE6DA">MOMENTUM_LIVE.PY</text>
  <text x="30" y="293" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">5 pairs, BTC excl.</text>
  <text x="30" y="306" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">hold to resolution</text>
  <text x="30" y="319" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">no TP / no SL</text>
  <rect x="175" y="265" width="145" height="63" fill="#141210" stroke="#2A251F"></rect>
  <text x="185" y="280" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="10" font-weight="600" fill="#EDE6DA">SOL_EDGE_LIVE.PY</text>
  <text x="185" y="293" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">self-contained</text>
  <text x="185" y="306" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">TP 0.95</text>
  <text x="185" y="319" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">SL @ 30% of entry</text>
  <rect x="20" y="356" width="300" height="62" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="377" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">LOGGING + BANKROLL RECONCILE</text>
  <text x="34" y="392" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">*_live_log.jsonl — one line per fill</text>
  <text x="34" y="407" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">reconcile_history.py rebuilds it</text>
  <rect x="20" y="438" width="300" height="77" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="459" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">BACKTEST + EDGE VALIDATION</text>
  <text x="34" y="474" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">backtest.py — Binance history pull</text>
  <text x="34" y="489" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">backtest_edge.py — entry×move rate</text>
  <text x="34" y="504" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#F0B429">ask-vs-outcome mispricing → real edge</text>
</svg>
</div>

## Stack & approach

Targets Polymarket's current Python SDK (`polymarket-client`) rather than
the older community `py-clob-client` path, using Gamma market endpoints for
slug-based market discovery. The live path posts a market order first and
falls back to a limit order near the current ask if that doesn't fill
immediately; a fallback order still open when the window closes gets
cancelled, leaving bankroll unchanged for that window. Stake sizing,
drawdown guards, and order-book gating are config-driven rather than
hardcoded.

`strategy.py`'s composite signal isn't a vote — it's an additive score
across seven indicators, each contributing on its own threshold-tiered
scale (a break past 0.10% of the window open is worth up to 7 points,
tick-trend or RSI extremes up to 2 more), summed and normalized into a
0–1 confidence against a fixed maximum. `bot.py` gates entries on that
confidence per trading mode (safe/aggressive/degen) and, optionally, a
live order-book ask band. The two production scripts depart from that
general path on purpose: `momentum_live.py` runs five pairs — BTC excluded
after backtesting showed negative edge there — and holds every fill to
resolution with no TP/SL, while `sol_edge_live.py` is SOL-only and
self-contained (no `bot.py`/`botlib.py` dependency), actively exiting at a
0.95 bid or a stop set at 30% of the entry price instead of waiting out
the window.

## Status / results

Live trading code paths exist in the repo (`momentum_live.py`,
`sol_edge_live.py`) alongside backtest and edge-validation scripts. No
win-rate or PnL figures are published on this page yet — they'll be added
once there's a validated result worth standing behind.
