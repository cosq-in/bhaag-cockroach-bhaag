let ctx = null;
let muted = false;
let step = 0;

const SCALE = [0, 3, 5, 7, 10];
const MELODY = [5, 7, 6, 5, 4, 2, 3, 4, 5, 7, 8, 7, 6, 4, 5, 3];
const freqOf = (deg) => 220 * 2 ** ((SCALE[deg % 5] + 12 * Math.floor(deg / 5)) / 12);

function tone(freq, dur, type = 'square', vol = 0.04, delay = 0) {
  if (!ctx || muted || ctx.state !== 'running') return;
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function tick() {
  if (!ctx || ctx.state !== 'running') return;
  tone(freqOf(MELODY[step % MELODY.length]), 0.16, 'square', 0.025);
  if (step % 4 === 0) tone(110, 0.3, 'triangle', 0.05);
  step += 1;
}

export function initAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setInterval(tick, 200);
    } catch {
      ctx = null;
      return;
    }
  }
  if (ctx.state !== 'running') {
    try { ctx.resume?.()?.catch(() => {}); } catch { /* ignore */ }
  }
}

export function setPaused(paused) {
  if (!ctx) return;
  try {
    const p = paused ? ctx.suspend?.() : ctx.resume?.();
    p?.catch?.(() => {});
  } catch { /* ignore */ }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function sfx(name) {
  switch (name) {
    case 'pickup': tone(880, 0.08); tone(1320, 0.1, 'square', 0.04, 0.06); break;
    case 'stumble': tone(140, 0.25, 'sawtooth', 0.07); break;
    case 'caught': [440, 330, 220, 110].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.06, i * 0.15)); break;
    case 'revive': [330, 440, 660, 880].forEach((f, i) => tone(f, 0.15, 'square', 0.05, i * 0.08)); break;
    case 'power': [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, i * 0.07)); break;
    default: break;
  }
}
