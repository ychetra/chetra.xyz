# Projects Content — Authoring Spec (real content; runs AFTER system scaffold)

Author the real project markdown files in `src/content/projects/`, matching the schema in `src/content.config.ts` (defined in docs/PROJECTS-SYSTEM-SPEC.md). Delete the `_example-*` seed files. Grounded in the user's real GitHub (`ychetra`) inventory.

## THE ANTI-FABRICATION RULE (non-negotiable)
The site's ethos is "every number from validated runs" and the audience is prop firms who verify claims. Therefore:
- **Never invent metrics, dates, results, or capabilities.** If you don't know it from the repo or the material provided here, DON'T write it.
- Where a fact is missing, write a visible `TODO(chetra): …` in the body (these are placeholders the user fills) — never a plausible-sounding guess.
- Only include `metrics:` frontmatter for facts that are real and known (see per-project notes). The Strategy Factory's numbers are already public on this site (tearsheet) — those are OK to reuse.
- Read each PUBLIC repo before writing (via `gh repo view ychetra/<name> --json …` and `gh api repos/ychetra/<name>/readme`, or clone read-only). Base the write-up on what's actually there: purpose, stack, structure, notable design.

## FEATURED tier (9) — get detail pages
Two sub-rules by privacy (per user's explicit scope call):

### Private trading repos → "JUST EXISTENCE + STACK" (light detail page, no new internals)
Keep these short: one honest paragraph of what it is + stack + status. NO architecture deep-dive, NO strategy internals, NO invented numbers. `isPrivate: true`, no repo link (show lock).
1. **Strategy Factory** (repo: trading-agent, private). EXCEPTION: its validated results are already public on this site — the body may briefly summarize and link to the on-page case study (`/#factory`) and the tearsheet (`/tearsheet`). Reuse only already-published numbers. Stack: Python, Docker, vectorbt, pandas, MongoDB. category: trading. order 1.
2. **HolaPrime EA** (repo: hola-ea, private). Existence + stack only: a prop-firm Expert Advisor enforcing the risk ladder. Stack: Python, MQL5. category: trading. order 3.
3. **Trading Cockpit** (repo: chatra/chetra trading dashboard lineage, private). Existence + stack only: real-time command view of the factory. Stack: TypeScript, FastAPI, MongoDB, ECharts. category: trading. order 2. (Its animated mock lives on the homepage cockpit — may link to `/#factory`.)

### Public repos → honest, repo-sourced write-ups (read the repo, flag gaps)
Structure body as: short intro → **The problem** → **What I built** → **Stack & approach** → **Status / results** (TODO if unknown). Keep the quiet, precise tone. `isPrivate: false`, include `repo:` link.
4. **LLM-Trading** (repo: LLM-trading, public, Jupyter). LLM applied to trading research. Read the notebooks' intent. category: trading. order 4.
5. **Polymarket Bots** (repos: polymarket + poly_bot, public, Python). Prediction-market trading/automation. Merge the two repos into one project; link the primary. category: trading. order 5.
6. **YT Strategy Agent** (repo: yt-strategy-agent, private, Python — desc: "auto-generated docs"). Auto strategy-generation agent. If private, treat as existence+stack; if readable, light write-up. category: ai-systems. order 6.
7. **Trading Journal** (repo: Trading-Journal, private, TypeScript). Trade logging/journaling app. Existence + stack (private). category: trading. order 7.
8. **Claude-brain** (repo: claude-brain, private, Python — but user has referenced it publicly). Self-evolving memory system: knowledge graphs, Obsidian vault, multi-agent orchestration, cost-tiered routing. Write from what's publicly known + user's prior descriptions; flag specifics as TODO. Keep `repo:` only if the repo is actually public — it's currently PRIVATE, so set isPrivate:true and omit the repo link (or link the known public mirror if one exists: github.com/ychetra/claude-brain — verify public before linking). category: ai-systems. order 8.
9. **forven** (repo: forven, public, Python). READ THE REPO to learn what it is (unknown to us) — write only what the repo shows; if unclear, minimal + TODO. category: ai-systems or other (decide from repo). order 9.

## ARCHIVE tier — compact rows (frontmatter only, NO body, NO detail page)
Create minimal `.md` files (frontmatter only, `tier: archive`) for the meaningful non-featured repos. Include: title, tagline (short, honest — from repo desc or obvious purpose), year (from updatedAt), tier: archive, category, status: 'archived' (or 'active' if recently touched), stack (primaryLanguage + obvious), repo (if public) or isPrivate. NO invented detail.

Archive set (drop pure coursework/web-throwaway — RUPP_Web, OOAD_PolicyPart, php-admin, phpecommerce, wordpress, furnijs, ecommerce, laravel-api, vote, Teaching-Site, y4s1_aws_web, Test-API, web-api, Quickstart, testbruno, admin, web, wpbackup, demo-light are EXCLUDED). Include these as archive rows:
- **IoT / hardware**: andon-tower-light, Smart-light, Tuya-API, home-assistant, esp_sim, Camera-Docs, repair (category: iot)
- **Trading (secondary)**: autonomous_bot, trading-bot-copy, self-claw, mqttbroker, pipboost (category: trading or ai-systems — judge from repo; if unknown purpose, tagline = repo desc or "TODO(chetra): describe")
- **Other**: Product-Authenticity, Yai-Chinese-Release, InE/ine_v2 (merge InE+ine_v2 → one) (category: other/web)
Use judgment; if a repo's purpose is genuinely unknown and private, either skip it or add with tagline `TODO(chetra): describe` — never guess.

## After authoring
- Delete `src/content/projects/_example-*.md` seeds.
- `npm run build` must pass clean (all featured slugs generate detail pages; index lists featured + archive).
- Verify no `draft: true` left on anything meant to ship (unless the user chose review-mode — they chose "draft from repos, flag gaps, never invent", so ship live with TODO markers in bodies, NOT draft-hidden).
- Report: files created, which projects had gaps flagged as TODO, any repo you couldn't read, build output.
