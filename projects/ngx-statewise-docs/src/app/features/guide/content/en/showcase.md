---
slug: showcase
title:
  en: The showcase
  fr: L’application de démonstration
summary:
  en: A working application, and which screen demonstrates which mechanism.
  fr: Une application complète, et quel écran démontre quel mécanisme.
---

# The showcase

A working application built on the library, in this repository at
`projects/ngx-statewise-showcase`. It is where every mechanism the guide
explains is used against a real feature rather than a snippet.

It is not deployed. Read it from the repository, or run it:

```bash
npm install
npm run build:library   # the showcase resolves ngx-statewise to dist/
npm start
```

> [!IMPORTANT]
> Build the library before serving, never during. The showcase imports
> `ngx-statewise` from `dist/`, so a rebuild while `npm start` is running
> leaves the serve holding files that have been replaced underneath it.
> Restart the serve to recover.

## Which screen shows what

Five screens. The first two are the flow, the third is the interesting one, and
the last two exist to make the library's own behaviour visible.

| Screen     | Route      | What it demonstrates                                                  |
| ---------- | ---------- | --------------------------------------------------------------------- |
| Sign in    | `/login`   | A fire-and-forget dispatch, and navigation inside the effect          |
| Dashboard  | `/home`    | One login reloading two other features, inside the same cascade       |
| Task board | `/task`    | Every `createEffect` option, against drag, search, create and delete  |
| State      | `/state`   | An interceptor refusing, a global updater, and plain-property state   |
| History    | `/history` | `ActionHistory.snapshot()`, its cascade paths, and a redacted payload |

## Sign in

The component hands the form to the manager and stops there:

```typescript title="login-page.component.ts"
public onFormSubmit(formData: LoginSubmit) {
  this.authManager.login(formData);
}
```

It never sees an action, and it does not navigate either. `AuthManager.login`
still returns the promise, because a manager method other features may call
[exposes the promise](/guide/managers#which-form-a-manager-exposes) whether
this caller wants it or not:

```typescript title="auth.manager.ts"
public login(credential: LoginSubmit): Promise<void> {
  return this.statewise.dispatchAsync(loginActions.request(credential));
}
```

Ignoring it here is deliberate. Nothing on the login page waits on the outcome,
and the navigation belongs to the effect below.

`loginRequestEffect` declares `concurrency: 'latest'`, and its comment is worth
reading for how a policy gets chosen. Two paths reach it: a double-clicked
submit, and the dashboard's user picker, where a second click is a deliberate
switch. `'first'` would fix the double click by ignoring the switch, so the
earlier attempt is abandoned instead.

Concepts: [Managers](/guide/managers), [Effects](/guide/effects).

## Dashboard

`loginSuccessEffect` is where both halves of the cross-feature rule sit in one
handler:

```typescript title="auth.effect.ts"
public readonly loginSuccessEffect = createEffect(
  loginActions.success,
  (session) => {
    this.projectManager.getAll();
    this.taskManager.getAll();
    this.router.navigate(['/']);

    return getMembersActions.request(session.userId);
  },
);
```

The two `getAll()` calls go to other features, so they cannot be returned as
actions. The handler is synchronous, so both reloads are adopted into the login
cascade anyway, and one `dispatchAsync` covers all three flows. That is the
rule [crossing a feature boundary](/guide/managers#crossing-a-feature-boundary)
states, and this is where you can watch it hold.

The returned action goes the other way. The team directory is auth's own state,
so `getMembersActions.request` is auth's action to return, and returning it
keeps that step visible in the action history.

`projectManager` and `taskManager` are not imported. They arrive as
`PROJECT_RELOAD` and `TASK_RELOAD`, two injection tokens aliased onto the real
managers with `useExisting` in `app.config.ts`, so `features/auth` reloads
tasks without importing `features/project` — which the import law forbids.

## Task board

The fullest screen, and the one to read first. `task.effect.ts` declares five
effects, and between them they use every option
[`createEffect`](/guide/effects#governing-the-runs) takes.

| Effect  | Options                                                        | Why                                                       |
| ------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| get all | `concurrency: 'latest'`, `cancelOn`, `mustAnswer`              | A reload started twice keeps the newer answer             |
| update  | `'latest'`, `key: (task) => task.id`, `cancelOn`, `mustAnswer` | Dragging a second card must not abandon the first's write |
| search  | `'latest'`, `cancelOn: [taskReset, searchCleared]`             | Two actions can make the results unwanted                 |
| create  | `concurrency: 'first'`, `cancelOn`, `mustAnswer`               | A double-submitted form creates one task                  |
| delete  | `'first'`, `key: (taskId) => taskId`, `cancelOn`, `mustAnswer` | Deleting one row twice is one delete, two rows are two    |

`key` is the option worth seeing in place. Without it, `'latest'` weighs every
run of the effect against every other one, so dragging a second card would
abandon the first card's write. With it, the runs split into one group per task
id, and only a second drag of the _same_ card supersedes anything.

`task.updater.ts` uses [`requestStatus`](/guide/updaters#request-status) for
the read flow and writes the optimistic flows out by hand. Both shapes sit in
one file on purpose: the helper covers two flags, and a rollback point per
entity is logic rather than boilerplate.

Concepts: [Effects](/guide/effects), [Updaters](/guide/updaters). Recipes:
[Cancelling a request](/guide/cancelling-requests),
[Optimistic updates](/guide/optimistic-updates).

## State

Three things the guide describes separately, on one screen.

**An interceptor refusing.** `TallyGuard` caps a counter at 20. Press the
increment past the ceiling and nothing happens: no state change, no history
entry, and the dispatch still resolves.
[Interceptors](/guide/interceptors) quotes the class in full, comments
included.

**A global updater.** `noticeUpdater` is registered through
`provideStatewise({ updaters })` rather than by a manager. Nothing claims
`NOTICE_RAISED`, which is the condition for a global updater to answer, so any
handle reaches it — including `injectStatewise()` with no updater at all. See
[attaching updaters](/guide/updaters#attaching-updaters).

**Plain-property state.** `TallyState` holds two numbers and no signal, which
is legal and has a cost:

```typescript title="tally.state.ts"
@Injectable({ providedIn: 'root' })
export class TallyState {
  public total = 0;
  public lastStep = 0;
}
```

The updater writes them the same way it writes signals. What the template loses
is redrawing on its own. [States](/guide/states) has the measurement, and
`src/integration/zoneless-plain-properties.spec.ts` is where it was taken.

This screen is also where the library's own reports surface.
`ShowcaseErrorHandler` is provided as Angular's `ErrorHandler`, and it turns a
misrouted dispatch, or an effect that declared `mustAnswer` and produced none,
into state the page renders.

## History

`provideStatewise({ history: { limit: 50, redact: withoutCredentials } })`, read
back with `inject(ActionHistory).snapshot()`.

Two things are worth looking at here. Each entry carries the cascade path that
led to it, so a login and the two reloads it triggered read as one chain rather
than as three unrelated rows. And the login entry's password is `[redacted]`,
because `auth.redaction.ts` strips it on the way in:

```typescript title="auth.redaction.ts"
export function withoutCredentials(action: Action): Action {
  if (action.type !== ofType(loginActions.request)) {
    return action;
  }

  const { email } = action.payload as LoginSubmit;

  return { type: action.type, payload: { email, password: '[redacted]' } };
}
```

The hook is wired once, application-wide. What an action carries is known by
the feature that declared it, which is why the function lives beside the
action rather than beside the provider.

Reference: [`ActionHistory`](/guide/api#actionhistory).

## The integration suites

Four suites under `src/integration/` test mechanisms rather than components,
and each is short enough to read as documentation:

| Suite                       | What it pins down                                          |
| --------------------------- | ---------------------------------------------------------- |
| `creating-and-refusing`     | A create flow, and what a refusal leaves behind            |
| `interceptor-chain`         | Several interceptors on one action, and where asking stops |
| `history-redaction`         | That the password never reaches the history                |
| `zoneless-plain-properties` | What a plain property costs a template, under zoneless     |

The last one is the measurement [States](/guide/states) quotes. It builds a
component over plain properties, writes them through an updater, and checks
what the view shows.

## How it is arranged

Four layers, and each reaches downwards only: `core/`, `features/`,
`shared/ui/`, `pages/`. A feature never imports another feature. The rule is
`no-restricted-imports` in `eslint.config.js` rather than a convention, so
breaking it fails `npm run lint`.

The library's own files sit together under `features/<name>/states/<name>/`:
the action, the state, the updater, the effect and the manager of one thing,
five files in one folder. The documentation site follows the same layout, so
reading one application teaches you the other.

Next: [Testing](/guide/testing) for the entry point these suites use, or the
[API reference](/guide/api).
