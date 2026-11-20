// Neon Sunset Cover Maker — entry program for make.fun's gta6-cover-art-01.
// It hands the app in: copies this repository's app/ and screenshots/ into the
// output directory and writes dossier.json there, the summary the judge reads,
// built with the vendored make.fun library. Node 22 standard library only, so
// it runs the same in the grader's sandbox as it does on this machine.
//
// Try it locally first:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Without MAKEFUN_OUTPUT_DIR it writes to /output, the grader's directory.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// Caps the sealed scorer enforces (see the competition's gate): the dossier text
// is capped at 160 KiB, at most 4 screenshots of 256 KiB each, and app/ stays
// within 993 files and 48 MiB with no path over 1000 bytes. The whole output
// also has to fit the platform's own 1000-entry / 64 MiB ceiling, so these
// numbers leave room for screenshots/ and dossier.json beside app/.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
