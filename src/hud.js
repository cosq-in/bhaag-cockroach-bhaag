import { MAX_GAP } from './chaser.js';
import { ROSTER, dialLayout, holePos } from './dial.js';

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

function overlay(ctx, w, h, u, lines, { y0 = 0.28, dim = 0.65 } = {}) {
  ctx.fillStyle = `rgba(10,5,20,${dim})`;
  ctx.fillRect(0, 0, w, h);
  let y = h * y0;
  for (const [s, size, color] of lines) y = block(ctx, s, w / 2, y, Math.max(14, size * u), color, w - 24) + size * u * 0.25;
}

function drawDial(ctx, w, h, u, dial) {
  const lay = dialLayout(w, h);
  const { cx, cy, r, holeR } = lay;
  ctx.fillStyle = 'rgba(20,12,35,0.88)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd27a'; ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,210,122,0.18)';
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ROSTER.forEach((c, i) => {
    const p = holePos(lay, dial, i);
    const sel = i === dial.index;
    ctx.fillStyle = sel ? '#3d2a63' : '#120a20';
    ctx.beginPath(); ctx.arc(p.x, p.y, holeR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sel ? '#7CFC9A' : '#8a7aa8'; ctx.lineWidth = sel ? 4 : 2; ctx.stroke();
    ctx.font = `${holeR * 1.2}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(c.icon, p.x, p.y + holeR * 0.05);
  });
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath(); ctx.moveTo(cx - 10, cy - r - 4); ctx.lineTo(cx + 10, cy - r - 4); ctx.lineTo(cx, cy - r + 12); ctx.fill();
  const nameSz = Math.max(20, 28 * u);
  text(ctx, dial.character.name, cx, cy - r - nameSz * 1.5, nameSz, '#7CFC9A');
  text(ctx, 'Turn the dial: swipe or tap a hole', cx, cy - r - nameSz * 2.5, Math.max(12, 14 * u), '#ddd');
}

export function drawHud(ctx, w, h, g, dial) {
  ctx.clearRect(0, 0, w, h);
  const u = Math.min(w / 500, h / 700);
  const fs = Math.max(16, 22 * u);
  const maxW = w - 32;

  text(ctx, `Score ${Math.floor(g.score)}`, 14, 12, fs, '#fff', 'left');
  text(ctx, `Best ${Math.floor(g.hi)}`, w - 14, 12, fs, '#ffd27a', 'right');
  if (g.state !== 'over') text(ctx, `Stage ${g.stage.id}: ${g.stage.name}`, w / 2, 12 + fs * 1.3, Math.max(14, fs * 0.8), '#fff');
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

  const card = g.tut?.card;
  if (card && g.state === 'play') {
    ctx.fillStyle = 'rgba(10,5,20,0.45)';
    ctx.fillRect(0, 0, w, h);
    const pw = Math.min(w - 32, 440);
    const px = (w - pw) / 2;
    const titleSz = Math.max(24, 30 * u);
    const lineSz = Math.max(15, 17 * u);
    ctx.font = `${lineSz}px ${FONT}`;
    const lines = card.lines.flatMap((l) => wrap(ctx, l, pw - 32));
    const ph = titleSz * 1.7 + lines.length * lineSz * 1.35 + 44;
    const py = h * 0.3;
    ctx.fillStyle = 'rgba(30,18,50,0.94)';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#ffd27a';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, pw, ph);
    text(ctx, card.title, w / 2, py + 14, titleSz, '#ffd27a');
    let y = py + titleSz * 1.7;
    for (const ln of lines) { text(ctx, ln, w / 2, y, lineSz, '#fff'); y += lineSz * 1.35; }
    bar(ctx, px + 16, py + ph - 18, pw - 32, 6, card.t / card.total, '#ffd27a');
  }

  if (g.state === 'menu') {
    overlay(ctx, w, h, u, [
      ['BHAAG COCKROACH BHAAG', 40, '#ffd27a'],
      ['Resign kar yaar.', 20, '#ff9f6b'],
      [g.touch ? 'Swipe to dodge, tap = power-up' : 'Arrows / WASD to run, Space = power-up', 15, '#ddd'],
    ], { y0: 0.04, dim: 0.35 });
    if (dial) drawDial(ctx, w, h, u, dial);
    text(ctx, g.touch ? 'Tap the screen to start' : 'Tap or press Enter to start', w / 2, h * 0.19, Math.max(16, 22 * u), '#7CFC9A');
  } else if (g.state === 'over') {
    const hit = Math.floor(g.overT / 0.55);
    const phase = (g.overT % 0.55) / 0.55;
    const words = ['WHACK!', 'THWACK!', 'OW!', 'DHAAP!', 'THOK!'];
    if (g.overT < 3) {
      ctx.globalAlpha = Math.max(0, 1 - phase * 1.2);
      const sz = Math.max(30, 56 * u) * (1 + (1 - phase) * 0.25);
      text(ctx, words[hit % words.length], w / 2, h * (0.34 - phase * 0.04 + (hit % 2) * 0.05), Math.min(sz, w * 0.16), '#ffd23f');
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = 'rgba(10,5,20,0.28)';
    ctx.fillRect(0, 0, w, h * 0.3);
    let y = h * 0.05;
    y = block(ctx, 'DETAINED!', w / 2, y, Math.max(34, 46 * u), '#ff6b6b', w - 24);
    y = block(ctx, `Score ${Math.floor(g.score)}   Best ${Math.floor(g.hi)}`, w / 2, y, Math.max(18, 24 * u), '#fff', w - 24);
    if (g.overT > 0.8) block(ctx, g.touch ? 'Tap to run again' : 'Tap or press Enter to run again', w / 2, h * 0.84, Math.max(18, 24 * u), '#7CFC9A', w - 24);
  }
}
