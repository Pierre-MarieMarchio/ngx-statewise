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

Format check, lint, library tests with coverage, both library entry points
built, showcase tests, showcase built. It must exit 0 from a clean tree.

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
3. computes the version, writes `projects/ngx-statewise/CHANGELOG.md`, commits and tags;
4. rebuilds the library so the published bundle carries the new version;
5. publishes to npm with [provenance](https://docs.npmjs.com/generating-provenance-statements), under the `beta` or `latest` dist-tag;
6. creates the GitHub release;
7. on `main`, opens the back-merge pull requests.

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

# A pull request and a green CI run for main, next and dev.
for branch in main next dev; do
  gh api -X PUT "repos/:owner/:repo/branches/$branch/protection" \
    --input - <<JSON
  {
    "required_status_checks": { "strict": true, "contexts": ["Validate workspace"] },
    "enforce_admins": false,
    "required_pull_request_reviews": null,
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false
  }
JSON
done
```

Without the first command, a squash merge is one click away and it breaks
versioning without any error. Without the second, a direct push to `main`
publishes to npm.

## Reporting

Bugs and features go through the [issue templates](.github/ISSUE_TEMPLATE).
Security reports go to [SECURITY.md](SECURITY.md) instead — not to a public
issue.
