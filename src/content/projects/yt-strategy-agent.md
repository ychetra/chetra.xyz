---
title: "YT Strategy Agent"
slug: "yt-strategy-agent"
tagline: "A 24/7 agent that watches trading YouTube channels and turns their latest videos into living strategy documents."
year: "2026"
order: 6
tier: "featured"
category: "ai-systems"
status: "active"
stack: ["Python", "Claude", "YouTube Data API", "Apify"]
isPrivate: true
draft: false
---

## What it is

A system that watches a configured list of YouTube channels and, for each
one's latest videos, extracts a strategy in plain English plus structured
buy/sell rules, risk notes, and timing notes. Every 10 minutes it checks
each channel for new videos, pulls the transcript, has Claude extract
strategy / rules / risk / timing / executed trades from it, and diffs the
result against the prior state — logging a changelog entry only when the
deduced strategy actually shifts. Similar rules get grouped by embedding
similarity, and newer videos are weighted more heavily than older ones in
the rolling merge. It emails an alert on a new video, a strategy shift, or a
called-out trade.

## Stack & approach

Python, run as a long-lived process on a small VPS. Designed to be set up by
an AI coding agent walking through a bundled setup prompt rather than a
manual install.

## Status

Private repository. Specific figures — how many channels it currently
watches, uptime — aren't published on this page.
