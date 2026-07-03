---
title: "Why my factory rejects 99.97% of strategies"
description: "Inside the three gates a candidate has to clear before the strategy factory trusts it: real-spread revalidation, a deflated Sharpe ratio audit, and a holdout window sealed before search began."
date: "2026-07-03"
draft: false
---

Most backtests are marketing. A smooth equity curve, a headline Sharpe ratio, a quarter that went up — none of it tells you whether the edge is real or whether it's just what's left over after enough tries. Run enough parameter combinations against enough history and something will look good by chance alone. The question that matters isn't "can you find a strategy with a great backtest." It's "can your process tell the difference between that and a real edge." Most can't, because most aren't built to reject anything.

Mine is built to reject almost everything. This cycle the factory screened 3,911 parameter trials across 19 strategy modules and 8 symbols. One candidate passed every gate: `ORB_SESSION`, an opening-range breakout on XAUUSD, H1. Everything else — 99.97% of what went in — got rejected somewhere along the way. That ratio isn't a failure rate to apologize for. It's the point. A pipeline that hands back many "validated" strategies from a few thousand trials almost certainly has gates that are too loose.

Here's what a candidate has to survive before it earns any trust, and what happened to two real candidates when they hit each gate.

## Gate 1: real-spread revalidation

Screening runs fast, across thousands of combinations, using vectorbt. That speed comes at a cost: the fill model is clean, and clean fills flatter everything. Any candidate that clears screening gets re-run against MT5 tick data, at real spread and commission — not a modeled cost, an actual one.

`ORB_SESSION` screened at a Sharpe of 2.50. Re-run at real spread, it came back at 1.53 — 61% of the screen number retained. That's the figure that goes on the tearsheet, not the 2.50. Screen Sharpe is a shortlist filter, not a result.

The cautionary case is `prior_day_breakout` on XAUUSD, H1. It screened even higher than `ORB_SESSION` — 2.537. Re-run at real spread, it fell to 0.604, and its deflated Sharpe ratio came back at 0.49, a clean fail against the 0.90 gate. A better-looking screen number told you nothing about which strategy would survive contact with real costs. If anything, here it pointed the wrong way.

## Gate 2: deflated Sharpe ratio ≥ 0.90

Scan 3,911 trials and some will look good purely from multiple testing — the same reason the best-performing fund in a table of a thousand funds isn't necessarily the best fund. The deflated Sharpe ratio (DSR) corrects for that: it asks how likely a given Sharpe is to be real, once you account for how many trials were tried and how correlated they were, and it discounts accordingly.

The gate is DSR ≥ 0.90. Of the candidates that made it to this stage, nineteen of twenty failed it. `ORB_SESSION` cleared it at 0.909 — over the line, not by a wide margin. That's an honest number, not a comfortable one, and it's the one published everywhere on this site the strategy appears.

## Gate 3: locked holdout

The last gate isn't statistical, it's procedural: five months of 2026 data, sealed before the search began. Not a random split, not a rolling window chosen after the fact — a window the strategy could not have seen during discovery, screening, or the DSR audit, because it didn't exist yet when the gates were set.

`ORB_SESSION` scored a Sharpe of 3.75 on that locked window. Higher than the screen number, higher than the real-spread number. That doesn't prove the edge holds forever — nothing does — but a strategy fit to noise in the search window typically falls apart on data it never touched. This one didn't. That's the signal the gate is designed to catch.

## What the funnel means

3,911 parameter trials → 2,192 ranked combinations → 20 audited for overfit → 1 passed every gate.

Each stage cuts hard. Screening to ranking keeps more than half — that's cheap filtering, mostly removing combinations that are obviously broken. Ranking to audit is the real cut: only 20 candidates were considered worth the cost of a full DSR and holdout audit. Audit to survivor is where nineteen of those twenty died.

A single survivor from 3,911 trials looks, at a glance, like a pipeline that mostly fails. It is. That's what a pipeline with real gates looks like. If this factory routinely produced five or ten "validated" strategies a cycle, the more likely explanation wouldn't be a run of good luck — it would be gates too loose to be doing their job. Rejection at this rate is the evidence the gates are actually gates, not a formality on the way to something already decided.

## What this isn't

No live trading results exist yet. `ORB_SESSION` cleared real-spread validation, the DSR gate, and a locked holdout — that's a validated backtest, not a track record. I'm preparing a HolaPrime 2-step challenge under this strategy and the same risk ladder that governs everything else here. When there are live numbers, they'll replace the backtested ones on the [tearsheet](/tearsheet/) and here — not before, and not quietly.
