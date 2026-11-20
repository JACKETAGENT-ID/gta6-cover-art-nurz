// The editor: wires the controls in index.html to the cover renderer.
// State lives in one object; every control change updates the state and
// schedules one preview redraw. Photos are either a scene canvas painted
// by scenes.js or an image the user picked from their own machine — the
// renderer cannot tell the difference, which is the point.

import { renderCover, SIZES } from './cover.js';
import { paintScene, SCENE_IDS, SCENE_LABELS } from './scenes.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);

const state = {
  slots: [
    { scene: 'strip', img: null, zoom: 1, px: 0.5, py: 0.5 },
    { scene: 'rooftop', img: null, zoom: 1, px: 0.5, py: 0.5 },
    { scene: 'pier', img: null, zoom: 1, px: 0.5, py: 0.5 },
  ],
  activeSlot: 0,
  layout: 'triptych',
  grade: 'sunset',
  size: 'wide',
  kicker: 'Greetings from',
  title: 'Sunset Heist',
  place: 'Vice City',
};

function slotPhoto(slot) {
  if (slot.img) return { img: slot.img, zoom: slot.zoom, px: slot.px, py: slot.py };
  const canvas = paintScene(slot.scene, 900, 900);
  return { img: canvas, zoom: slot.zoom, px: slot.px, py: slot.py };
}

function previewPhotos() {
  return state.slots.map(slotPhoto);
}

let redrawQueued = false;
function redraw() {
  if (redrawQueued) return;
  redrawQueued = true;
  requestAnimationFrame(() => {
    redrawQueued = false;
    const size = SIZES[state.size];
    const preview = $('preview');
    preview.width = size.w;
    preview.height = size.h;
    renderCover(preview, {
      photos: previewPhotos(),
      layout: state.layout,
      grade: state.grade,
      kicker: state.kicker,
      title: state.title,
      place: state.place,
    });
    syncSlotCards();
  });
}

function syncSlotCards() {
  state.slots.forEach((slot, i) => {
    const card = $(`slot-${i}`);
    if (!card) return;
    card.classList.toggle('active', i === state.activeSlot);
    const thumb = card.querySelector('.thumb');
    if (thumb) {
      const photo = slotPhoto(slot);
      const tctx = thumb.getContext('2d');
      tctx.clearRect(0, 0, thumb.width, thumb.height);
      const iw = photo.img.naturalWidth || photo.img.width;
      const ih = photo.img.naturalHeight || photo.img.height;
      const s = Math.max(thumb.width / iw, thumb.height / ih);
      tctx.drawImage(photo.img, (thumb.width - iw * s) / 2, (thumb.height - ih * s) / 2, iw * s, ih * s);
    }
    const label = card.querySelector('.slot-name');
    if (label) label.textContent = slot.img ? `Photo ${i + 1}` : SCENE_LABELS[slot.scene];
  });
  const zoom = $('zoom');
  const panX = $('pan-x');
  const panY = $('pan-y');
  const slot = state.slots[state.activeSlot];
  if (zoom) zoom.value = String(slot.zoom);
  if (panX) panX.value = String(Math.round(slot.px * 100));
  if (panY) panY.value = String(Math.round(slot.py * 100));
  const zoomOut = $('zoom-out');
  if (zoomOut) zoomOut.textContent = `${Math.round(slot.zoom * 100)}%`;
}

function buildSlotCards() {
  const wrap = $('slots');
  wrap.innerHTML = '';
  state.slots.forEach((slot, i) => {
    const card = document.createElement('article');
    card.className = 'slot';
    card.id = `slot-${i}`;
    const sceneButtons = SCENE_IDS.map(
      (id) => `<button type="button" data-scene="${id}" data-slot="${i}">${SCENE_LABELS[id]}</button>`,
    ).join('');
    card.innerHTML = `
      <canvas class="thumb" width="180" height="120"></canvas>
      <p class="slot-name">Photo ${i + 1}</p>
      <label class="upload">Upload a photo
        <input type="file" accept="image/*" data-slot="${i}">
      </label>
      <div class="scene-pick">${sceneButtons}</div>`;
    card.addEventListener('click', (event) => {
      if (event.target.closest('button, input, label')) return;
      state.activeSlot = i;
      redraw();
    });
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const slot = state.slots[Number(input.dataset.slot)];
          slot.img = img;
          slot.zoom = 1;
          slot.px = 0.5;
          slot.py = 0.5;
          setStatus(`Photo ${Number(input.dataset.slot) + 1} loaded.`);
          redraw();
        };
        img.src = String(reader.result);
      };
      reader.readAsDataURL(file);
    });
  });

  wrap.querySelectorAll('[data-scene]').forEach((button) => {
    button.addEventListener('click', () => {
      const slot = state.slots[Number(button.dataset.slot)];
      slot.scene = button.dataset.scene;
      slot.img = null;
      slot.zoom = 1;
      slot.px = 0.5;
      slot.py = 0.5;
      state.activeSlot = Number(button.dataset.slot);
      redraw();
    });
  });
}

function buildPicker(groupId, values, current, onPick) {
  const group = $(groupId);
  group.innerHTML = '';
  for (const value of values) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value.label;
    button.dataset.value = value.id;
    button.classList.toggle('picked', value.id === current);
    button.addEventListener('click', () => {
      onPick(value.id);
      group.querySelectorAll('button').forEach((b) => b.classList.toggle('picked', b === button));
      redraw();
    });
    group.appendChild(button);
  }
}

function setStatus(text) {
  const status = $('status');
  if (status) status.textContent = text;
}

function exportPng() {
  const size = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  renderCover(off, {
    photos: previewPhotos(),
    layout: state.layout,
    grade: state.grade,
    kicker: state.kicker,
    title: state.title,
    place: state.place,
  });
  off.toBlob((blob) => {
    if (!blob) {
      setStatus('Export failed in this browser.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neon-sunset-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatus(`Exported ${size.label} PNG.`);
  }, 'image/png');
}

function initEditor() {
  buildSlotCards();
  buildPicker('layout-pick', [
    { id: 'triptych', label: 'Triptych' },
    { id: 'quad', label: 'Quad' },
    { id: 'split', label: 'Split' },
    { id: 'solo', label: 'Solo' },
  ], state.layout, (id) => { state.layout = id; });
  buildPicker('grade-pick', [
    { id: 'sunset', label: 'Sunset' },
    { id: 'ember', label: 'Ember' },
    { id: 'midnight', label: 'Midnight' },
  ], state.grade, (id) => { state.grade = id; });
  buildPicker('size-pick', Object.entries(SIZES).map(([id, s]) => ({ id, label: s.label })), state.size, (id) => { state.size = id; });

  const kicker = $('kicker');
  const title = $('title');
  const place = $('place');
  kicker.value = state.kicker;
  title.value = state.title;
  place.value = state.place;
  kicker.addEventListener('input', () => { state.kicker = kicker.value; redraw(); });
  title.addEventListener('input', () => { state.title = title.value; redraw(); });
  place.addEventListener('input', () => { state.place = place.value; redraw(); });

  $('zoom').addEventListener('input', (e) => {
    state.slots[state.activeSlot].zoom = Number(e.target.value);
    redraw();
  });
  $('pan-x').addEventListener('input', (e) => {
    state.slots[state.activeSlot].px = Number(e.target.value) / 100;
    redraw();
  });
  $('pan-y').addEventListener('input', (e) => {
    state.slots[state.activeSlot].py = Number(e.target.value) / 100;
    redraw();
  });
  $('export').addEventListener('click', exportPng);
  $('clear-photos').addEventListener('click', () => {
    state.slots.forEach((slot, i) => {
      slot.img = null;
      slot.scene = SCENE_IDS[i];
      slot.zoom = 1;
      slot.px = 0.5;
      slot.py = 0.5;
    });
    setStatus('Back to the three sample scenes.');
    redraw();
  });
  redraw();
}

const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  document.body.classList.add('shot-mode');
  runShot(params, { state, previewPhotos, renderCover, SIZES, initEditor });
} else {
  initEditor();
}
