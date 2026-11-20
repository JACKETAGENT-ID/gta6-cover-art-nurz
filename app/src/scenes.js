// Procedural sample scenes for the Neon Sunset Cover Maker, drawn live on
// canvas at run time. No image files are shipped: each scene is a small
// deterministic painting built from gradients, silhouettes and a seeded
// random stream, so the same scene always looks the same. Every scene
// paints into a canvas of the size the caller asks for and returns it,
// which the editor then treats exactly like a photo the user uploaded.

export const SCENE_IDS = ['strip', 'rooftop', 'pier'];

export const SCENE_LABELS = {
  strip: 'Sunset Strip',
  rooftop: 'Rooftop Neon',
  pier: 'Ocean Pier',
};

// A tiny deterministic random stream (mulberry32). Seeding keeps every
// window, palm and gull in the same place on every run, so the exported
// cover is byte-identical across the two main.ts runs.
export function seeded(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function skyGradient(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  return g;
}

function stars(ctx, w, h, rand, count, top) {
  ctx.save();
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < count; i += 1) {
    const x = rand() * w;
    const y = rand() * h * top;
    const r = 0.6 + rand() * 1.4;
    ctx.globalAlpha = 0.35 + rand() * 0.6;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function litWindows(ctx, x, y, bw, bh, rand, lit, color) {
  const cols = Math.max(2, Math.floor(bw / 22));
  const rows = Math.max(3, Math.floor(bh / 26));
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      if (rand() > lit) continue;
      ctx.fillStyle = rand() > 0.5 ? color : '#ffd27a';
      ctx.fillRect(x + 5 + c * ((bw - 10) / cols), y + 6 + r * ((bh - 12) / rows), 7, 9);
    }
  }
}

function buildingRow(ctx, w, baseY, rand, minH, maxH, color, lit) {
  let x = -10;
  while (x < w + 10) {
    const bw = 40 + rand() * 90;
    const bh = minH + rand() * (maxH - minH);
    ctx.fillStyle = color;
    ctx.fillRect(x, baseY - bh, bw, bh);
    litWindows(ctx, x, baseY - bh, bw, bh, rand, lit, '#ffe9a8');
    x += bw + 4 + rand() * 18;
  }
}

function palm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 7 * s;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 30 * s, y - 70 * s, x + lean * 46 * s, y - 118 * s);
  ctx.stroke();
  const crownX = x + lean * 46 * s;
  const crownY = y - 118 * s;
  ctx.lineWidth = 4.5 * s;
  // Fronds arch up and out from the crown, then tip down slightly —
  // the classic palm fan, not a drooping spider.
  for (let i = 0; i < 7; i += 1) {
    const angle = Math.PI * (0.06 + (i / 7) * 0.88);
    const reach = (52 + (i % 3) * 12) * s;
    const tipX = crownX + Math.cos(angle) * reach * (lean < 0 ? -1 : 1);
    const tipY = crownY - Math.sin(angle) * reach * 0.42 + 14 * s;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(
      crownX + (tipX - crownX) * 0.5,
      crownY - 34 * s,
      tipX,
      tipY,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(crownX, crownY, 6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function gulls(ctx, w, h, rand, count, top) {
  ctx.save();
  ctx.strokeStyle = 'rgba(20, 12, 30, 0.85)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i += 1) {
    const x = rand() * w;
    const y = h * top * rand();
    const s = 7 + rand() * 9;
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
  ctx.restore();
}

// A striped synthwave sun: a glowing disc cut by horizontal slits that
// grow wider toward the bottom, as if the sun is sinking behind the city.
function stripedSun(ctx, cx, cy, r, sky, rand) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.1);
  glow.addColorStop(0, 'rgba(255, 190, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 190, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 2.2, cy - r * 2.2, r * 4.4, r * 4.4);

  const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  disc.addColorStop(0, '#ffe9a3');
  disc.addColorStop(0.45, '#ffb347');
  disc.addColorStop(1, '#ff4d6d');
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = sky;
  let y = cy + r * 0.05;
  let gap = 3;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, gap);
    y += gap + r * 0.16;
    gap += 2.5;
  }
  ctx.restore();
  return disc;
}

// Scene one: Sunset Strip. A palm-lined boulevard at dusk, a striped sun
// sinking behind the skyline, and a convertible cruising toward the viewer.
export function paintStrip(ctx, w, h) {
  const rand = seeded(20261120);
  const sky = skyGradient(ctx, w, h, [
    [0, '#1b0f3a'],
    [0.42, '#7b2d8b'],
    [0.68, '#ff5e78'],
    [0.85, '#ff9a3d'],
    [1, '#ffc46b'],
  ]);
  stars(ctx, w, h, rand, 42, 0.3);
  stripedSun(ctx, w * 0.5, h * 0.52, Math.min(w, h) * 0.26, '#ff5e78', rand);
  buildingRow(ctx, w, h * 0.66, rand, h * 0.1, h * 0.3, '#241239', 0.5);
  buildingRow(ctx, w, h * 0.72, rand, h * 0.06, h * 0.18, '#160a28', 0.65);

  // The road: a dark wedge narrowing to the horizon, with neon edges.
  ctx.fillStyle = '#0d0716';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.42, h * 0.72);
  ctx.lineTo(w * 0.58, h * 0.72);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ff2e88';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.42, h * 0.72);
  ctx.moveTo(w, h);
  ctx.lineTo(w * 0.58, h * 0.72);
  ctx.stroke();
  ctx.strokeStyle = '#ffd166';
  ctx.setLineDash([18, 22]);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h);
  ctx.lineTo(w * 0.5, h * 0.72);
  ctx.stroke();
  ctx.setLineDash([]);

  // A convertible silhouette rolling down the road.
  ctx.fillStyle = '#12081f';
  const carY = h * 0.86;
  const carW = w * 0.2;
  const carX = w * 0.5 - carW / 2;
  ctx.beginPath();
  ctx.moveTo(carX, carY);
  ctx.lineTo(carX + carW * 0.08, carY - h * 0.045);
  ctx.lineTo(carX + carW * 0.3, carY - h * 0.075);
  ctx.lineTo(carX + carW * 0.68, carY - h * 0.075);
  ctx.lineTo(carX + carW * 0.92, carY - h * 0.045);
  ctx.lineTo(carX + carW, carY);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(carX + carW * 0.22, carY, carW * 0.075, 0, Math.PI * 2);
  ctx.arc(carX + carW * 0.78, carY, carW * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(carX + carW * 0.02, carY - h * 0.012, 5, 4);
  ctx.fillRect(carX + carW * 0.96, carY - h * 0.012, 5, 4);

  palm(ctx, w * 0.06, h * 0.74, 1.05, 1, '#12081f');
  palm(ctx, w * 0.94, h * 0.74, 0.95, -1, '#12081f');
  gulls(ctx, w, h, rand, 5, 0.25);
}

// Scene two: Rooftop Neon. A night rooftop above the city: water tower,
// glowing signs, searchlight beams sweeping a starry sky.
export function paintRooftop(ctx, w, h) {
  const rand = seeded(777001);
  skyGradient(ctx, w, h, [
    [0, '#060a24'],
    [0.5, '#141b4a'],
    [0.8, '#3b2a6e'],
    [1, '#6e2f74'],
  ]);
  stars(ctx, w, h, rand, 90, 0.5);
  const moon = ctx.createRadialGradient(w * 0.78, h * 0.16, 4, w * 0.78, h * 0.16, h * 0.16);
  moon.addColorStop(0, 'rgba(240, 244, 255, 0.9)');
  moon.addColorStop(0.25, 'rgba(220, 228, 255, 0.55)');
  moon.addColorStop(1, 'rgba(220, 228, 255, 0)');
  ctx.fillStyle = moon;
  ctx.fillRect(w * 0.6, 0, w * 0.36, h * 0.32);
  ctx.fillStyle = '#eef1ff';
  ctx.beginPath();
  ctx.arc(w * 0.78, h * 0.16, h * 0.055, 0, Math.PI * 2);
  ctx.fill();

  buildingRow(ctx, w, h * 0.62, rand, h * 0.12, h * 0.34, '#0d1030', 0.55);
  buildingRow(ctx, w, h * 0.7, rand, h * 0.08, h * 0.2, '#080a20', 0.7);

  // Searchlight beams sweeping up from the rooftops.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [bx, tilt, color] of [
    [w * 0.2, -0.5, 'rgba(120, 220, 255, 0.16)'],
    [w * 0.82, 0.42, 'rgba(255, 120, 200, 0.14)'],
  ]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(bx, h * 0.68);
    ctx.lineTo(bx + tilt * h * 0.5, 0);
    ctx.lineTo(bx + tilt * h * 0.5 + w * 0.09, 0);
    ctx.lineTo(bx + w * 0.02, h * 0.68);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // The rooftop slab in the foreground.
  ctx.fillStyle = '#0a0c22';
  ctx.fillRect(0, h * 0.68, w, h * 0.32);
  ctx.fillStyle = '#141736';
  ctx.fillRect(0, h * 0.68, w, 6);

  // Water tower: legs, tank and cone roof.
  const tx = w * 0.68;
  const ty = h * 0.68;
  ctx.strokeStyle = '#1c2044';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(tx - w * 0.05, ty);
  ctx.lineTo(tx - w * 0.03, ty - h * 0.16);
  ctx.moveTo(tx + w * 0.05, ty);
  ctx.lineTo(tx + w * 0.03, ty - h * 0.16);
  ctx.stroke();
  ctx.fillStyle = '#23264e';
  ctx.beginPath();
  ctx.ellipse(tx, ty - h * 0.2, w * 0.055, h * 0.075, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2e3260';
  ctx.beginPath();
  ctx.moveTo(tx - w * 0.055, ty - h * 0.2);
  ctx.lineTo(tx, ty - h * 0.3);
  ctx.lineTo(tx + w * 0.055, ty - h * 0.2);
  ctx.closePath();
  ctx.fill();

  // Neon signs with a hot glow.
  const sign = (x, y, sw, sh, color, word) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 22;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, sw, sh);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0c22';
    ctx.font = `900 ${Math.round(sh * 0.52)}px "Arial Black", "Noto Sans Display", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, x + sw / 2, y + sh / 2 + 1);
    ctx.restore();
  };
  sign(w * 0.14, h * 0.74, w * 0.16, h * 0.07, '#ff2e88', 'NEON');
  sign(w * 0.34, h * 0.8, w * 0.13, h * 0.055, '#22d3ee', '24H');

  // Antenna with a red beacon.
  ctx.strokeStyle = '#1c2044';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(w * 0.52, h * 0.68);
  ctx.lineTo(w * 0.52, h * 0.5);
  ctx.stroke();
  ctx.fillStyle = '#ff3355';
  ctx.beginPath();
  ctx.arc(w * 0.52, h * 0.49, 5, 0, Math.PI * 2);
  ctx.fill();
  gulls(ctx, w, h, rand, 4, 0.3);
}

// Scene three: Ocean Pier. A pier reaching over a glowing sea toward a
// ferris wheel, under a low sun and a teal-to-peach sky.
export function paintPier(ctx, w, h) {
  const rand = seeded(424242);
  skyGradient(ctx, w, h, [
    [0, '#0e3a5c'],
    [0.45, '#2a7d8c'],
    [0.68, '#f2a65e'],
    [1, '#ffd9a0'],
  ]);
  const sunR = Math.min(w, h) * 0.16;
  const sun = ctx.createLinearGradient(0, h * 0.3, 0, h * 0.62);
  sun.addColorStop(0, '#fff3c4');
  sun.addColorStop(1, '#ff7a4d');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(w * 0.62, h * 0.48, sunR, 0, Math.PI * 2);
  ctx.fill();

  // The sea: dark teal bands with a glittering sun path.
  const sea = ctx.createLinearGradient(0, h * 0.58, 0, h);
  sea.addColorStop(0, '#2a7d8c');
  sea.addColorStop(0.5, '#14455f');
  sea.addColorStop(1, '#0a2438');
  ctx.fillStyle = sea;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 46; i += 1) {
    const y = h * 0.6 + rand() * h * 0.36;
    const spread = (y - h * 0.58) / (h * 0.42);
    const cx = w * 0.62 + (rand() - 0.5) * w * 0.34 * spread;
    ctx.fillStyle = rand() > 0.4 ? '#ffd9a0' : '#ff9a5c';
    ctx.fillRect(cx, y, 14 + rand() * 42, 2.5);
  }
  ctx.restore();

  // Ferris wheel silhouette on the right horizon.
  const fx = w * 0.82;
  const fy = h * 0.5;
  const fr = h * 0.17;
  ctx.strokeStyle = '#12283e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(fx, fy, fr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr);
    ctx.stroke();
  }
  ctx.fillStyle = '#12283e';
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(fx + Math.cos(a) * fr, fy + Math.sin(a) * fr, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(fx - fr * 0.35, h * 0.62);
  ctx.lineTo(fx, fy);
  ctx.lineTo(fx + fr * 0.35, h * 0.62);
  ctx.stroke();

  // The pier: planks in perspective, posts and a rail.
  ctx.fillStyle = '#1d2f42';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.3, h * 0.62);
  ctx.lineTo(w * 0.52, h * 0.62);
  ctx.lineTo(w * 0.34, h);
  ctx.closePath();
  ctx.fill();
  // Plank seams across the pier, widening toward the viewer. The pier is
  // a trapezoid: top edge (0.30w, 0.62h)-(0.52w, 0.62h), bottom edge
  // (0, h)-(0.34w, h). A seam at depth s spans the two sloping edges.
  ctx.strokeStyle = '#0e1c2b';
  ctx.lineWidth = 2;
  for (let i = 1; i <= 8; i += 1) {
    const s = i / 8;
    const y = h * 0.62 + h * 0.38 * s * s;
    const leftX = w * 0.3 * (1 - s);
    const rightX = w * 0.52 - w * 0.18 * s;
    ctx.beginPath();
    ctx.moveTo(leftX, y);
    ctx.lineTo(rightX, y);
    ctx.stroke();
  }
  // Posts along the right edge of the pier.
  ctx.fillStyle = '#16283a';
  for (let i = 0; i < 6; i += 1) {
    const s = i / 5;
    const y = h * 0.62 + h * 0.38 * s * s;
    const x = w * 0.52 - w * 0.18 * s;
    ctx.fillRect(x - 3, y - h * 0.035, 6, h * 0.035);
  }
  gulls(ctx, w, h, rand, 6, 0.22);
}

// Paint a scene by id into a fresh canvas of the requested size.
export function paintScene(id, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(2, Math.round(w));
  canvas.height = Math.max(2, Math.round(h));
  const ctx = canvas.getContext('2d');
  if (id === 'rooftop') paintRooftop(ctx, canvas.width, canvas.height);
  else if (id === 'pier') paintPier(ctx, canvas.width, canvas.height);
  else paintStrip(ctx, canvas.width, canvas.height);
  return canvas;
}
