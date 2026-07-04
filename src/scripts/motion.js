import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * prefers-reduced-motion is re-checked on every astro:page-load invocation
 * (not cached once at module-eval time) -- the media query itself can't
 * change mid-session in practice, but per the lifecycle spec this must be
 * "checked inside init, per invocation" so the whole per-page setup path
 * makes that check explicit and local instead of leaning on a module-level
 * constant computed once when the module first loaded.
 */
function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * gsap.context() scopes every tween/timeline/ScrollTrigger created inside
 * initPageContent() for the CURRENT page's main content. ctx.revert() on
 * astro:before-swap kills all of it in one call (including infinite
 * repeat:-1 tweens like the pipeline-connector dash and the status-dot
 * pulse, which would otherwise keep running forever on detached nodes after
 * every nav) and reverts any inline styles gsap set. Nav is intentionally
 * bound OUTSIDE this context: the header (and toggle) are transition:persist
 * and must survive reverts, not get torn down on every swap.
 */
let ctx = null;

let scrollProgressHandler = null;
let scrollProgressRaf = null;

/**
 * Fixed-nav mobile menu: hamburger toggle, full-screen overlay, focus trap.
 * Runs regardless of reduced-motion -- this is core navigation, not
 * decoration. Its own internal tween is gated on reducedMotion().
 *
 * #nav-toggle lives inside <header>, which is transition:persist, so this
 * function's setup (listener binding) must run exactly once per session --
 * guarded via a dataset flag on the persisted toggle node itself, the same
 * "already-initialized" pattern cockpit.js uses for its own root. #nav-
 * overlay, by contrast, is a sibling OUTSIDE <header> and is NOT persisted,
 * so it (and its <main>/<footer> targets for `inert`) are re-queried fresh
 * on every open/close call rather than cached in a closure -- caching them
 * once would go stale the moment the ClientRouter swaps in a new <main>/
 * <footer>/#nav-overlay on the very first client-side nav.
 */
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  if (!toggle) return;
  if (toggle.dataset.navBound === 'true') return;
  toggle.dataset.navBound = 'true';

  let isOpen = false;
  let lastFocused = null;

  function getOverlay() {
    return document.getElementById('nav-overlay');
  }

  function getLinks(overlay) {
    return Array.from(overlay.querySelectorAll('a'));
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
      return;
    }
    if (event.key === 'Tab') {
      const overlay = getOverlay();
      if (!overlay) return;
      const links = getLinks(overlay);
      const focusable = [toggle, ...links];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  function openMenu() {
    const overlay = getOverlay();
    if (!overlay) return;
    const links = getLinks(overlay);

    isOpen = true;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    toggle.classList.add('is-open');
    document.body.style.overflow = 'hidden';

    const mainEl = document.querySelector('main');
    const footerEl = document.querySelector('footer');
    if (mainEl) mainEl.inert = true;
    if (footerEl) footerEl.inert = true;

    if (!reducedMotion()) {
      gsap.fromTo(
        links,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' }
      );
    } else {
      links.forEach((link) => {
        link.style.opacity = '1';
        link.style.transform = 'none';
      });
    }

    links[0]?.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function closeMenu() {
    const overlay = getOverlay();
    isOpen = false;
    if (overlay) overlay.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.classList.remove('is-open');
    document.body.style.overflow = '';

    const mainEl = document.querySelector('main');
    const footerEl = document.querySelector('footer');
    if (mainEl) mainEl.inert = false;
    if (footerEl) footerEl.inert = false;

    document.removeEventListener('keydown', onKeydown);
    (lastFocused || toggle).focus();
  }

  toggle.addEventListener('click', () => (isOpen ? closeMenu() : openMenu()));

  // Delegate link clicks on `document` (not cached `links`) so this keeps
  // working even though #nav-overlay's <a> nodes are swapped for fresh ones
  // on every client-side nav.
  document.addEventListener('click', (event) => {
    if (!isOpen) return;
    const target = event.target;
    if (target instanceof Element && target.closest('#nav-overlay a')) closeMenu();
  });

  // If the viewport widens past the mobile breakpoint while the menu is
  // open, the toggle disappears (md:hidden) with no way to close the menu
  // and release the scroll lock. Force-close it on the breakpoint cross.
  window.addEventListener('resize', () => {
    if (isOpen && window.innerWidth >= 768) {
      closeMenu();
    }
  });
}

/**
 * Nav active state (persisted header only). Nav.astro's SSR output already
 * gets aria-current/accent right on every hard load AND on the (non-
 * persisted) #nav-overlay after every soft nav -- that markup is freshly
 * re-rendered per page. The persisted <header>, by contrast, is the SAME
 * DOM node across client-side navs (transition:persist skips re-render), so
 * whatever active-state classes were last applied to it survive untouched
 * and can go stale the moment you nav away. Re-derive from the live
 * location.pathname and reapply here, every astro:page-load, so the
 * persisted header stays honest. This is a correctness fix, not decoration
 * -- called unconditionally, before the reducedMotion() early return.
 */
function syncNavActiveState() {
  const path = window.location.pathname;
  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    const active = !href.startsWith('/#') && (path === href || path.startsWith(href));
    link.classList.toggle('text-accent', active);
    link.classList.toggle('decoration-accent', active);
    link.classList.toggle('text-fg', !active);
    link.classList.toggle('decoration-transparent', !active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

/** Hero content: simple on-load fade/slide, not scroll-triggered (already in view). */
function initHeroEntrance() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  const targets = [
    hero.querySelector('[data-hero-kicker]'),
    hero.querySelector('[data-hero-heading]'),
    hero.querySelector('[data-hero-copy]'),
  ].filter(Boolean);
  if (!targets.length) return;

  gsap.set(targets, { y: 24, opacity: 0 });
  gsap.to(targets, {
    y: 0,
    opacity: 1,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power2.out',
    delay: 0.1,
  });
}

/**
 * Hero live equity visualization (Hero.astro's <canvas data-hero-canvas>,
 * inside [data-hero-curve]). A continuously-running, simulated equity
 * ticker: an accent line + faint fill scroll left as new points are appended
 * every ~500ms, occasional trade markers (win/loss) fade in and scroll off
 * with the curve, a pulsing dot rides the newest point. Vanilla canvas 2D +
 * requestAnimationFrame, no libraries. See docs/HERO-VIZ-SPEC.md.
 *
 * Sampling model: `samples` is a fixed-length array (HERO_VIZ_VISIBLE + 1)
 * of logical y-values (0-300 space, matching the old hand-authored seed's
 * convention: 0 = top/high equity, 300 = baseline). x is never stored --
 * every sample is evenly spaced across the canvas width at draw time, so
 * "the view scrolls" is just a continuously growing pixel offset subtracted
 * from each sample's index-based x. When that offset reaches one step, the
 * oldest sample is dropped, a new one is appended, and the offset resets to
 * 0 -- the classic ticker-scroll technique (see draw()/pushSample() below).
 * The extra (+1) sample is what's sliding in from off-canvas-right during
 * that animation; it's what the now-dot rides.
 */
const HERO_VIZ_VISIBLE = 40; // samples fully on-screen at rest
const HERO_VIZ_TICK_MS = 500; // cadence of new samples
const HERO_VIZ_VALUE_MAX = 300; // logical y-range (matches legacy viewBox)
const HERO_VIZ_VALUE_TOP = 14; // clamp: never draws above this (near top)
const HERO_VIZ_VALUE_BASE = 290; // clamp: never draws below this (near baseline)
const HERO_VIZ_MARKER_CHANCE = 0.25; // ~1 in 4 new points gets a trade marker
const HERO_VIZ_WIN_CHANCE = 0.55; // loosely matches the published win rate; never printed here
const HERO_VIZ_LABEL_CHANCE = 0.4; // fraction of markers that also get a fading R-multiple label
const HERO_VIZ_LABEL_MS = 1500;
const HERO_VIZ_MARKER_FADE_MS = 400;
const HERO_VIZ_COLOR_REFRESH_MS = 1000; // re-read CSS custom properties at most this often

// Per-page-load teardown registry -- mirrors cockpit.js's pattern. Hero.astro
// only renders on the homepage and its [data-hero-curve] root is NOT
// transition:persist, so every astro:page-load here starts from a clean
// node and every astro:before-swap must fully undo it (no stacked rAF loops
// across home -> work -> home round-trips).
let heroVizRafId = null;
let heroVizResizeHandler = null;
let heroVizResizeTimer = null;
let heroVizObserver = null;
let heroVizVisibilityHandler = null;
let heroVizThemeClickHandler = null;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** '#RGB' | '#RRGGBB' -> 'rgba(r,g,b,a)'. The only hex shapes global.css uses. */
function hexToRgba(hex, alpha) {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const int = parseInt(h, 16);
  if (Number.isNaN(int) || h.length !== 6) return `rgba(240,180,41,${alpha})`; // accent fallback
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function readHeroVizColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent: style.getPropertyValue('--color-accent').trim() || '#F0B429',
    up: style.getPropertyValue('--color-up').trim() || '#3FCF8E',
    down: style.getPropertyValue('--color-down').trim() || '#E5484D',
    line: style.getPropertyValue('--color-line').trim() || '#2A251F',
    muted: style.getPropertyValue('--color-muted').trim() || '#8F8577',
    mono: style.getPropertyValue('--font-mono').trim() || '"JetBrains Mono", ui-monospace, monospace',
  };
}

/**
 * Reads the seed curve baked into [data-hero-curve]'s data-curve-points
 * (Hero.astro's hand-authored 24-point array) and adapts it into the
 * fixed-length sample buffer described above: takes the tail if longer than
 * needed, pads (repeating the first value) if shorter, so the very first
 * frame reads as a continuation of the same curve shape regardless of the
 * seed's length.
 */
function seedHeroVizSamples(wrap) {
  let seed;
  try {
    seed = JSON.parse(wrap.dataset.curvePoints || '[]');
  } catch {
    seed = [];
  }
  if (!Array.isArray(seed) || seed.length < 2) return null;

  let samples = seed.map(([, y]) => y);
  const want = HERO_VIZ_VISIBLE + 1;
  if (samples.length > want) samples = samples.slice(samples.length - want);
  while (samples.length < want) samples.unshift(samples[0]);
  return samples;
}

/**
 * Clamped random-walk step: jaggy noise (both up- and down-ticks, like the
 * hand-authored seed's own local wiggles) with a slight upward bias, plus
 * occasional short, clearly-stronger pullbacks -- distinguishable "dips"
 * rather than every down-tick reading as one. Tuned by eye against a
 * ~20s capture so the curve visibly climbs and pulls back, rather than
 * either pinning flat at the ceiling or wandering with no net drift.
 */
function makeHeroVizStepper() {
  let dipRemaining = 0;
  return function step(last) {
    if (dipRemaining > 0) {
      dipRemaining--;
    } else if (Math.random() < 0.035) {
      dipRemaining = 3 + Math.floor(Math.random() * 3); // 3-5 tick pullback
    }
    const stepSize = 9;
    let next;
    if (dipRemaining > 0) {
      next = last + (0.3 + Math.random() * 0.5) * stepSize; // pullback: y rises (equity dips) each tick
    } else {
      next = last + (Math.random() - 0.62) * stepSize; // noisy, net upward drift (y trends down)
    }
    return clamp(next, HERO_VIZ_VALUE_TOP, HERO_VIZ_VALUE_BASE);
  };
}

function drawHeroVizMarker(ctx2d, x, y, isWin, size) {
  ctx2d.beginPath();
  if (isWin) {
    ctx2d.moveTo(x, y - size);
    ctx2d.lineTo(x + size, y + size);
    ctx2d.lineTo(x - size, y + size);
  } else {
    ctx2d.moveTo(x, y + size);
    ctx2d.lineTo(x + size, y - size);
    ctx2d.lineTo(x - size, y - size);
  }
  ctx2d.closePath();
  ctx2d.fill();
}

/**
 * Builds the whole engine for one [data-hero-curve] root and returns a small
 * API for initHeroCrosshair to read the live series from (or null if the
 * markup/canvas context isn't available). Handles BOTH branches internally:
 * prefers-reduced-motion draws exactly one static frame and schedules zero
 * rAF/listeners; otherwise it wires the full ticking engine with resize,
 * IntersectionObserver, and visibilitychange gating.
 */
function initHeroViz() {
  const wrap = document.querySelector('[data-hero-curve]');
  const canvas = wrap?.querySelector('[data-hero-canvas]');
  const heroSection = document.getElementById('hero');
  if (!wrap || !canvas || !heroSection) return null;
  if (wrap.dataset.heroVizInit === 'true') return null; // defensive, mirrors cockpit.js's guard
  wrap.dataset.heroVizInit = 'true';

  const ctx2d = canvas.getContext('2d');
  if (!ctx2d) return null;

  const samples = seedHeroVizSamples(wrap);
  if (!samples) return null;
  const markers = samples.map(() => null); // parallel array: null | { kind, r, createdAt, hasLabel }
  let activeLabel = null; // { text, createdAt } -- at most one visible at a time (site-wide spec rule)
  const step = makeHeroVizStepper();

  let width = 0;
  let height = 0;
  let colors = readHeroVizColors();
  let lastColorRead = 0;
  let lastTick = 0;

  function fit() {
    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  fit();

  function pushSample() {
    const next = step(samples[samples.length - 1]);
    samples.push(next);
    samples.shift();

    let marker = null;
    if (Math.random() < HERO_VIZ_MARKER_CHANCE) {
      const isWin = Math.random() < HERO_VIZ_WIN_CHANCE;
      const r = isWin ? 0.2 + Math.random() * 1.1 : -(0.2 + Math.random() * 1.0);
      const createdAt = performance.now();
      marker = { kind: isWin ? 'win' : 'loss', r, createdAt, hasLabel: false };
      if (!activeLabel && Math.random() < HERO_VIZ_LABEL_CHANCE) {
        marker.hasLabel = true;
        activeLabel = {
          text: `${r >= 0 ? '+' : ''}${r.toFixed(1)}R`,
          createdAt,
        };
      }
    }
    markers.push(marker);
    markers.shift();
  }

  /**
   * Renders the current buffer state. `advance` controls whether time has
   * passed since the last call (true inside the rAF loop) or this is a
   * one-off redraw of the same state with fresh colors (reduced-motion's
   * single frame, and the theme-toggle click redraw below).
   */
  function draw(now, advance) {
    if (now - lastColorRead > HERO_VIZ_COLOR_REFRESH_MS) {
      colors = readHeroVizColors();
      lastColorRead = now;
    }

    let progress = 0;
    if (advance) {
      let elapsed = now - lastTick;
      // Capped delta: a long gap (background-tab jank, or resuming from a
      // paused rAF after being scrolled out of view / tab hidden) resyncs
      // to "now" instead of fast-forwarding through every missed tick.
      if (elapsed > HERO_VIZ_TICK_MS * 3 || elapsed < 0) {
        lastTick = now;
        elapsed = 0;
      }
      progress = clamp(elapsed / HERO_VIZ_TICK_MS, 0, 1);
    }

    const stepX = width / HERO_VIZ_VISIBLE;
    const offset = progress * stepX;

    ctx2d.clearRect(0, 0, width, height);

    // --- grid: faint horizontal lines + a slightly stronger baseline ---
    ctx2d.strokeStyle = colors.line;
    ctx2d.lineWidth = 1;
    ctx2d.globalAlpha = 0.3;
    for (let g = 1; g < 4; g++) {
      const gy = Math.round((height / 4) * g) + 0.5;
      ctx2d.beginPath();
      ctx2d.moveTo(0, gy);
      ctx2d.lineTo(width, gy);
      ctx2d.stroke();
    }
    ctx2d.globalAlpha = 0.5;
    const baseY = Math.round((HERO_VIZ_VALUE_BASE / HERO_VIZ_VALUE_MAX) * height) + 0.5;
    ctx2d.beginPath();
    ctx2d.moveTo(0, baseY);
    ctx2d.lineTo(width, baseY);
    ctx2d.stroke();
    ctx2d.globalAlpha = 1;

    const n = samples.length;
    const pts = new Array(n);
    for (let i = 0; i < n; i++) {
      pts[i] = [i * stepX - offset, (samples[i] / HERO_VIZ_VALUE_MAX) * height];
    }

    // --- fill: faint accent gradient under the line to the baseline ---
    const grad = ctx2d.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, hexToRgba(colors.accent, 0.05));
    grad.addColorStop(1, hexToRgba(colors.accent, 0));
    ctx2d.fillStyle = grad;
    ctx2d.beginPath();
    ctx2d.moveTo(pts[0][0], height);
    pts.forEach(([x, y]) => ctx2d.lineTo(x, y));
    ctx2d.lineTo(pts[n - 1][0], height);
    ctx2d.closePath();
    ctx2d.fill();

    // --- line: crisp stroke + a wider, fainter glow pass underneath ---
    ctx2d.lineJoin = 'round';
    ctx2d.strokeStyle = colors.accent;
    ctx2d.globalAlpha = 0.12;
    ctx2d.lineWidth = 6;
    ctx2d.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y)));
    ctx2d.stroke();
    ctx2d.globalAlpha = 0.35;
    ctx2d.lineWidth = 2;
    ctx2d.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? ctx2d.moveTo(x, y) : ctx2d.lineTo(x, y)));
    ctx2d.stroke();
    ctx2d.globalAlpha = 1;

    // --- trade markers: fade in on creation, persist, scroll off with the curve ---
    let labelPos = null;
    for (let i = 0; i < n; i++) {
      const marker = markers[i];
      if (!marker) continue;
      const [x, y] = pts[i];
      if (x < -12 || x > width + 12) continue;

      const age = now - marker.createdAt;
      const fadeT = clamp(age / HERO_VIZ_MARKER_FADE_MS, 0, 1);
      ctx2d.globalAlpha = 0.9 * fadeT;
      ctx2d.fillStyle = marker.kind === 'win' ? colors.up : colors.down;
      drawHeroVizMarker(ctx2d, x, y, marker.kind === 'win', 3 + 2.5 * fadeT);
      ctx2d.globalAlpha = 1;

      if (marker.hasLabel && activeLabel && activeLabel.createdAt === marker.createdAt) {
        labelPos = { x, y };
      }
    }

    // --- sparse R-multiple label: at most one on screen, fades after ~1.5s ---
    if (activeLabel) {
      const labelAge = now - activeLabel.createdAt;
      if (labelAge > HERO_VIZ_LABEL_MS) {
        activeLabel = null;
      } else if (labelPos) {
        const fadeOutStart = HERO_VIZ_LABEL_MS - 300;
        const alpha =
          labelAge > fadeOutStart ? clamp(1 - (labelAge - fadeOutStart) / 300, 0, 1) : clamp(labelAge / 200, 0, 1);
        ctx2d.globalAlpha = alpha;
        ctx2d.fillStyle = colors.muted;
        ctx2d.font = `10px ${colors.mono}`;
        ctx2d.textBaseline = 'middle';
        const above = labelPos.y > 16;
        ctx2d.fillText(activeLabel.text, labelPos.x + 6, above ? labelPos.y - 10 : labelPos.y + 12);
        ctx2d.globalAlpha = 1;
      }
    }

    // --- now-dot: pulsing accent dot riding the newest (sliding-in) point ---
    const [ndx, ndy] = pts[n - 1];
    if (ndx <= width + 6) {
      const pulse = advance ? 0.55 + 0.45 * Math.sin(now / 260) : 0.85;
      ctx2d.globalAlpha = pulse;
      ctx2d.fillStyle = colors.accent;
      ctx2d.beginPath();
      ctx2d.arc(ndx, ndy, 3, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.globalAlpha = 1;
    }

    if (advance && progress >= 1) {
      pushSample();
      lastTick = now;
    }
  }

  function loop(now) {
    heroVizRafId = requestAnimationFrame(loop);
    draw(now, true);
  }

  function start() {
    if (heroVizRafId) return;
    lastTick = performance.now(); // resync so resuming never fast-forwards
    heroVizRafId = requestAnimationFrame(loop);
  }

  function stop() {
    if (heroVizRafId) {
      cancelAnimationFrame(heroVizRafId);
      heroVizRafId = null;
    }
  }

  const api = {
    getSamples: () => samples,
    valueMax: HERO_VIZ_VALUE_MAX,
  };

  if (reducedMotion()) {
    // Exactly one static frame: seed curve + whatever representative
    // markers pushSample() happens to have seeded (none yet -- draw a
    // couple by hand so the frame reads as representative, not empty).
    markers[markers.length - 5] = { kind: 'win', r: 0.6, createdAt: performance.now(), hasLabel: false };
    markers[markers.length - 12] = { kind: 'loss', r: -0.4, createdAt: performance.now(), hasLabel: false };
    draw(performance.now(), false);

    // Reduced-motion has no loop to pick up a theme change on its own --
    // redraw the single static frame (fresh colors only, no state advance)
    // whenever the toggle is used, so it never shows stale dark-on-light.
    heroVizThemeClickHandler = (event) => {
      const target = event.target;
      if (target instanceof Element && target.closest('[data-theme-toggle]')) {
        requestAnimationFrame(() => draw(performance.now(), false));
      }
    };
    document.addEventListener('click', heroVizThemeClickHandler);

    return api; // no crosshair under reduced motion (matches existing CSS/JS guards)
  }

  draw(performance.now(), false); // paint immediately, before the first rAF tick

  heroVizResizeHandler = () => {
    clearTimeout(heroVizResizeTimer);
    heroVizResizeTimer = setTimeout(() => {
      fit();
      draw(performance.now(), false);
    }, 150);
  };
  window.addEventListener('resize', heroVizResizeHandler);

  let sectionVisible = true;
  let tabVisible = document.visibilityState !== 'hidden';
  function evaluateVisibility() {
    if (sectionVisible && tabVisible) start();
    else stop();
  }

  if ('IntersectionObserver' in window) {
    heroVizObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionVisible = entry.isIntersecting;
        });
        evaluateVisibility();
      },
      { threshold: 0 }
    );
    heroVizObserver.observe(heroSection);
  } else {
    start();
  }

  heroVizVisibilityHandler = () => {
    tabVisible = document.visibilityState !== 'hidden';
    evaluateVisibility();
  };
  document.addEventListener('visibilitychange', heroVizVisibilityHandler);

  return api;
}

/**
 * Runs right before the ClientRouter swaps in new content. Cancels the rAF
 * loop (if running), removes the resize/visibility listeners, disconnects
 * the IntersectionObserver -- so home -> work -> home round-trips never
 * stack more than one loop. Safe to call even when initHeroViz bailed early
 * or took the reduced-motion branch (nothing was registered, all no-ops).
 */
function teardownHeroViz() {
  if (heroVizRafId) {
    cancelAnimationFrame(heroVizRafId);
    heroVizRafId = null;
  }
  if (heroVizResizeHandler) {
    window.removeEventListener('resize', heroVizResizeHandler);
    heroVizResizeHandler = null;
  }
  clearTimeout(heroVizResizeTimer);
  heroVizResizeTimer = null;
  if (heroVizObserver) {
    heroVizObserver.disconnect();
    heroVizObserver = null;
  }
  if (heroVizVisibilityHandler) {
    document.removeEventListener('visibilitychange', heroVizVisibilityHandler);
    heroVizVisibilityHandler = null;
  }
  if (heroVizThemeClickHandler) {
    document.removeEventListener('click', heroVizThemeClickHandler);
    heroVizThemeClickHandler = null;
  }
}

/**
 * Generic scroll reveal: any [data-reveal-group] container reveals its
 * [data-reveal-item] children with a stagger once it enters the viewport.
 */
function initScrollReveals() {
  document.querySelectorAll('[data-reveal-group]').forEach((group) => {
    const items = group.querySelectorAll('[data-reveal-item]');
    if (!items.length) return;

    gsap.set(items, { y: 24, opacity: 0 });
    ScrollTrigger.create({
      trigger: group,
      start: 'top 85%',
      once: true,
      onEnter: () =>
        gsap.to(items, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.08,
          ease: 'power2.out',
        }),
    });
  });
}

/** Metric / funnel numbers count up from 0 once scrolled into view. */
function initCounters() {
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    const target = parseFloat(el.dataset.countTo);
    if (Number.isNaN(target)) return;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const proxy = { val: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      once: true,
      onEnter: () => {
        gsap.to(proxy, {
          val: target,
          duration: 1.4,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent =
              proxy.val.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
              }) + suffix;
          },
        });
      },
    });
  });
}

/**
 * Pipeline connectors: a small accent dash flows continuously along each
 * connector line. Not scroll-scrubbed -- this is the one exception the spec
 * allows for a continuous, always-running micro-animation. repeat:-1 means
 * this MUST be inside the per-page gsap context so it gets killed on
 * astro:before-swap instead of running forever on a removed node.
 */
function initPipelineConnectors() {
  const dashes = document.querySelectorAll('[data-connector-dash]');
  if (!dashes.length) return;
  gsap.to(dashes, {
    strokeDashoffset: -32,
    duration: 1.4,
    repeat: -1,
    ease: 'none',
  });
}

/** Funnel bars grow from 0 to their target width on scroll-in. */
function initFunnelBars() {
  const bars = document.querySelectorAll('[data-funnel-bar]');
  if (!bars.length) return;
  const group = bars[0].closest('[data-reveal-group]') || bars[0];

  gsap.set(bars, { scaleX: 0, transformOrigin: 'left center' });
  ScrollTrigger.create({
    trigger: group,
    start: 'top 85%',
    once: true,
    onEnter: () =>
      gsap.to(bars, {
        scaleX: 1,
        duration: 0.9,
        stagger: 0.1,
        ease: 'power2.out',
      }),
  });
}

/** Magnetic hover on `.magnetic` CTAs -- desktop pointer:fine only, rAF-throttled. */
function initMagnetic() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const strength = 6;

  document.querySelectorAll('.magnetic').forEach((el) => {
    let rafId = null;
    let mouseX = 0;
    let mouseY = 0;

    function update() {
      const rect = el.getBoundingClientRect();
      const relX = mouseX - (rect.left + rect.width / 2);
      const relY = mouseY - (rect.top + rect.height / 2);
      const x = Math.max(-strength, Math.min(strength, relX * 0.3));
      const y = Math.max(-strength, Math.min(strength, relY * 0.3));
      gsap.to(el, { x, y, duration: 0.3, ease: 'power2.out' });
      rafId = null;
    }

    el.addEventListener('mousemove', (event) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!rafId) rafId = requestAnimationFrame(update);
    });

    el.addEventListener('mouseleave', () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      gsap.to(el, { x: 0, y: 0, duration: 0.4, ease: 'power2.out' });
    });
  });
}

/**
 * Hero curve crosshair (Hero.astro, desktop pointer:fine only, rAF-
 * throttled): a 1px vertical + horizontal hairline pair and a small mono
 * readout chip track the cursor over the hero's live canvas equity ticker.
 * The horizontal hairline and the chip both snap to the CURVE's own y-value
 * at the cursor's x -- read directly from the same `samples` buffer
 * initHeroViz() draws from (heroViz.getSamples()), linearly interpolated
 * between the two nearest evenly-spaced samples -- rather than the raw
 * mouse y. This intentionally ignores the sub-tick scroll offset the canvas
 * animates with (per HERO-VIZ-SPEC.md §4: "acceptable to compute y from the
 * same sample buffer the canvas draws" when wiring to the literal scrolling
 * position is fiddly); the mismatch is at most one sample-width and never
 * visible at crosshair speed. The percentage is a pure linear map of that
 * value onto the CURRENTLY VISIBLE window's own [min,max] (0% at its lowest
 * point, 100% at its highest) -- self-referential, no invented headline
 * metric, recomputed every move since the visible window keeps scrolling.
 * [data-hero-curve] only accepts pointer events at md: and up (see
 * Hero.astro), so this never fires on touch layouts either. Only wired up
 * when initHeroViz() actually started the live engine (never under reduced
 * motion, where heroViz is still returned but there's nothing moving to
 * chase -- matches the existing CSS/JS touch+reduced-motion absence). No
 * teardown needed: the listeners live on an element inside the page's
 * swapped-out <main> content, garbage-collected with it on nav -- same
 * "nothing module-level to leak" reasoning as initFunnelTooltips below.
 */
function initHeroCrosshair(heroViz) {
  if (!heroViz || reducedMotion()) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const wrap = document.querySelector('[data-hero-curve]');
  const canvas = wrap?.querySelector('[data-hero-canvas]');
  const vLine = wrap?.querySelector('[data-crosshair-v]');
  const hLine = wrap?.querySelector('[data-crosshair-h]');
  const chip = wrap?.querySelector('[data-crosshair-chip]');
  const chipValue = wrap?.querySelector('[data-crosshair-value]');
  if (!wrap || !canvas || !vLine || !hLine || !chip || !chipValue) return;

  let rafId = null;
  let pending = null;

  function hide() {
    vLine.style.opacity = '0';
    hLine.style.opacity = '0';
    chip.style.opacity = '0';
  }

  function update() {
    rafId = null;
    if (!pending) return;
    const rect = canvas.getBoundingClientRect();
    const px = pending.x - rect.left;
    const py = pending.y - rect.top;
    if (px < 0 || px > rect.width || py < 0 || py > rect.height) {
      hide();
      return;
    }

    const samples = heroViz.getSamples();
    const n = samples.length;
    const idxF = clamp((px / rect.width) * (n - 1), 0, n - 1);
    const i0 = Math.min(n - 2, Math.floor(idxF));
    const t = idxF - i0;
    const curveY = samples[i0] + (samples[i0 + 1] - samples[i0]) * t;

    const minY = Math.min(...samples);
    const maxY = Math.max(...samples);
    const yPx = (curveY / heroViz.valueMax) * rect.height;
    const pct = maxY === minY ? 0 : ((maxY - curveY) / (maxY - minY)) * 100;

    vLine.style.transform = `translateX(${px}px)`;
    hLine.style.transform = `translateY(${yPx}px)`;
    chipValue.textContent = `${pct.toFixed(1)}%`;

    const chipRect = chip.getBoundingClientRect();
    let chipX = px + 12;
    if (chipX + chipRect.width > rect.width) chipX = px - 12 - chipRect.width;
    let chipY = yPx - chipRect.height - 10;
    if (chipY < 0) chipY = yPx + 10;
    chip.style.transform = `translate(${chipX}px, ${chipY}px)`;

    vLine.style.opacity = '0.6';
    hLine.style.opacity = '0.6';
    chip.style.opacity = '1';
  }

  // Listen on the whole hero section, not the curve layer: update() maps
  // viewport coords onto the SVG rect and hides itself outside it, so the
  // text overlay above the curve stays fully selectable (no pointer-events
  // pass-through hacks needed).
  const heroSection = document.getElementById('hero') || wrap;

  heroSection.addEventListener('mousemove', (event) => {
    pending = { x: event.clientX, y: event.clientY };
    if (!rafId) rafId = requestAnimationFrame(update);
  });

  heroSection.addEventListener('mouseleave', () => {
    pending = null;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    hide();
  });
}

/** Status dot: subtle opacity pulse (transform/opacity only). repeat:-1 -> context-scoped. */
function initStatusDotPulse() {
  const dot = document.querySelector('[data-status-dot]');
  if (!dot) return;
  gsap.to(dot, { opacity: 0.25, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

/**
 * Scroll-progress hairline: [data-scroll-progress] only exists on long-form
 * templates (work/[slug].astro, notes/[slug].astro). rAF-throttled, writes
 * only `transform: scaleX(...)` (no layout reads/writes in the hot path
 * beyond the rAF-batched scrollY read). Short pages (< ~1.5 viewports of
 * content) are left at their initial scaleX(0) -- effectively invisible --
 * per spec, rather than showing a hairline that jumps near-instantly to
 * full. Reduced-motion hides the element entirely via global.css, and (to
 * avoid wiring up a scroll listener for nothing) this function is only
 * called from the non-reduced-motion branch of the per-page init below.
 */
function initScrollProgress() {
  const bar = document.querySelector('[data-scroll-progress]');
  if (!bar) return;

  const doc = document.documentElement;
  if (doc.scrollHeight < window.innerHeight * 1.5) return;

  function update() {
    scrollProgressRaf = null;
    const max = doc.scrollHeight - window.innerHeight;
    const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    bar.style.transform = `scaleX(${progress})`;
  }

  scrollProgressHandler = () => {
    if (scrollProgressRaf) return;
    scrollProgressRaf = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', scrollProgressHandler, { passive: true });
  update();
}

function teardownScrollProgress() {
  if (scrollProgressHandler) {
    window.removeEventListener('scroll', scrollProgressHandler);
    scrollProgressHandler = null;
  }
  if (scrollProgressRaf) {
    cancelAnimationFrame(scrollProgressRaf);
    scrollProgressRaf = null;
  }
}

/**
 * Interactive funnel rows (Factory.astro, homepage only): hover/focus shows
 * a per-stage tooltip (CSS-driven via group-hover/group-focus-visible in
 * Factory.astro). `click` additionally toggles an `.is-open` class so touch
 * taps (which don't reliably trigger :focus-visible on every browser) work
 * too, and `focusout` clears it when focus/attention moves elsewhere. No
 * teardown needed: these listeners live on elements that belong to the
 * page's swapped-out <main> content, so they're garbage-collected with the
 * nodes themselves on nav -- nothing module-level to leak or re-bind.
 */
function initFunnelTooltips() {
  const rows = document.querySelectorAll('[data-funnel-row]');
  if (!rows.length) return;

  rows.forEach((row) => {
    row.addEventListener('click', () => {
      const willOpen = !row.classList.contains('is-open');
      rows.forEach((r) => r.classList.remove('is-open'));
      row.classList.toggle('is-open', willOpen);
    });
    row.addEventListener('focusout', (event) => {
      if (!row.contains(event.relatedTarget)) row.classList.remove('is-open');
    });
  });
}

/**
 * Live-system reachability check (LiveSystems.astro). A no-cors fetch from
 * the visitor's browser: resolves (opaque) whenever the host is reachable,
 * rejects only on network failure — so the dot reflects real reachability,
 * not a hardcoded badge. Runs regardless of reduced-motion (it's status,
 * not decoration). Aborted on swap via the controller below.
 */
let systemStatusController = null;

function initSystemStatus() {
  const el = document.querySelector('[data-system-status]');
  if (!el) return;
  const url = el.dataset.systemUrl;
  const dot = el.querySelector('[data-system-status-dot]');
  const label = el.querySelector('[data-system-status-label]');
  if (!url || !dot || !label) return;

  systemStatusController = new AbortController();
  const timeout = window.setTimeout(() => systemStatusController?.abort(), 8000);

  fetch(url, { mode: 'no-cors', cache: 'no-store', signal: systemStatusController.signal })
    .then(() => {
      dot.classList.remove('bg-muted', 'bg-down');
      dot.classList.add('bg-up');
      label.textContent = 'LIVE';
      label.classList.remove('text-muted', 'text-down');
      label.classList.add('text-up');
      if (!reducedMotion()) {
        gsap.to(dot, { opacity: 0.3, duration: 1, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
    })
    .catch(() => {
      dot.classList.remove('bg-muted', 'bg-up');
      dot.classList.add('bg-down');
      label.textContent = 'UNREACHABLE';
      label.classList.remove('text-muted', 'text-up');
      label.classList.add('text-down');
    })
    .finally(() => window.clearTimeout(timeout));
}

function teardownSystemStatus() {
  systemStatusController?.abort();
  systemStatusController = null;
  // The LIVE dot pulse is created inside a fetch .then — possibly after the
  // gsap context snapshot — so kill it explicitly by selector.
  gsap.killTweensOf('[data-system-status-dot]');
}

/**
 * Cross-page fragment scroll. The ClientRouter does a soft DOM swap for
 * cross-page anchor links like /#contact (clicked from /work/, /notes/,
 * /tearsheet/) -- it inserts the new page's DOM and updates location.hash
 * but the browser's native fragment-scroll doesn't reliably fire on the
 * swapped-in fragment, so the visitor lands at scrollY=0. This finishes
 * the job the browser skipped.
 *
 * Same-page hash links (Contact clicked while already on home) never
 * trigger a ClientRouter swap, so this never runs for them -- the browser's
 * native scroll-behavior:smooth + scroll-padding-top keep handling those
 * untouched. Idempotent: no hash or no matching element -> no-op.
 *
 * Header offset: window.scrollTo with an explicit `top` bypasses CSS
 * scroll-padding-top, so the persisted <header>'s own height (h-16 = 64px)
 * is subtracted manually to keep the target heading clear of the fixed
 * header. The site-nav header is the first <header> in the DOM (Nav renders
 * before <main>), so querySelector('header') finds the right one even on
 * templates that also render an article <header> deeper in the page.
 * Reduced-motion -> instant jump, else smooth (matches the global CSS).
 *
 * rAF fallback: the target should exist by the time this runs (it's called
 * from ScrollTrigger's refresh event in initPageContent, well after DOM
 * mount), but if a section ever mounts late we retry once on the next tick
 * -- costs nothing and avoids a silent miss.
 *
 * Timing (important): see initPageContent -- this is invoked AFTER
 * ScrollTrigger's auto-refresh settles, because that refresh's measurement
 * pass resets scroll to 0 and would otherwise clobber a pre-refresh call.
 */
function handleHashScroll() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  const scrollToEl = (el) => {
    if (!el) return;
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 64;
    const top = el.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({
      top,
      behavior: reducedMotion() ? 'auto' : 'smooth',
    });
  };

  const el = document.getElementById(hash);
  if (el) {
    scrollToEl(el);
    return;
  }
  requestAnimationFrame(() => scrollToEl(document.getElementById(hash)));
}

/**
 * Runs on the initial load AND after every client-side nav. Idempotent per
 * page: everything below queries the live DOM fresh each call, so there are
 * no stale element references carried over from a previous page.
 */
function initPageContent() {
  initNav();
  initFunnelTooltips();
  syncNavActiveState();
  initSystemStatus();

  // Runs (and no-ops instantly on pages without [data-hero-curve]) before
  // the reduced-motion branch below, because it owns BOTH cases itself: a
  // static single frame under reduced motion, or the full ticking engine
  // otherwise. Not gsap-tied, so it isn't inside the ctx() context -- torn
  // down explicitly via teardownHeroViz() in teardownPageContent instead.
  const heroViz = initHeroViz();

  // Reduced-motion path: no gsap.context, no ScrollTrigger -> nothing will
  // clobber a programmatic scroll, so handle the fragment directly.
  if (reducedMotion()) {
    handleHashScroll();
    return;
  }

  ctx = gsap.context(() => {
    initHeroEntrance();
    initScrollReveals();
    initCounters();
    initPipelineConnectors();
    initFunnelBars();
    initMagnetic();
    initHeroCrosshair(heroViz);
    initStatusDotPulse();
  });

  // ScrollTrigger order-of-operations trap (the real reason a naive
  // page-load hash-scroll "didn't work" here): the ScrollTrigger.create()
  // calls above batch an auto-refresh on the next frame, and that refresh
  // does a measurement pass that temporarily forces scrollBehavior='auto'
  // and scrollTo(0) -- clobbering any hash-scroll done before it settles.
  // So handleHashScroll MUST run after that refresh completes, not before.
  // Hooking ScrollTrigger's own 'refresh' event (registered synchronously
  // here, before the batched refresh fires) is the deterministic way to
  // land our scroll after the measurement pass. One-shot: the listener
  // removes itself so the later fonts-driven refresh below doesn't double-
  // fire a second smooth scroll. See handleHashScroll for the header offset
  // + reduced-motion behavior selection (idempotent, safe to re-call).
  const onFirstRefresh = () => {
    ScrollTrigger.removeEventListener('refresh', onFirstRefresh);
    handleHashScroll();
  };
  ScrollTrigger.addEventListener('refresh', onFirstRefresh);

  initScrollProgress();

  // Webfonts loading after first layout can reflow the page and leave both
  // ScrollTrigger's cached trigger offsets AND our hash target's offset
  // stale. Recompute once fonts settle, then re-apply the hash-scroll in
  // case the target section shifted vertically with the reflow.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!reducedMotion()) {
        ScrollTrigger.refresh();
        handleHashScroll();
      }
    });
  }
}

/**
 * Full teardown of everything the outgoing page started, run right before
 * the ClientRouter swaps in new content. No leaked timers, no leaked
 * ScrollTriggers, no infinite tweens left running on detached nodes.
 */
function teardownPageContent() {
  ScrollTrigger.getAll().forEach((t) => t.kill());
  if (ctx) {
    ctx.revert();
    ctx = null;
  }
  teardownScrollProgress();
  teardownSystemStatus();
  teardownHeroViz();
  // Magnetic tweens are short-lived (<=0.4s) and self-bounded, but kill any
  // still in flight defensively so nothing keeps writing to a detached
  // node's inline transform after the swap.
  gsap.killTweensOf('.magnetic');
}

document.addEventListener('astro:page-load', initPageContent);
document.addEventListener('astro:before-swap', teardownPageContent);
