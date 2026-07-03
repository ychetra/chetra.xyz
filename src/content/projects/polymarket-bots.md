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

## Stack & approach

Targets Polymarket's current Python SDK (`polymarket-client`) rather than
the older community `py-clob-client` path, using Gamma market endpoints for
slug-based market discovery. The live path posts a market order first and
falls back to a limit order near the current ask if that doesn't fill
immediately; a fallback order still open when the window closes gets
cancelled, leaving bankroll unchanged for that window. Stake sizing,
drawdown guards, and order-book gating are config-driven rather than
hardcoded.

## Status / results

Live trading code paths exist in the repo (`momentum_live.py`,
`sol_edge_live.py`) alongside backtest and edge-validation scripts. No
win-rate or PnL figures are published on this page yet — they'll be added
once there's a validated result worth standing behind.
