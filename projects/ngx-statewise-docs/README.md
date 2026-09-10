# ngx-statewise-docs

The documentation site, served at
<https://pierre-mariemarchio.github.io/ngx-statewise/>. It is a third Angular
application in this workspace, private, prerendered to static files, and it is
the guide's single source of truth — the library's own README is an overview
that links here.

```bash
npm run start:docs   # serve it
npm run verify:docs  # what its build cannot check about itself
npm run verify:api   # the API page against the library's built surface
```

To add or change a page of the guide, see
[CONTRIBUTING.md](../../CONTRIBUTING.md#adding-a-page-to-the-guide). This file
is about how the application is arranged.

## The layers

```
src/app/
  app.routes.ts                       the only file that reaches into pages/
  core/
    i18n/                             the two locales and the interface strings
    ui-state/                         the theme and the drawers
      states/docs-ui/                 action, effect, manager, state, updater
      models/theme.model.ts           the theme's types and constants
      utils/theme.utils.ts            resolving a choice against the system
      services/                       reading the document, the media query, storage
    site.ts                           the repository, npm and version claims
  features/
    guide/                            content, metadata, rendering, search index
    flow-demo/                        the live flow on the landing page
      components/flow-demo/
      states/flow-demo/               action, effect, manager, state, updater
  shared/ui/
    icon/
  pages/
    shell/                            the layout every route renders inside
      components/search-dialog/
    home/                             the landing page
    guide/                            every /guide/<slug> route
```

Two groupings, both the showcase's:

- **a component lives in a folder carrying its name**, and a folder that holds
  more than components groups them under `components/`. A page component sits
  directly in its page's folder, because there is only ever one of it.
- **the library's own files live under `states/<name>/`** — the action, the
  updater, the effect, the manager and the state of one thing, together. It is
  five files for one concept, so they are the fastest way to make a folder
  unreadable when they are loose in it, and a second state would double that.

Everything else in a folder is sorted the same way as in the showcase:
`models/<name>.model.ts` for types and the constants that belong with them,
`utils/<name>.utils.ts` for pure functions, `services/<name>.service.ts` for
what needs injecting. `utils/` carries no barrel, exactly as `core/utils/` in
the showcase carries none.

None of this is only tidiness: it is where a reader of the showcase already
looks, and it means adding a component, a second state or a second service
moves nothing.

Same four layers as
[the showcase](../ngx-statewise-showcase), because a reader who knows one
application in this workspace should not have to learn another. What is **not**
taken from it is the subdivision inside a feature — `guards/`, `interceptors/`,
`models/`, `pages/`, `services/`, `states/`. The showcase has real guards and
real interceptors; this site has none, and folders holding one file each are
ceremony. The layering carries information here; the subdivision would not.

## The import law

Each layer reaches downwards, never sideways and never up.

| This layer   | may import                      | and never                        |
| ------------ | ------------------------------- | -------------------------------- |
| `pages/`     | `core/`, `features/`, `shared/` | —                                |
| `features/`  | `core/`, `shared/`              | `pages/`, **another feature**    |
| `shared/ui/` | `core/`                         | `features/`, `pages/`            |
| `core/`      | nothing else under `app/`       | `features/`, `shared/`, `pages/` |

Two consequences are worth stating, because both were decided against the
obvious alternative:

- **`core/` may name no part of the documentation.** i18n was the one place
  that broke this: its strings module imported `guide/callout` for two types.
  Building the callout labels now lives in `features/guide/callout-labels.ts`
  and reads the translations, so the arrow points the one way that holds.
- **No feature imports another feature.** That absolute is what makes the rest
  hold, and it is why the guide's search index lives inside
  `features/guide/`: the index is built from the guide's own markdown, so a
  `features/search/` would have had to import `features/guide/` on its first
  line. The search _dialog_ went to `pages/shell/` instead, because the shell
  is what opens it.

The law is not a convention here. It is
[`no-restricted-imports`](../../eslint.config.js), generated from a table of
zones where each row says what that zone may not reach for, so breaking it
fails `npm run lint`. The showcase has the same four layers and the same
mechanism — `zoneLaws()` serves both, and the two applications differ only in
their table, because a second scheme beside it would be a second thing to keep
true.

A pattern there matches the import string, not a resolved path. That is why
the cross-feature rule names each feature one by one, and names it at any
depth. `../flow-demo/index` climbs out of `features/guide/` without ever
writing the word `features`, and how far it climbs depends on how deep the
importing file sits — `../../../guide/guide-pages` from a component two folders
down. A relative pattern pins the depth and lets the deeper file through, which
is what happened when `components/<name>/` was introduced, so the sibling
patterns are `**`-prefixed. The shape that would say it generically —
`../!(..)/**` — matches nothing, because `no-restricted-imports` does not read
extglob. A pattern that guards no import is worse than no pattern, so
`npm run verify:docs` fails when that list and `app/features/` stop agreeing.

## Constraints that shape the code

These are not preferences, and each of them has something that fails when it
is broken.

- **Everything is prerendered.** `outputMode: 'static'`, 37 routes, no server.
  What is above the fold has to exist in the served HTML with no JavaScript.
- **Zoneless.** No `zone.js`, no `provideZoneChangeDetection`.
- **Offline build.** `npm run check` never reaches the network. The fonts are
  Fontsource packages pinned in `package.json`, not a stylesheet from a CDN.
- **No Angular Material.**
- **Two locales, the interface only.** The guide stays in English and every
  page carries the banner saying so. `guide-pages.ts` refuses a page missing a
  title or a summary in either of them.
- **AA contrast (4.5:1) in both themes.** Measure it; do not assume it.
- **The rendered guide is trusted HTML.** `bypassSecurityTrustHtml` is
  deliberate: Angular's sanitizer strips `id` attributes, which are exactly
  what the heading anchors and the on-page table of contents are made of. The
  markdown is repository content compiled into the bundle, never user input.
  Two specs fail if the bypass is removed.
- **A component must not `@use` the global sheet.** It would inline all of it
  into that component's styles. `assets/_scroll-shadows.scss` exists for
  exactly that reason — the mixin lives on its own so a component can take it
  without taking the sheet.
- **`outputHashing: "bundles"`, not `"all"`.** A `<link rel="preload">` cannot
  name a file whose hash it does not know.
