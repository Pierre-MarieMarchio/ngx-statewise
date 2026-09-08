#!/usr/bin/env node

/**
 * Compiles and tests the *published* ngx-statewise against one Angular major.
 *
 * The workspace itself can only ever hold one Angular version, so the peer
 * range it declares is a claim about versions nothing here installs. This
 * script closes that gap the only way that does not fork the workspace: it
 * packs the built library, installs the tarball into a throwaway application
 * outside the repository, and asks that application's own Angular CLI to
 * build it ahead of time and run its specs.
 *
 * Usage: node tools/angular-compat/verify.mjs <major> [--keep] [--skip-build]
 */

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..');
const FIXTURE = join(HERE, 'consumer');

/**
 * One entry per major in the peer range. The TypeScript and Vitest pins are
 * not preferences: they are the intersection of what `@angular/compiler-cli`
 * and `@angular/build` of that major accept as peers. Widening them here
 * would test a combination Angular itself refuses.
 */
const MAJORS = {
  20: { angular: '^20.0.0', typescript: '~5.9.0', vitest: '^3.1.1' },
  21: { angular: '^21.0.0', typescript: '~5.9.0', vitest: '^4.0.8' },
  22: { angular: '^22.0.0', typescript: '~6.0.0', vitest: '^4.0.8' },
};

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function capture(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8' }).trim();
}

function main() {
  const args = process.argv.slice(2);
  const major = args.find((argument) => !argument.startsWith('--'));
  const keep = args.includes('--keep');
  const skipBuild = args.includes('--skip-build');
  const target = MAJORS[major];

  if (!target) {
    const known = Object.keys(MAJORS).join(', ');

    throw new Error(
      `Unknown Angular major "${major ?? ''}". Expected one of: ${known}.`,
    );
  }

  if (!skipBuild) {
    console.log(`\n--- Building the library`);
    run('npm', ['run', 'build:library'], REPO);
  }

  const work = mkdtempSync(join(tmpdir(), `ngx-statewise-compat-${major}-`));

  try {
    console.log(`\n--- Packing dist/ngx-statewise into ${work}`);
    const packed = JSON.parse(
      capture(
        'npm',
        ['pack', '--json', `--pack-destination=${work}`],
        join(REPO, 'dist', 'ngx-statewise'),
      ),
    );
    const tarball = join(work, packed[0].filename);

    console.log(`\n--- Materialising the consumer against Angular ${major}`);
    const app = join(work, 'consumer');
    cpSync(FIXTURE, app, { recursive: true });
    rmSync(join(app, 'package.template.json'));

    const manifest = readFileSync(
      join(FIXTURE, 'package.template.json'),
      'utf8',
    )
      .replaceAll('{{ANGULAR}}', target.angular)
      .replaceAll('{{TYPESCRIPT}}', target.typescript)
      .replaceAll('{{VITEST}}', target.vitest)
      .replaceAll('{{PACKAGE}}', `file:${tarball}`);

    writeFileSync(join(app, 'package.json'), manifest);

    run('npm', ['install', '--no-audit', '--no-fund'], app);

    const installed = capture(
      'node',
      ['-p', "require('@angular/core/package.json').version"],
      app,
    );
    console.log(`\n--- Resolved @angular/core ${installed}`);

    const ng = join(app, 'node_modules', '.bin', 'ng');

    console.log(`\n--- Building the consumer ahead of time`);
    run(ng, ['build'], app);

    console.log(`\n--- Running the consumer specs`);
    run(ng, ['test', '--watch=false'], app);

    console.log(
      `\nAngular ${installed}: the packed package builds and its specs pass.`,
    );
  } finally {
    if (keep) {
      console.log(`\nKept the fixture at ${work}`);
    } else {
      rmSync(work, { recursive: true, force: true });
    }
  }
}

main();
