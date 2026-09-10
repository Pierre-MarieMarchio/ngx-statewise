# What ngx-statewise adds

`projects/ngx-statewise/README.md` publishes two numbers about weight. This
directory is where they come from, and the reason they are not the number the
documentation site publishes.

## The two questions, and why they need different answers

**"How big is this package?"** is answered by `scripts/verify-site-claims.mjs`:
the whole public barrel bundled on its own, minified and gzipped, with Angular
and RxJS left out. That runs in `npm run check`, and the site quotes it.

**"What does importing it cost me?"** is a different question, and the first
answer cannot stand in for it. Bundling the barrel retains every export whether
an application reaches for it or not, and it never runs the Angular linker over
the partial-compilation output the package actually ships.

## What this measures

```bash
npm run measure:size
```

Three production builds of one throwaway application, differing only in
`src/app/subject.ts`:

| Variant    | What it imports                                           |
| ---------- | --------------------------------------------------------- |
| `baseline` | nothing from the library                                  |
| `helpers`  | `defineActionsGroup`, `payload`, `emptyPayload`, `ofType` |
| `full`     | every public export, retained through `Object.keys`       |

What it reports is the two deltas against the baseline, so the figures are the
library's cost and not Angular's. The absolute baseline is printed alongside
only so the deltas can be sanity-checked against it.

Both variants render their result into the DOM. A build that discarded the
subject would weigh an empty application three times over and report that the
library is free.

## The correction it produced

This measurement was written to re-take one that had been done with a plain
bundler, which concluded that three quarters of the package's weight was
irreducible and that the action helpers could not be had without the engine.

Through Angular's own pipeline that is not so: the helpers cost **0.2 kB
gzipped** on their own. The floor was an artefact of bundling the whole barrel,
which retains every export whether an application imports it or not.

Both methods are still here, which is the point of keeping two. The barrel
measurement is `scripts/verify-site-claims.mjs` and answers "how big is this
package"; this directory answers "what does importing it cost me". Neither
number is wrong, and the guide says which is which.

## The ceiling

`CEILING_KB` in `measure.mjs` is a tripwire, not a target. Both values sit a
little above what the README publishes: ordinary drift shows up as a diff in
that file, and a step change fails the run.

Raising one is a decision. The commit that raises it should say what bought the
bytes.

## Why it is not in `npm run check`

It needs a full `npm install` of a fixture outside the repository, which is
minutes per run spent re-answering a question most diffs do not ask. What moves the answer
is a new export or a new dependency edge, which is a slow clock rather than an
event, so `bundle-size.yml` runs it weekly and on demand. That workflow also
declares `workflow_call`, so it can be made a release gate the way the
compatibility check is, if the weekly cadence ever proves too slow.
