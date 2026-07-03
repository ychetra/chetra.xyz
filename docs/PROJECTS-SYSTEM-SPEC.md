# Projects System — Build Spec (system only; content authored separately)

Turn the hardcoded 4-card `Projects.astro` into a content-collection–driven projects system: a `/work` index that lists EVERY project in two tiers, a detail page per featured project, and a homepage teaser that reads from the same single source of truth. Astro 5 + Tailwind 4, matches the Amber Terminal design system. No new deps.

## Two-tier model (resolves "list everything" vs "ten projects")
- **tier: "featured"** → rich detail page at `/work/<slug>`, eligible for homepage teaser, shown as a full card on the index.
- **tier: "archive"** → compact row on the index only (title, year, stack, repo link). NO detail page, NO write-up.

This lists everything without fabricating 50 case studies.

## 1. Content collection (single source of truth)

Create `src/content.config.ts` (Astro 5 content-layer API):

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),                 // override; else derived from filename
    tagline: z.string(),                          // one-line card summary (<= ~120 chars)
    year: z.string(),                             // "2026" or "2025–26"
    order: z.number().default(100),               // sort key within a tier (lower = first)
    tier: z.enum(['featured', 'archive']),
    category: z.enum(['trading', 'ai-systems', 'iot', 'web', 'other']),
    status: z.enum(['shipped', 'active', 'wip', 'archived', 'private']),
    stack: z.array(z.string()),                   // ["Python","Docker",...]
    role: z.string().optional(),                  // "Solo build"
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    isPrivate: z.boolean().default(false),        // repo not public — show lock, no repo link
    metrics: z.array(z.object({
      label: z.string(), value: z.string(),
      tone: z.enum(['neutral','up','down','accent']).default('neutral'),
    })).optional(),
    draft: z.boolean().default(false),            // exclude from build entirely
  }),
});

export const collections = { projects };
```

Detail-page body = the markdown content of each file (rendered via `render()`).

## 2. `/work` index — `src/pages/work/index.astro`

- Uses Base layout. title `Work — Chetra`, description e.g. `Selected projects — trading systems, autonomous agents, and the infrastructure around them.`
- Kicker `// SELECTED WORK`, big Fraunces h1 `Work`. Short intro line (muted).
- **Featured section**: `getCollection('projects')` filtered `tier==='featured' && !draft`, sorted by `order` then `year` desc. Render as an editorial grid (reuse the homepage project-card visual language — mono index number, Fraunces title, tagline, stack tag, status chip, hover → bg-surface + title→accent). Each links to `/work/<slug>`. If `metrics` present, optionally surface the top 1 metric on the card (e.g. the accent one).
- **Archive section**: `tier==='archive'`, grouped by `category` (trading, ai-systems, iot, web, other) with a mono category header each. Each project = a compact row: title · year · stack (mono) · repo/demo link (or a lock glyph if isPrivate). Dense, scannable, no cards. Sorted by year desc within group.
- A count somewhere: `N projects` (total across tiers).
- Fully responsive 375→4K, no horizontal overflow, scroll-reveal via the existing `data-reveal-group`/`data-reveal-item` hooks (so motion.js animates them; verify reduced-motion leaves them visible).

## 3. Detail page — `src/pages/work/[slug].astro`

- `getStaticPaths()` over `tier==='featured' && !draft` only. Param = slug (frontmatter `slug` or filename).
- Layout (long-form case study, reuse Factory section's visual language):
  - **Hero**: kicker `// <CATEGORY> · <YEAR>`, Fraunces h1 title, tagline as subhead. Meta row (mono): role, status chip, stack chips. Links: `Repo ↗` (if repo & !isPrivate), `Live ↗` (if demo). If isPrivate, a muted `Private repository` note with a lock glyph instead of a repo link.
  - **Metrics strip** (if `metrics` present): the same bordered metric-cell grid used on the homepage (label / value with tone color / optional note). Do NOT count-up here unless trivial; static is fine.
  - **Body**: rendered markdown in a `.prose`-style block tuned to the tokens — Fraunces for h2/h3, Instrument Sans body at readable measure (max-w ~68ch), mono for inline code, accent for links, styled lists/blockquotes (pull-quote style for `>`). Ensure headings continue h2→h3 under the page h1.
  - **Footer nav**: prev/next featured project (by `order`), and a `← All work` link to `/work`.
- Meta: per-project title `<title> — Chetra`, description = tagline, canonical, og (reuse Base's og image for now).

## 4. Homepage refactor — `src/components/Projects.astro`

- STOP hardcoding the 4-card array. Read `getCollection('projects')`, take `tier==='featured'`, sort by `order`, show the top **4** as the existing card grid.
- Cards now link to `/work/<slug>` (internal) instead of anchors/external, EXCEPT keep the Strategy Factory card pointing to `#factory` (its deep dive is the on-page case study) — OR link it to its detail page; pick one and be consistent. Preferred: featured cards link to their `/work/<slug>` detail pages; the Factory's detail page can summarize + link down to nothing (content team handles its copy).
- Add a footer link under the grid: `View all N projects � /work` (mono, uppercase, tracking-[0.15em], accent underline on hover). N = total project count from the collection.
- Keep the section's existing id `projects`, kicker, reveal hooks, a11y (the `<a>` vs `<article>` logic no longer needed — all featured cards are links now, so all `<a>`).

## 5. Nav reconciliation (`src/components/Nav.astro`)

Currently: Work→`#factory`, Projects→`#projects`, Notes→`/notes`, Contact→`#contact`.
Change to a coherent set now that a real index exists:
- **Work → `/work`** (the new index).
- Remove the separate **Projects** item (Work now covers it) — OR repoint it to `/work`; prefer removing to keep nav tight (4 items: Work, Notes, Contact — plus wordmark home).
- **Contact** must work from sub-pages: use `/#contact` (absolute) not `#contact`, so it also works from `/work`, `/work/<slug>`, `/notes`. Same for any other homepage-anchor nav item.
- Mobile overlay uses the same link list — verify it still opens (the overlay-outside-header fix must stay intact).

## Seed content (so the system builds + renders before content agents run)
Create ONE placeholder featured project and ONE archive project as `src/content/projects/_example-*.md` with `draft: false` so `getStaticPaths`, the index, and the detail template all have data to render and the build is verifiable. Use obviously-placeholder copy (e.g. title "Example Project", tagline "Placeholder — replace"). The content team will delete these and add real files. Do NOT invent real-looking metrics in the seed.

## Hard requirements
- `npm run build` passes clean with the seed content (index + at least one detail page generated).
- No horizontal overflow at 375px on index and detail.
- Reduced-motion: all project cards/rows visible (reveal hooks hidden-state set via JS only).
- Zero border-radius, no shadows, token classes only. Mono for data/labels, Fraunces for headings.
- Keep total client JS < 200KB (no new libraries).
- Don't touch: cockpit (Factory.astro cockpit block), tearsheet, motion.js internals (only reuse its data-attrs), tokens.

## Report
Files created/changed, build output, JS size, how slug is derived, and confirmation the seed detail page renders + nav anchors resolve from `/work`.
