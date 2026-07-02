import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Fixed-nav mobile menu: hamburger toggle, full-screen overlay, focus trap.
 * Runs regardless of reduced-motion — this is core navigation, not decoration.
 * Its own internal tween is gated on prefersReducedMotion.
 */
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const overlay = document.getElementById('nav-overlay');
  if (!toggle || !overlay) return;

  const links = Array.from(overlay.querySelectorAll('a'));
  const mainEl = document.querySelector('main');
  const footerEl = document.querySelector('footer');
  let isOpen = false;
  let lastFocused = null;

  function onKeydown(event) {
    if (event.key === 'Escape') {
      closeMenu();
      return;
    }
    if (event.key === 'Tab') {
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
    isOpen = true;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    toggle.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    if (mainEl) mainEl.inert = true;
    if (footerEl) footerEl.inert = true;

    if (!prefersReducedMotion) {
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
    isOpen = false;
    overlay.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    toggle.classList.remove('is-open');
    document.body.style.overflow = '';
    if (mainEl) mainEl.inert = false;
    if (footerEl) footerEl.inert = false;
    document.removeEventListener('keydown', onKeydown);
    (lastFocused || toggle).focus();
  }

  toggle.addEventListener('click', () => (isOpen ? closeMenu() : openMenu()));
  links.forEach((link) => link.addEventListener('click', closeMenu));

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
 * or non-scaling-stroke — no getTotalLength() unit mismatch to worry about.
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
 * connector line. Not scroll-scrubbed — this is the one exception the spec
 * allows for a continuous, always-running micro-animation.
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

/** Magnetic hover on `.magnetic` CTAs — desktop pointer:fine only, rAF-throttled. */
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

/** Status dot: subtle opacity pulse (transform/opacity only). */
function initStatusDotPulse() {
  const dot = document.querySelector('[data-status-dot]');
  if (!dot) return;
  gsap.to(dot, { opacity: 0.25, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
}

function ready(fn) {
  if (document.readyState !== 'loading') fn();
  else document.addEventListener('DOMContentLoaded', fn);
}

ready(() => {
  // Core navigation must work regardless of motion preference.
  initNav();

  // prefers-reduced-motion: reduce -> skip ALL gsap. Content is already
  // visible by default (no CSS hides it), so there's nothing to reveal.
  if (prefersReducedMotion) return;

  gsap.registerPlugin(ScrollTrigger);

  initHeroEntrance();
  initEquityCurve();
  initScrollReveals();
  initCounters();
  initPipelineConnectors();
  initFunnelBars();
  initMagnetic();
  initStatusDotPulse();

  // Webfonts loading after first layout can reflow the page and leave
  // ScrollTrigger's cached trigger offsets stale. Recompute once fonts settle.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!prefersReducedMotion) {
        ScrollTrigger.refresh();
      }
    });
  }
});
