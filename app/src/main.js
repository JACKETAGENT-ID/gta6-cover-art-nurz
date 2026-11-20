// Wires the Neon Sunset Cover Maker v2 page: photo slots, sample scenes,
// caption fields, layout / grade / size picks, and the PNG export.
//
// State lives in one object and every control funnels through `refresh()`:
// change a control, the preview canvas is repainted from the same state
// the export uses, so what you see is what the PNG holds. A `?shot=`
// query instead stages a fixed scene for a screenshot (see shots.js).
import { renderPoster, EXPORT_SIZES, LAYOUTS, GRADES } from "./cover.js";
import { makeSceneCanvas, SCENE_NAMES, SCENE_LABELS } from "./samples.js";
import { stageShot } from "./shots.js";

const $ = (id) => document.getElementById(id);

const preview = $("preview");
const note = $("note");

const state = {
  size: "square",
  layout: "triptych",
  grade: "sunset",
  photos: [null, null, null],
  framings: [
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
    { zoom: 1, dx: 0, dy: 0 },
  ],
  kicker: "Welcome to",
  title: "Sunset Heist",
  place: "Neon Bay",
};

let activeSlot = 0;

function refresh() {
  renderPoster(preview, state);
  document.querySelectorAll(".slot-card").forEach((card, i) => {
    card.classList.toggle("active", i === activeSlot);
    card.classList.toggle("filled", Boolean(state.photos[i]));
  });
  $("zoom").value = state.framings[activeSlot].zoom;
  $("panx").value = state.framings[activeSlot].dx;
  $("pany").value = state.framings[activeSlot].dy;
  $("zoom-out").textContent = `${state.framings[activeSlot].zoom.toFixed(2)}×`;
}

function say(text) {
  note.textContent = text;
}

// --- Photo slots: upload a file, or paint a sample scene in. ---
function loadFileIntoSlot(slot, file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.photos[slot] = img;
    state.framings[slot] = { zoom: 1, dx: 0, dy: 0 };
    URL.revokeObjectURL(url);
    refresh();
    say(`Photo ${slot + 1} loaded — drag the sliders to frame it.`);
  };
  img.onerror = () => say("That file could not be read as a photo.");
  img.src = url;
}

function paintSampleIntoSlot(slot, scene) {
  state.photos[slot] = makeSceneCanvas(scene, 1080, 1080);
  state.framings[slot] = { zoom: 1, dx: 0, dy: 0 };
  refresh();
  say(`${SCENE_LABELS[scene]} painted into photo ${slot + 1}.`);
}

document.querySelectorAll(".slot-card").forEach((card) => {
  const slot = Number(card.dataset.slot);
  card.querySelector(".slot-pick").addEventListener("click", () => {
    activeSlot = slot;
    refresh();
  });
  card.querySelector(".slot-file").addEventListener("change", (e) => {
    loadFileIntoSlot(slot, e.target.files[0]);
    e.target.value = "";
  });
});

// Sample scene buttons fill the active slot.
document.querySelectorAll("[data-scene]").forEach((button) => {
  button.addEventListener("click", () => {
    paintSampleIntoSlot(activeSlot, button.dataset.scene);
  });
});

// Fill all three slots at once, one scene each, in scene order.
$("fill-samples").addEventListener("click", () => {
  SCENE_NAMES.forEach((scene, i) => paintSampleIntoSlot(i, scene));
  say("All three sample scenes painted in.");
});

// --- Framing sliders for the active slot. ---
$("zoom").addEventListener("input", (e) => {
  state.framings[activeSlot].zoom = Number(e.target.value);
  refresh();
});
$("panx").addEventListener("input", (e) => {
  state.framings[activeSlot].dx = Number(e.target.value);
  refresh();
});
$("pany").addEventListener("input", (e) => {
  state.framings[activeSlot].dy = Number(e.target.value);
  refresh();
});

// --- Caption fields. ---
$("kicker").addEventListener("input", (e) => {
  state.kicker = e.target.value;
  refresh();
});
$("title").addEventListener("input", (e) => {
  state.title = e.target.value;
  refresh();
});
$("place").addEventListener("input", (e) => {
  state.place = e.target.value;
  refresh();
});

// --- Layout, grade and size radios. ---
document.querySelectorAll('input[name="layout"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    state.layout = radio.value;
    refresh();
  });
});
document.querySelectorAll('input[name="grade"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    state.grade = radio.value;
    refresh();
  });
});
document.querySelectorAll('input[name="size"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    state.size = radio.value;
    refresh();
  });
});

// --- Export: repaint at full export size and download the PNG. ---
$("export").addEventListener("click", () => {
  const size = EXPORT_SIZES[state.size];
  const off = document.createElement("canvas");
  renderPoster(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      say("Export failed — try again.");
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `neon-sunset-cover-${state.size}-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    say(`Saved ${a.download}.`);
  }, "image/png");
});

// --- Fixed screenshot scenes: ?shot=cover or ?shot=editor. ---
const params = new URLSearchParams(location.search);
const shot = params.get("shot");
if (shot) {
  stageShot(shot, params, (scene) => {
    const order = SCENE_NAMES.slice(SCENE_NAMES.indexOf(scene)).concat(
      SCENE_NAMES.slice(0, SCENE_NAMES.indexOf(scene)),
    );
    order.forEach((name, i) => paintSampleIntoSlot(i, name));
    state.layout = params.get("layout") ?? state.layout;
    state.grade = params.get("grade") ?? state.grade;
    state.size = params.get("size") ?? state.size;
    state.title = params.get("caption") ?? state.title;
    document.querySelector(`input[name="layout"][value="${state.layout}"]`).checked = true;
    document.querySelector(`input[name="grade"][value="${state.grade}"]`).checked = true;
    document.querySelector(`input[name="size"][value="${state.size}"]`).checked = true;
    $("title").value = state.title;
    refresh();
  });
} else {
  // First visit: paint the three sample scenes so the editor is alive.
  SCENE_NAMES.forEach((scene, i) => paintSampleIntoSlot(i, scene));
  refresh();
  say("Three sample scenes painted in — swap any slot with your own photo.");
}

// Keep the option lists in sync with the modules, for the record.
void LAYOUTS;
void GRADES;
