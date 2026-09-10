# Contributing

Thanks for looking. This file is the whole workflow: what a change goes through,
how a version is decided, and the two rules that will silently break a release
if you ignore them.

## The two rules

1. **Merge with a merge commit. Never squash, never rebase-merge.** The version
   and the changelog are computed from the `BREAKING CHANGE` footers in the
   commit bodies. A squash merge rewrites those bodies into one, the footers are
   lost, and the next release quietly ships a minor where it owed a major. The
   repository is configured to allow merge commits only.
2. **Every pull request targets `dev`.** `next` and `main` receive whole
   branches, never individual features.

## Branches

| Branch | What it is  | What lands there            | Publishes           |
| ------ | ----------- | --------------------------- | ------------------- |
| `dev`  | Integration | Every pull request          | nothing             |
| `next` | Prerelease  | `dev`, as one pull request  | npm `beta` dist-tag |
| `main` | Stable      | `next`, as one pull request | npm `latest`        |

```
feature ──PR──▶ dev ──PR──▶ next ──PR──▶ main
                 ▲                         │
                 └──── back-merge PR ──────┘
```

`main` never diverges: pushing a release to it opens a back-merge pull request
into both `dev` and `next` automatically. Merge those, or the branches keep
releasing from a version that no longer matches `main` — which is exactly how
`next` once ended up two commits behind stable.

## A change, end to end

```bash
git switch dev && git pull
git switch -c feat/what-it-does
# … work …
npm run check          # must exit 0
git push -u origin feat/what-it-does
gh pr create --base dev
```

CI runs `npm run check` on the pull request and again on `dev` once it lands.
Nothing reaches `next` or `main` without having passed it.

### Commit messages

[Conventional commits](https://www.conventionalcommits.org), enforced by a
`commit-msg` hook. The type decides the version:

| Commit                                                                      | Effect on the version |
| --------------------------------------------------------------------------- | --------------------- |
| any type + a `BREAKING CHANGE:` footer                                      | major                 |
| `feat: …`                                                                   | minor                 |
| `fix: …`                                                                    | patch                 |
| `docs:`, `test:`, `chore:`, `refactor:`, `style:`, `ci:`, `build:`, `perf:` | patch                 |

Two things about that table are easy to misread, and both decide a release:

- **No type means "no release".** There is no such row, and there cannot be: the
  preset starts every commit at patch and only ever lowers that level. A release
  built from nothing but `chore:` and `docs:` still ships a patch — the changelog
  says `Version bump only for package ngx-statewise`, as it already has three
  times. Nothing here holds a version back; the commits only decide how far it
  moves.
- **A `!` in the header does nothing at all.** The preset's header pattern leaves
  no room for it, so `feat(effect)!: …` matches nothing and the commit is parsed
  with no type at all: it loses even the minor its `feat` would have earned and
  falls back to the baseline patch. Only the footer produces a major.

So a breaking change is the footer, and the header stays a plain type:

```
feat(effect): run an effect only for the manager owning its action

BREAKING CHANGE: an effect registered for an action type owned by an updater no
longer runs when that action is dispatched through another manager.
```

## Verification

```bash
npm run check
```

Format check, lint, the documentation site's own checks, library tests with
coverage, both library entry points built, the compatibility fixture
type-checked, the site's claims about the library remeasured, the API page
checked against the built surface, showcase tests, showcase built, docs tests,
docs built. It must exit 0 from a clean tree.

Never check it with `npm run check | tail`: the exit status you would read is
`tail`'s, so a failing run reports 0. Redirect to a file instead.

The library is held to **100% statements, lines and functions, and 95%
branches**, and the gate fails the command. Both halves of it live on the
library's `test` target in [`angular.json`](angular.json):

- `coverageThresholds` holds the numbers;
- `coverageInclude` is what makes a source **no test imports** still count.
  Remove it and Vitest reports only the files a test happened to load, so an
  untested file would score 100% by being invisible.

Keep them together when you touch either. The way to check the guard is still a
guard: drop a file with an untested function under
`projects/ngx-statewise/src/lib/`, and the command must exit 1.

The showcase is tested but deliberately outside the gate.

> The showcase resolves `ngx-statewise` to `dist/`, not to the sources, so
> `npm run build:library` has to run before serving or testing it. `npm run check`
> already orders this correctly. Never rebuild the library while `npm start` is
> serving — restart the serve instead.

### What CI adds that `npm run check` cannot

A pull request also faces **SonarCloud**, and nothing local reports it. The scan
runs in [`ci.yml`](.github/workflows/ci.yml) straight after `npm run check`, on
the coverage that command has just written —
[`sonar-project.properties`](sonar-project.properties) says what it reads and
what it leaves out.

The condition that catches people is **duplication: more than 3% of the new
lines fails the gate**. Copying one template block into four sibling components
is enough — 19.6% once, on four copies of a single `matColumnDef`. Specs are
indexed as tests rather than as sources, so a fixture arranged the same way in
four files does not count against it; production markup and code do.

What is left on an open pull request, named file by file:

```bash
curl -s "https://sonarcloud.io/api/measures/component_tree?component=Pierre-MarieMarchio_ngx-statewise&pullRequest=<n>&metricKeys=new_duplicated_lines_density,new_lines&ps=200"
```

A run with no `SONAR_TOKEN` skips the scan rather than failing it, because that
is what a pull request from a fork looks like and the contributor cannot fix it.
The consequence is worth knowing: the gate is a required check, so a fork's
pull request cannot go green on its own. A maintainer has to push the branch to
this repository and open the pull request from there.

## Adding a page to the guide

The guide is at
[`projects/ngx-statewise-docs`](projects/ngx-statewise-docs). A page is one
markdown file that declares itself, plus one line saying where it is read.

**1. Write the file** at
`projects/ngx-statewise-docs/src/app/features/guide/content/en/<slug>.md`. It
opens with its own metadata, and the slug has to be the filename:

```markdown
---
slug: interceptors
title:
  en: Interceptors
  fr: Interceptors
  es: Interceptors
  de: Interceptors
  pt-BR: Interceptors
summary:
  en: Asking before an updater applies.
  fr: Demander avant qu'un updater s'applique.
  es: Preguntar antes de que un updater se aplique.
  de: Fragen, bevor ein Updater greift.
  pt-BR: Perguntar antes de um updater se aplicar.
---

# Interceptors

The first heading repeats the English title, and a spec holds you to it.
```

The title and the summary are needed in all five locales because the interface
is translated even though the guide is not: they are what the sidebar, the
landing page's contents and the browser tab show. The prose itself stays in
English, with the banner every page carries.

A value runs to the end of its line, so a colon inside a summary needs no
quoting. Only `slug`, `title` and `summary` are read; anything else in the
block is an error rather than a silently ignored line.

**2. Place it** in
[`guide-pages.ts`](projects/ngx-statewise-docs/src/app/features/guide/guide-pages.ts) —
an import, and the identifier in the section it belongs to, at the position it
should be read at:

```typescript
import interceptorsEn from './content/en/interceptors.md';

// …
  {
    title: { en: 'Key concepts' /* … */ },
    pages: [statesEn, actionsEn, updatersEn, effectsEn, interceptorsEn],
  },
```

That file holds sections and reading order and nothing else. The router, the
sidebar, the landing page's contents, the previous/next footer and the search
index are all derived from it, so those five need no edit.

Run `npm run format` after this step. One more identifier is usually what
pushes a `pages:` line past Prettier's width, and `npm run check` starts with
`format:check`.

**That is the whole change.** Fenced blocks take `title="auth.updater.ts"` and
a `prefer` or `avoid` stance; callouts use GitHub's `> [!NOTE]` syntax. Links
between pages are absolute, `](/guide/effects#scope)`, never bare anchors.

### What fails if you stop half way

Nothing about a page is checked by eye:

- a missing title or summary in any locale, a slug that could not be a URL
  segment, or two pages claiming one slug **fails the prerender and every
  spec** — the metadata is read while the module loads;
- an import you forgot to place in a section is an unused binding, so
  **`npm run lint`** refuses it;
- a markdown file no one imported, or a slug that disagrees with its filename,
  is invisible from inside the bundle, so **`npm run verify:docs`** checks
  those against the filesystem;
- a page whose first heading is not its English title fails
  `guide-pages.spec.ts`.

### The API page is checked, in both directions

`api.md` is written by hand on purpose: a generated reference gives a signature
and never says why you would reach for the thing. What it costs is drift, so
`npm run verify:api` reads the built `.d.ts` of both entry points and holds the
page to it.

It fails two ways. An export with no entry ships undocumented, findable only by
reading the type definitions. An entry naming no export sends a reader to write
code against a name that is not there.

An entry is a `### <name>` section, or a row of the exported-types table for a
type that needs no signature of its own. Names prefixed with `ɵ` are skipped,
since both the README and the page say they are outside the contract.

To translate a page's prose rather than add one, put the translation at
`content/<locale>/<slug>.md` — body only, no metadata block — and give the
registry the object form: `{ source: effectsEn, translations: { fr: effectsFr } }`.

## Releasing

Releases are driven by [release-it](https://github.com/release-it/release-it)
from the conventional-commit history. Nobody types a version number.

```bash
gh pr create --base next --head dev   # then merge → publishes a beta
gh pr create --base main --head next  # then merge → publishes the stable
```

Merging into `next` or `main` runs `.github/workflows/release.yml`, which:

1. runs `npm run check` and stops there if it fails — nothing is tagged or published;
2. refuses to continue if the branch moved since the run started;
3. cuts a `release/…` branch. A required status check applies to a direct push
   as much as to a merge, and the workflow's token has write access rather than
   admin, so the version commit cannot reach `main` or `next` any other way;
4. computes the version, writes `projects/ngx-statewise/CHANGELOG.md`, commits and tags;
5. rebuilds the library so the published bundle carries the new version, and
   writes the same version into the site's `LIBRARY_VERSION` so both travel in
   the release commit — without that step `verify:claims` fails on the very
   next run, on `main` and on the back-merge pull request;
6. publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements), under the `beta` or `latest` dist-tag;
7. creates the GitHub release;
8. opens a pull request for the version commit and merges it once the checks
   that branch requires have passed. The tag and the package exist by then, so
   a pull request that will not merge is a conflict to land by hand rather than
   a release to redo — and the step says so and fails, instead of leaving the
   run green with the commit still floating;
9. on `main`, deploys the documentation site — after the publish, never before,
   so the site cannot state a version npm does not have;
10. on `main`, opens the back-merge pull requests.

### Why `next` exists

`next` is a quality gate, not a version trick: a beta is installable
(`npm i ngx-statewise@beta`) and gives real usage a chance to find what the test
suite cannot before the version becomes `latest`.

### Running a release by hand

Only if the workflow is unavailable. It needs push rights, an npm token and a
`GITHUB_TOKEN`, and it will refuse to run from any branch but `next` or `main`.

```bash
npm run release:beta     # from next
npm run release:stable   # from main
```

Add `-- --dry-run` to see what it would do without touching anything.

## Repository settings this workflow assumes

Set once, with the `gh` CLI:

```bash
# Merge commits only — this is what protects the BREAKING CHANGE footers.
gh api -X PATCH repos/:owner/:repo \
  -F allow_squash_merge=false -F allow_rebase_merge=false \
  -F allow_merge_commit=true -F delete_branch_on_merge=true

# A green CI run and a passing quality gate on main, next and dev. `main`
# matters most of the three: it is the branch that publishes.
#
# `strict` — "the branch must be up to date with the base" — is true only on
# main, where the two pull requests that arrive (next, and the release
# workflow's own) are up to date by construction. It has to be false on next
# and dev, because the back-merge pull request runs the other way: its head is
# main, and every commit that lands on dev meanwhile leaves it BEHIND. The
# button GitHub then offers would merge dev into main, which protection
# refuses — so the back-merge would sit there, and the branches would drift
# apart exactly as this workflow exists to prevent.
for branch in next dev; do
  gh api -X PUT "repos/:owner/:repo/branches/$branch/protection" \
    --input - <<JSON
  {
    "required_status_checks": {
      "strict": false,
      "contexts": ["Validate workspace", "SonarCloud Code Analysis"]
    },
    "enforce_admins": false,
    "required_pull_request_reviews": null,
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_conversation_resolution": true
  }
JSON
done

gh api -X PUT "repos/:owner/:repo/branches/main/protection" --input - <<JSON
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["Validate workspace", "SonarCloud Code Analysis"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
JSON
```

Without the first command, a squash merge is one click away and it breaks
versioning without any error. Without the second, a direct push to `main`
publishes to npm.

The second command is also why the release workflow builds its version commit
on a `release/…` branch: those checks bind the release automation exactly as
they bind you, and GitHub's own Actions app cannot be given a bypass on a
personal repository — that is an organization-only setting. Nothing is exempt,
which is the point.

### The four things `gh` cannot set

Each is a switch somewhere else, and each one silently changes what a green
run means.

1. **`SONAR_TOKEN`, as an Actions secret.** Generated under _My Account →
   Security_ on SonarCloud. `gh secret set SONAR_TOKEN`.
2. **`SONAR_TOKEN` again, as a Dependabot secret.** Dependabot's runs read a
   separate store, and a pull request of its own that cannot reach SonarCloud
   never gets the check that `dev` requires — so it sits blocked forever.
   `gh secret set SONAR_TOKEN --app dependabot`.
3. **SonarCloud's Automatic Analysis, off.** _Administration → Analysis
   Method_ on the project. It and the CI scanner are exclusive: while it is
   on, the scan in `ci.yml` is refused. It is also what makes the coverage
   worth having — Automatic Analysis reads the repository without the build,
   so it could never see an lcov file and judged the library's 100% coverage
   as no coverage at all.
4. **Pages, served from GitHub Actions.** `deploy-docs.yml` turns this on by
   itself the first time it runs, through `configure-pages` with
   `enablement: true`. If that ever fails, it is _Settings → Pages → Source:
   GitHub Actions_.

## Reporting

Bugs and features go through the [issue templates](.github/ISSUE_TEMPLATE).
Security reports go to [SECURITY.md](SECURITY.md) instead — not to a public
issue.
