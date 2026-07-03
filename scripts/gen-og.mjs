#!/usr/bin/env node
/**
 * Generate per-project OG (social share) images.
 *
 * Reads the projects content collection (by globbing + frontmatter-parsing
 * src/content/projects/*.md — no astro:content runtime available outside
 * Astro, and no new deps allowed), keeps the featured/non-draft slugs, and
 * screenshots each one's /og-card/<slug>/ render route at exactly 1200x630
 * via headless Chrome.
 *
 * One-shot run sequence (build, boot a preview server, generate, stop it):
 *
 *   npm run build
 *   npx astro preview --port 4498 &
 *   PREVIEW_PID=$!
 *   npm run og
 *   kill $PREVIEW_PID
 *
 * Or, if a preview server is already running on some other port:
 *
 *   OG_PORT=4488 npm run og
 *
 * This script does NOT start/stop the preview server itself — it assumes
 * one is already reachable at http://localhost:$OG_PORT (default 4498) and
 * fails fast with a clear message if it isn't.
 */
import { readFileSync, readdirSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PROJECTS_DIR = path.join(ROOT, 'src/content/projects');
const NOTES_DIR = path.join(ROOT, 'src/content/notes');
const OUT_DIR = path.join(ROOT, 'public/og');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const PORT = process.env.OG_PORT || 4498;
const BASE_URL = `http://localhost:${PORT}`;

const WIDTH = 1200;
const HEIGHT = 630;

/** Minimal frontmatter reader — good enough for the flat scalar fields
 * this script needs (tier, draft, slug). Doesn't attempt to parse the
 * nested `metrics`/`stack` arrays; those aren't needed here. */
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z][\w]*):\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    fm[key] = rawValue.trim().replace(/^"(.*)"$/, '$1');
  }
  return fm;
}

function getFeaturedSlugs() {
  const files = readdirSync(PROJECTS_DIR).filter((f) => f.endsWith('.md'));
  const slugs = [];
  for (const file of files) {
    const raw = readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
    const fm = parseFrontmatter(raw);
    const isDraft = fm.draft === 'true';
    if (fm.tier === 'featured' && !isDraft) {
      slugs.push(fm.slug || file.replace(/\.md$/, ''));
    }
  }
  return slugs.sort();
}

function getNoteSlugs() {
  let files;
  try {
    files = readdirSync(NOTES_DIR).filter((f) => f.endsWith('.md'));
  } catch {
    return []; // no notes dir yet
  }
  const slugs = [];
  for (const file of files) {
    const raw = readFileSync(path.join(NOTES_DIR, file), 'utf-8');
    const fm = parseFrontmatter(raw);
    if (fm.draft !== 'true') slugs.push(file.replace(/\.md$/, ''));
  }
  return slugs.sort();
}

function isServerUp() {
  try {
    execFileSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', `${BASE_URL}/`], {
      encoding: 'utf-8',
    });
    return true;
  } catch {
    return false;
  }
}

function shoot(slug) {
  const url = `${BASE_URL}/og-card/${slug}/`;
  const out = path.join(OUT_DIR, `${slug}.png`);
  execFileSync(
    CHROME,
    [
      '--headless=new',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${WIDTH},${HEIGHT}`,
      `--screenshot=${out}`,
      // Gives web fonts (Fraunces/Instrument Sans/JetBrains Mono, loaded via
      // fontsource) time to load before the virtual clock advances and
      // Chrome takes the screenshot — without this the capture can race
      // font load and fall back to system fonts.
      '--virtual-time-budget=1500',
      url,
    ],
    { stdio: 'inherit' }
  );
  return out;
}

/** Reads width/height straight out of the PNG IHDR chunk (bytes 16-23) —
 * no image-parsing dependency needed for a sanity check. */
function pngDimensions(file) {
  const buf = readFileSync(file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function main() {
  if (!isServerUp()) {
    console.error(
      `\n✗ No server reachable at ${BASE_URL}.\n` +
        `  Start one first, e.g.:\n` +
        `    npm run build && npx astro preview --port ${PORT}\n` +
        `  or point at an already-running server: OG_PORT=<port> npm run og\n`
    );
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  const slugs = [...getFeaturedSlugs(), ...getNoteSlugs()];
  if (slugs.length === 0) {
    console.error('✗ No featured, non-draft projects found in src/content/projects/.');
    process.exit(1);
  }

  console.log(`Generating ${slugs.length} OG image(s) from ${BASE_URL} → public/og/\n`);

  const results = [];
  for (const slug of slugs) {
    const out = shoot(slug);
    const { width, height } = pngDimensions(out);
    const { size } = statSync(out);
    const ok = width === WIDTH && height === HEIGHT;
    results.push({ slug, width, height, size, ok });
    const flag = ok ? '✓' : '✗ WRONG SIZE';
    console.log(`  ${flag}  ${slug}.png  ${width}x${height}  ${(size / 1024).toFixed(1)}KB`);
  }

  const failed = results.filter((r) => !r.ok);
  if (failed.length > 0) {
    console.error(`\n✗ ${failed.length} image(s) did not come out at ${WIDTH}x${HEIGHT}.`);
    process.exit(1);
  }

  console.log(`\n✓ Done. ${results.length} image(s) written to public/og/.`);
}

main();
