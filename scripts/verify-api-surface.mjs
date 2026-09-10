/**
 * That the API page and the published surface still name the same things.
 *
 * `api.md` is written by hand, and that is the point: a generated reference
 * says what a signature is and never why you would reach for it. The cost of
 * writing it by hand is that it drifts, in two directions that fail
 * differently.
 *
 * An export nobody documented is invisible. It ships, it is supported, and the
 * only way to find it is to read the `.d.ts`. An entry naming nothing is
 * worse: it sends a reader to write code against a name the package does not
 * have, and the compiler is the first thing that tells them.
 *
 * So both are errors here, and neither is a warning.
 *
 * `ɵ`-prefixed names are excluded, because the README and the API page both
 * say they are outside the contract. Documenting them would contradict that.
 *
 * Runs in `npm run check`, after `build:library` — the surface it reads is the
 * built one, so what is checked is what a consumer installs rather than what
 * the sources happen to re-export.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = join(root, 'dist', 'ngx-statewise', 'types');
const page = join(
  root,
  'projects',
  'ngx-statewise-docs',
  'src',
  'app',
  'features',
  'guide',
  'content',
  'en',
  'api.md',
);

const problems = [];

function fail(message) {
  problems.push(message);
}

/**
 * The names one entry point exports.
 *
 * Both `.d.ts` files end in a pair of `export { … }` / `export type { … }`
 * statements listing everything, so the whole surface is two lines however
 * many files it came from. An aliased export is read as the name it is
 * published under, which is the only name a consumer can write.
 */
function exportsOf(declarationFile) {
  const declarations = readFileSync(join(types, declarationFile), 'utf8');
  const listed = [
    ...declarations.matchAll(/^export (?:type )?\{([^}]*)\};/gm),
  ].flatMap((statement) => statement[1].split(','));

  if (listed.length === 0) {
    fail(
      `no export statement found in ${declarationFile} — this script is out of step`,
    );
  }

  return listed
    .map(
      (name) =>
        name
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim() ?? '',
    )
    .filter((name) => name.length > 0 && !name.startsWith('ɵ'));
}

const published = new Set([
  ...exportsOf('ngx-statewise.d.ts'),
  ...exportsOf('ngx-statewise-testing.d.ts'),
]);

// --- what the page documents ----------------------------------------------
const documented = new Map();

const markdown = readFileSync(page, 'utf8');

/** Fenced blocks hold signatures, and a signature is not an entry. */
const prose = markdown.replace(/^```[\s\S]*?^```/gm, '');

function document(name, how) {
  if (!documented.has(name)) {
    documented.set(name, how);
  }
}

// An entry is a third-level heading. `## Effects` groups them; `### createEffect`
// is one.
for (const heading of prose.matchAll(/^### (\S+)\s*$/gm)) {
  document(heading[1], 'a heading');
}

/**
 * The exported-types table, which is the entry for a type that needs no
 * signature of its own. Scoped to its own section rather than read off every
 * table on the page: the options and return tables have a name in the first
 * cell too, and they describe arguments rather than exports.
 */
const TYPES_HEADING = '\n## Exported types\n';
const opensAt = prose.indexOf(TYPES_HEADING);

if (opensAt === -1) {
  fail(`no "## Exported types" section in api.md — this script is out of step`);
}

// To the next second-level heading, or to the end of the page when it is the
// last section, which today it is.
const after = prose.slice(opensAt + TYPES_HEADING.length);
const closesAt = after.indexOf('\n## ');
const typesSection = closesAt === -1 ? after : after.slice(0, closesAt);

for (const row of typesSection.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)) {
  document(row[1], 'a row of the exported-types table');
}

if (documented.size === 0) {
  fail(`no entries found in api.md — this script is out of step`);
}

// --- both directions -------------------------------------------------------
const undocumented = [...published]
  .filter((name) => !documented.has(name))
  .sort();

if (undocumented.length > 0) {
  fail(
    `the package exports ${undocumented.join(', ')}, and api.md has no entry for ` +
      `${undocumented.length === 1 ? 'it' : 'them'}.\n` +
      `  Give each one a \`### <name>\` section, or a row in the exported-types ` +
      `table if it is a type needing no signature of its own.`,
  );
}

const phantom = [...documented.keys()]
  .filter((name) => !published.has(name))
  .sort();

if (phantom.length > 0) {
  fail(
    `api.md documents ${phantom
      .map((name) => `${name} (${documented.get(name)})`)
      .join(', ')}, which the package does not export.\n` +
      `  Either the entry is stale and goes, or the export was dropped by ` +
      `accident and goes back.`,
  );
}

// --- verdict ---------------------------------------------------------------
if (problems.length > 0) {
  console.error(
    `verify:api — ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n\n` +
      problems.map((problem) => `- ${problem}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  `verify:api — ${published.size} exported names across both entry points, ` +
    `each with an entry in api.md, and no entry naming anything else.`,
);
