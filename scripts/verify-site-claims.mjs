/**
 * Every number the site states about the library, read back from what it
 * describes.
 *
 * Three kinds: the version it documents, how big it is, and what the "Why"
 * page admits it costs you in lines. All of them are true on the day they are
 * written and silently false afterwards — the third most of all, because it
 * counts code that changes every week. So none is trusted.
 *
 * The size is the one people mean by "bundle size": every public export
 * bundled together, minified, gzipped, with Angular and RxJS left out because
 * an Angular application already carries them.
 *
 * The boilerplate figures are the unflattering ones, which is exactly why they
 * need a guard: a number that makes a library look worse is the number nobody
 * remembers to update.
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
  'core',
  'site.ts',
);

const packageManifest = join(root, 'projects', 'ngx-statewise', 'package.json');

function fail(message) {
  console.error(`verify:claims — ${message}`);
  process.exit(1);
}

const site = readFileSync(claimSource, 'utf8');

// --- the version -----------------------------------------------------------
const claimedVersion = /export const LIBRARY_VERSION = '([^']+)';/.exec(site);

if (claimedVersion === null) {
  fail(`no LIBRARY_VERSION found in ${claimSource}`);
}

const publishedVersion = JSON.parse(
  readFileSync(packageManifest, 'utf8'),
).version;

if (claimedVersion[1] !== publishedVersion) {
  fail(
    `the site says version ${claimedVersion[1]}, the package says ${publishedVersion}.\n` +
      `Update LIBRARY_VERSION in ${claimSource}.`,
  );
}

// --- the size --------------------------------------------------------------
const claimed = /export const LIBRARY_GZIP_KB = ([\d.]+);/.exec(site);

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

// --- how many types the contract commits to -------------------------------
// The README and the API page both state this count, and it is the number that
// rots the instant a type is added: nothing else in the suite notices.
const declarations = readFileSync(
  join(distributed, 'types', 'ngx-statewise.d.ts'),
  'utf8',
);
const exported = [...declarations.matchAll(/^export (?:type )?\{([^}]*)\};/gm)]
  .flatMap((match) => match[1].split(','))
  .map((name) => name.trim())
  .filter((name) => name.length > 0);

// A type by convention: capitalised, not one of the classes, not `ɵ`-prefixed.
const CLASSES = ['ActionHistory'];
const committedTypes = exported.filter(
  (name) =>
    /^[A-Z]/.test(name) && !name.includes(' as ɵ') && !CLASSES.includes(name),
);

// --- what the "Why" page admits it costs ------------------------------------
const whyPage = join(
  root,
  'projects',
  'ngx-statewise-docs',
  'src',
  'app',
  'features',
  'guide',
  'content',
  'en',
  'why.md',
);
const why = readFileSync(whyPage, 'utf8');

const showcase = join(root, 'projects', 'ngx-statewise-showcase', 'src', 'app');
const taskFlow = join(showcase, 'features', 'project', 'states', 'task');

/**
 * Reads the numbers of one table row. Whitespace-tolerant on purpose: prettier
 * re-aligns a markdown table's columns whenever a cell's width changes, so a
 * pattern that pinned the padding would break on the next unrelated edit.
 */
function claimedIn(pattern, what) {
  const found = pattern.exec(why);

  if (found === null) {
    fail(`no ${what} claim found in ${whyPage} — this script is out of step`);
  }

  return found.slice(1).map(Number);
}

/** Lines in a file, counted the way `wc -l` counts them. */
function linesOf(file) {
  return readFileSync(file, 'utf8').split('\n').length - 1;
}

/** How many times a pattern occurs across a set of files. */
function occurrences(files, pattern) {
  return files.reduce(
    (total, file) =>
      total + (readFileSync(file, 'utf8').match(pattern) ?? []).length,
    0,
  );
}

function check(what, claim, measurement, source = 'the showcase') {
  if (claim !== measurement) {
    fail(
      `the "Why" page claims ${what} is ${String(claim)}, ${source} measures ` +
        `${String(measurement)}.\nUpdate it in ${whyPage}.`,
    );
  }
}

const flowFiles = [
  'task.action.ts',
  'task.state.ts',
  'task.updater.ts',
  'task.effect.ts',
  'task.manager.ts',
].map((name) => join(taskFlow, name));

const [claimedGzip] = claimedIn(
  /the whole ([\d.]+) kB gzipped comes along/,
  'gzipped size',
);

check('the gzipped size it quotes', claimedGzip, measured, 'the build');

const readme = readFileSync(
  join(root, 'projects', 'ngx-statewise', 'README.md'),
  'utf8',
);
const claimedNames = /it is (\w+) names/.exec(readme);

if (claimedNames === null) {
  fail(`no exported-type count found in the library README`);
}

const AS_WORDS = {
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  'twenty-one': 21,
  'twenty-two': 22,
};
const claimedTypeCount = AS_WORDS[claimedNames[1]];

if (claimedTypeCount === undefined) {
  fail(
    `the README says "it is ${claimedNames[1]} names", which this script cannot ` +
      `read as a number. Add it to AS_WORDS, or write a digit.`,
  );
}

if (claimedTypeCount !== committedTypes.length) {
  fail(
    `the README commits to ${claimedNames[1]} exported types, the build ships ` +
      `${String(committedTypes.length)}: ${committedTypes.join(', ')}.\n` +
      `Update the README and the API page's table together.`,
  );
}

const [claimedFiles, claimedLines] = claimedIn(
  /\|\s*the complete `task` flow\s*\|\s*(\d+) files, (\d+) lines\s*\|/,
  'task flow',
);

check('the task flow file count', claimedFiles, flowFiles.length);
check(
  'the task flow line count',
  claimedLines,
  flowFiles.reduce((total, file) => total + linesOf(file), 0),
);

const managers = [
  join(showcase, 'features', 'project', 'states', 'task', 'task.manager.ts'),
  join(
    showcase,
    'features',
    'project',
    'states',
    'project',
    'project.manager.ts',
  ),
  join(showcase, 'features', 'auth', 'states', 'auth', 'auth.manager.ts'),
];
const updaters = [
  join(showcase, 'features', 'project', 'states', 'task', 'task.updater.ts'),
  join(
    showcase,
    'features',
    'project',
    'states',
    'project',
    'project.updater.ts',
  ),
  join(showcase, 'features', 'auth', 'states', 'auth', 'auth.updater.ts'),
];

const [claimedManagers, claimedReadonly] = claimedIn(
  /\|\s*`asReadonly\(\)` lines re-exposing state, across (\d+) managers\s*\|\s*(\d+)\s*\|/,
  'asReadonly',
);

check('the manager count', claimedManagers, managers.length);
check(
  'the asReadonly line count',
  claimedReadonly,
  occurrences(managers, /asReadonly\(\)/g),
);

const [claimedUpdaters, claimedStatusSets] = claimedIn(
  /\|\s*`isLoading\.set` \/ `isError\.set` lines, across (\d+) updaters\s*\|\s*(\d+)\s*\|/,
  'status-flag',
);

check('the updater count', claimedUpdaters, updaters.length);
check(
  'the status-flag line count',
  claimedStatusSets,
  occurrences(updaters, /is(?:Loading|Error)\.set/g),
);

console.log(
  `verify:claims — version ${publishedVersion}, ` +
    `${String(measured)} kB minified and gzipped, ` +
    `${String(committedTypes.length)} exported types, ` +
    `and the boilerplate figures of the "Why" page. All as claimed.`,
);
