#!/usr/bin/env node

/**
 * Weighs what ngx-statewise adds to an application, through Angular's own
 * production pipeline.
 *
 * The number the site publishes is measured with esbuild over the whole
 * barrel. That is the right number for "how big is this package", and it is
 * the wrong one for "what does importing it cost me": it never runs the
 * Angular linker over the partial-compilation output, and it bundles the whole
 * public API whether or not an application reaches for it.
 *
 * So this builds the same throwaway application three times, with `ng build
 * --configuration production`, and subtracts:
 *
 *   baseline  an Angular application importing nothing of the library
 *   helpers   the action helpers only, no engine
 *   full      every public export, retained
 *
 * What it reports is the two deltas. The absolute figures are Angular's, and
 * are printed only so the deltas can be checked against them.
 *
 * Usage: node tools/bundle-size/measure.mjs [--keep] [--skip-build] [--json]
 */

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const FIXTURE = join(HERE, 'fixture');
const VARIANTS = join(HERE, 'variants');

/**
 * The Angular the workspace itself holds. One major is enough here: this
 * measures what the library adds, and the compatibility workflow is what
 * answers whether the other two majors accept it at all.
 */
const ANGULAR = '^22.0.0';
const TYPESCRIPT = '~6.0.0';

/**
 * What the two deltas may not exceed, in kilobytes gzipped.
 *
 * Not a target — a tripwire. They are set a little above the figures the
 * README publishes, so ordinary drift is visible in the diff of that file
 * while a step change fails the build. Raising one is a decision, and the
 * commit that raises it should say what bought the bytes.
 */
const CEILING_KB = { helpers: 5, full: 6 };

/** The ceiling of one variant, refusing a name nobody set one for. */
function ceilingOf(variant) {
  const ceiling = CEILING_KB[variant];

  if (ceiling === undefined) {
    console.error(`bundle-size — no ceiling declared for "${variant}".`);
    process.exit(1);
  }

  return ceiling;
}

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function capture(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8' }).trim();
}

/** Every emitted script, gzipped, added up. */
function weigh(directory) {
  const browser = join(directory, 'dist', 'sizing', 'browser');

  return readdirSync(browser)
    .filter((name) => name.endsWith('.js'))
    .reduce((total, name) => {
      const file = join(browser, name);

      if (!statSync(file).isFile()) {
        return total;
      }

      return total + gzipSync(readFileSync(file)).length;
    }, 0);
}

function kb(bytes) {
  return Math.round((bytes / 1024) * 10) / 10;
}

function main() {
  const args = new Set(process.argv.slice(2));
  const keep = args.has('--keep');
  const asJson = args.has('--json');

  if (!args.has('--skip-build')) {
    run('npm', ['run', 'build:library'], REPO);
  }

  const work = mkdtempSync(join(tmpdir(), 'ngx-statewise-sizing-'));

  try {
    const packed = JSON.parse(
      capture(
        'npm',
        ['pack', '--json', `--pack-destination=${work}`],
        join(REPO, 'dist', 'ngx-statewise'),
      ),
    );
    const [tar] = packed;

    if (tar === undefined) {
      console.error('bundle-size — `npm pack` produced no tarball.');
      process.exit(1);
    }

    const tarball = join(work, tar.filename);

    const app = join(work, 'sizing');
    cpSync(FIXTURE, app, { recursive: true });
    rmSync(join(app, 'package.template.json'));

    writeFileSync(
      join(app, 'package.json'),
      readFileSync(join(FIXTURE, 'package.template.json'), 'utf8')
        .replaceAll('{{ANGULAR}}', ANGULAR)
        .replaceAll('{{TYPESCRIPT}}', TYPESCRIPT)
        .replaceAll('{{PACKAGE}}', `file:${tarball}`),
    );

    // One install for the three builds: only src/app/subject.ts changes
    // between them, so reinstalling would measure npm rather than the library.
    run('npm', ['install', '--no-audit', '--no-fund'], app);

    const ng = join(app, 'node_modules', '.bin', 'ng');

    /** Builds one variant and weighs what it emitted. */
    function build(variant) {
      cpSync(join(VARIANTS, `${variant}.ts`), join(app, 'src/app/subject.ts'));
      rmSync(join(app, 'dist'), { recursive: true, force: true });
      run(ng, ['build', '--configuration', 'production'], app);

      return weigh(app);
    }

    const baseline = build('baseline');
    // Named rather than keyed: what the report and the ceilings need is these
    // two deltas, and a lookup by string leaves room for a typo to read as a
    // measurement of zero.
    const measurements = [
      { variant: 'helpers', delta: build('helpers') - baseline },
      { variant: 'full', delta: build('full') - baseline },
    ];

    const reported = measurements.map(({ variant, delta }) => ({
      variant,
      addedKb: kb(delta),
      ceilingKb: ceilingOf(variant),
    }));

    if (asJson) {
      console.log(
        JSON.stringify({ baselineKb: kb(baseline), added: reported }, null, 2),
      );
    } else {
      console.log('\n--- What ngx-statewise adds, gzipped\n');
      console.log(`  baseline (no import)  ${String(kb(baseline))} kB`);

      for (const { variant, addedKb, ceilingKb } of reported) {
        console.log(
          `  ${variant.padEnd(21)} +${String(addedKb)} kB` +
            ` (ceiling ${String(ceilingKb)} kB)`,
        );
      }
    }

    const over = reported.filter(
      ({ addedKb, ceilingKb }) => addedKb > ceilingKb,
    );

    if (over.length > 0) {
      for (const { variant, addedKb, ceilingKb } of over) {
        console.error(
          `\nbundle-size — ${variant} adds ${String(addedKb)} kB, ` +
            `over its ${String(ceilingKb)} kB ceiling.`,
        );
      }
      console.error(
        `Either give the bytes back, or raise CEILING_KB in ${import.meta.filename} ` +
          `and say in the commit what bought them.`,
      );
      process.exit(1);
    }
  } finally {
    if (keep) {
      console.log(`\nKept the fixture at ${work}`);
    } else {
      rmSync(work, { recursive: true, force: true });
    }
  }
}

main();
