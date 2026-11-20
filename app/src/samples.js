// Sample scenes for Neon Sunset Cover Maker v2.
//
// The three sample photos are not image files: each one is painted onto a
// canvas at run time, here, with plain 2D drawing calls, so the app ships
// no photo files at all and works with no network request. Every scene is
// deterministic: the same seed always paints the same picture, which keeps
// the screenshots reproducible. The scenes are original drawings — a
// harbour at dusk, a neon alley, a coastal freeway — not game artwork.

export const SCENE_NAMES = ["marina", "alley", "freeway"];

export const SCENE_LABELS = {
  marina: "Harbor Lights",
  alley: "Neon Alley",
  freeway: "Skyline Drive",
};

// Small deterministic generator so a scene never changes between loads.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function verticalFade(ctx, w, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, color] of stops) g.addColorStop(at, color);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function disc(ctx, x, y, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function flock(ctx, rnd, w, h, count, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.lineCap = "round";
  for (let i = 0; i < count; i++) {
    const x = w * (0.08 + rnd() * 0.84);
    const y = h * (0.06 + rnd() * 0.22);
    const s = w * (0.012 + rnd() * 0.012);
    ctx.beginPath();
    ctx.moveTo(x - s, y);
    ctx.quadraticCurveTo(x - s * 0.4, y - s * 0.7, x, y);
    ctx.quadraticCurveTo(x + s * 0.4, y - s * 0.7, x + s, y);
    ctx.stroke();
  }
}

function palmTree(ctx, x, y, size, color, rnd) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, size * 0.06);
  ctx.lineCap = "round";
  const lean = (rnd() - 0.5) * size * 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.4, y - size * 0.6, x + lean, y - size);
  ctx.stroke();
  const topX = x + lean;
  const topY = y - size;
  for (let i = 0; i < 7; i++) {
    const a = (-Math.PI * 0.15) - (i / 6) * Math.PI * 0.7 + (rnd() - 0.5) * 0.2;
    const len = size * (0.42 + rnd() * 0.2);
    ctx.lineWidth = Math.max(2, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(
      topX + Math.cos(a) * len * 0.6,
      topY + Math.sin(a) * len * 0.5 - size * 0.12,
      topX + Math.cos(a) * len,
      topY + Math.sin(a) * len + size * 0.18,
    );
    ctx.stroke();
  }
}

function cityRow(ctx, baseY, w, h, rnd, color, lit) {
  ctx.fillStyle = color;
  let x = 0;
  while (x < w) {
    const bw = w * (0.04 + rnd() * 0.09);
    const bh = h * (0.05 + rnd() * 0.16);
    ctx.fillRect(x, baseY - bh, bw, bh);
    if (rnd() < 0.5) {
      ctx.fillRect(x + bw * 0.3, baseY - bh - h * 0.03, bw * 0.08, h * 0.03);
    }
    if (lit) {
      for (let k = 0; k < 5; k++) {
        if (rnd() < 0.4) {
          ctx.fillStyle = "rgba(255, 214, 130, 0.85)";
          ctx.fillRect(
            x + bw * (0.15 + rnd() * 0.6),
            baseY - bh * (0.2 + rnd() * 0.7),
            Math.max(2, w * 0.006),
            Math.max(2, h * 0.008),
          );
          ctx.fillStyle = color;
        }
      }
    }
    x += bw + w * 0.008;
  }
}

// --- Marina: harbour at dusk, yachts under a slatted synthwave sun. ---
function paintMarina(ctx, w, h, rnd) {
  verticalFade(ctx, w, h, [
    [0, "#170b33"],
    [0.42, "#7a1e5e"],
    [0.62, "#ff7a3d"],
    [0.68, "#ffd27a"],
    [1, "#1a0b2e"],
  ]);
  const horizon = h * 0.62;
  // Sun with horizontal slats cut out of its lower half.
  const sunX = w * 0.5;
  const sunY = h * 0.5;
  const sunR = w * 0.17;
  ctx.save();
  ctx.shadowColor = "rgba(255, 150, 80, 0.9)";
  ctx.shadowBlur = w * 0.05;
  disc(ctx, sunX, sunY, sunR, "#ffdf8a");
  ctx.restore();
  ctx.fillStyle = "#ff7a3d";
  let barY = sunY + sunR * 0.05;
  let barH = h * 0.006;
  while (barY < sunY + sunR) {
    ctx.fillRect(sunX - sunR, barY, sunR * 2, barH);
    barY += barH + h * 0.016;
    barH += h * 0.004;
  }
  cityRow(ctx, horizon, w, h, rnd, "#1c0b31", true);
  flock(ctx, rnd, w, h, 4, "rgba(20, 8, 40, 0.9)");
  // Water: dark base, then orange shimmer strokes.
  const water = ctx.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(0, "#3a1450");
  water.addColorStop(1, "#12081f");
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon, w, h - horizon);
  for (let i = 0; i < 90; i++) {
    const y = horizon + rnd() * (h - horizon);
    const len = w * (0.02 + rnd() * 0.12);
    ctx.strokeStyle = `rgba(255, ${140 + Math.floor(rnd() * 90)}, 90, ${0.12 + rnd() * 0.3})`;
    ctx.lineWidth = Math.max(1, h * 0.002);
    ctx.beginPath();
    ctx.moveTo(w * rnd(), y);
    ctx.lineTo(w * rnd() + len, y);
    ctx.stroke();
  }
  // Two yachts: hull, mast and a lit sail each.
  for (const [fx, fs] of [[0.24, 1], [0.68, 0.75]]) {
    const hx = w * fx;
    const hy = h * 0.78;
    const s = w * 0.09 * fs;
    ctx.fillStyle = "#0d0618";
    ctx.beginPath();
    ctx.moveTo(hx - s, hy);
    ctx.lineTo(hx + s, hy);
    ctx.lineTo(hx + s * 0.72, hy + s * 0.28);
    ctx.lineTo(hx - s * 0.72, hy + s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#0d0618";
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx, hy - s * 1.5);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 179, 122, 0.92)";
    ctx.beginPath();
    ctx.moveTo(hx, hy - s * 1.45);
    ctx.lineTo(hx + s * 0.55, hy - s * 0.08);
    ctx.lineTo(hx, hy - s * 0.08);
    ctx.closePath();
    ctx.fill();
    // Reflection streak under the hull.
    ctx.strokeStyle = "rgba(255, 150, 90, 0.35)";
    ctx.lineWidth = Math.max(2, w * 0.005);
    ctx.beginPath();
    ctx.moveTo(hx - s * 0.4, hy + s * 0.4);
    ctx.lineTo(hx + s * 0.4, hy + s * 0.4);
    ctx.stroke();
  }
  // String lights sagging across the top of the frame.
  ctx.strokeStyle = "rgba(255, 220, 150, 0.5)";
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.beginPath();
  ctx.moveTo(0, h * 0.1);
  ctx.quadraticCurveTo(w * 0.5, h * 0.2, w, h * 0.08);
  ctx.stroke();
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    const x = w * t;
    const y = h * (0.1 + 0.09 * Math.sin(t * Math.PI) * 0.9 - 0.02 * t);
    ctx.save();
    ctx.shadowColor = "#ffd27a";
    ctx.shadowBlur = w * 0.012;
    disc(ctx, x, y, Math.max(2, w * 0.005), "#ffe9a8");
    ctx.restore();
  }
}

// --- Alley: a wet back alley glowing with neon signs. ---
function paintAlley(ctx, w, h, rnd) {
  verticalFade(ctx, w, h, [
    [0, "#0c091f"],
    [0.55, "#221040"],
    [1, "#0a0618"],
  ]);
  // Brick side walls.
  const wall = (x0, x1) => {
    ctx.fillStyle = "#241233";
    ctx.fillRect(x0, 0, x1 - x0, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    for (let y = h * 0.03; y < h; y += h * 0.045) {
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }
    for (let y = 0, row = 0; y < h; y += h * 0.045, row++) {
      for (let x = x0 + (row % 2 ? (x1 - x0) / 4 : 0); x < x1; x += (x1 - x0) / 2) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + h * 0.045);
        ctx.stroke();
      }
    }
  };
  wall(0, w * 0.28);
  wall(w * 0.74, w);
  // Far glow at the end of the alley.
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, w * 0.5);
  glow.addColorStop(0, "rgba(255, 46, 136, 0.55)");
  glow.addColorStop(0.5, "rgba(120, 60, 200, 0.25)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(w * 0.28, 0, w * 0.46, h);
  // Neon sign boxes: pink on the left wall, cyan on the right.
  const neonBox = (x, y, bw, bh, color) => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = w * 0.03;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, bw, bh);
    ctx.restore();
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + bw * 0.14, y + bh * (0.2 + i * 0.28), bw * 0.72, Math.max(2, bh * 0.1));
    }
  };
  neonBox(w * 0.05, h * 0.14, w * 0.17, h * 0.2, "#ff2e88");
  neonBox(w * 0.79, h * 0.3, w * 0.15, h * 0.26, "#22d3ee");
  // Round neon sign on the left wall.
  ctx.save();
  ctx.shadowColor = "#ffb03d";
  ctx.shadowBlur = w * 0.025;
  ctx.strokeStyle = "#ffb03d";
  ctx.lineWidth = Math.max(3, w * 0.008);
  ctx.beginPath();
  ctx.arc(w * 0.14, h * 0.52, w * 0.06, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // A lit doorway at the far end of the alley: the focal point that stays
  // visible even when the scene is cropped to a narrow panel.
  ctx.save();
  ctx.shadowColor = "#ffd27a";
  ctx.shadowBlur = w * 0.02;
  ctx.fillStyle = "#ffd27a";
  ctx.fillRect(w * 0.46, h * 0.34, w * 0.08, h * 0.34);
  ctx.restore();
  ctx.fillStyle = "rgba(20, 8, 32, 0.85)";
  ctx.fillRect(w * 0.475, h * 0.4, w * 0.05, h * 0.28);
  const spill = ctx.createLinearGradient(0, h * 0.66, 0, h * 0.84);
  spill.addColorStop(0, "rgba(255, 210, 122, 0.35)");
  spill.addColorStop(1, "rgba(255, 210, 122, 0)");
  ctx.fillStyle = spill;
  ctx.beginPath();
  ctx.moveTo(w * 0.44, h * 0.68);
  ctx.lineTo(w * 0.56, h * 0.68);
  ctx.lineTo(w * 0.62, h * 0.84);
  ctx.lineTo(w * 0.38, h * 0.84);
  ctx.closePath();
  ctx.fill();
  // Hanging wire with bulbs across the top.
  ctx.strokeStyle = "rgba(200, 200, 220, 0.4)";
  ctx.lineWidth = Math.max(1, w * 0.002);
  ctx.beginPath();
  ctx.moveTo(w * 0.28, h * 0.06);
  ctx.quadraticCurveTo(w * 0.5, h * 0.16, w * 0.74, h * 0.05);
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const x = w * (0.28 + 0.46 * t);
    const y = h * (0.06 + 0.09 * Math.sin(t * Math.PI));
    disc(ctx, x, y + h * 0.02, Math.max(2, w * 0.006), "#ffe9a8");
  }
  // Wet pavement: dark floor with long neon reflections.
  const floorY = h * 0.68;
  ctx.fillStyle = "#150b26";
  ctx.fillRect(0, floorY, w, h - floorY);
  for (let i = 0; i < 26; i++) {
    const x = w * (0.3 + rnd() * 0.42);
    const len = h * (0.04 + rnd() * 0.16);
    const pink = rnd() < 0.55;
    const g = ctx.createLinearGradient(0, floorY, 0, floorY + len);
    g.addColorStop(0, pink ? "rgba(255, 46, 136, 0.5)" : "rgba(34, 211, 238, 0.45)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x, floorY, Math.max(2, w * 0.008), len);
  }
  // Puddles catching the light.
  for (let i = 0; i < 4; i++) {
    const x = w * (0.34 + rnd() * 0.34);
    const y = h * (0.74 + rnd() * 0.18);
    ctx.fillStyle = "rgba(150, 120, 255, 0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y, w * (0.05 + rnd() * 0.05), h * 0.012, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- Freeway: a coastal highway at golden hour, palms and skyline. ---
function paintFreeway(ctx, w, h, rnd) {
  verticalFade(ctx, w, h, [
    [0, "#2b1050"],
    [0.4, "#c23a6e"],
    [0.55, "#ff9a4d"],
    [0.62, "#ffd98a"],
    [1, "#1c1030"],
  ]);
  const horizon = h * 0.58;
  // Low sun, half sunk behind the skyline.
  ctx.save();
  ctx.shadowColor = "rgba(255, 220, 140, 0.9)";
  ctx.shadowBlur = w * 0.06;
  disc(ctx, w * 0.62, horizon - h * 0.02, w * 0.13, "#ffe9a8");
  ctx.restore();
  cityRow(ctx, horizon, w, h, rnd, "#200b38", true);
  flock(ctx, rnd, w, h, 5, "rgba(20, 8, 40, 0.9)");
  // The road: a trapezoid narrowing to the vanishing point.
  const vx = w * 0.5;
  const vy = horizon;
  ctx.fillStyle = "#1c1030";
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h);
  ctx.lineTo(vx - w * 0.02, vy);
  ctx.lineTo(vx + w * 0.02, vy);
  ctx.lineTo(w * 0.92, h);
  ctx.closePath();
  ctx.fill();
  // Edge lines and a dashed centre line shrinking toward the horizon.
  ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
  ctx.lineWidth = Math.max(2, w * 0.004);
  ctx.beginPath();
  ctx.moveTo(w * 0.1, h);
  ctx.lineTo(vx - w * 0.018, vy);
  ctx.moveTo(w * 0.9, h);
  ctx.lineTo(vx + w * 0.018, vy);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 214, 130, 0.9)";
  ctx.lineWidth = Math.max(3, w * 0.006);
  for (let i = 0; i < 7; i++) {
    const t0 = i / 7;
    const t1 = (i + 0.45) / 7;
    const y0 = h - (h - vy) * (1 - t0) * (1 - t0);
    const y1 = h - (h - vy) * (1 - t1) * (1 - t1);
    ctx.beginPath();
    ctx.moveTo(vx, y0);
    ctx.lineTo(vx, y1);
    ctx.stroke();
  }
  // Palms framing the road.
  palmTree(ctx, w * 0.12, h * 0.86, h * 0.3, "#12081f", rnd);
  palmTree(ctx, w * 0.88, h * 0.9, h * 0.34, "#12081f", rnd);
  palmTree(ctx, w * 0.3, h * 0.72, h * 0.16, "#1a0b2e", rnd);
  // Warm haze band above the road.
  const haze = ctx.createLinearGradient(0, horizon - h * 0.06, 0, horizon + h * 0.04);
  haze.addColorStop(0, "rgba(255, 200, 120, 0)");
  haze.addColorStop(0.5, "rgba(255, 200, 120, 0.18)");
  haze.addColorStop(1, "rgba(255, 200, 120, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, horizon - h * 0.06, w, h * 0.1);
}

const PAINTERS = { marina: paintMarina, alley: paintAlley, freeway: paintFreeway };
const SEEDS = { marina: 20261120, alley: 71113, freeway: 90210 };

/** Paints the named scene onto a fresh canvas of the given size and returns it. */
export function makeSceneCanvas(name, width = 1080, height = 1080) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const paint = PAINTERS[name] ?? PAINTERS.marina;
  paint(ctx, width, height, mulberry32(SEEDS[name] ?? 7));
  return canvas;
}
