const KEYS = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump',
  ArrowDown: 'slide', KeyS: 'slide',
  Space: 'power', Enter: 'start', KeyM: 'mute',
};

export function keyIntent(code) {
  return KEYS[code] ?? null;
}

export function swipeIntent(dx, dy, threshold = 30) {
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  if (Math.max(ax, ay) < threshold) return null;
  if (ax > ay) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'jump' : 'slide';
}

export class SwipeTracker {
  constructor(threshold = 30) {
    this.threshold = threshold;
    this.origin = null;
    this.fired = false;
    this.id = undefined;
  }

  start(x, y, id) {
    if (this.origin) return;
    this.origin = { x, y };
    this.id = id;
    this.fired = false;
  }

  move(x, y, id) {
    if (!this.origin || this.fired || id !== this.id) return null;
    const intent = swipeIntent(x - this.origin.x, y - this.origin.y, this.threshold);
    if (intent) this.fired = true;
    return intent;
  }

  end(id) {
    if (!this.origin || id !== this.id) return null;
    const tap = this.fired ? null : 'tap';
    this.origin = null;
    this.id = undefined;
    this.fired = false;
    return tap;
  }
}

export function attachInput(target, onIntent) {
  window.addEventListener('keydown', (e) => {
    const intent = keyIntent(e.code);
    if (!intent) return;
    e.preventDefault();
    if (!e.repeat) onIntent(intent);
  });

  const swipe = new SwipeTracker();
  const tracked = (e) => {
    for (const t of e.changedTouches) if (t.identifier === swipe.id) return t;
    return null;
  };
  target.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (swipe.origin) {
      if (e.touches.length > 1) return;
      swipe.end(swipe.id);
    }
    const t = e.changedTouches[0];
    swipe.start(t.clientX, t.clientY, t.identifier);
    onIntent('touch');
  }, { passive: false });
  target.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const t = tracked(e);
    if (!t) return;
    const intent = swipe.move(t.clientX, t.clientY, t.identifier);
    if (intent) onIntent(intent);
  }, { passive: false });
  target.addEventListener('touchend', (e) => {
    e.preventDefault();
    const t = tracked(e);
    if (!t) return;
    const tap = swipe.end(t.identifier);
    if (tap) onIntent(tap, { x: t.clientX, y: t.clientY });
  }, { passive: false });
  target.addEventListener('touchcancel', (e) => {
    const t = tracked(e);
    if (t) swipe.end(t.identifier);
  });
  target.addEventListener('mousedown', (e) => onIntent('tap', { x: e.clientX, y: e.clientY }));
}
