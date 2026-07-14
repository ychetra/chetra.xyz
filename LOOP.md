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
- Iteration: 6 (404 page — next)
- Branch: `site-loop`
- Baseline (2026-07-10): build 35.4s, 25 pages (astro count incl. 404; verify-site counts 24 index.html), raw JS 156,818/204,800 bytes (77% of budget)
- Lighthouse baseline (2026-07-13, it2): all 6 runs ≥95. Known ceilings: home BP 96 = console error from external trading.chetra.xyz 530 (not a site defect); home mobile perf 96 = throttled FCP 2.0s.
- Standing risk: host disk 98% full — large artifacts (screenshots, lighthouse reports) go to scratchpad, not repo.

## BACKLOG (top = next)
### P1 — perf + polish
- [x] **Baseline**: build 35.4s · 25 pages · JS 156,818 bytes (77% of budget). Recorded in STATE.
- [x] A11y sweep: palette input focus ring restored (outline-none killed the global :focus-visible rule); archive Repo/Live links got per-project aria-labels. Reduced-motion audit: all 15 animation inits covered, zero gaps. Everything else already correct.
- [x] Lighthouse: 6 runs (home/work/featured × desktop/mobile) all ≥95 — perf 96-100, a11y 100, BP 96-100, SEO 100. Zero fixes needed. Ceilings recorded in STATE.
- [x] Dead CSS/JS audit: clean — all 13 @theme tokens live, zero orphaned selectors, OG assets match slugs 1:1, all JS functions consumed. Nothing removed.

### P2 — features
- [x] `/now` page — static, 3 sections, every sentence fact-traced to already-published copy (trace table in docs/drafts/now-page.md). Nav + ⌘K entries added. PENDING USER PROSE REVIEW before deploy.
- [x] RSS feed for notes — `src/pages/rss.xml.js` + `<link rel="alternate">` in Base head. New dep: `@astrojs/rss@4.0.19` (only dep added by the loop). Build-time only, JS budget unchanged. Notes-index RSS link deferred (design judgment) → see backlog.
- [ ] 404 page in site voice.
- [ ] Visible RSS link on /notes/ (deferred from it5 — needs design judgment: placement + whether an icon fits the no-radius/mono system).

### P3 — project integrations
- [ ] Factory architecture note + inline SVG diagram (from ~/trading-agent docs; DEMO-labeled, zero numbers).
- [ ] Cockpit-style animated widget on work page (honest simulation, labeled, JS-budget-aware).

### P4 — content pipeline
- [ ] Draft 1 note from a vault session note (e.g. supertrend-scalp-port) → `docs/drafts/` for user review.

## LOG
- 2026-07-10 · it0 · scaffolding: LOOP.md + site-loop skill + verify-site.sh created; git index corruption repaired (disk 98% full — flagged).
- 2026-07-10 · it1 · a11y sweep (2 files, markup-only) · VERIFY OK, JS unchanged 156,818B · reviewer cut off by session limit, remaining checks finished in main thread · commit 7df9ec0.
- 2026-07-13 · it2 · Lighthouse 6 runs all ≥95 (min: home BP 96 = external trading.chetra.xyz 530 console error; home mobile perf 96 = throttled FCP 2.0s) · zero fixes needed · main-thread spot-check of raw JSONs matched · VERIFY OK, JS unchanged 156,818B.
- 2026-07-13 · it3 · dead CSS/JS audit · zero dead code found (tokens/selectors/OG/JS all live; conservative rules) · tree untouched, spot-checks matched · VERIFY OK, JS unchanged 156,818B.
- 2026-07-13 · it4 · /now page (now.astro + nav + ⌘K, zero client JS) · reviewer found 2 attribution risks in prose, both fixed; fact-trace verified in main thread · playwright 375/1440 clean, no overflow · VERIFY OK, JS unchanged 156,818B, 25 pages (+1).
- 2026-07-13 · it5 · RSS feed for notes (rss.xml.js + head link, @astrojs/rss@4.0.19) · audit: `draft` filter matches real schema, feed description lifted verbatim from notes/index.astro:7, dep in `dependencies` not dev · main thread added reverse-chron sort (glob order would break with a 2nd note) · rendered item = absolute URL + trailing slash · VERIFY OK, JS unchanged 156,818B.
