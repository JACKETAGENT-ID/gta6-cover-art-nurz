// Neon Sunset Cover Maker — sample scenes drawn live on a canvas.
// No sample photo files ship with the app: each scene below is procedural
// drawing (sky gradients, a synthwave sun, silhouettes) rendered in the
// browser when the visitor clicks a sample button, or when a ?shot= scene
// loads them. Everything is deterministic, so every render matches.

/** Small seeded random generator, so a scene draws the same every time. */
function seededRand(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Vertical sunset gradient over the whole scene canvas. */
function paintSky(ctx, w, h, stops) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  stops.forEach((c, i) => sky.addColorStop(i / (stops.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
}

/** Synthwave sun: glowing disc with horizontal slats across its lower half. */
function paintSun(ctx, cx, cy, r, core, rim, slat) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, rim + 'cc');
  glow.addColorStop(1, rim + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.4, cy - r * 2.4, r * 4.8, r * 4.8);
  const disc = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
  disc.addColorStop(0, core);
  disc.addColorStop(1, rim);
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = slat;
  let y = cy + r * 0.05;
  let th = r * 0.045;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, th);
    y += th + r * 0.16;
    th *= 1.5;
  }
  ctx.restore();
}

/** A low skyline with lit windows, deterministic per seed. */
function paintSkyline(ctx, x0, baseY, x1, topY, color, seed) {
  const rand = seededRand(seed);
  ctx.fillStyle = color;
  let x = x0;
  while (x < x1) {
    const bw = (x1 - x0) * (0.06 + rand() * 0.08);
    const bh = (baseY - topY) * (0.35 + rand() * 0.65);
    ctx.fillRect(x, baseY - bh, bw, bh);
    ctx.fillStyle = 'rgba(255, 190, 90, 0.9)';
    for (let wy = baseY - bh + 8; wy < baseY - 8; wy += 16) {
      for (let wx = x + 6; wx < x + bw - 6; wx += 14) {
        if (rand() < 0.4) ctx.fillRect(wx, wy, 4, 6);
      }
    }
    ctx.fillStyle = color;
    x += bw + (x1 - x0) * 0.015;
  }
}

/** A palm silhouette: curved trunk and seven drooping fronds. */
function paintPalm(ctx, x, y, s, lean, color) {
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

/** Three gulls: small paired arcs against the sky. */
function paintGulls(ctx, w, h, seed) {
  const rand = seededRand(seed);
  ctx.strokeStyle = 'rgba(30, 8, 40, 0.85)';
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const gx = w * (0.2 + rand() * 0.6);
    const gy = h * (0.12 + rand() * 0.18);
    const s = w * (0.02 + rand() * 0.015);
    ctx.beginPath();
    ctx.moveTo(gx - s, gy);
    ctx.quadraticCurveTo(gx - s * 0.4, gy - s * 0.6, gx, gy);
    ctx.quadraticCurveTo(gx + s * 0.4, gy - s * 0.6, gx + s, gy);
    ctx.stroke();
  }
}

/** Pier scene: low sun over the sea, shimmering reflection, wooden pier planks. */
function drawPier(ctx, w, h) {
  paintSky(ctx, w, h, ['#2a0e4d', '#8a2a6d', '#e84a6f', '#ff8a3d', '#ffc46b']);
  paintSun(ctx, w * 0.5, h * 0.44, w * 0.17, '#fff3c4', '#ffe9a8', '#e84a6f');
  paintGulls(ctx, w, h, 7);
  // Sea: dark water from the horizon down, with a glittering sun path.
  const sea = ctx.createLinearGradient(0, h * 0.52, 0, h);
  sea.addColorStop(0, '#57205e');
  sea.addColorStop(1, '#160a2e');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.52, w, h * 0.48);
  const rand = seededRand(21);
  for (let i = 0; i < 46; i++) {
    const y = h * (0.54 + rand() * 0.42);
    const spread = (y / h - 0.52) * w * 0.55;
    const x = w * 0.5 + (rand() - 0.5) * spread;
    const len = w * (0.02 + rand() * 0.07);
    ctx.fillStyle = `rgba(255, 220, 140, ${0.25 + rand() * 0.5})`;
    ctx.fillRect(x, y, len, Math.max(2, h * 0.004));
  }
  // Pier: planks converging from the bottom edge toward the sun.
  ctx.fillStyle = '#1c0a26';
  ctx.beginPath();
  ctx.moveTo(w * 0.30, h);
  ctx.lineTo(w * 0.46, h * 0.62);
  ctx.lineTo(w * 0.54, h * 0.62);
  ctx.lineTo(w * 0.72, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 170, 90, 0.55)';
  ctx.lineWidth = Math.max(2, w * 0.003);
  for (let i = 0; i <= 9; i++) {
    const t = i / 9;
    const y = h * (0.62 + 0.38 * t * t);
    const half = w * (0.04 + 0.21 * t * t);
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - half, y);
    ctx.lineTo(w * 0.5 + half, y);
    ctx.stroke();
  }
  // Lamp posts along the pier, warm dots in the dusk.
  for (const t of [0.25, 0.55, 0.85]) {
    const y = h * (0.62 + 0.38 * t * t);
    const x = w * (0.5 - (0.04 + 0.21 * t * t)) - w * 0.012;
    ctx.strokeStyle = '#1c0a26';
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - h * 0.07);
    ctx.stroke();
    ctx.fillStyle = '#ffd98a';
    ctx.beginPath();
    ctx.arc(x, y - h * 0.075, Math.max(3, w * 0.007), 0, Math.PI * 2);
    ctx.fill();
  }
  paintPalm(ctx, w * 0.06, h * 0.62, h * 0.16, -w * 0.01, 'rgba(20,6,32,0.95)');
}

/** Boulevard scene: neon road in perspective, palms, skyline, glowing signs. */
function drawBoulevard(ctx, w, h) {
  paintSky(ctx, w, h, ['#12082e', '#5b1a8a', '#c22a8a', '#ff3d8b', '#37e0ff']);
  paintSun(ctx, w * 0.68, h * 0.3, w * 0.13, '#fff0fa', '#ffd6f2', '#c22a8a');
  paintSkyline(ctx, 0, h * 0.58, w, h * 0.22, 'rgba(18,6,34,0.9)', 33);
  // Road: dark asphalt widening toward the viewer, neon centre dashes.
  ctx.fillStyle = '#150826';
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.58);
  ctx.lineTo(w * 0.58, h * 0.58);
  ctx.lineTo(w * 0.86, h);
  ctx.lineTo(w * 0.14, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#37e0ff';
  for (let i = 0; i < 6; i++) {
    const t = i / 6;
    const y = h * (0.60 + 0.40 * t * t);
    const half = w * (0.004 + 0.02 * t * t);
    ctx.fillRect(w * 0.5 - half, y, half * 2, Math.max(2, h * 0.008 + t * h * 0.02));
  }
  // Neon sign blocks flanking the road, pink and cyan glow.
  const signs = [
    [0.06, 0.62, '#ff3d8b'], [0.20, 0.68, '#37e0ff'],
    [0.78, 0.64, '#37e0ff'], [0.88, 0.72, '#ff8a3d'],
  ];
  for (const [fx, fy, color] of signs) {
    const sw = w * 0.075;
    const sh = h * 0.05;
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = w * 0.02;
    ctx.fillStyle = color;
    ctx.fillRect(w * fx, h * fy, sw, sh);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(w * fx + sw * 0.12, h * fy + sh * 0.3, sw * 0.76, sh * 0.14);
    ctx.fillRect(w * fx + sw * 0.12, h * fy + sh * 0.58, sw * 0.5, sh * 0.14);
  }
  paintPalm(ctx, w * 0.10, h * 0.60, h * 0.17, -w * 0.012, 'rgba(16,5,30,0.95)');
  paintPalm(ctx, w * 0.92, h * 0.60, h * 0.15, w * 0.01, 'rgba(16,5,30,0.95)');
  paintGulls(ctx, w, h, 12);
}

/** Rider scene: motorbike silhouette with a leaning rider, sun at the back.
 *  The bike sits in the scene's middle band (about 0.25–0.63 of its height),
 *  so it survives a wide panel's vertical crop, which keeps the slice around
 *  the focus point rather than the whole square. */
function drawRider(ctx, w, h) {
  paintSky(ctx, w, h, ['#070a24', '#1a2350', '#2c3a7a', '#4a5aa8', '#8a7fd0']);
  paintSun(ctx, w * 0.5, h * 0.30, w * 0.19, '#ffffff', '#dfe6ff', '#2c3a7a');
  paintSkyline(ctx, 0, h * 0.58, w, h * 0.30, 'rgba(10,12,34,0.9)', 55);
  // Ground: dark strip the bike rides on, with motion streaks.
  ctx.fillStyle = '#0a0e24';
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  ctx.strokeStyle = 'rgba(138, 180, 255, 0.5)';
  ctx.lineWidth = Math.max(2, h * 0.005);
  for (const fy of [0.66, 0.76, 0.88]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.05, h * fy);
    ctx.lineTo(w * 0.35, h * fy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * fy);
    ctx.lineTo(w * 0.97, h * fy);
    ctx.stroke();
  }
  // Bike + rider silhouette, near-black with a hot-pink rim on the sun side.
  const ink = '#0b0618';
  const rim = '#ff3d8b';
  const wy = h * 0.52; // wheel centres
  const wr = w * 0.085; // wheel radius
  const rearX = w * 0.34;
  const frontX = w * 0.66;
  ctx.save();
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.strokeStyle = ink;
  // Wheels.
  for (const wx of [rearX, frontX]) {
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(wx, wy, wr * 0.55, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Frame: rear hub to tank, tank to head, head to front hub, swingarm.
  ctx.beginPath();
  ctx.moveTo(rearX, wy);
  ctx.lineTo(w * 0.50, wy - h * 0.10);
  ctx.lineTo(w * 0.60, wy - h * 0.10);
  ctx.lineTo(frontX, wy);
  ctx.moveTo(rearX, wy);
  ctx.lineTo(w * 0.46, wy - h * 0.02);
  ctx.lineTo(w * 0.60, wy - h * 0.10);
  ctx.stroke();
  // Handlebar + fork.
  ctx.beginPath();
  ctx.moveTo(w * 0.60, wy - h * 0.10);
  ctx.lineTo(w * 0.63, wy - h * 0.16);
  ctx.moveTo(w * 0.60, wy - h * 0.10);
  ctx.lineTo(frontX, wy);
  ctx.stroke();
  // Rider: leaning torso, helmet, arms to the bars, leg to the peg.
  ctx.beginPath();
  ctx.moveTo(w * 0.47, wy - h * 0.10);
  ctx.lineTo(w * 0.53, wy - h * 0.20);
  ctx.lineTo(w * 0.60, wy - h * 0.15);
  ctx.lineWidth = Math.max(5, w * 0.014);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w * 0.545, wy - h * 0.24, w * 0.036, 0, Math.PI * 2);
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(w * 0.50, wy - h * 0.13);
  ctx.lineTo(w * 0.44, wy - h * 0.01);
  ctx.lineWidth = Math.max(4, w * 0.011);
  ctx.stroke();
  // Pink rim light along the sun-facing edges.
  ctx.strokeStyle = rim;
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.arc(frontX, wy, wr, -Math.PI * 0.7, Math.PI * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w * 0.53, wy - h * 0.20);
  ctx.lineTo(w * 0.60, wy - h * 0.15);
  ctx.stroke();
  ctx.restore();
  paintGulls(ctx, w, h, 29);
}

const SCENES = { pier: drawPier, boulevard: drawBoulevard, rider: drawRider };

/**
 * Draws one named sample scene onto a fresh canvas and returns it. The
 * canvas drops straight into the editor's photo slots: drawPhoto reads its
 * width/height the same way it reads a loaded image. Unknown names fall
 * back to the pier scene.
 */
export function makeSampleScene(name, w = 1080, h = 1080) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  (SCENES[name] || SCENES.pier)(ctx, w, h);
  return canvas;
}

/** The sample names the editor offers, in button order. */
export const SAMPLE_NAMES = ['pier', 'boulevard', 'rider'];
