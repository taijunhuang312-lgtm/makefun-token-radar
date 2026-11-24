// Token Radar: one snapshot in, one ranked board and one dashboard out.
//
// The program reads the sealed DefiLlama snapshot, scores every protocol the
// model can rank, and writes everything the entry needs into the output
// directory: the ranked board, the dashboard's data, the dashboard itself,
// its screenshots, and the dossier that describes them. The grader runs it
// twice and the two runs must write byte-identical output, so nothing here
// reads the clock, rolls dice, or formats by locale.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { boardIssue, buildRadar, dataScript, parseSnapshot } from './lib/model.ts';
import type { Snapshot } from './lib/model.ts';
import { buildDossier } from './vendor/makefun-board.ts';

/** Where the snapshot comes from and where the output goes. */
interface RunOptions {
  inputPath: string;
  outputDir: string;
}

/** The snapshot path from --input, and the output directory from the environment. */
function readOptions(argv: string[]): RunOptions {
  let inputPath = '/input/snapshot.json';
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === '--input' && i + 1 < argv.length) {
      inputPath = argv[++i]!;
    } else if (arg.startsWith('--input=')) {
      inputPath = arg.slice('--input='.length);
    }
  }
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  return { inputPath: resolve(inputPath), outputDir: resolve(outputDir) };
}

/** The repository's own directory: the dashboard and the screenshots live beside this file. */
function repoRoot(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** Copy one directory's whole contents into another, replacing what was there first. */
function copyDir(source: string, target: string): number {
  const from = resolve(source);
  const to = resolve(target);
  if (from === to) {
    throw new Error(`refusing to copy a directory onto itself: ${from}`);
  }
  if (!existsSync(from)) throw new Error(`missing directory: ${from}`);
  rmSync(to, { recursive: true, force: true });
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true, force: true });
  return readdirSync(to).length;
}

function main(): void {
  const { inputPath, outputDir } = readOptions(process.argv.slice(2));
  const root = repoRoot();

  const snapshot: Snapshot = parseSnapshot(readFileSync(inputPath, 'utf8'));
  const { board, radar } = buildRadar(snapshot);

  const issue = boardIssue(board, snapshot);
  if (issue !== null) {
    console.error(`token radar: board refused: ${issue}`);
    process.exit(1);
  }

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(join(outputDir, 'board.json'), `${JSON.stringify({ rows: board }, null, 2)}\n`, 'utf8');
  writeFileSync(join(outputDir, 'data.js'), dataScript(radar), 'utf8');

  const dashboardFiles = copyDir(join(root, 'dashboard'), join(outputDir, 'dashboard'));
  const screenshotFiles = copyDir(join(root, 'screenshots'), join(outputDir, 'screenshots'));

  const dossier = buildDossier(outputDir, {
    text_max_bytes: 65536,
    screenshots: { max: 4, max_bytes: 524288 },
    dashboard: { max_files: 400, max_bytes: 4194304 },
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);

  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  console.log(
    `token radar: board ready — ${board.length} rows (${snapshot.watchlist.length} watchlist + ${early} early) ` +
      `from ${snapshot.protocols.length} protocols; ${radar.live.length} live-token protocols set aside`,
  );
  console.log(
    `token radar: output written to ${outputDir} (board.json, data.js, dashboard with ${dashboardFiles} files, ` +
      `screenshots with ${screenshotFiles} images, dossier.json)`,
  );
}

try {
  main();
} catch (error) {
  console.error(`token radar: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
