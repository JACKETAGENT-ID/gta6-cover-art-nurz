// Neon Sunset Cover Maker — the entry program for make.fun's gta6-cover-art-01.
// It hands the app in: the repository's app/ and screenshots/ are copied into
// the output directory, and dossier.json is written there — the summary the
// judge reads — built with the vendored make.fun library. Node 22 standard
// library only, so it behaves the same in the grader's sandbox as here.
//
// Try it locally first:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Without MAKEFUN_OUTPUT_DIR it writes to /output, the grader's directory.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The sealed scorer's caps (see the competition's gate): the dossier text is
// capped at 160 KiB, at most 4 screenshots of 256 KiB each, and app/ stays
// within 993 files and 48 MiB with no path over 1000 bytes. The whole output
// also has to fit the platform's own 1000-entry / 64 MiB ceiling, so these
// numbers leave room for screenshots/ and dossier.json beside app/.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
