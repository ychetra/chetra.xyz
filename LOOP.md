# SITE LOOP — chetra.xyz self-improvement loop

The persistent spine of the improvement loop (see `.claude/skills/site-loop/SKILL.md` for protocol).
Model forgets between runs; this file doesn't. Every iteration reads it first, writes it last.

## GUARDRAILS (inviolable — no iteration may violate)
1. **Never invent metrics/results/dates/capabilities.** Tearsheet + all published numbers are UNTOUCHABLE by the loop. New numbers only from a user-approved snapshot.
2. **No deploys.** Loop stages + commits on the `site-loop` branch only. User reviews and deploys from main.
3. **No prose published without user review.** Content drafts go to `docs/drafts/`, never to `src/content/`.
4. Verification gate before any "done": `bash scripts/verify-site.sh` passes (build + JS <200KB raw) + visual check at 375px/1440px for visual changes (playwright; no horizontal overflow).
5. ClientRouter lifecycle rules (init on `astro:page-load`, teardown on `astro:before-swap`), reduced-motion static fallback on every animation, design-token classes only, zero border-radius/shadows.
6. No new npm deps without flagging in the iteration report. Builder = sonnet worker w/ ponytail; separate reviewer audits the diff — never self-graded.
7. Copy voice: quiet, precise, zero hype.

## STATE
- Iteration: 1 (a11y sweep — builder dispatched)
- Branch: `site-loop`
- Baseline (2026-07-10): build 35.4s, 25 pages, raw JS 156,818/204,800 bytes (77% of budget)
- Standing risk: host disk 98% full — large artifacts (screenshots, lighthouse reports) go to scratchpad, not repo.

## BACKLOG (top = next)
### P1 — perf + polish
- [x] **Baseline**: build 35.4s · 25 pages · JS 156,818 bytes (77% of budget). Recorded in STATE.
- [ ] A11y sweep: focus-visible states, aria-labels on icon links, prefers-reduced-motion coverage audit (fallback rule check on every GSAP init).
- [ ] Lighthouse 4-category run (needs `npx lighthouse` vs preview server — heavy; scratchpad output) → fix lowest category to ≥95.
- [ ] Dead CSS/JS audit: unused tokens, orphaned styles, stale OG assets.

### P2 — features
- [ ] `/now` page — what's running now (trading factory status, current focus). Static, hand-written, no live numbers.
- [ ] RSS feed for notes (`@astrojs/rss`, official + tiny — flag as new dep).
- [ ] 404 page in site voice.

### P3 — project integrations
- [ ] Factory architecture note + inline SVG diagram (from ~/trading-agent docs; DEMO-labeled, zero numbers).
- [ ] Cockpit-style animated widget on work page (honest simulation, labeled, JS-budget-aware).

### P4 — content pipeline
- [ ] Draft 1 note from a vault session note (e.g. supertrend-scalp-port) → `docs/drafts/` for user review.

## LOG
- 2026-07-10 · it0 · scaffolding: LOOP.md + site-loop skill + verify-site.sh created; git index corruption repaired (disk 98% full — flagged).
