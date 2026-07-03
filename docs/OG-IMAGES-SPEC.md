# Per-Project OG Images — Build Spec

Give every project detail page (and the key top-level pages) its own 1200×630 social share image, on-brand (dark Amber Terminal), generated from the projects collection — no external services, no new runtime deps. Currently every page shares the homepage `/og.png`.

## 1. Base layout accepts an ogImage prop
`src/layouts/Base.astro` currently hardcodes `og:image` (and should also set `twitter:image`) to `/og.png`. Change it to accept an `ogImage` prop (default `'/og.png'`) and emit an ABSOLUTE URL built from the configured `site` (e.g. `new URL(ogImage, Astro.site)`) for both `og:image` and `twitter:image`. Social scrapers require absolute URLs. Don't break existing pages — default keeps `/og.png`.

## 2. On-brand OG card template (buildable render route)
Create `src/pages/og-card/[slug].astro`:
- `getStaticPaths()` over `getCollection('projects', p => p.data.tier === 'featured' && !p.data.draft)`.
- Renders a single element sized EXACTLY 1200×630 px (fixed, `width:1200px;height:630px;overflow:hidden`), no page margin, dark bg `#0B0A08`.
- Layout (match the site + tearsheet look): 
  - Top: mono kicker `// <CATEGORY> · <YEAR>` in muted, `chetra.xyz` wordmark top-right (accent dot).
  - Middle: Fraunces title (big, ~72–96px, tight leading, `#EDE6DA`); tagline below in Instrument Sans, muted, 2 lines max.
  - Bottom: mono stack row (`PYTHON · DOCKER · …`, accent dots) + a status chip; a faint amber equity-curve motif or a 1px accent baseline for texture.
- Inline the fonts the same way the site does (fontsource) so the screenshot renders with Fraunces/Instrument Sans/JetBrains Mono, not fallbacks. Wait for `document.fonts.ready` conceptually — the generator must delay capture until fonts load (see step 4).
- This route is a rendering helper, not content — see step 5 (exclude from sitemap).

Optionally also add fixed cards for `/work`, `/tearsheet`, `/notes` (nice-to-have; do featured projects first).

## 3. Generation script
Add `scripts/gen-og.mjs` (Node, ESM) that:
- Reads the list of featured slugs (from the built output or by importing the collection — simplest: glob `src/content/projects/*.md`, parse frontmatter, take tier==featured && !draft).
- Assumes a local preview server is running (document the port). For each slug, capture `http://localhost:<port>/og-card/<slug>/` at exactly 1200×630 → `public/og/<slug>.png`.
- Capture via headless Chrome (installed at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`): 
  `<chrome> --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --screenshot="public/og/<slug>.png" --virtual-time-budget=1500 "http://localhost:<port>/og-card/<slug>/"`
  (the `--virtual-time-budget` gives fonts time to load; verify output is 1200×630 and not blank/fallback-font).
- Also document the one-shot run sequence in the script header: `npm run build && (npx astro preview --port 4498 &) && node scripts/gen-og.mjs && kill preview`.
- Add an npm script `"og": "node scripts/gen-og.mjs"` to package.json.

Generated PNGs live in `public/og/` and are committed (they're static assets served at `/og/<slug>.png`).

## 4. Wire detail pages to their image
`src/pages/work/[slug].astro`: pass `ogImage={`/og/${slug}.png`}` to Base. (If a generated file is missing for some slug, the default `/og.png` still applies — acceptable fallback, but generate all featured.)

## 5. Keep helper routes out of the sitemap
`/og-card/*` are render helpers, not pages. Exclude them from the sitemap: in `astro.config.mjs` `@astrojs/sitemap` integration, add a `filter: (page) => !page.includes('/og-card/')`. Verify the built `sitemap-*.xml` has no og-card URLs.

## 6. Verify (report these)
- `public/og/<slug>.png` exists for ALL 9 featured slugs, each exactly 1200×630, and visibly on-brand (real fonts, not blank).
- A featured detail page's built HTML has `<meta property="og:image" content="https://chetra.xyz/og/<slug>.png">` (absolute).
- `npm run build` clean; sitemap excludes og-card; JS budget unaffected (these are build-time images, zero client JS).
- Report: files created/changed, the generation command, list of PNGs with dimensions, and paste one detail page's og:image/twitter:image meta tags.

## Constraints
- No external fonts/CDNs, no new npm deps beyond what's installed (Chrome is used via CLI, not a package). Tokens/fonts must match the site. Don't touch cockpit, tearsheet content, motion.js, or project content files.
