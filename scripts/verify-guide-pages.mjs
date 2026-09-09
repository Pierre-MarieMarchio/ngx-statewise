/**
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
 * Runs in `npm run check`.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const guide = join(root, 'projects/ngx-statewise-docs/src/app/guide');
const content = join(guide, 'content');
const registry = join(guide, 'guide-pages.ts');

const problems = [];

function fail(message) {
  problems.push(message);
}

// --- the locales, read from the one place that declares them ---------------
const locale = readFileSync(join(guide, '..', 'i18n', 'locale.ts'), 'utf8');
const codes = [...locale.matchAll(/^\s*(?:\{\s*)?code: '([^']+)'/gm)].map(
  (match) => match[1],
);

if (codes.length === 0) {
  fail('no locales found in i18n/locale.ts — this script is out of step');
}

const [defaultCode] = codes;

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

// --- verdict ---------------------------------------------------------------
if (problems.length > 0) {
  console.error(
    `verify:guide — ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n\n` +
      problems.map((problem) => `- ${problem}`).join('\n'),
  );
  process.exit(1);
}

console.log(
  `verify:guide — ${imported.size} markdown file${imported.size === 1 ? '' : 's'}, each imported once and named after its slug.`,
);
