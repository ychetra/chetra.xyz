---
title: "PipBoost"
slug: "pipboost"
tagline: "A trading-journal SaaS — trade logging, broker sync, analytics, and prop-firm challenge tracking, built on Next.js and Prisma."
year: "2026"
order: 9
tier: "featured"
category: "trading"
status: "active"
stack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind"]
isPrivate: true
draft: false
---

## What it is

A full-stack SaaS for traders who want their journal to do more than store
screenshots. It logs trades, syncs them from brokers, turns them into
analytics, and tracks progress against prop-firm challenge rules — the same
discipline problems I solve for myself, packaged for other traders.

## What I built

- **Trade logging & broker sync** — trades enter by hand or arrive
  automatically through broker webhooks and scheduled sync jobs.
- **Prop-challenge tracking** — encodes firm rules (drawdown limits, daily
  loss caps, profit targets) and tracks an account's standing against them,
  the same rails as my own risk ladder.
- **Analytics** — per-trade and aggregate views built from the logged data.
- **Accounts & security** — multi-user auth with two-factor, plus an admin
  panel.
- **Coaching & gamification** — a feedback layer that reviews journaled
  trades, with progress mechanics to keep the habit.

## Stack & approach

Next.js and TypeScript end to end, Prisma over PostgreSQL for the data
model, Tailwind for the UI. Broker sync runs on webhooks and cron; the
prop-rule engine is config-driven so new firm rulesets can be added without
touching the core.

## Status

Actively developed. Private repository — no source or internals published
beyond what's described here.
