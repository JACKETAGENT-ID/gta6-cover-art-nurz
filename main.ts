// Neon Sunset Cover Maker, entry program (Node 22, standard library
// only). It hands the app in: copy the static app/ folder and the
// screenshots/ folder beside this file into the output directory, then
// write /output/dossier.json with the vendored make.fun library, which
// summarises the app for the judge. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The grader runs the program twice into the same /output, and /output is
// a mount point there: never remove it, only create it. (Round 4 failed
// run_completes with exit 1 because an earlier version called
// rmSync(outputDir) here.)
mkdirSync(outputDir, { recursive: true });

cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's own (see the kit's gate.json): only
// text_max_bytes shapes the dossier bytes; the rest refuse an entry the
// scorer would refuse — more than 4 screenshots or one over 256 KiB, more
// than 993 files in app/ or 48 MiB of app files, or an app path over
// 1000 bytes. app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
