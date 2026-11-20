// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos
// loaded; ?shot=cover shows the cover alone at the requested post size.
// `photos` picks the samples (samples/<name>.jpg, comma-separated, one per panel),
// `caption` / `subtitle` the words, `size` square|portrait|landscape, `grade`
// sunset|neon|midnight. window.__shotReady is set once painted, and the document
// carries data-shot-ready="1" so a headless run can tell it finished.
export async function runShot(shot, query, api) {
  const names = (query.get('photos') ?? query.get('photo') ?? 'pier').split(',');
  const samples = names.map((n) => `samples/${n.trim()}.jpg`);
  if (shot === 'cover') document.body.classList.add('shot-cover');
  await api.loadSamples(samples);
  api.setCaption(query.get('caption') ?? 'Sunset Heist');
  api.setSubtitle(query.get('subtitle') ?? 'Vice Nights · Neon City');
  api.setGrade(query.get('grade') ?? 'sunset');
  api.setSize(query.get('size') ?? 'square');
  api.redraw();
  await document.fonts.ready;
  api.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.documentElement.dataset.shotReady = '1';
    window.__shotReady = true;
  }));
}
