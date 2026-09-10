# Angular compatibility check

`projects/ngx-statewise/package.json` promises three Angular majors:

```json
"@angular/core": "^20.0.0 || ^21.0.0 || ^22.0.0"
```

This workspace can only hold one Angular version at a time, and it holds 22.
So two thirds of that promise used to be an assumption. This directory turns
it into a measurement.

## What it does

`verify.mjs <major>` builds the library, packs `dist/ngx-statewise` into the
same tarball `npm publish` would upload, then installs that tarball into a
throwaway application outside the repository and asks _that_ application's
Angular CLI, which is the requested major's own, to build it ahead of time and
run its specs.

```bash
npm run verify:angular 20        # or 21, or 22
npm run verify:angular -- 20 --keep         # leave the fixture on disk
npm run verify:angular -- 20 --skip-build   # reuse the current dist/
```

The fixture lives in `consumer/`. Its `package.json` is generated per run from
`package.template.json`; the TypeScript and Vitest pins in `verify.mjs` are the
intersection of what `@angular/compiler-cli` and `@angular/build` of that major
accept as peers, not preferences. When a new major enters the peer range, add a
row to the `MAJORS` table and a value to the workflow matrix.

## What this verifies

- **The published artifact, not the sources.** The tarball is what is tested,
  through its `exports` map, so both entry points: `ngx-statewise` and
  `ngx-statewise/testing`.
- **Peer resolution.** `npm install` applies the declared peer range itself, so
  a range that cannot be satisfied fails before anything compiles.
- **The shipped types, against that major's typings.** `tsconfig.app.json` sets
  `skipLibCheck: false` with `types: []`, and `strictTemplates` is on: the
  `.d.ts` files are checked, not waved through.
- **The shipped code, running.** An AOT production build of an application that
  bootstraps the library, plus specs that dispatch through an updater, settle an
  effect answering with a follow-up action, read the action history, and render
  a component whose template binds a signal an updater writes to.

## What this does not verify

Worth stating plainly, because the gaps are the reason the check is cheap:

- **The library's own suite never runs under 20 or 21.** Its specs live in this
  workspace, and the workspace is on 22. The fixture re-tests the _contract_
  from the outside; a regression only the library's internal specs would catch
  stays uncaught on the older majors.
- **Only the latest patch of each major.** Whatever npm resolves the day it
  runs. Passing on 20.3.30 is not a statement about 20.0.0.
- **jsdom on Node, no browser.** No real-browser run, and no Karma.
- **Zoneless only.** The fixture bootstraps with
  `provideZonelessChangeDetection()`. A Zone.js application is not exercised,
  and that is still the common shape on Angular 20.
- **One Node version.** The one in `.nvmrc`, not each major's own supported
  floor. This is deliberate: the package declares no `engines` field, and the
  peer range is about Angular, not about Node.
- **Standalone only.** No `NgModule`-based consumer, no SSR, no
  `platform-server`.

## When it runs

- **Weekly**, on a schedule. The registry is what changes, not the diff.
- **On demand**, by `workflow_dispatch`.
- **Before every publish.** `release.yml` calls this workflow and its `release`
  job declares `needs: compat`, so nothing reaches npm unless all three majors
  answered. That is three full installs per release, and it is the right price
  for a range that would otherwise be a guess: `npm run check` type-checks
  against the Angular in this lockfile and proves nothing about the other two.

It is one workflow rather than two copies of the matrix, on purpose. Two
copies drift, and the one a release verifies is the one that would drift
unnoticed.

## Why it is not in `ci.yml`

Nothing in a pull request changes what npm resolves for Angular 20. Running
this on every PR would spend three installs to re-answer a question the diff
did not ask. What _does_ change is the registry: a patch release of a
supported major can break the package without a single commit here. That is a
clock, not an event.

A failure is not automatically a bug to fix. Tightening the declared range and
saying why is an equally valid answer. Since a failure now blocks the publish,
that answer has to be given before the release goes out rather than after.
