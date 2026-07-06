/**
 * Light/dark theme toggle. Dark is the default/brand; only an explicit user
 * choice (persisted to localStorage) switches to light -- no
 * prefers-color-scheme auto-switch (see THEME-SPEC.md §4).
 *
 * The no-FOUC script inline in Base.astro's <head> (is:inline, runs before
 * first paint) already sets html[data-theme="light"] from localStorage on
 * hard loads, so this module's job is just: handle clicks, keep the toggle
 * button(s) aria-* in sync, update meta[theme-color], and re-assert on
 * ClientRouter swaps.
 *
 * Icon swap (sun/moon) is pure CSS keyed off html[data-theme] (see
 * global.css) -- deliberately not done here, so the correct icon is already
 * showing on first paint and on the mobile #nav-overlay's fresh button after
 * every soft nav, with zero JS race.
 *
 * Two toggle buttons exist in the DOM (Nav.astro): the persisted desktop
 * header's (survives soft navs, transition:persist) and the mobile
 * #nav-overlay's (a brand-new node every swap, NOT persisted -- same
 * lifecycle as the rest of that overlay). Binding the click listener on
 * `document` once, at module scope, covers both without needing the
 * dataset-flag re-bind-guard pattern initNav() uses in motion.js --
 * delegation already handles nodes that don't exist yet.
 */

const THEME_KEY = 'theme';
const DARK_THEME_COLOR = '#0B0A08';
const LIGHT_THEME_COLOR = '#F4EFE6';
const FADE_MS = 120;

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    // Storage unavailable (private mode / disabled) -- fall back to light,
    // matching the no-FOUC script's own try/catch fallback.
    return 'light';
  }
}

function currentTheme() {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function updateMetaThemeColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? LIGHT_THEME_COLOR : DARK_THEME_COLOR);
}

/** Syncs every toggle button in the DOM (persisted header + fresh overlay copy). */
function syncToggleUI(theme) {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    btn.setAttribute('aria-pressed', theme === 'light' ? 'true' : 'false');
  });
}

/**
 * Applies a theme to the document. `persist: false` is used on
 * astro:after-swap re-assertion, where we're re-deriving from localStorage
 * (already the source of truth) rather than recording a new user choice.
 */
function applyTheme(theme, { persist = true } = {}) {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;

  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Non-fatal: theme still applies for this page load, just won't persist.
    }
  }

  updateMetaThemeColor(theme);
  syncToggleUI(theme);
}

/**
 * Instant switch is correct terminal behavior (spec §4) -- the optional
 * ~120ms opacity micro-fade is just a soft edge, not a themed transition,
 * and is skipped entirely under reduced motion rather than relying on
 * global.css's transition-duration:0.01ms fallback, so no transition
 * property is ever written for those users.
 */
export function toggleTheme() {
  const next = currentTheme() === 'light' ? 'dark' : 'light';

  if (reducedMotion()) {
    applyTheme(next);
    return;
  }

  const html = document.documentElement;
  html.style.transition = `opacity ${FADE_MS}ms ease`;
  html.style.opacity = '0.4';
  applyTheme(next);
  requestAnimationFrame(() => {
    html.style.opacity = '1';
    window.setTimeout(() => {
      html.style.transition = '';
      html.style.opacity = '';
    }, FADE_MS);
  });
}

function onDocumentClick(event) {
  const target = event.target;
  const btn = target instanceof Element ? target.closest('[data-theme-toggle]') : null;
  if (btn) toggleTheme();
}

/**
 * Runs on the initial load AND after every astro:page-load. Idempotent:
 * just re-reads the live html[data-theme] and re-applies aria state / meta-color,
 * which also seeds the correct state on any freshly-rendered #nav-overlay
 * toggle button (SSR can't know the client's stored theme, so its aria-*
 * attributes start from Nav.astro's static markup until this runs).
 */
function syncOnPageLoad() {
  const theme = currentTheme();
  updateMetaThemeColor(theme);
  syncToggleUI(theme);
}

/**
 * ClientRouter preserves <html> attributes across swaps except edge cases
 * (spec §4) -- re-assert from localStorage (the source of truth, not
 * html[data-theme] which is what we're verifying) on every swap. persist:
 * false because this is re-derivation, not a new user choice.
 */
function reassertOnSwap() {
  applyTheme(readStoredTheme(), { persist: false });
}

// Bound once: this module only evaluates once per real page load (ES module
// import, not re-executed on soft navs), so no astro:page-load re-bind guard
// is needed here the way initNav()'s dataset-flag guard is in motion.js.
document.addEventListener('click', onDocumentClick);

document.addEventListener('astro:page-load', syncOnPageLoad);
document.addEventListener('astro:after-swap', reassertOnSwap);
