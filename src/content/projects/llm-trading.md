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

### Pipeline flow

Each stage below is a real file in the repo, in run order:

<div style="overflow-x:auto; margin:2.5rem 0;">
<svg viewBox="0 0 340 680" width="100%" role="img" style="display:block; max-width:460px; margin:0 auto; height:auto;" aria-label="LLM-Trading pipeline flow: raw M1 ticks are validated and resampled into H1 decision bars while M1 is kept for fills; 25 causal features are built and checked for leakage; a baseline policy or optional PPO agent is evaluated across walk-forward folds; a deployment gate passes or fails the run before production; a passing model's sealed holdout is revealed once; results surface on a dashboard.">
  <defs>
    <marker id="lt-arrow" markerWidth="8" markerHeight="8" viewBox="0 0 10 10" refX="9" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="#2A251F"></path>
    </marker>
  </defs>
  <line x1="170" y1="59" x2="170" y2="79" stroke="#2A251F" stroke-width="1.4" marker-end="url(#lt-arrow)"></line>
  <line x1="170" y1="141" x2="170" y2="161" stroke="#2A251F" stroke-width="1.4" marker-end="url(#lt-arrow)"></line>
  <line x1="170" y1="238" x2="170" y2="258" stroke="#2A251F" stroke-width="1.4" marker-end="url(#lt-arrow)"></line>
  <line x1="170" y1="335" x2="170" y2="355" stroke="#2A251F" stroke-width="1.4" marker-end="url(#lt-arrow)"></line>
  <polyline points="170,417 170,421 92,421 92,425" fill="none" stroke="#2A251F" stroke-width="1.2"></polyline>
  <polyline points="170,421 247,421 247,425" fill="none" stroke="#2A251F" stroke-width="1.2"></polyline>
  <line x1="170" y1="505" x2="170" y2="525" stroke="#2A251F" stroke-width="1.4" marker-end="url(#lt-arrow)"></line>
  <text x="178" y="518" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#8F8577">(if passed)</text>
  <line x1="170" y1="587" x2="170" y2="607" stroke="#2A251F" stroke-width="1.4" marker-end="url(#lt-arrow)"></line>
  <rect x="20" y="12" width="300" height="47" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="33" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">RAW M1 TICKS</text>
  <text x="34" y="48" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">data_loader.py — parses broker/EET tz</text>
  <rect x="20" y="79" width="300" height="62" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="100" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">VALIDATE + RESAMPLE</text>
  <text x="34" y="115" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">data_loader.py — validates, de-dupes</text>
  <text x="34" y="130" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">H1 decision bars · M1 kept for fills</text>
  <rect x="20" y="161" width="300" height="77" fill="#141210" stroke="#2A251F"></rect>
  <rect x="252" y="169" width="60" height="16" fill="none" stroke="#3FCF8E" stroke-width="1.1"></rect>
  <text x="282" y="180" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9" fill="#3FCF8E" text-anchor="middle">LEAK OK</text>
  <text x="34" y="182" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">25 CAUSAL FEATURES</text>
  <text x="34" y="197" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">features.py — ATR-normalized signals</text>
  <text x="34" y="212" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">4 dropped (collinearity |r|≥0.96)</text>
  <text x="34" y="227" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">leakage_checks.py — future-append test</text>
  <rect x="20" y="258" width="300" height="77" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="279" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">BASELINE / PPO AGENT</text>
  <text x="34" y="294" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">baselines.py — trend-hold policy</text>
  <text x="34" y="309" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">train_ppo.py + env_bracket.py (opt.)</text>
  <text x="34" y="324" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#F0B429">5 block folds / ~35 sliding folds</text>
  <rect x="20" y="352" width="40" height="3" fill="#F0B429"></rect>
  <rect x="20" y="355" width="300" height="62" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="376" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">WALK-FORWARD DEPLOYMENT GATE</text>
  <text x="34" y="391" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">config.py — 4/5 folds PF&gt;1.0,</text>
  <text x="34" y="406" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">worst-fold PF&gt;0.9, mean Sharpe&gt;0</text>
  <rect x="20" y="425" width="145" height="44" fill="#141210" stroke="#3FCF8E" stroke-width="1.2"></rect>
  <text x="32" y="442" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" font-weight="600" fill="#3FCF8E">PASS</text>
  <text x="32" y="457" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="10" fill="#8F8577">→ models/ (live)</text>
  <rect x="175" y="425" width="145" height="44" fill="#141210" stroke="#E5484D" stroke-width="1.2"></rect>
  <text x="187" y="442" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" font-weight="600" fill="#E5484D">FAIL</text>
  <text x="187" y="457" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="10" fill="#8F8577">→ quarantined</text>
  <text x="170" y="486" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9.5" fill="#8F8577" text-anchor="middle">gate only ever prevents a bad deploy —</text>
  <text x="170" y="499" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="9.5" fill="#8F8577" text-anchor="middle">it never fabricates one</text>
  <rect x="20" y="525" width="300" height="62" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="546" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">SEALED HOLDOUT REVEAL</text>
  <text x="34" y="561" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">final_holdout_eval.py — one-time,</text>
  <text x="34" y="576" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">reveal on the frozen model</text>
  <rect x="20" y="607" width="300" height="47" fill="#141210" stroke="#2A251F"></rect>
  <text x="34" y="628" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="12.5" font-weight="600" fill="#EDE6DA">DASHBOARD</text>
  <text x="34" y="643" font-family="'JetBrains Mono Variable', ui-monospace, monospace" font-size="11" fill="#8F8577">Next.js app — replaces Streamlit</text>
</svg>
</div>

## Stack & approach

Python for the pipeline (`config.py`, `data_loader.py`, `features.py`, a
Gymnasium-compatible bracket-trading environment in `env_bracket.py`,
`train_ppo.py`), a guided Jupyter notebook for walkthroughs, and a
TypeScript/Next.js dashboard for results. When TP and SL land in the same M1
candle, the simulator assumes SL first — deliberately pessimistic. Position
size is fixed-fractional and risk-based; the RL agent controls direction and
bracket shape, not size.

Split boundaries carry a 200-bar embargo on each side — sized to EMA-200,
the longest lookback in the feature set, which still retains about 37% of a
bar's weight after 200 steps, so nothing upstream of a boundary can leak
into validation or test. And getting a model into production isn't
automatic: `config.py` defines a deployment gate that requires a minimum
number of walk-forward folds to clear a profit-factor floor, sets a hard
floor under the worst individual fold, and checks that mean out-of-sample
Sharpe is positive. Fail any of it and the run is quarantined under
`models/walk_forward/` instead of promoted — the gate can only block a bad
deploy, it can't manufacture a good one.

## Status / results

Actively developed research pipeline. The holdout hasn't been revealed on a
frozen model yet, so no Sharpe ratio, win rate, or walk-forward return
numbers are published here — none exist in the repo to report. This section
will be updated with real results once a holdout run is finalized and worth
standing behind.
