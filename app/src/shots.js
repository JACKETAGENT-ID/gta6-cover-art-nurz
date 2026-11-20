// Fixed scenes for screenshots: ?shot=editor shows the page with sample
// photos loaded; ?shot=cover shows the cover alone, controls hidden.
// `scene` picks the first sample scene, `caption` the title, and `layout`,
// `grade` and `size` pick the poster's shape. The page signals it is
// painted by setting data-shot-ready on the document element.
export function stageShot(shot, query, apply) {
  if (shot === "cover") document.body.classList.add("shot-cover");
  const scene = query.get("scene") ?? "marina";
  apply(scene);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.setAttribute("data-shot-ready", "1");
    });
  });
}
