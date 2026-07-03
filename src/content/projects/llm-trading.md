---
title: "LLM-Trading"
slug: "llm-trading"
tagline: "A leak-checked feature and bracket-trading research pipeline for XAUUSD, built around walk-forward validation instead of a single train/test split."
year: "2026"
order: 4
tier: "featured"
category: "trading"
status: "active"
stack: ["Python", "Jupyter", "Gymnasium", "PPO", "Next.js", "TypeScript"]
repo: "https://github.com/ychetra/LLM-trading"
isPrivate: false
draft: false
---

## The problem

Most retail strategy research overfits a single train/test split, or leaks
future information into "causal" features without anyone checking. This is a
research pipeline for XAUUSD minute data built to make both mistakes hard to
make by accident: a sealed test split, an explicit leakage checker, and —
once a strategy graduates to reinforcement learning — walk-forward
validation instead of one backtest window.

## What I built

A pipeline from raw MT4/MT5-style M1 ticks to a trade-ready policy:

- **Data handling** — loads and validates raw M1 data, parses broker/EET
  time safely, and resamples M1 execution data into H1 decision bars while
  keeping M1 for intrabar TP/SL simulation.
- **Feature set** — 25 causal, ATR-normalized features. Four redundant ones
  were dropped after a collinearity audit, each correlated \|r\| ≥ 0.96 with
  a feature already retained.
- **Baseline** — a simple trend-following policy tuned on train/validation
  splits with the test split sealed until the end.
- **RL agent (optional)** — a PPO agent with a
  `MultiDiscrete([direction, SL bucket, TP/R bucket])` action space, trained
  with sliding walk-forward validation: each fold trains on 5 years, selects
  its checkpoint on the next 6 months, and is judged out-of-sample on the 6
  months after that — simulating "retrain every 6 months, trade the next 6
  live." Roughly 35 folds over the ~23-year dataset, stitched into one
  continuous out-of-sample equity curve.
- **Leakage checks** — a future-append stability test the pipeline runs
  before a feature set is trusted.
- **Holdout reveal** — a separate `final_holdout_eval.py` entry point whose
  only job is revealing the sealed test split once, after the model is
  frozen.
- **Dashboard** — a Next.js dashboard (replacing an earlier Streamlit one)
  for viewing pipeline output, deployed on Railway.

## Stack & approach

Python for the pipeline (`config.py`, `data_loader.py`, `features.py`, a
Gymnasium-compatible bracket-trading environment in `env_bracket.py`,
`train_ppo.py`), a guided Jupyter notebook for walkthroughs, and a
TypeScript/Next.js dashboard for results. When TP and SL land in the same M1
candle, the simulator assumes SL first — deliberately pessimistic. Position
size is fixed-fractional and risk-based; the RL agent controls direction and
bracket shape, not size.

## Status / results

Actively developed research pipeline. The holdout hasn't been revealed on a
frozen model yet, so no Sharpe ratio, win rate, or walk-forward return
numbers are published here — none exist in the repo to report. This section
will be updated with real results once a holdout run is finalized and worth
standing behind.
