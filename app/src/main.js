// Neon Sunset Cover Maker — wires the editor: photos in, caption typed, panels
// arranged, PNG out. Everything runs on the visitor's machine; photos are never
// uploaded. A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, panelLayout } from './cover.js';

const SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  landscape: [1920, 1080],
};

const canvas = document.getElementById('cover');
const captionInput = document.getElementById('caption');
const subtitleInput = document.getElementById('subtitle');
const gradeInput = document.getElementById('grade');
const zoomInput = document.getElementById('zoom');
const status = document.getElementById('status');

const state = {
  photos: [null, null, null],
  panelPhotos: [0, 0, 0],
  zooms: [1, 1, 1],
  focus: [{ x: 0.5, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 0.5, y: 0.4 }],
  caption: captionInput.value,
  subtitle: subtitleInput.value,
  grade: gradeInput.value,
  size: 'square',
};

let selectedPanel = 0;

function redraw() {
  drawCover(canvas, state);
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function loadFonts() {
  try {
    const display = new FontFace('Archivo Black', 'url(./fonts/ArchivoBlack-Regular.ttf)');
    const text = new FontFace('Oswald', 'url(./fonts/Oswald.ttf)', { weight: '200 700' });
    document.fonts.add(display);
    document.fonts.add(text);
    await Promise.all([display.load(), text.load()]);
  } catch {
    // The bundled fonts failed; the canvas falls back to system fonts.
  }
  redraw();
}

function setSize(name) {
  state.size = name;
  const [w, h] = SIZES[name];
  canvas.width = w;
  canvas.height = h;
  for (const btn of document.querySelectorAll('.size-btn')) {
    btn.classList.toggle('active', btn.id === `size-${name}`);
  }
  redraw();
}

async function setPhoto(slot, url, label) {
  try {
    state.photos[slot] = await loadImage(url);
    state.zooms = state.zooms.map(() => 1);
    status.textContent = `${label} loaded into Photo ${slot + 1}.`;
    redraw();
  } catch {
    status.textContent = `Could not load ${label}.`;
  }
}

for (let slot = 0; slot < 3; slot++) {
  document.getElementById(`photo${slot}`).addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(slot, URL.createObjectURL(file), file.name);
  });
}

const SAMPLES = { pier: 'pier', boulevard: 'boulevard', rider: 'rider' };
for (const [key, name] of Object.entries(SAMPLES)) {
  document.getElementById(`sample-${key}`).addEventListener('click', () => {
    setPhoto(0, `samples/${name}.jpg`, `${name} sample`);
  });
}

for (let i = 0; i < 3; i++) {
  document.getElementById(`panel${i}`).addEventListener('change', (e) => {
    state.panelPhotos[i] = Number(e.target.value);
    selectedPanel = i;
    zoomInput.value = Math.round(state.zooms[i] * 100);
    redraw();
  });
}

zoomInput.addEventListener('input', () => {
  state.zooms[selectedPanel] = Number(zoomInput.value) / 100;
  redraw();
});

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
gradeInput.addEventListener('change', () => { state.grade = gradeInput.value; redraw(); });

for (const name of Object.keys(SIZES)) {
  document.getElementById(`size-${name}`).addEventListener('click', () => setSize(name));
}

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-sunset-cover-${w}x${h}.png`;
    a.click();
    status.textContent = `Saved neon-sunset-cover-${w}x${h}.png`;
  }, 'image/png');
});

// Drag a panel on the preview to pan its photo inside the frame.
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const { panels } = panelLayout(canvas.width, canvas.height);
  const i = panels.findIndex(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  return i === -1 ? null : { index: i, x, y };
}

function photoDrawSize(img, rect, zoom) {
  const rw = rect[2] - rect[0];
  const rh = rect[3] - rect[1];
  const scale = Math.max(rw / img.naturalWidth, rh / img.naturalHeight) * zoom;
  return [img.naturalWidth * scale, img.naturalHeight * scale, rw, rh];
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  selectedPanel = hit.index;
  zoomInput.value = Math.round(state.zooms[hit.index] * 100);
  status.textContent = `Panel ${'ABC'[hit.index]} selected — drag to pan, slider to zoom.`;
  canvas.setPointerCapture(e.pointerId);
  drag = { panel: hit.index, x: hit.x, y: hit.y };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  const { panels } = panelLayout(canvas.width, canvas.height);
  const rect = panels[drag.panel];
  const img = state.photos[state.panelPhotos[drag.panel]];
  if (!img) return;
  const [pw, ph, rw, rh] = photoDrawSize(img, rect, state.zooms[drag.panel]);
  const f = state.focus[drag.panel];
  if (pw > rw) f.x = Math.min(1, Math.max(0, f.x - (hit.x - drag.x) / (pw - rw)));
  if (ph > rh) f.y = Math.min(1, Math.max(0, f.y - (hit.y - drag.y) / (ph - rh)));
  drag.x = hit.x;
  drag.y = hit.y;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointercancel', () => { drag = null; });

const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  await loadFonts();
  const { runShot } = await import('./shots.js');
  await runShot(shot, query, {
    loadSamples: async (urls) => {
      for (let i = 0; i < urls.length && i < 3; i++) {
        state.photos[i] = await loadImage(urls[i]);
        state.panelPhotos[i] = i;
        document.getElementById(`panel${i}`).value = String(i);
      }
    },
    setCaption: (text) => { state.caption = text; captionInput.value = text; },
    setSubtitle: (text) => { state.subtitle = text; subtitleInput.value = text; },
    setGrade: (g) => { state.grade = g; gradeInput.value = g; },
    setSize: (name) => setSize(name),
    redraw,
  });
} else {
  loadFonts();
  redraw();
}
