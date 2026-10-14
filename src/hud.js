import { MAX_GAP } from './chaser.js';

const FONT = '"Permanent Marker","Marker Felt","Comic Sans MS",cursive';
const BANKED_ICON = { meme: '😂', wifi: '📶', shield: '🛡️' };
const SAFE_BOTTOM = 24;

function text(ctx, s, x, y, size, color = '#fff', align = 'center') {
  ctx.font = `${Math.max(4, size)}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  ctx.lineWidth = Math.max(1, size / 7);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function wrap(ctx, s, maxW) {
  const lines = [];
  let line = '';
  for (const word of s.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Draws wrapped text; returns the y just below the last line.
function block(ctx, s, x, y, size, color, maxW) {
  ctx.font = `${size}px ${FONT}`;
  for (const ln of wrap(ctx, s, maxW)) { text(ctx, ln, x, y, size, color); y += size * 1.25; }
  return y;
}

function bar(ctx, x, y, bw, bh, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x, y, bw, bh);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, bw * Math.max(0, Math.min(1, frac)), bh);
}

function overlay(ctx, w, h, u, lines) {
  ctx.fillStyle = 'rgba(10,5,20,0.65)';
  ctx.fillRect(0, 0, w, h);
  let y = h * 0.28;
  for (const [s, size, color] of lines) y = block(ctx, s, w / 2, y, Math.max(14, size * u), color, w - 24) + size * u * 0.25;
}

export function drawHud(ctx, w, h, g) {
  ctx.clearRect(0, 0, w, h);
  const u = Math.min(w / 500, h / 700);
  const fs = Math.max(16, 22 * u);
  const maxW = w - 32;

  text(ctx, `Score ${Math.floor(g.score)}`, 14, 12, fs, '#fff', 'left');
  text(ctx, `Best ${Math.floor(g.hi)}`, w - 14, 12, fs, '#ffd27a', 'right');
  text(ctx, `Stage ${g.stage.id}: ${g.stage.name}`, w / 2, 12 + fs * 1.3, Math.max(14, fs * 0.8), '#fff');
  if (g.mult > 1) text(ctx, `x${g.mult}`, 14, 12 + fs * 1.3, fs, '#7CFC9A', 'left');

  const bw = Math.min(150 * u, w * 0.38);
  const bh = 10;
  const by = h - SAFE_BOTTOM - bh;
  const lf = Math.max(12, 12 * u);
  text(ctx, 'INSPECTOR', 14, by - lf * 1.5, lf, '#fff', 'left');
  bar(ctx, 14, by, bw, bh, 1 - g.chaser.gap / MAX_GAP, '#e74c3c');
  text(ctx, 'WITNESS', w - 14 - bw, by - lf * 1.5, lf, '#fff', 'left');
  bar(ctx, w - 14 - bw, by, bw, bh, g.powerups.meter / 100, '#4fc3f7');
  if (g.powerups.banked) {
    const icon = Math.max(30, 34 * u);
    text(ctx, BANKED_ICON[g.powerups.banked], w - 14, by - lf * 1.5 - icon * 1.3, icon, '#fff', 'right');
    if (g.touch) text(ctx, 'TAP', w - 14, by - lf * 1.5 - icon * 0.2, lf, '#ffd27a', 'right');
  }

  let y = h * 0.22;
  for (const p of g.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.t));
    y = block(ctx, p.text, w / 2, y, fs * 1.05, '#fff', maxW) + fs * 0.3;
  }
  ctx.globalAlpha = 1;
  if (g.boss) {
    const pulse = 1 + Math.sin(g.t * 8) * 0.06;
    text(ctx, `BOSS: ${g.stage.boss}`, w / 2, h * 0.12, Math.max(18, fs * 1.3 * pulse), '#ff6b6b');
  }

  if (g.state === 'menu') {
    overlay(ctx, w, h, u, [
      ['DELHI RUNNER 3D', 50, '#ffd27a'],
      ['Cockroach Janta Party edition (fan satire)', 20, '#fff'],
      [g.touch ? 'Swipe left/right to change lane, up to jump, down to slide. Tap = power-up.' : 'Arrows / WASD to run. Space for power-ups.', 16, '#ddd'],
      ['Run up ramps onto buses. Dodge the inspector. Collect witnesses.', 16, '#ddd'],
      [g.touch ? 'Tap to start' : 'Tap or press Enter to start', 26, '#7CFC9A'],
    ]);
  } else if (g.state === 'over') {
    overlay(ctx, w, h, u, [
      ['DETAINED!', 50, '#ff6b6b'],
      [`Score ${Math.floor(g.score)}   Best ${Math.floor(g.hi)}`, 26, '#fff'],
      [g.touch ? 'Tap to run again' : 'Tap or press Enter to run again', 24, '#7CFC9A'],
    ]);
  }
}
