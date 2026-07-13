# /now page — draft copy for review

Route: `/now/` · File: `src/pages/now.astro` · Layout: Base (same column width/padding as `/notes/`)

Final copy after builder draft + reviewer pass + main-thread edits (2026-07-13):

---

// NOW

# Now

Last updated 2026-07-13.

## Building

A strategy factory — an autonomous pipeline that researches, screens, validates, and audits trading
strategies before any of them see real money. Six stages, always in that order: research, screen,
validate, audit, compare, live. Paper first. Always.

## Focused on

Validation discipline, not headline numbers. Every candidate has to clear real-spread revalidation, a
deflated Sharpe audit, and a holdout window sealed before search began — most don't. The one survivor,
ORB_SESSION, is being prepared for a HolaPrime 2-step challenge under the same risk ladder: position
sizing, loss limits, a kill switch.

## Elsewhere

Based in Phnom Penh, self-taught. This site runs on one rule: every number from validated runs,
nothing published before it's true. Notes cover the systems behind the work.

← Back home

---

## Fact trace (source → line, for reviewer)

- "autonomous pipeline that researches, screens, validates, and audits ... before any of them see real
  money" — `src/components/Factory.astro` intro paragraph; `src/content/projects/strategy-factory.md`
  tagline.
- "research, screen, validate, audit, compare, live" / "paper first. always." — `Factory.astro` `stages`
  array (the `Live` stage's own note is literally "paper first. always.").
- "real-spread revalidation, a deflated Sharpe audit, a holdout window sealed before search began" —
  `src/content/notes/anti-overfit-gates.md` description + gate headings.
- "ORB_SESSION ... HolaPrime 2-step challenge" — `Factory.astro` STATUS line ("preparing HolaPrime 2-step
  challenge under the validated strategy and risk ladder") and `src/content/projects/holaprime-ea.md`
  ("Currently being prepared for a HolaPrime 2-step challenge").
- "position sizing, loss limits, a kill switch" — `holaprime-ea.md` body, verbatim list.
- "Based in Phnom Penh, self-taught" — `About.astro` ("Self-taught in Phnom Penh").
- "every number from validated runs" — site footer, verbatim. "nothing published before it's true" —
  `Factory.astro` STATUS ("not before") + `notes/index.astro` ("published when they're true").
- No numbers, no live/profitable status claims. "Last updated 2026-07-13" is a page date, not a trading
  claim.

## Review notes

- Reviewer flagged (both fixed): "kill switch that's always armed" mixed the EA claim with About.astro's
  personal-discipline phrasing → trimmed to the verbatim holaprime-ea.md list. "no invented numbers" as a
  stated factory rule wasn't published anywhere → re-anchored to the footer's "every number from
  validated runs".
- Main thread dropped a trailing "published when they're true" that repeated the previous sentence.
