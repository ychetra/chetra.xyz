import { gsap } from 'gsap';

/**
 * "Candidate journey" — Factory.astro's pipeline strip (RESEARCH -> SCREEN
 * -> VALIDATE -> AUDIT -> COMPARE -> LIVE) animates small candidate squares
 * flowing through and mostly dying, weighted to roughly the real published
 * funnel (3,911 -> 2,192 ranked -> 20 audited -> 1 passed). This is a
 * dramatization, not a population simulation: max 3 concurrent candidates,
 * nowhere near literal counts. The caption under the strip says so.
 *
 * Loaded from Base.astro on every page (same convention as cockpit.js):
 * initFactoryFlow() no-ops instantly on any page without the pipeline
 * markup, so importing it everywhere costs nothing elsewhere.
 *
 * Lifecycle follows cockpit.js exactly: init on astro:page-load, full
 * teardown on astro:before-swap, tracked timer + tracked-timeline registries
 * cleared on teardown (same "trackInterval/clearAllIntervals" shape, applied
 * to gsap timelines too since a fresh one is created per spawn rather than
 * once at init). Gated on IntersectionObserver (kept alive continuously,
 * NOT one-shot like cockpit's reveal trigger, because this must also PAUSE
 * when scrolled away and resume when scrolled back) and hard-stopped via
 * document.visibilitychange when the tab is hidden.
 *
 * Death/survival probabilities below are internally consistent with the
 * spec's three concrete ratios (44% die at SCREEN, ~1-in-12 spawns reach
 * COMPARE, ~1-in-25 reach LIVE) and with "bias to AUDIT" (AUDIT kills a
 * larger share of what reaches it than VALIDATE does). They are NOT
 * consistent with the spec's separate prose claim that "54% of survivors
 * die at VALIDATE/AUDIT" combined -- that figure is mathematically
 * incompatible with the other three (44% + 1-in-12 + 1-in-25 already fully
 * determine the combined VALIDATE+AUDIT survival rate at ~15%, not 46%).
 * The three ratio-shaped numbers were treated as load-bearing (they're the
 * ones a viewer could actually eyeball-verify against the real funnel and
 * against a run of the animation); "54%" was treated as loose narrative
 * color and dropped. See docs/UX-TRADING-MOTION-SPEC.md section B.
 */

const SPAWN_INTERVAL_MS = 3500;
const POOL_SIZE = 3;
const TRAVEL_S = 0.45; // seconds per stage-to-stage leg
const HALF = 4; // half of the 8px candidate square, for centering

const SURVIVAL = {
  screen: 0.56, // -> 44% die at SCREEN, matches the real 3,911->2,192 ratio
  validate: 0.45, // -> 55% die at VALIDATE
  audit: 0.331, // -> 66.9% die at AUDIT (harsher than VALIDATE: the DSR gate)
  compare: 0.48, // -> 52% die at COMPARE
};
// Compound: screen*validate*audit = 0.0834 (~1-in-12 reach COMPARE);
// *compare = 0.0400 (~1-in-25 reach LIVE).

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let root = null;
let layer = null;
let stageBoxes = [];
let pool = [];
let activeTimelines = new Set();
let spawnIntervalId = null;
let observer = null;
let onScreen = false;
let boundVisibilityChange = null;

function makeCandidate() {
  const el = document.createElement('div');
  el.className = 'candidate-dot';
  el.setAttribute('aria-hidden', 'true');
  return el;
}

function buildPool() {
  pool = Array.from({ length: POOL_SIZE }, () => {
    const el = makeCandidate();
    layer.appendChild(el);
    return { el, busy: false };
  });
}

/** Center point of each of the 6 stage boxes, relative to the candidate
 * layer's own top-left. Recomputed fresh on every spawn (cheap: 7
 * getBoundingClientRect calls every 3.5s) rather than cached, so a candidate
 * always travels the CURRENT layout -- correct across the md: row/column
 * breakpoint switch with no separate vertical/horizontal branch needed. */
function getCenters() {
  const layerRect = layer.getBoundingClientRect();
  return stageBoxes.map((box) => {
    const r = box.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - layerRect.left,
      y: r.top + r.height / 2 - layerRect.top,
    };
  });
}

function resetCandidate(el) {
  gsap.killTweensOf(el);
  el.classList.remove('is-dead', 'is-live');
  gsap.set(el, { opacity: 0, x: 0, y: 0 });
}

function runCandidate(slot) {
  const { el } = slot;
  resetCandidate(el);
  const centers = getCenters();
  if (centers.length !== 6) return; // markup mismatch guard, don't spawn into nothing

  slot.busy = true;
  gsap.set(el, { left: centers[0].x - HALF, top: centers[0].y - HALF, opacity: 1 });

  const tl = gsap.timeline({
    onComplete: () => {
      slot.busy = false;
      activeTimelines.delete(tl);
    },
  });
  activeTimelines.add(tl);

  const gates = [
    SURVIVAL.screen,
    SURVIVAL.validate,
    SURVIVAL.audit,
    SURVIVAL.compare,
  ];

  let from = centers[0];
  let survivedAllGates = true;

  for (let i = 0; i < gates.length; i++) {
    const to = centers[i + 1];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    tl.to(el, { x: `+=${dx}`, y: `+=${dy}`, duration: TRAVEL_S, ease: 'none' });
    from = to;

    if (Math.random() >= gates[i]) {
      // Dies here: flash down, drop 4px, fade out. transforms/opacity only
      // for the tween itself; the color flip is a plain class toggle (same
      // pattern motion.js's startPnlNudge already uses for text-up/text-down).
      tl.add(() => el.classList.add('is-dead'));
      tl.to(el, { y: '+=4', opacity: 0, duration: 0.4, ease: 'power1.in' });
      survivedAllGates = false;
      break;
    }
  }

  if (survivedAllGates) {
    const to = centers[5]; // LIVE -- reaching it isn't itself a gate, just the destination
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    tl.to(el, { x: `+=${dx}`, y: `+=${dy}`, duration: TRAVEL_S, ease: 'none' });
    tl.add(() => el.classList.add('is-live'));
    tl.to(el, { opacity: 0, duration: 0.6, ease: 'power1.in' }, '+=0.35');
  }
}

function trySpawn() {
  const slot = pool.find((s) => !s.busy);
  if (!slot) return; // pool full (max 3 concurrent) -- skip this tick
  runCandidate(slot);
}

/** Starts/stops the spawn interval itself (not just gating work inside it)
 * so a backgrounded/scrolled-away tab does zero timer work, not just zero
 * visible work. */
function updateRunState() {
  const tabVisible = document.visibilityState === 'visible';
  const shouldRun = onScreen && tabVisible;
  if (shouldRun && !spawnIntervalId) {
    spawnIntervalId = setInterval(trySpawn, SPAWN_INTERVAL_MS);
  } else if (!shouldRun && spawnIntervalId) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = null;
  }
}

function begin() {
  buildPool();

  boundVisibilityChange = () => updateRunState();
  document.addEventListener('visibilitychange', boundVisibilityChange);

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        updateRunState();
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0 }
    );
    observer.observe(root);
  } else {
    onScreen = true;
    updateRunState();
  }
}

function initFactoryFlow() {
  root = document.querySelector('[data-pipeline-track]');
  layer = document.querySelector('[data-candidate-layer]');
  stageBoxes = Array.from(document.querySelectorAll('[data-stage-box]'));

  if (!root || !layer || stageBoxes.length !== 6) {
    root = null;
    layer = null;
    stageBoxes = [];
    return;
  }

  // Reduced motion: no journey animation at all -- static diagram, as today.
  if (reducedMotion()) return;

  begin();
}

/** Mirrors cockpit.js's teardown(): clears the spawn interval, disconnects
 * the observer, unbinds visibilitychange, kills every in-flight candidate
 * timeline (and defensively any stray tween on the pooled elements), and
 * drops every module-level reference so the next astro:page-load starts
 * completely clean. [data-candidate-layer]'s children are removed from the
 * document along with the rest of the outgoing page's <main> -- nothing to
 * explicitly detach here, only JS-side state to release. */
function teardownFactoryFlow() {
  if (spawnIntervalId) {
    clearInterval(spawnIntervalId);
    spawnIntervalId = null;
  }
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (boundVisibilityChange) {
    document.removeEventListener('visibilitychange', boundVisibilityChange);
    boundVisibilityChange = null;
  }
  activeTimelines.forEach((tl) => tl.kill());
  activeTimelines.clear();
  pool.forEach((slot) => gsap.killTweensOf(slot.el));
  pool = [];
  stageBoxes = [];
  root = null;
  layer = null;
  onScreen = false;
}

document.addEventListener('astro:page-load', initFactoryFlow);
document.addEventListener('astro:before-swap', teardownFactoryFlow);
