let ctx = null;
let muted = false;
let step = 0;
const samples = new Map();
const lastPlayed = new Map();

// Optional custom clips: assets/sfx/manifest.json maps game events to audio files.
async function loadSamples() {
  try {
    const manifest = await (await fetch('assets/sfx/manifest.json')).json();
    for (const [event, files] of Object.entries(manifest)) {
      const buffers = [];
      for (const f of files) {
        try {
          const data = await (await fetch(`assets/sfx/${f}`)).arrayBuffer();
          buffers.push(await ctx.decodeAudioData(data));
        } catch { /* skip a bad or missing file */ }
      }
      if (buffers.length) samples.set(event, buffers);
    }
  } catch { /* no custom sounds */ }
}

function playSample(name) {
  const list = samples.get(name);
  if (!list || !ctx || muted || ctx.state !== 'running') return false;
  const now = ctx.currentTime;
  if (now - (lastPlayed.get(name) ?? -1) < 0.35) return true;
  lastPlayed.set(name, now);
  const src = ctx.createBufferSource();
  src.buffer = list[Math.floor(Math.random() * list.length)];
  const gain = ctx.createGain();
  gain.gain.value = 0.9;
  src.connect(gain).connect(ctx.destination);
  src.start();
  return true;
}

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
      loadSamples();
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
  if (playSample(name)) return;
  switch (name) {
    case 'pickup': tone(880, 0.08); tone(1320, 0.1, 'square', 0.04, 0.06); break;
    case 'stumble': tone(140, 0.25, 'sawtooth', 0.07); break;
    case 'caught': [440, 330, 220, 110].forEach((f, i) => tone(f, 0.25, 'sawtooth', 0.06, i * 0.15)); break;
    case 'revive': [330, 440, 660, 880].forEach((f, i) => tone(f, 0.15, 'square', 0.05, i * 0.08)); break;
    case 'power': [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'triangle', 0.06, i * 0.07)); break;
    default: break;
  }
}
