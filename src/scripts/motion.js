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
 * Hero equity curve: draw stroke left to right on load.
 * The path has pathLength="1" (SVG2), so dasharray/dashoffset are always
 * expressed in that normalized [0,1] space regardless of viewBox geometry
 * or non-scaling-stroke -- no getTotalLength() unit mismatch to worry about.
 */
function initEquityCurve() {
  const line = document.querySelector('[data-equity-line]');
  if (!line) return;
  gsap.set(line, { strokeDasharray: 1, strokeDashoffset: 1 });
  gsap.to(line, { strokeDashoffset: 0, duration: 2.5, ease: 'power2.out', delay: 0.2 });
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
 * Runs on the initial load AND after every client-side nav. Idempotent per
 * page: everything below queries the live DOM fresh each call, so there are
 * no stale element references carried over from a previous page.
 */
function initPageContent() {
  initNav();
  initFunnelTooltips();

  if (reducedMotion()) return;

  ctx = gsap.context(() => {
    initHeroEntrance();
    initEquityCurve();
    initScrollReveals();
    initCounters();
    initPipelineConnectors();
    initFunnelBars();
    initMagnetic();
    initStatusDotPulse();
  });

  initScrollProgress();

  // Webfonts loading after first layout can reflow the page and leave
  // ScrollTrigger's cached trigger offsets stale. Recompute once fonts settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!reducedMotion()) {
        ScrollTrigger.refresh();
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
  // Magnetic tweens are short-lived (<=0.4s) and self-bounded, but kill any
  // still in flight defensively so nothing keeps writing to a detached
  // node's inline transform after the swap.
  gsap.killTweensOf('.magnetic');
}

document.addEventListener('astro:page-load', initPageContent);
document.addEventListener('astro:before-swap', teardownPageContent);
