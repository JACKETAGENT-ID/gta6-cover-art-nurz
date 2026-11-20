// Screenshot scenes for the ?shot= query: the same app, driven by URL
// parameters instead of clicks, so the maker's screenshots are
// reproducible. `?shot=cover` hides the editor and renders one exported
// cover at the viewport's size; `?shot=editor` opens the editor with the
// given layout, grade, size, caption and scenes already picked.
//
// Examples:
//   ?shot=cover&layout=triptych&grade=sunset&size=wide
//     &kicker=Greetings%20from&title=Sunset%20Heist&place=Vice%20City
//   ?shot=editor&layout=split&grade=ember&size=square
//     &scenes=strip,rooftop,pier

export function runShot(params, ctx) {
  const { state, previewPhotos, renderCover, SIZES, initEditor } = ctx;
  const shot = params.get('shot');

  const layout = params.get('layout');
  if (layout) state.layout = layout;
  const grade = params.get('grade');
  if (grade) state.grade = grade;
  const size = params.get('size');
  if (size && SIZES[size]) state.size = size;
  const kicker = params.get('kicker');
  if (kicker !== null) state.kicker = kicker;
  const title = params.get('title');
  if (title !== null) state.title = title;
  const place = params.get('place');
  if (place !== null) state.place = place;
  const scene = params.get('scene');
  if (scene) {
    state.slots.forEach((slot) => {
      slot.scene = scene;
      slot.img = null;
    });
  }
  const scenes = params.get('scenes');
  if (scenes) {
    scenes.split(',').forEach((name, i) => {
      if (state.slots[i] && name) {
        state.slots[i].scene = name;
        state.slots[i].img = null;
      }
    });
  }

  if (shot === 'editor') {
    initEditor();
    return;
  }

  // A cover shot: the editor chrome goes away and the preview canvas
  // becomes the whole viewport, rendered at exactly the viewport's size.
  document.body.classList.add('shot-cover');
  const preview = document.getElementById('preview');
  preview.width = window.innerWidth;
  preview.height = window.innerHeight;
  renderCover(preview, {
    photos: previewPhotos(),
    layout: state.layout,
    grade: state.grade,
    kicker: state.kicker,
    title: state.title,
    place: state.place,
  });
}
