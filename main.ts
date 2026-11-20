// Neon Sunset Cover Maker v2 — the entry program (Node 22, stdlib only).
//
// It hands the app in: it copies this folder's app/ and screenshots/ into
// the output directory and writes output/dossier.json there, the summary
// the judge reads, using the vendored make.fun library. The grader runs
// this program twice and the two runs must write identical bytes.
// Locally, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
mkdirSync(join(outDir, "screenshots"), { recursive: true });
if (existsSync(join(repoRoot, "screenshots"))) {
  cpSync(join(repoRoot, "screenshots"), join(outDir, "screenshots"), {
    recursive: true,
  });
}

writeFileSync(
  join(outDir, "dossier.json"),
  buildDossier(outDir, dossierCaps),
);
