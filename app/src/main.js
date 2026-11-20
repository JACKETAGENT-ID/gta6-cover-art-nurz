// Neon Sunset Cover Maker — the editor glue: photos in, caption typed, panels
// arranged, PNG out. The visitor's photos never leave their machine. Lettering
// is heavy system sans (see cover.js), so there is no font file to load; the
// sample scenes are drawn on a canvas at click time (see samples.js), so no
// sample photo file ships with the app either. A `?shot=` query arranges a
// fixed scene for a screenshot (see shots.js).
import { drawCover, panelLayout } from './cover.js';
import { makeSampleScene, SAMPLE_NAMES } from './samples.js';

/** The three post sizes the app exports, in pixels. */
const POST_SIZES = {
  square: [1080, 1080],
  portrait: [1080, 1350],
  landscape: [1920, 1080],
};

const canvas = document.getElementById('cover');
const captionField = document.getElementById('caption');
const subtitleField = document.getElementById('subtitle');
const gradeField = document.getElementById('grade');
const zoomField = document.getElementById('zoom');
const statusLine = document.getElementById('status');

/** Everything drawCover needs: three photo slots, which photo each panel
 *  shows, zoom and focus per panel, the words, the grade, the post size. */
const editor = {
  photos: [null, null, null],
  panelPhotos: [0, 0, 0],
  zooms: [1, 1, 1],
  focus: [{ x: 0.5, y: 0.4 }, { x: 0.5, y: 0.4 }, { x: 0.5, y: 0.4 }],
  caption: captionField.value,
  subtitle: subtitleField.value,
  grade: gradeField.value,
  size: 'square',
};

/** Which panel the zoom slider and the drag gesture currently steer. */
let activePanel = 0;

function repaint() {
  drawCover(canvas, editor);
}

/** Loads an image from a URL and resolves once it is drawable. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** System fonts need no loading; one ready-wait keeps the first paint honest. */
async function settleFonts() {
  await document.fonts.ready;
  repaint();
}

/** Switches the post size, resizes the live canvas, repaints. */
function pickSize(name) {
  editor.size = name;
  const [w, h] = POST_SIZES[name];
  canvas.width = w;
  canvas.height = h;
  for (const btn of document.querySelectorAll('.size-btn')) {
    btn.classList.toggle('active', btn.id === `size-${name}`);
  }
  repaint();
}

/** Puts a loaded image into a photo slot and resets every zoom. */
async function placePhoto(slot, url, label) {
  try {
    editor.photos[slot] = await loadImage(url);
    editor.zooms = editor.zooms.map(() => 1);
    statusLine.textContent = `${label} loaded into Photo ${slot + 1}.`;
    repaint();
  } catch {
    statusLine.textContent = `Could not load ${label}.`;
  }
}

/** Draws a named sample scene into a photo slot (a canvas, not a file). */
function placeSample(slot, name) {
  editor.photos[slot] = makeSampleScene(name);
  editor.zooms = editor.zooms.map(() => 1);
  statusLine.textContent = `${name} sample drawn into Photo ${slot + 1}.`;
  repaint();
}

/** Drawn size of an image or canvas cover-filling `rect` at a zoom. */
function fitSize(img, rect, zoom) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const rw = rect[2] - rect[0];
  const rh = rect[3] - rect[1];
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  return [iw * scale, ih * scale, rw, rh];
}

/** Which panel a pointer position on the preview falls in, if any. */
function panelAt(clientX, clientY) {
  const box = canvas.getBoundingClientRect();
  const x = ((clientX - box.left) / box.width) * canvas.width;
  const y = ((clientY - box.top) / box.height) * canvas.height;
  const { panels } = panelLayout(canvas.width, canvas.height);
  const i = panels.findIndex(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
  return i === -1 ? null : { index: i, x, y };
}

/** Wires every control once the page is up. */
function bindEditor() {
  for (let slot = 0; slot < 3; slot++) {
    document.getElementById(`photo${slot}`).addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) placePhoto(slot, URL.createObjectURL(file), file.name);
    });
  }

  for (const name of SAMPLE_NAMES) {
    document.getElementById(`sample-${name}`).addEventListener('click', () => {
      placeSample(0, name);
    });
  }

  for (let i = 0; i < 3; i++) {
    document.getElementById(`panel${i}`).addEventListener('change', (e) => {
      editor.panelPhotos[i] = Number(e.target.value);
      activePanel = i;
      zoomField.value = Math.round(editor.zooms[i] * 100);
      repaint();
    });
  }

  zoomField.addEventListener('input', () => {
    editor.zooms[activePanel] = Number(zoomField.value) / 100;
    repaint();
  });

  captionField.addEventListener('input', () => { editor.caption = captionField.value; repaint(); });
  subtitleField.addEventListener('input', () => { editor.subtitle = subtitleField.value; repaint(); });
  gradeField.addEventListener('change', () => { editor.grade = gradeField.value; repaint(); });

  for (const name of Object.keys(POST_SIZES)) {
    document.getElementById(`size-${name}`).addEventListener('click', () => pickSize(name));
  }

  document.getElementById('export').addEventListener('click', () => {
    const [w, h] = POST_SIZES[editor.size];
    const off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    drawCover(off, editor);
    off.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-sunset-cover-${w}x${h}.png`;
      a.click();
      statusLine.textContent = `Saved neon-sunset-cover-${w}x${h}.png`;
    }, 'image/png');
  });

  // Drag a panel on the preview to pan its photo inside the frame.
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const hit = panelAt(e.clientX, e.clientY);
    if (!hit) return;
    activePanel = hit.index;
    zoomField.value = Math.round(editor.zooms[hit.index] * 100);
    statusLine.textContent = `Panel ${'ABC'[hit.index]} selected — drag to pan, slider to zoom.`;
    canvas.setPointerCapture(e.pointerId);
    drag = { panel: hit.index, x: hit.x, y: hit.y };
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const hit = panelAt(e.clientX, e.clientY);
    if (!hit) return;
    const { panels } = panelLayout(canvas.width, canvas.height);
    const rect = panels[drag.panel];
    const img = editor.photos[editor.panelPhotos[drag.panel]];
    if (!img) return;
    const [pw, ph, rw, rh] = fitSize(img, rect, editor.zooms[drag.panel]);
    const f = editor.focus[drag.panel];
    if (pw > rw) f.x = Math.min(1, Math.max(0, f.x - (hit.x - drag.x) / (pw - rw)));
    if (ph > rh) f.y = Math.min(1, Math.max(0, f.y - (hit.y - drag.y) / (ph - rh)));
    drag.x = hit.x;
    drag.y = hit.y;
    repaint();
  });
  const endDrag = () => { drag = null; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
}

bindEditor();

// Screenshot mode: ?shot= arranges a fixed scene, then flags readiness.
const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  await settleFonts();
  const { runShot } = await import('./shots.js');
  await runShot(shot, params, {
    loadSamples: async (names) => {
      for (let i = 0; i < names.length && i < 3; i++) {
        editor.photos[i] = makeSampleScene(names[i]);
        editor.panelPhotos[i] = i;
        document.getElementById(`panel${i}`).value = String(i);
      }
    },
    setCaption: (text) => { editor.caption = text; captionField.value = text; },
    setSubtitle: (text) => { editor.subtitle = text; subtitleField.value = text; },
    setGrade: (g) => { editor.grade = g; gradeField.value = g; },
    setSize: (name) => pickSize(name),
    redraw: repaint,
  });
} else {
  settleFonts();
  repaint();
}
