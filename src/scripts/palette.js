import { navigate } from 'astro:transitions/client';
import { toggleTheme } from './theme.js';

/**
 * ⌘K command palette. Vanilla JS, no deps.
 *
 * Lifecycle: the palette root (#command-palette, rendered once by
 * CommandPalette.astro inside Base) carries `transition:persist`, so the
 * ClientRouter keeps this exact DOM node across every client-side nav --
 * correct because the command list is site-wide, not page-specific, so
 * there is never a "new" version to swap in. That means listeners only need
 * binding ONCE, ever; `initialized` guards against astro:page-load firing
 * that setup again after every nav (it fires on the initial load AND after
 * each swap).
 *
 * Open/close animation is driven by a single CSS opacity/transform
 * transition (see CommandPalette.astro's <style>); reduced-motion needs no
 * separate JS branch because global.css already zeroes all
 * transition-durations under `prefers-reduced-motion: reduce`, so the same
 * class toggle is instant there.
 */

let initialized = false;
let commands = [];
let filtered = [];
let activeIndex = 0;
let lastFocused = null;

function isTypingTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}

function loadCommands() {
  const script = document.getElementById('palette-commands');
  if (!script) return [];
  try {
    const parsed = JSON.parse(script.textContent || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getRoot() {
  return document.getElementById('command-palette');
}

function isOpen() {
  const root = getRoot();
  return !!root && !root.hidden;
}

/** Same inert-background pattern Nav.astro's mobile overlay uses. */
function setInert(state) {
  ['header', 'main', 'footer'].forEach((sel) => {
    const el = document.querySelector(sel);
    if (el) el.inert = state;
  });
}

function filterCommands(query) {
  const q = query.trim().toLowerCase();
  if (!q) return commands.slice();
  return commands
    .map((cmd, i) => ({ cmd, i, idx: cmd.label.toLowerCase().indexOf(q) }))
    .filter((entry) => entry.idx !== -1)
    .sort((a, b) => a.idx - b.idx || a.i - b.i)
    .map((entry) => entry.cmd);
}

const ROW_BASE_CLASSES = [
  'flex',
  'items-center',
  'gap-2',
  'border-l-2',
  'border-transparent',
  'px-4',
  'py-2',
  'font-mono',
  'text-[13px]',
  'text-fg',
  'cursor-pointer',
];

function updateActive() {
  const rows = document.querySelectorAll('#palette-list [data-row-index]');
  const input = document.getElementById('palette-input');
  let activeRow = null;

  rows.forEach((row) => {
    const i = Number(row.dataset.rowIndex);
    const active = i === activeIndex;
    row.classList.toggle('bg-elevated', active);
    row.classList.toggle('border-accent', active);
    row.classList.toggle('border-transparent', !active);
    row.setAttribute('aria-selected', active ? 'true' : 'false');
    if (active) activeRow = row;
  });

  if (input) {
    if (activeRow) input.setAttribute('aria-activedescendant', activeRow.id);
    else input.removeAttribute('aria-activedescendant');
  }
  activeRow?.scrollIntoView({ block: 'nearest' });
}

function render() {
  const list = document.getElementById('palette-list');
  const empty = document.querySelector('[data-palette-empty]');
  if (!list) return;

  list.replaceChildren();

  if (!filtered.length) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  filtered.forEach((cmd, i) => {
    const li = document.createElement('li');
    li.id = `palette-opt-${i}`;
    li.setAttribute('role', 'option');
    li.dataset.rowIndex = String(i);
    li.className = ROW_BASE_CLASSES.join(' ');

    const label = document.createElement('span');
    label.className = 'truncate';
    label.textContent = cmd.label;
    li.appendChild(label);

    li.addEventListener('mouseenter', () => {
      activeIndex = i;
      updateActive();
    });
    li.addEventListener('click', () => activate(i));

    list.appendChild(li);
  });

  updateActive();
}

function activate(i) {
  const cmd = filtered[i];
  if (!cmd) return;
  closePalette();
  if (cmd.kind === 'external') {
    window.open(cmd.href, '_blank', 'noopener,noreferrer');
  } else if (cmd.kind === 'mailto' || cmd.kind === 'download') {
    window.location.href = cmd.href;
  } else if (cmd.kind === 'theme') {
    // Not a navigation -- cmd.href is inert ('#'). Calls the same toggle
    // the nav button uses (src/scripts/theme.js), so state/persistence/
    // aria-sync all go through one code path.
    toggleTheme();
  } else {
    // Soft, transition-aware navigation -- close first, then navigate, so
    // the palette isn't part of the outgoing view-transition snapshot.
    navigate(cmd.href);
  }
}

function openPalette() {
  const root = getRoot();
  const input = document.getElementById('palette-input');
  if (!root || !input || isOpen()) return;

  lastFocused = document.activeElement;
  root.hidden = false;
  setInert(true);
  document.body.style.overflow = 'hidden';

  input.value = '';
  activeIndex = 0;
  filtered = filterCommands('');
  render();

  // Flip to display:block first, THEN add .is-open on the next frame so the
  // opacity/transform transition in CommandPalette.astro's <style> actually
  // has a starting frame to animate from.
  requestAnimationFrame(() => {
    root.classList.add('is-open');
    input.focus();
  });
}

function closePalette() {
  const root = getRoot();
  if (!root || root.hidden) return;

  root.classList.remove('is-open');
  root.hidden = true;
  setInert(false);
  document.body.style.overflow = '';

  const toFocus = lastFocused && document.contains(lastFocused) ? lastFocused : null;
  (toFocus || document.getElementById('nav-toggle') || document.body).focus?.();
  lastFocused = null;
}

function togglePalette() {
  if (isOpen()) closePalette();
  else openPalette();
}

function onInput(event) {
  activeIndex = 0;
  filtered = filterCommands(event.target.value);
  render();
}

function onInputKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    if (filtered.length) activeIndex = (activeIndex + 1) % filtered.length;
    updateActive();
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    if (filtered.length) activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
    updateActive();
  } else if (event.key === 'Enter') {
    event.preventDefault();
    activate(activeIndex);
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closePalette();
  } else if (event.key === 'Tab') {
    // Sole focusable control in the dialog -- trap focus on the input.
    event.preventDefault();
  }
}

function onGlobalKeydown(event) {
  const meta = event.metaKey || event.ctrlKey;
  if (meta && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    togglePalette();
    return;
  }
  if (event.key === '/' && !isOpen() && !isTypingTarget(document.activeElement)) {
    event.preventDefault();
    openPalette();
  }
}

function init() {
  const root = getRoot();
  if (!root) return;

  // Command list is static per build but the persisted root only exists
  // once we've reached here at least once; refresh the in-memory copy every
  // page-load in case this ever runs before the persisted node is present
  // (defensive -- cheap, JSON is tiny).
  commands = loadCommands();

  if (initialized) return;
  initialized = true;

  document.addEventListener('keydown', onGlobalKeydown);

  document.getElementById('palette-input')?.addEventListener('input', onInput);
  document.getElementById('palette-input')?.addEventListener('keydown', onInputKeydown);

  document.querySelectorAll('[data-palette-backdrop]').forEach((el) => {
    el.addEventListener('click', closePalette);
  });

  document.querySelectorAll('[data-palette-open]').forEach((el) => {
    el.addEventListener('click', openPalette);
  });
}

document.addEventListener('astro:page-load', init);

// If the palette is open when a swap starts (e.g. browser back/forward),
// close it first: its inert targets (main/footer) are about to be replaced
// by fresh, non-inert nodes, which would strand a stale-open dialog state.
document.addEventListener('astro:before-swap', () => {
  closePalette();
});
