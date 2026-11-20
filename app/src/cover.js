// Renders the poster for Neon Sunset Cover Maker v2.
//
// A poster is built from three ingredients: up to three photos (uploads or
// the runtime-drawn sample scenes), a panel layout, and a colour grade.
// The caption sits in a dark band across the foot: a small kicker, the big
// title in heavy system lettering, and a place line. Everything is drawn
// with the canvas 2D API onto the canvas handed in, at that canvas's own
// pixel size, so the same code draws the live preview and the export.

export const EXPORT_SIZES = {
  square: { w: 1080, h: 1080, label: "Square 1080 × 1080" },
  portrait: { w: 1080, h: 1350, label: "Portrait 1080 × 1350" },
  wide: { w: 1920, h: 1080, label: "Wide 1920 × 1080" },
};

export const LAYOUTS = {
  triptych: "Triptych — three panels",
  diptych: "Diptych — two panels",
  solo: "Solo — one photo",
};

export const GRADES = {
  sunset: "Sunset",
  vapor: "Vapor",
  noir: "Noir",
};

const DISPLAY_FACE = '"Arial Black", "Liberation Sans", Arial, sans-serif';
const BODY_FACE = '"Liberation Sans", Arial, "Helvetica Neue", sans-serif';
const GUTTER = 6;
const INK = "#0d0616";

// Where each panel sits, and which photo slot fills it.
function panelRects(layout, w, h) {
  if (layout === "diptych") {
    const split = Math.round(h * 0.6);
    return [
      { x: 0, y: 0, w, h: split, slot: 0 },
      { x: 0, y: split + GUTTER, w, h: h - split - GUTTER, slot: 1 },
    ];
  }
  if (layout === "solo") {
    return [{ x: 0, y: 0, w, h, slot: 0 }];
  }
  const third = Math.round((w - GUTTER * 2) / 3);
  return [
    { x: 0, y: 0, w: third, h, slot: 0 },
    { x: third + GUTTER, y: 0, w: third, h, slot: 1 },
    { x: (third + GUTTER) * 2, y: 0, w: w - (third + GUTTER) * 2, h, slot: 2 },
  ];
}

// Draws one photo cover-fitting its rectangle, honouring the slot's zoom
// and drag offsets (fractions of the rectangle, centred on 0).
function paintPhoto(ctx, image, rect, framing) {
  const iw = image.naturalWidth || image.width;
  const ih = image.naturalHeight || image.height;
  const zoom = framing?.zoom ?? 1;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const cx = rect.x + rect.w / 2 + (framing?.dx ?? 0) * rect.w;
  const cy = rect.y + rect.h / 2 + (framing?.dy ?? 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
  ctx.restore();
}

// An empty slot still has to look deliberate: a dusk gradient and a label.
function paintEmptySlot(ctx, rect, label) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  g.addColorStop(0, "#2a1544");
  g.addColorStop(1, "#12081f");
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.strokeRect(rect.x + 14, rect.y + 14, rect.w - 28, rect.h - 28);
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
  ctx.font = `700 ${Math.max(14, rect.w * 0.045)}px ${BODY_FACE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2);
}

// The colour grade: a wash over the whole poster plus a vignette.
function paintGrade(ctx, w, h, grade) {
  let wash;
  if (grade === "vapor") {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, "rgba(34, 211, 238, 0.20)");
    wash.addColorStop(0.55, "rgba(120, 60, 200, 0.10)");
    wash.addColorStop(1, "rgba(255, 46, 136, 0.28)");
  } else if (grade === "noir") {
    wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, "rgba(10, 10, 26, 0.25)");
    wash.addColorStop(1, "rgba(5, 5, 12, 0.45)");
  } else {
    wash = ctx.createLinearGradient(0, h * 0.3, 0, h);
    wash.addColorStop(0, "rgba(255, 120, 80, 0)");
    wash.addColorStop(1, "rgba(200, 40, 120, 0.42)");
  }
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, "rgba(0, 0, 0, 0)");
  vig.addColorStop(1, "rgba(0, 0, 0, 0.38)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
}

// Breaks a title into at most two lines that fit the width at the size.
function wrapTitle(ctx, text, maxWidth, size) {
  ctx.font = `900 ${size}px ${DISPLAY_FACE}`;
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width <= maxWidth || !current) {
      current = trial;
    } else {
      lines.push(current);
      current = word;
    }
    if (lines.length === 2) break;
  }
  if (current && lines.length < 2) lines.push(current);
  return lines;
}

// The caption band: kicker, heavy title, place line, over a dark gradient.
function paintCaption(ctx, w, h, words) {
  const bandH = h * 0.27;
  const bandY = h - bandH;
  const shade = ctx.createLinearGradient(0, bandY - h * 0.06, 0, h);
  shade.addColorStop(0, "rgba(5, 2, 10, 0)");
  shade.addColorStop(0.35, "rgba(5, 2, 10, 0.82)");
  shade.addColorStop(1, "rgba(5, 2, 10, 0.94)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, bandY - h * 0.06, w, bandH + h * 0.06);
  // Neon rule above the kicker.
  ctx.fillStyle = "#ff2e88";
  ctx.fillRect(w * 0.06, bandY + bandH * 0.1, w * 0.1, Math.max(3, h * 0.004));
  const pad = w * 0.06;
  const inner = w - pad * 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const kicker = (words.kicker || "").trim().toUpperCase();
  if (kicker) {
    const kSize = Math.max(16, h * 0.026);
    ctx.font = `700 ${kSize}px ${BODY_FACE}`;
    ctx.fillStyle = "#ff8ac2";
    ctx.fillText(kicker.split("").join("  "), pad, bandY + bandH * 0.26);
  }
  const title = (words.title || "").trim().toUpperCase();
  if (title) {
    let size = h * 0.105;
    let lines = wrapTitle(ctx, title, inner, size);
    // Shrink until the title fits the width AND its lines fit the band
    // above the place line (two lines need real room, not an overlap).
    while (
      size > h * 0.04 &&
      (lines.length > 2 ||
        (lines[0] && ctx.measureText(lines[0]).width > inner) ||
        lines.length * size * 1.02 > bandH * 0.58)
    ) {
      size -= h * 0.004;
      lines = wrapTitle(ctx, title, inner, size);
    }
    ctx.font = `900 ${size}px ${DISPLAY_FACE}`;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.04;
    const lineH = size * 1.02;
    const firstY = bandY + bandH * 0.32 + size * 0.9;
    lines.slice(0, 2).forEach((line, i) => {
      ctx.fillText(line, pad, firstY + i * lineH);
    });
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    const place = (words.place || "").trim().toUpperCase();
    if (place) {
      const pSize = Math.max(14, h * 0.022);
      ctx.font = `700 ${pSize}px ${BODY_FACE}`;
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.fillText(place.split("").join("  "), pad, bandY + bandH * 0.92);
    }
  }
}

/**
 * Draws the whole poster onto `canvas` from a state object:
 * { size, layout, grade, photos, framings, kicker, title, place }.
 * photos holds one image or canvas per slot (or null); framings holds one
 * { zoom, dx, dy } per slot. The canvas is resized to the export size.
 */
export function renderPoster(canvas, state) {
  const size = EXPORT_SIZES[state.size] ?? EXPORT_SIZES.square;
  canvas.width = size.w;
  canvas.height = size.h;
  const ctx = canvas.getContext("2d");
  const w = size.w;
  const h = size.h;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, w, h);
  const panels = panelRects(state.layout ?? "triptych", w, h);
  panels.forEach((panel, i) => {
    const photo = state.photos?.[panel.slot] ?? null;
    if (photo) {
      paintPhoto(ctx, photo, panel, state.framings?.[panel.slot]);
    } else {
      paintEmptySlot(ctx, panel, `PHOTO ${i + 1}`);
    }
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = Math.max(2, w * 0.002);
    ctx.strokeRect(panel.x + 1, panel.y + 1, panel.w - 2, panel.h - 2);
  });
  paintGrade(ctx, w, h, state.grade ?? "sunset");
  paintCaption(ctx, w, h, {
    kicker: state.kicker,
    title: state.title,
    place: state.place,
  });
}
