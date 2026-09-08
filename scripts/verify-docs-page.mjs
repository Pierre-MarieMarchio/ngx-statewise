/*
 * The showcase's docs page claims, for each mechanism it describes, the file
 * where that mechanism is exercised. Those claims are plain strings, so they
 * rot the first time a file moves — and they moved twice this week.
 *
 * This checks them, and the shape of the sections around them.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const APP = 'projects/ngx-statewise-showcase/src/app';
const DOCS_PAGE = join(
  APP,
  'features/docs/pages/docs-page/docs-page.component.ts',
);

const source = readFileSync(DOCS_PAGE, 'utf8');

const failures = [];

const ids = [...source.matchAll(/^\s{4}id: '([^']+)',$/gm)].map(([, id]) => id);
const seenIn = [...source.matchAll(/seenIn:\s*\n?\s*'([^']+)',/g)].map(
  ([, path]) => path,
);

if (ids.length === 0) {
  failures.push('no section found at all — has the file been restructured?');
}

if (ids.length !== seenIn.length) {
  failures.push(
    `${ids.length} sections but ${seenIn.length} seenIn: every section must name where it is exercised`,
  );
}

const duplicated = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicated.length > 0) {
  failures.push(`duplicate section ids: ${duplicated.join(', ')}`);
}

for (const path of seenIn) {
  // Written either from the repository root or from the app folder.
  if (!existsSync(path) && !existsSync(join(APP, path))) {
    failures.push(`seenIn points nowhere: ${path}`);
  }
}

if (failures.length > 0) {
  console.error('docs page verification failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(
  `docs page: ${ids.length} sections, ${seenIn.length} seenIn paths all resolve`,
);
