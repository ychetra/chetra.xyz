---
title: "forven"
slug: "forven"
tagline: "A self-hosted, open-source autonomous crypto-trading research workspace — multi-agent strategy generation, a robustness gauntlet, and paper trading."
year: "2026"
order: 9
tier: "featured"
category: "ai-systems"
status: "wip"
stack: ["Python", "FastAPI", "SvelteKit", "Svelte", "CCXT", "ChromaDB"]
repo: "https://github.com/ychetra/forven"
isPrivate: false
draft: true
---

## What it is

An AGPL-3.0 licensed, self-hosted workspace that pairs a team of AI agents
(strategy-developer, quant-researcher, risk, execution) with a bar-by-bar
backtesting engine, a robustness "Gauntlet" (walk-forward analysis,
Monte-Carlo, parameter-jitter, cost-stress) that gates strategy promotion,
and paper trading on Hyperliquid testnet with real risk controls —
stop-losses, a drawdown kill-switch, fill reconciliation, and
liquidation-distance monitoring. It ships paper-trading-only by default; a
live/mainnet path exists in the code but is unsupported and opt-in only.

## Stack

Python 3.11+ / FastAPI backend, SvelteKit 2 + Svelte 5 + Tailwind frontend,
SQLite for state, ChromaDB for agent memory, CCXT exchange adapters, and an
in-process MCP server so the workspace can also be driven from Claude,
Codex, or other MCP clients.

## Status

`TODO(chetra): this repository's README credits copyright to a different
author ("Judder") and most of its commit history predates this account —
confirm your actual relationship to this project (personal deployment, fork
for testing, contribution, etc.) before this page ships. The description
above is what the repository is, not a claim that it was built here.`
