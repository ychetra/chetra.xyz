---
title: "Claude-brain"
slug: "claude-brain"
tagline: "A self-syncing memory system for Claude Code — skills, an Obsidian knowledge vault, and settings synced across machines."
year: "2026"
order: 8
tier: "featured"
category: "ai-systems"
status: "active"
stack: ["Python", "Claude Code", "Obsidian", "MCP"]
isPrivate: true
draft: false
---

## What it is

A private repo that syncs Claude Code skills, a knowledge vault, and
settings across machines via git. It holds 170+ Claude Code skills (trading,
finance, and general-purpose), a 642-note Obsidian vault built from Claude
Code's own documentation, and a static knowledge graph (598 nodes) generated
from the raw docs. An hourly cron job keeps it synced; credentials and
session state are deliberately excluded from the sync.

## Stack & approach

A single bootstrap script (`setup-new-mac.sh`) clones the repo, symlinks the
skills directory, installs settings (model, plugins, theme), and wires up
MCP servers for a new machine in one command.

## Status

Actively maintained — updated continuously as skills and notes accumulate.

Private repository.
