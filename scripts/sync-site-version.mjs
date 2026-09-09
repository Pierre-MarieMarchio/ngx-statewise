/**
 * Writes the published version into the site, from the manifest that decides it.
 *
 * `LIBRARY_VERSION` in the docs site is checked rather than trusted:
 * `verify:claims` fails the build when it disagrees with
 * projects/ngx-statewise/package.json. That check is the right one — a site
 * claiming a version npm never published is worse than a site claiming none —
 * but on its own it turns a release into a trap. release-it bumps the manifest
 * and touches nothing else, so the next run of `npm run check` fails on a line
 * no human wrote: on `main`, and on the back-merge pull request the release
 * opens into `dev`.
 *
 * So the bump writes the line. This runs from `after:bump` in
 * projects/ngx-statewise/.release-it.json, before the release commit is staged,
 * which is what puts the version and the site that states it in one commit.
 *
 * Idempotent, and safe to run by hand: with nothing to change it says so and
 * exits clean.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const siteSource = join(
  root,
  'projects/ngx-statewise-docs/src/app/core/site.ts',
);
const packageManifest = join(root, 'projects/ngx-statewise/package.json');

// The shape verify-site-claims.mjs reads back. Written the same way in both
// places on purpose: the writer and the checker have to agree on the line, and
// two regexes that drift apart would fail after the release rather than before.
const declaration = /export const LIBRARY_VERSION = '([^']+)';/;

function fail(message) {
  console.error(`sync:site-version — ${message}`);
  process.exit(1);
}

const site = readFileSync(siteSource, 'utf8');
const claimed = declaration.exec(site)?.[1];

if (claimed === undefined) {
  fail(`no LIBRARY_VERSION found in ${siteSource}`);
}

const published = JSON.parse(readFileSync(packageManifest, 'utf8')).version;

if (typeof published !== 'string' || published === '') {
  fail(`no version found in ${packageManifest}`);
}

if (claimed === published) {
  console.log(`sync:site-version — already ${published}, nothing to write.`);
  process.exit(0);
}

writeFileSync(
  siteSource,
  site.replace(declaration, `export const LIBRARY_VERSION = '${published}';`),
);

console.log(`sync:site-version — ${claimed} → ${published}.`);
