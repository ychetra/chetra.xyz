---
title: "Strategy Factory"
slug: "strategy-factory"
tagline: "An autonomous pipeline that researches, screens, and rejects trading strategies before any of them see real money."
year: "2026"
order: 1
tier: "featured"
category: "trading"
status: "active"
stack: ["Python", "Docker", "vectorbt", "pandas", "MongoDB"]
isPrivate: true
metrics:
  - label: "Real-spread Sharpe"
    value: "1.53"
    tone: "accent"
  - label: "Holdout Sharpe (locked)"
    value: "3.75"
    tone: "up"
  - label: "Deflated Sharpe"
    value: "0.91"
    tone: "neutral"
  - label: "Max drawdown"
    value: "11.1%"
    tone: "down"
  - label: "Trials → survivors"
    value: "3,911 → 1"
    tone: "neutral"
draft: false
---

## What it is

An autonomous research pipeline that generates, screens, and rejects trading
strategy candidates with as little human input as possible in the early
stages. MT5 runs in Docker behind a Wine bridge; a vectorbt engine backtests
every candidate against real spread costs; anything that survives has to
clear anti-overfit gates before it earns a forward test.

19 strategy modules, 8 symbols, 3,911 parameter trials screened this cycle.
One candidate has passed every gate so far — `ORB_SESSION` on XAUUSD, H1 —
and that's deliberate: the factory is built to reject almost everything.

## Status

Preparing a HolaPrime 2-step challenge under the validated strategy and risk
ladder. No live trading results exist yet, and this page won't claim any
until they do.

## More

This is a private repository — no source, no internals beyond what's above.
The full case study (pipeline diagram, funnel, cockpit) lives on the
[homepage](/#factory), and the validated numbers are published in full on
the [tearsheet](/tearsheet).
