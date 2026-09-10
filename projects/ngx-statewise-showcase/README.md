# ngx-statewise-showcase

A working application built on the library, private and never published. It is
the reference example: every mechanism the guide explains is used here against
a real feature.

The guide's [showcase page](https://pierre-mariemarchio.github.io/ngx-statewise/guide/showcase)
is the tour, and it says which screen demonstrates which mechanism. This file
is about running it and how it is arranged.

## Running it

```bash
npm install
npm run build:library   # required: this app resolves ngx-statewise to dist/
npm start
```

The backend is faked by an HTTP interceptor, so there is nothing to start
beside it. Sign in as `admin@admin` / `admin`, or as `user1@user` / `user1`.
The seed data is `src/app/fake-backend/db.data.ts`.

> Never run `npm run build:library` while `npm start` is serving. The serve
> holds the files the build replaces underneath it. Restart the serve to
> recover. `npm run check` already orders the two correctly.

```bash
npm run test:showcase   # 57 spec files, in jsdom
```

The showcase is tested but deliberately outside the library's coverage gate.
That gate protects a published contract; this application's value is being
runnable and exemplary, and forcing full coverage on SCSS-heavy components
produces ceremony that protects nothing.

## The five screens

| Route      | What it is | What it demonstrates                                            |
| ---------- | ---------- | --------------------------------------------------------------- |
| `/login`   | Sign in    | A fire-and-forget dispatch, navigation inside the effect        |
| `/home`    | Dashboard  | One login reloading two other features in the same cascade      |
| `/task`    | Task board | Every `createEffect` option, on drag, search, create, delete    |
| `/state`   | State      | An interceptor refusing, a global updater, plain-property state |
| `/history` | History    | `ActionHistory.snapshot()`, cascade paths, a redacted payload   |

## How it is wired

`app.config.ts` is worth reading first. It is the only place the library is
configured, and it uses every option `provideStatewise` takes:

```typescript
provideStatewise({
  effects: [AuthEffect, TaskEffect, ProjectEffect],
  interceptors: [TallyGuard],
  updaters: [noticeUpdater],
  history: { limit: 50, redact: withoutCredentials },
});
```

`ShowcaseErrorHandler` replaces Angular's `ErrorHandler`, so everything the
library reports — a misrouted dispatch, an effect that declared `mustAnswer`
and produced none — becomes state the `/state` page renders instead of a
console line nobody reads.

## The layers

```
src/app/
  core/                 error handling, shared services, utils
  fake-backend/         the HTTP interceptor standing in for an API
  features/
    auth/               sign-in, the session, the team directory
    project/            projects and tasks
    inspection/         the tally and the notice, which exist to be watched
    common/             the ports features answer for each other
  shared/ui/            presentational components
  pages/                one folder per route
  integration/          suites that test mechanisms rather than components
```

Each layer reaches downwards only, and **a feature never imports another
feature**. That is not a convention: it is `no-restricted-imports` in
[`eslint.config.js`](../../eslint.config.js), so breaking it fails
`npm run lint`.

Where two features need each other, the shared kernel in `features/common/`
declares a port and the composition root answers it. `features/auth` reloads
tasks through `TASK_RELOAD`, an injection token aliased onto `TaskManager` with
`useExisting`, and never names `features/project` at all.

The library's own files sit together under `features/<name>/states/<name>/` —
the action, the state, the updater, the effect and the manager of one thing.
Five files for one concept, so they get a folder rather than being loose beside
the components. The documentation site uses the same layout, so reading one
application teaches you the other.

## The integration suites

Four suites under `src/integration/` test the library's behaviour rather than a
component, and each is short enough to read as documentation:

| Suite                       | What it pins down                                          |
| --------------------------- | ---------------------------------------------------------- |
| `creating-and-refusing`     | A create flow, and what a refusal leaves behind            |
| `interceptor-chain`         | Several interceptors on one action, and where asking stops |
| `history-redaction`         | That the password never reaches the history                |
| `zoneless-plain-properties` | What a plain property costs a template, under zoneless     |

The last one is the measurement the guide's
[States](https://pierre-mariemarchio.github.io/ngx-statewise/guide/states) page
quotes.
