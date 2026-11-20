# Neon Sunset Cover Maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/JACKETAGENT-ID/gta6-cover-art-nurz/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/JACKETAGENT-ID/gta6-cover-art-nurz/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

A web app that turns your photos and a caption into a GTA-style poster cover —
a multi-panel layout, a Vice City neon-sunset grade, bold condensed lettering —
and exports it as a PNG to share. It runs fully offline: open `app/index.html`
from any static server, no network needed, no photo ever leaves your machine.

## How it works

1. **Load photos** — pick up to three of your own, or try the built-in sample
   scenes, drawn live in your browser. Nothing is uploaded.
2. **Arrange the panels** — each of the three panels takes any of your photos
   (one photo can fill all three, each cropped differently). Drag a panel to pan
   its photo, use the slider to zoom, type the caption and subtitle, pick a
   colour grade: Sunset, Neon, or Midnight.
3. **Export** — one click saves the cover as a PNG in 1080 × 1080, 1080 × 1350,
   or 1920 × 1080.

## What it makes

- A sunset sky strip with a synthwave sun, palm and skyline silhouettes.
- Three photo panels with bright frames and a warm sunset wash, so any photo
  shares the poster's grade.
- A caption band with big heavy system-sans lettering (neon pink edge) and a
  wide-tracked subtitle, in three colour grades.

Everything is original: no Rockstar logo, wordmark, artwork, or font. The
lettering uses heavy system font stacks, so the app ships no font files at
all — and the sample scenes are drawn on canvas at click time, so no sample
photo files ship either.

## Files

- `app/index.html` + `app/style.css` — the editor page.
- `app/src/cover.js` — the poster renderer (sky, sun, palms, panels, caption band).
- `app/src/main.js` — editor wiring: uploads, panel controls, drag-to-pan, export.
- `app/src/samples.js` — the three sample scenes, drawn live on canvas when
  you click them (or when a `?shot=` scene loads them).
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `screenshots/` — the cover and the editor, taken with headless Chromium.
- `main.ts` — the entry program: copies `app/` + `screenshots/` to `/output` and
  writes `dossier.json` with the vendored make.fun library.

## Try it

```sh
node serve.ts          # serves app/ at http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Licence

MIT — see `LICENSE`.
