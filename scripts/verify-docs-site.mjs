/**
 * What the documentation site's own build cannot check about itself.
 *
 * Two things about a guide page cannot be checked from inside the bundle.
 *
 * A markdown file nobody imported is invisible: it compiles, the suite passes,
 * and the page simply is not on the site. And a `slug` that disagrees with its
 * filename is worse than invisible — the route works, while the "edit this
 * page" link and every translation of it point at a file that is not there.
 *
 * Everything else a page needs is checked while the module loads, so it fails
 * the prerender and the whole suite. See `defineGuideSections`.
 *
 * And one thing about its layers: the import law in eslint.config.js has to
 * name each feature one by one, so this fails if that list and app/features/
 * ever stop agreeing — a feature nobody added to the list is a feature the
 * cross-feature rule does not cover.
 *
 * Runs in `npm run check`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const guide = join(root, 'projects/ngx-statewise-docs/src/app/features/guide');
const content = join(guide, 'content');
const registry = join(guide, 'guide-pages.ts');

const problems = [];

function fail(message) {
  problems.push(message);
}

// --- the locales, read from the one place that declares them ---------------
const locale = readFileSync(
  join(guide, '..', '..', 'core', 'i18n', 'locale.ts'),
  'utf8',
);
const codes = [...locale.matchAll(/^\s*(?:\{\s*)?code: '([^']+)'/gm)].map(
  (match) => match[1],
);

if (codes.length === 0) {
  fail('no locales found in i18n/locale.ts — this script is out of step');
}

const [defaultCode] = codes;

// --- the place the content used to live ------------------------------------
// The guide moved from app/guide/ to app/features/guide/. A page written to
// the old path still parses, still formats, and is simply never served, which
// is the failure this whole script exists to prevent.
const former = join(root, 'projects/ngx-statewise-docs/src/app/guide');

if (existsSync(former)) {
  fail(
    `src/app/guide/ exists again. The guide lives in src/app/features/guide/ — move what is in there across, and delete it.`,
  );
}

// --- what the registry imports ---------------------------------------------
const source = readFileSync(registry, 'utf8');
const imported = new Map();

for (const match of source.matchAll(
  /^import \w+ from '\.\/content\/([^/]+)\/([^']+)\.md';$/gm,
)) {
  const [, code, name] = match;
  imported.set(`${code}/${name}`, { code, name });
}

if (imported.size === 0) {
  fail(`no markdown imports found in ${registry} — this script is out of step`);
}

for (const key of imported.keys()) {
  if (!existsSync(join(content, `${key}.md`))) {
    fail(`guide-pages.ts imports content/${key}.md, which does not exist`);
  }
}

// --- what is on disk -------------------------------------------------------
const pagesOf = (code) => {
  const directory = join(content, code);

  return existsSync(directory)
    ? readdirSync(directory)
        .filter((file) => file.endsWith('.md') && file !== 'README.md')
        .map((file) => file.replace(/\.md$/, ''))
    : [];
};

for (const code of readdirSync(content, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)) {
  if (!codes.includes(code)) {
    fail(
      `content/${code}/ is not one of the site's locales (${codes.join(', ')})`,
    );
    continue;
  }

  for (const name of pagesOf(code)) {
    if (!imported.has(`${code}/${name}`)) {
      fail(
        `content/${code}/${name}.md is not imported by guide-pages.ts, so the site does not serve it.\n` +
          `  Add \`import ${name.replace(/-(.)/g, (_, letter) => letter.toUpperCase())}${code === defaultCode ? 'En' : ''} from './content/${code}/${name}.md';\` and place it in a section.`,
      );
    }

    if (code !== defaultCode && !pagesOf(defaultCode).includes(name)) {
      fail(
        `content/${code}/${name}.md translates a page that does not exist in ${defaultCode}`,
      );
    }
  }
}

// --- the slug each page claims ---------------------------------------------
for (const name of pagesOf(defaultCode)) {
  const page = readFileSync(join(content, defaultCode, `${name}.md`), 'utf8');
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(page);

  if (block === null) {
    fail(
      `content/${defaultCode}/${name}.md has no metadata block. A page opens with one — see CONTRIBUTING.md.`,
    );
    continue;
  }

  const slug = /^slug:[ \t]*(.+?)[ \t]*$/m.exec(block[1]);

  if (slug === null) {
    fail(`content/${defaultCode}/${name}.md declares no slug`);
    continue;
  }

  const claimed = slug[1].replace(/^['"]|['"]$/g, '');

  if (claimed !== name) {
    fail(
      `content/${defaultCode}/${name}.md calls itself "${claimed}". The slug is the filename: rename the file, or fix the slug.`,
    );
  }
}

// --- the features the import law names -------------------------------------
const app = join(root, 'projects/ngx-statewise-docs/src/app');
const features = readdirSync(join(app, 'features'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const eslintConfig = readFileSync(join(root, 'eslint.config.js'), 'utf8');
const named = [...eslintConfig.matchAll(/^\s*'\.\.\/([a-z0-9-]+)',$/gm)]
  .map((match) => match[1])
  .sort();

const unnamed = features.filter((feature) => !named.includes(feature));
const stale = named.filter((feature) => !features.includes(feature));

if (unnamed.length > 0) {
  fail(
    `eslint.config.js does not name ${unnamed.map((f) => `features/${f}`).join(', ')} in the docs site's cross-feature rule, so nothing stops another feature importing it.\n` +
      `  Add '../${unnamed[0]}' and '../${unnamed[0]}/**' to that rule's group.`,
  );
}

if (stale.length > 0) {
  fail(
    `eslint.config.js names ${stale.map((f) => `features/${f}`).join(', ')} in the docs site's cross-feature rule, and there is no such feature. Remove it.`,
  );
}

// --- verdict ---------------------------------------------------------------
if (problems.length > 0) {
  console.error(
    `verify:docs — ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n\n` +
      problems.map((problem) => `- ${problem}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  `verify:docs — ${imported.size} markdown file${imported.size === 1 ? '' : 's'}, each imported once and named after its slug; ` +
    `${features.length} feature${features.length === 1 ? '' : 's'} named by the import law.`,
);
