// The cover renderer: turns a set of photos, a layout, a colour grade and
// a caption into one finished poster on a canvas. Everything here is
// geometry and paint — no DOM, no network — so the editor preview, the
// screenshot scenes and the PNG export all draw through this one function
// and always agree with each other.

export const LAYOUTS = ['triptych', 'quad', 'split', 'solo'];
export const GRADES = ['sunset', 'ember', 'midnight'];
export const SIZES = {
  square: { w: 1080, h: 1080, label: 'Square 1080 x 1080' },
  portrait: { w: 1080, h: 1350, label: 'Portrait 1080 x 1350' },
  wide: { w: 1920, h: 1080, label: 'Wide 1920 x 1080' },
};

export const DISPLAY_STACK = '"Arial Black", "Noto Sans Display", "Liberation Sans", Arial, sans-serif';
export const BODY_STACK = '"Liberation Sans", "Noto Sans", Arial, sans-serif';

// How many panels each layout shows, and where they sit inside the photo
// area (fractions of its width and height, gutters included).
export function panelRects(layout, areaW, areaH, gutter) {
  const g = gutter;
  if (layout === 'quad') {
    const cw = (areaW - g) / 2;
    const ch = (areaH - g) / 2;
    return [
      { x: 0, y: 0, w: cw, h: ch },
      { x: cw + g, y: 0, w: cw, h: ch },
      { x: 0, y: ch + g, w: cw, h: ch },
      { x: cw + g, y: ch + g, w: cw, h: ch },
    ];
  }
  if (layout === 'split') {
    const left = areaW * 0.62 - g / 2;
    const right = areaW - left - g;
    const rh = (areaH - g) / 2;
    return [
      { x: 0, y: 0, w: left, h: areaH },
      { x: left + g, y: 0, w: right, h: rh },
      { x: left + g, y: rh + g, w: right, h: rh },
    ];
  }
  if (layout === 'solo') return [{ x: 0, y: 0, w: areaW, h: areaH }];
  const pw = (areaW - g * 2) / 3;
  return [
    { x: 0, y: 0, w: pw, h: areaH },
    { x: pw + g, y: 0, w: pw, h: areaH },
    { x: (pw + g) * 2, y: 0, w: pw, h: areaH },
  ];
}

// Draw one photo into one panel with a cover fit: the photo fills the
// panel, cropped on the long side, with zoom and pan from the editor.
function paintPhoto(ctx, photo, rect) {
  const img = photo.img;
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const zoom = photo.zoom || 1;
  const px = photo.px ?? 0.5;
  const py = photo.py ?? 0.5;
  const scale = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rect.x + (rect.w - dw) * px;
  const dy = rect.y + (rect.h - dh) * py;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// A colour grade is a translucent wash laid over the photos plus a
// vignette that darkens the corners, so every panel shares one mood.
function paintGrade(ctx, w, h, grade) {
  ctx.save();
  if (grade === 'ember') {
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255, 60, 30, 0.16)');
    wash.addColorStop(0.55, 'rgba(255, 110, 20, 0.10)');
    wash.addColorStop(1, 'rgba(120, 10, 40, 0.22)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 140, 40, 0.12)';
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'midnight') {
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(40, 80, 255, 0.18)');
    wash.addColorStop(0.6, 'rgba(90, 40, 160, 0.12)');
    wash.addColorStop(1, 'rgba(10, 10, 60, 0.26)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(140, 180, 255, 0.14)';
    ctx.fillRect(0, 0, w, h);
  } else {
    const wash = ctx.createLinearGradient(0, 0, 0, h);
    wash.addColorStop(0, 'rgba(255, 120, 180, 0.10)');
    wash.addColorStop(0.5, 'rgba(255, 150, 60, 0.10)');
    wash.addColorStop(1, 'rgba(255, 80, 120, 0.16)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(255, 170, 80, 0.10)';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = 'source-over';
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.42,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vig.addColorStop(1, 'rgba(0, 0, 0, 0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, minPx, stack, weight) {
  let size = startPx;
  ctx.font = `${weight} ${size}px ${stack}`;
  while (size > minPx && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${stack}`;
  }
  return size;
}

function spacedText(ctx, text, x, y, spacing) {
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + spacing;
  }
  return cx - x - spacing;
}

// The caption band: a dark strip with a neon top edge, a letterspaced
// kicker, one big auto-fitting title line and a place line underneath.
function paintCaption(ctx, w, bandY, bandH, caption) {
  const { kicker, title, place } = caption;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  band.addColorStop(0, 'rgba(12, 8, 24, 0.96)');
  band.addColorStop(1, 'rgba(24, 10, 40, 0.96)');
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, bandH);
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, bandY, w, Math.max(3, bandH * 0.03));

  const pad = w * 0.045;
  const inner = w - pad * 2;
  let y = bandY + bandH * 0.24;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const kickerSize = Math.max(14, bandH * 0.13);
  ctx.font = `700 ${kickerSize}px ${BODY_STACK}`;
  ctx.fillStyle = '#22d3ee';
  spacedText(ctx, (kicker || '').toUpperCase(), pad, y, kickerSize * 0.28);

  const titleSize = fitFont(
    ctx,
    (title || '').toUpperCase(),
    inner,
    bandH * 0.44,
    Math.max(18, bandH * 0.16),
    DISPLAY_STACK,
    900,
  );
  y += bandH * 0.42;
  ctx.font = `900 ${titleSize}px ${DISPLAY_STACK}`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = titleSize * 0.22;
  ctx.fillText((title || '').toUpperCase(), pad, y);
  ctx.shadowBlur = 0;

  const placeSize = Math.max(13, bandH * 0.12);
  ctx.font = `700 ${placeSize}px ${BODY_STACK}`;
  ctx.fillStyle = '#ffb347';
  spacedText(ctx, (place || '').toUpperCase(), pad, y + bandH * 0.24, placeSize * 0.3);
}

// Render a whole cover. photos is an array of {img, zoom, px, py} in slot
// order; layouts with more panels than photos repeat the photos.
export function renderCover(canvas, opts) {
  const { photos, layout, grade, kicker, title, place } = opts;
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const bandH = Math.round(h * 0.19);
  const photoH = h - bandH;
  const gutter = Math.max(4, Math.round(w * 0.008));
  const rects = panelRects(layout, w, photoH, gutter);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, photoH);
  rects.forEach((rect, i) => {
    const photo = photos[i % photos.length];
    if (photo) paintPhoto(ctx, photo, rect);
  });

  // White gutters and a thin frame around the photo area.
  ctx.fillStyle = '#ffffff';
  for (const rect of rects) {
    ctx.fillRect(rect.x - gutter / 2, rect.y, gutter / 2, rect.h);
    ctx.fillRect(rect.x + rect.w, rect.y, gutter / 2, rect.h);
  }
  ctx.fillRect(0, 0, w, gutter / 2);
  ctx.fillRect(0, photoH - gutter / 2, w, gutter / 2);
  paintGrade(ctx, w, photoH, grade);
  paintCaption(ctx, w, photoH, bandH, { kicker, title, place });
  return canvas;
}
