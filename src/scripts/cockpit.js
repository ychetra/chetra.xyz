import { gsap } from 'gsap';

/**
 * Live cockpit terminal (Factory.astro "THE COCKPIT" block, homepage only).
 *
 * Loaded from Base.astro (not Factory-scoped) so it runs on every
 * astro:page-load regardless of which page module scripts happened to
 * execute first -- Factory-scoped <script> tags don't reliably re-run under
 * the ClientRouter. `initCockpit()` itself still no-ops instantly on any
 * page without a [data-cockpit] root, so loading it everywhere costs
 * nothing on pages that don't have a cockpit.
 *
 * The [data-cockpit] root is NOT transition:persist -- it's swapped for a
 * brand-new node (back at its SSR seed state: clock at 14:32:00, one log
 * line, AUDIT active) every time the homepage is (re)loaded. That is
 * intentional: it's what makes "cockpit still ticking at exactly 1s cadence
 * after N home<->work round-trips" a meaningful, provable check -- each
 * return to `/` starts exactly one fresh clock interval, and
 * astro:before-swap guarantees the previous one was already cleared before
 * that happens.
 */

const CLOCK_SEED_SECONDS = 14 * 3600 + 32 * 60; // 14:32:00, matches the SSR markup

const LOG_LINES = [
  { time: '14:32:07', tag: 'screen', text: 'vwap_reversion  Sharpe~1.59  queued', status: null },
  { time: '14:32:09', tag: 'mt5', text: 'real-spread charge applied  −39%', status: null },
  { time: '14:32:11', tag: 'audit', text: 'DSR 0.909 ≥ 0.90', status: 'pass' },
  { time: '14:32:14', tag: 'audit', text: 'breakout_xauusd', status: 'fail' },
  { time: '14:32:16', tag: 'holdout', text: 'locked 2026-H1  Sharpe 3.75', status: null },
  { time: '14:32:19', tag: 'compare', text: 'firm/real/crypto  1 survivor', status: null },
];
const LOG_START_INDEX = 2; // must match the line baked into the SSR markup

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// --- Per-page-load teardown registries -------------------------------------
// Reset (emptied) by teardown(), which astro:before-swap calls right before
// the outgoing page's [data-cockpit] root is removed from the DOM.
let intervalIds = [];
let observer = null;
let ctx = null;

function trackInterval(id) {
  intervalIds.push(id);
  return id;
}

function clearAllIntervals() {
  intervalIds.forEach((id) => clearInterval(id));
  intervalIds = [];
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatClock(totalSeconds) {
  const s = totalSeconds % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(sec)}`;
}

function startDotPulse(root) {
  const dot = root.querySelector('[data-cockpit-dot]');
  if (!dot) return;
  gsap.to(dot, { opacity: 0.25, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

function startClock(root) {
  const el = root.querySelector('[data-cockpit-clock]');
  if (!el) return;
  let total = CLOCK_SEED_SECONDS;
  trackInterval(
    setInterval(() => {
      total += 1;
      el.textContent = formatClock(total);
    }, 1000)
  );
}

/** Rebuild the SVG path `d` string from a flat array of y-values (x is an even grid). */
function buildPathD(ys, vbW) {
  const n = ys.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = ((i / (n - 1)) * vbW).toFixed(2);
    d += `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]} `;
  }
  return d.trim();
}

function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}

function positionNowDot(nowDot, y, vbH) {
  if (!nowDot) return;
  // HTML overlay dot: percentage top against the equity panel, x pinned right.
  nowDot.style.top = `${((y / vbH) * 100).toFixed(2)}%`;
}

/** After the draw-in completes, occasionally append a new point (rolling ~60pt window). */
function startEquityExtend(root, path, nowDot, vbW, vbH, topY, baseY) {
  let ys;
  try {
    ys = JSON.parse(root.dataset.cockpitPoints || '[]');
  } catch {
    ys = [];
  }
  if (!ys.length) return;

  trackInterval(
    setInterval(() => {
      const last = ys[ys.length - 1];
      const next = clamp(last + (Math.random() - 0.42) * 6, topY - 4, baseY + 4);
      ys.shift();
      ys.push(Number(next.toFixed(2)));
      path.setAttribute('d', buildPathD(ys, vbW));
      positionNowDot(nowDot, ys[ys.length - 1], vbH);
    }, 2500)
  );
}

function startEquityDraw(root) {
  const path = root.querySelector('[data-cockpit-equity-line]');
  const nowDot = root.querySelector('[data-cockpit-now-dot]');
  const valueEl = root.querySelector('[data-cockpit-equity-value]');
  if (!path) return;

  const svg = path.ownerSVGElement;
  const viewBox = svg?.viewBox?.baseVal;
  const vbW = viewBox?.width || 600;
  const vbH = viewBox?.height || 200;

  gsap.set(path, { strokeDasharray: 1, strokeDashoffset: 1 });
  if (nowDot) gsap.set(nowDot, { opacity: 0 });

  gsap.to(path, {
    strokeDashoffset: 0,
    duration: 2,
    ease: 'power2.out',
    onComplete: () => {
      if (nowDot) {
        gsap.set(nowDot, { opacity: 1 });
        gsap.to(nowDot, { opacity: 0.35, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
      }
      startEquityExtend(root, path, nowDot, vbW, vbH, 22, 182);
    },
  });

  if (valueEl) {
    const target = parseFloat(valueEl.dataset.target || '0');
    if (!Number.isNaN(target)) {
      const proxy = { val: 0 };
      gsap.to(proxy, {
        val: target,
        duration: 2,
        ease: 'power2.out',
        onUpdate: () => {
          valueEl.textContent = `${target >= 0 ? '+' : ''}${proxy.val.toFixed(1)}%`;
        },
      });
    }
  }
}

function startPnlNudge(root) {
  const el = root.querySelector('[data-cockpit-pnl]');
  if (!el) return;
  let value = parseFloat(el.dataset.value || '0');
  if (Number.isNaN(value)) return;

  trackInterval(
    setInterval(() => {
      value = clamp(value + (Math.random() - 0.45) * 0.15, -2.5, 2.5);
      value = Math.round(value * 100) / 100;
      el.textContent = `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
      el.classList.toggle('text-up', value >= 0);
      el.classList.toggle('text-down', value < 0);
    }, 4000)
  );
}

function startPipelineCycle(root) {
  const stages = Array.from(root.querySelectorAll('[data-cockpit-stage]'));
  if (!stages.length) return;

  let active = stages.findIndex((s) => s.dataset.active === 'true');
  if (active < 0) active = 0;

  trackInterval(
    setInterval(() => {
      const current = stages[active];
      current.classList.remove('bg-surface', 'text-accent');
      current.classList.add('text-muted');
      delete current.dataset.active;

      active = (active + 1) % stages.length;

      const next = stages[active];
      next.classList.add('bg-surface', 'text-accent');
      next.classList.remove('text-muted');
      next.dataset.active = 'true';
    }, 1800)
  );
}

function makeSpan(className, text) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  return span;
}

/** Built with textContent/createElement (no innerHTML) even though every value here is a static constant. */
function renderLogLine(el, line) {
  el.replaceChildren();
  el.append(
    makeSpan('text-fg', line.time),
    document.createTextNode(' '),
    makeSpan('text-muted', line.tag),
    document.createTextNode(' '),
    makeSpan('text-muted', line.text),
    document.createTextNode(' ')
  );
  if (line.status === 'pass') {
    el.append(makeSpan('text-up', '✓ pass'));
  } else if (line.status === 'fail') {
    el.append(makeSpan('text-down', '✗ fail (overfit)'));
  }
}

function startLogTicker(root) {
  const el = root.querySelector('[data-cockpit-log]');
  if (!el) return;
  let index = LOG_START_INDEX;

  trackInterval(
    setInterval(() => {
      gsap.to(el, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
          index = (index + 1) % LOG_LINES.length;
          renderLogLine(el, LOG_LINES[index]);
          gsap.to(el, { opacity: 1, duration: 0.25 });
        },
      });
    }, 2200)
  );
}

function startCockpitAnimations(root) {
  startDotPulse(root);
  startClock(root);
  startEquityDraw(root);
  startPnlNudge(root);
  startPipelineCycle(root);
  startLogTicker(root);
}

function begin(root) {
  if (root.dataset.cockpitInit === 'true') return;
  root.dataset.cockpitInit = 'true';
  // Every tween started inside (including the repeat:-1 dot pulses) is
  // tracked by this context; ctx.revert() on teardown kills all of them in
  // one call instead of leaking on every home<->away round-trip.
  ctx = gsap.context(() => {
    startCockpitAnimations(root);
  });
}

function initCockpit() {
  const root = document.querySelector('[data-cockpit]');
  if (!root) return; // no-ops on every page without a cockpit block

  // prefers-reduced-motion: reduce -> no timers, no rAF, no GSAP. The
  // server-rendered markup is already the full static frame the spec asks
  // for (drawn line, fixed clock, AUDIT active, one log line, solid dot).
  if (reducedMotion()) {
    root.dataset.cockpitInit = 'true';
    return;
  }

  // The cockpit figure sits below the fold and is scroll-revealed by
  // motion.js's initScrollReveals (opacity 0 -> 1 around "top 85%"). Starting
  // the equity draw-in at page-load would finish unseen; gate it on the
  // cockpit actually entering the viewport instead, using a native
  // IntersectionObserver so this file stays independent of motion.js/GSAP
  // plugin registration. Re-armed fresh on every astro:page-load since
  // `root` is itself a brand-new node each time.
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          begin(root);
          observer?.disconnect();
          observer = null;
        }
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0 }
    );
    observer.observe(root);
  } else {
    begin(root);
  }
}

/**
 * Runs right before the ClientRouter swaps in new content. Clears every
 * interval this page started (clock, equity-extend, pnl nudge, pipeline
 * cycle, log ticker), disconnects the IntersectionObserver if the cockpit
 * was never scrolled into view, and reverts every gsap tween/timeline
 * created inside begin()'s context -- including the infinite dot-pulse
 * tweens, which would otherwise keep running on a detached node forever.
 */
function teardown() {
  clearAllIntervals();
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (ctx) {
    ctx.revert();
    ctx = null;
  }
}

document.addEventListener('astro:page-load', initCockpit);
document.addEventListener('astro:before-swap', teardown);
