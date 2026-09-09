/**
 * The landing page tells the reader how big the library is. A number written
 * into a page is true on the day it is written and silently false afterwards,
 * so this rebuilds the measurement from the freshly built package and fails if
 * it no longer rounds to what the site claims.
 *
 * The measurement is the one people mean by "bundle size": every public export
 * bundled together, minified, gzipped, with Angular and RxJS left out because
 * an Angular application already carries them.
 *
 * Runs in `npm run check`, right after `build:library` — the earliest point at
 * which dist/ngx-statewise exists.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const distributed = join(root, 'dist', 'ngx-statewise');
const claimSource = join(
  root,
  'projects',
  'ngx-statewise-docs',
  'src',
  'app',
  'site.ts',
);

function fail(message) {
  console.error(`verify:size — ${message}`);
  process.exit(1);
}

const claimed = /export const LIBRARY_GZIP_KB = ([\d.]+);/.exec(
  readFileSync(claimSource, 'utf8'),
);

if (claimed === null) {
  fail(`no LIBRARY_GZIP_KB found in ${claimSource}`);
}

let bundled;

try {
  bundled = await build({
    stdin: {
      contents: "export * from 'ngx-statewise';",
      resolveDir: root,
      loader: 'ts',
    },
    bundle: true,
    minify: true,
    format: 'esm',
    target: 'es2022',
    write: false,
    // Peer dependencies: an Angular application already ships these, so
    // counting them would measure Angular rather than this library.
    external: ['@angular/*', 'rxjs', 'rxjs/*'],
    alias: { 'ngx-statewise': distributed },
  });
} catch (error) {
  fail(
    `could not bundle ${distributed} — run \`npm run build:library\` first.\n${String(error)}`,
  );
}

const bytes = gzipSync(bundled.outputFiles[0].contents).length;
const measured = Math.round((bytes / 1024) * 10) / 10;

if (measured !== Number(claimed[1])) {
  fail(
    `the site claims ${claimed[1]} kB, the build measures ${String(measured)} kB ` +
      `(${String(bytes)} bytes gzipped).\n` +
      `Update LIBRARY_GZIP_KB in ${claimSource}.`,
  );
}

console.log(
  `verify:size — ${String(measured)} kB minified and gzipped, as claimed.`,
);
