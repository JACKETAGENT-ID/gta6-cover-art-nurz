// Neon Sunset Cover Maker — draws the multi-panel GTA-style poster onto a canvas.
// Own design: sunset sky strip with a synthwave sun, palm and skyline silhouettes,
// three photo panels with white-hot gutters, and a bold caption band. No Rockstar
// artwork, logo or font: the lettering is heavy system sans stacks, so the app
// ships no font files at all.

/** Colour grades: sky stops, sun, caption band, accents, photo tint. */
export const GRADES = {
  sunset: {
    sky: ['#2a0e4d', '#8a2a6d', '#e84a6f', '#ff8a3d', '#ffc46b'],
    sun: '#ffe9a8', sunCore: '#fff3c4', band: '#1d0b2b', accent: '#ff8a3d',
    accent2: '#ff3d8b', tint: '#ff7a3d', placeholder: ['#3d1558', '#a83a6e'],
  },
  neon: {
    sky: ['#12082e', '#5b1a8a', '#c22a8a', '#ff3d8b', '#37e0ff'],
    sun: '#ffd6f2', sunCore: '#fff0fa', band: '#140a26', accent: '#37e0ff',
    accent2: '#ff3d8b', tint: '#ff3d8b', placeholder: ['#2a0f52', '#8a1a7a'],
  },
  midnight: {
    sky: ['#070a24', '#1a2350', '#2c3a7a', '#4a5aa8', '#8a7fd0'],
    sun: '#dfe6ff', sunCore: '#ffffff', band: '#0a0e24', accent: '#8ab4ff',
    accent2: '#b48aff', tint: '#5a6fd0', placeholder: ['#141a3d', '#2c3a7a'],
  },
};

/** Lettering stacks — heavy system sans only, so the app ships no font files.
 *  On Linux the bold weight resolves to Liberation Sans Bold; on macOS and
 *  Windows the same stack lands on Arial Black / Arial Bold. */
const DISPLAY_FONT = '"Arial Black", "Liberation Sans", Arial, sans-serif';
const TEXT_FONT = '"Liberation Sans", Arial, Helvetica, sans-serif';

/** Deterministic pseudo-random generator (seeded, so every render matches). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panel rectangles for the three post sizes, as fractions of width/height. */
export function panelLayout(w, h) {
  const g = Math.max(6, Math.round(w * 0.012)); // gutter
  const aspect = w / h;
  let strip, bandTop, a, b, c;
  if (aspect > 1.3) { // 1920 x 1080 landscape
    strip = 0.13 * h; bandTop = 0.78 * h;
    a = [0, strip, 0.52 * w, bandTop];
    b = [0.52 * w, strip, w, (strip + bandTop) / 2];
    c = [0.52 * w, (strip + bandTop) / 2, w, bandTop];
  } else if (aspect < 0.9) { // 1080 x 1350 portrait
    strip = 0.10 * h; bandTop = 0.68 * h;
    a = [0, strip, w, 0.46 * h];
    b = [0, 0.46 * h, 0.5 * w, bandTop];
    c = [0.5 * w, 0.46 * h, w, bandTop];
  } else { // 1080 x 1080 square
    strip = 0.11 * h; bandTop = 0.70 * h;
    a = [0, strip, 0.57 * w, bandTop];
    b = [0.57 * w, strip, w, (strip + bandTop) / 2];
    c = [0.57 * w, (strip + bandTop) / 2, w, bandTop];
  }
  const inset = ([x0, y0, x1, y1]) => [x0 + g / 2, y0 + g / 2, x1 - g / 2, y1 - g / 2];
  return { strip, bandTop, gutter: g, panels: [inset(a), inset(b), inset(c)] };
}

/** A palm silhouette: curved trunk and six drooping fronds. */
function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(2, s * 0.035);
  const tx = x + lean * s;
  const ty = y - s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * s * 0.4, y - s * 0.55, tx, ty);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, s * 0.016);
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI * (0.06 + 0.15 * k);
    const dir = k % 2 === 0 ? 1 : -1;
    const ex = tx + Math.cos(ang) * s * 0.52 * dir;
    const ey = ty + Math.sin(ang) * s * 0.34 + s * 0.14;
    const mx = tx + Math.cos(ang) * s * 0.26 * dir;
    const my = ty - s * 0.08 + Math.sin(ang) * s * 0.06;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

/** A low skyline silhouette with a few lit windows, deterministic per seed. */
function drawSkyline(ctx, x0, baseY, x1, topY, color, seed) {
  const rand = mulberry32(seed);
  ctx.fillStyle = color;
  let x = x0;
  while (x < x1) {
    const bw = (x1 - x0) * (0.06 + rand() * 0.08);
    const bh = (baseY - topY) * (0.35 + rand() * 0.65);
    ctx.fillRect(x, baseY - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 190, 90, 0.85)';
    for (let wy = baseY - bh + 8; wy < baseY - 8; wy += 16) {
      for (let wx = x + 6; wx < x + bw - 6; wx += 14) {
        if (rand() < 0.4) ctx.fillRect(wx, wy, 4, 6);
      }
    }
    ctx.fillStyle = color;
    x += bw + (x1 - x0) * 0.015;
  }
}

/** Synthwave sun: glowing disc with horizontal slats cut through its lower half. */
function drawSun(ctx, cx, cy, r, grade) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, grade.sun + 'cc');
  glow.addColorStop(1, grade.sun + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, grade.sunCore);
  disc.addColorStop(1, grade.sun);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slats: bars of the sky's mid tone, thicker toward the bottom.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = grade.sky[2];
  let y = cy + r * 0.05;
  let th = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, th);
    y += th + r * 0.16;
    th *= 1.5;
  }
  ctx.restore();
}

/** Draws one photo cover-filling `rect`, honouring zoom and focus point. */
function drawPhoto(ctx, img, rect, zoom, focus, grade) {
  const [x0, y0, x1, y1] = rect;
  const rw = x1 - x0;
  const rh = y1 - y0;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const pw = iw * scale;
  const ph = ih * scale;
  const dx = x0 + (rw - pw) * Math.min(1, Math.max(0, focus.x));
  const dy = y0 + (rh - ph) * Math.min(1, Math.max(0, focus.y));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, rw, rh);
  ctx.clip();
  ctx.drawImage(img, dx, dy, pw, ph);
  // Warm sunset wash + vignette, so every photo shares the poster's grade.
  const wash = ctx.createLinearGradient(x0, y0, x0, y1);
  wash.addColorStop(0, grade.tint + '00');
  wash.addColorStop(1, grade.tint + '2e');
  ctx.fillStyle = wash;
  ctx.fillRect(x0, y0, rw, rh);
  const vig = ctx.createRadialGradient(
    x0 + rw / 2, y0 + rh / 2, Math.min(rw, rh) * 0.35,
    x0 + rw / 2, y0 + rh / 2, Math.max(rw, rh) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(20,0,30,0.28)');
  ctx.fillStyle = vig;
  ctx.fillRect(x0, y0, rw, rh);
  ctx.restore();
}

/** Empty panel: grade gradient, mini sun, palm, and an "add photo" hint. */
function drawPlaceholder(ctx, rect, grade, seed) {
  const [x0, y0, x1, y1] = rect;
  const rw = x1 - x0;
  const rh = y1 - y0;
  const g = ctx.createLinearGradient(x0, y0, x0, y1);
  g.addColorStop(0, grade.placeholder[0]);
  g.addColorStop(1, grade.placeholder[1]);
  ctx.fillStyle = g;
  ctx.fillRect(x0, y0, rw, rh);
  drawSun(ctx, x0 + rw * 0.68, y0 + rh * 0.34, Math.min(rw, rh) * 0.16, grade);
  drawPalm(ctx, x0 + rw * 0.12, y0 + rh * 0.96, rh * 0.5, -rw * 0.06, 'rgba(20,6,32,0.9)');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `700 ${Math.max(14, rw * 0.045)}px ${TEXT_FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ADD PHOTO', x0 + rw / 2, y0 + rh * 0.62);
}

/** Fits the caption into at most two lines of heavy display sans, shrinking until
 *  every line fits `maxWidth` and the whole block (lines + subtitle) fits
 *  `maxHeight` — a long single word shrinks too, never overflows the band. */
function fitCaptionLines(ctx, text, maxWidth, startSize, maxHeight, subHeight) {
  const words = text.split(/\s+/).filter(Boolean);
  let size = startSize;
  while (size > 18) {
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxWidth || !line) line = trial;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const total = lines.length * size * 1.02 + subHeight;
    if (lines.length <= 2 && widest <= maxWidth && total <= maxHeight) return { lines, size };
    size = Math.floor(size * 0.92);
  }
  ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
  return { lines: [text], size };
}

/**
 * Draws the whole poster onto `canvas` at its own size.
 * `state`: { photos[3], panelPhotos[3], zooms[3], focus[{x,y} x3], caption, subtitle, grade }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const { strip, bandTop, panels } = panelLayout(w, h);

  // Sky: full-canvas sunset gradient.
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sky strip: sun, skyline, palms.
  drawSun(ctx, w * 0.72, strip * 0.52, strip * 0.42, grade);
  drawSkyline(ctx, 0, strip, w, strip * 0.25, 'rgba(24,8,40,0.85)', 11);
  drawPalm(ctx, w * 0.045, strip * 0.98, strip * 0.85, -w * 0.01, 'rgba(20,6,32,0.95)');
  drawPalm(ctx, w * 0.96, strip * 0.98, strip * 0.78, w * 0.008, 'rgba(20,6,32,0.95)');

  // Photo panels.
  panels.forEach((rect, i) => {
    const img = state.photos[state.panelPhotos[i]];
    if (img) drawPhoto(ctx, img, rect, state.zooms[i], state.focus[i], grade);
    else drawPlaceholder(ctx, rect, grade, 100 + i);
    // Thin bright frame around each panel.
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
  });

  // Caption band.
  const bandH = h - bandTop;
  ctx.fillStyle = grade.band;
  ctx.fillRect(0, bandTop, w, bandH);
  const rule = ctx.createLinearGradient(0, 0, w, 0);
  rule.addColorStop(0, grade.accent);
  rule.addColorStop(0.5, grade.accent2);
  rule.addColorStop(1, grade.accent);
  ctx.fillStyle = rule;
  ctx.fillRect(0, bandTop, w, Math.max(3, h * 0.004));

  const pad = w * 0.045;
  const title = (state.caption || 'Sunset Heist').trim().toUpperCase();
  const sub = (state.subtitle || '').trim().toUpperCase();
  const subSize = Math.max(14, Math.floor(bandH * 0.13));
  const subHeight = sub ? subSize * 1.9 : 0;
  const titleSize = Math.floor(bandH * 0.40);
  const { lines, size } = fitCaptionLines(
    ctx, title, w - pad * 2 - 12, titleSize, bandH * 0.94, subHeight,
  );
  const lineH = size * 1.02;
  const totalH = lineH * lines.length + subHeight;
  let y = bandTop + (bandH - totalH) / 2 + size * 0.82;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  // Neon edge: pink offset copy behind the white letters.
  ctx.fillStyle = grade.accent2;
  for (const line of lines) {
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    ctx.fillText(line, pad + size * 0.035, y + size * 0.035);
  }
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = size * 0.08;
  for (const line of lines) {
    ctx.font = `900 ${size}px ${DISPLAY_FONT}`;
    ctx.fillText(line, pad, y);
    y += lineH;
  }
  ctx.shadowBlur = 0;
  if (sub) {
    ctx.font = `600 ${subSize}px ${TEXT_FONT}`;
    try { ctx.letterSpacing = `${Math.max(2, subSize * 0.18)}px`; } catch { /* older canvas */ }
    ctx.fillStyle = grade.accent;
    // The subtitle sits in its own slot at the foot of the text block, so a
    // two-line title can never push it past the band's bottom edge.
    const subBaseline = bandTop + (bandH - totalH) / 2 + lines.length * lineH + subSize * 1.3;
    ctx.fillText(sub, pad, subBaseline);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
}
