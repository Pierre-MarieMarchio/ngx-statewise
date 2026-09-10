# ngx-statewise

State management for Angular, built on signals.

An action says what happened. An updater applies it to state, synchronously. An
effect does the asynchronous work.

**📖 [Read the documentation](https://pierre-mariemarchio.github.io/ngx-statewise/)**.
This page is the overview. The guide is on the site.

## Installation

```bash
npm install ngx-statewise
```

`ngx-statewise` supports Angular 20, 21 and 22, and needs `rxjs` ^7.4.

## Setup

`provideStatewise()` is the single entry point, and is called **once**, at the
application root. It wires the execution engine and registers your effects and
your global updaters.

```typescript
import { provideStatewise } from 'ngx-statewise';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStatewise({
      effects: [AuthEffect, UserEffect],
    }),
  ],
};
```

→ [Getting started](https://pierre-mariemarchio.github.io/ngx-statewise/guide/getting-started)
for every option it takes.

## Quick start

State is a plain injectable holding signals. An action carries what changed, an
updater applies it, an effect handles everything else, and a manager is what
your components talk to.

```typescript
// State: signals, so components re-render on their own
@Injectable({ providedIn: 'root' })
export class AuthState {
  public user = signal<User | null>(null);
  public isLoading = signal(false);
}

// Actions: the types LOGIN_REQUEST, LOGIN_SUCCESS and LOGIN_FAILURE
export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<Credentials>(),
    success: payload<User>(),
    failure: emptyPayload,
  },
});

// Updater: synchronous, and the only place state changes
export const authUpdater = defineUpdater(AuthState, (on) => {
  on(loginActions.request, (state) => state.isLoading.set(true));
  on(loginActions.success, (state, user) => {
    state.user.set(user);
    state.isLoading.set(false);
  });
});

// Effect: the asynchronous work, returning the next action
@Injectable({ providedIn: 'root' })
export class AuthEffect {
  private readonly repository = inject(AuthRepository);

  private readonly login = createEffect(loginActions.request, async (credentials) => {
    try {
      return loginActions.success(await this.repository.login(credentials));
    } catch {
      return loginActions.failure();
    }
  });
}

// Manager: exposes the state and dispatches, in its own scope
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly state = inject(AuthState);
  private readonly statewise = injectStatewise(authUpdater);

  public readonly user = this.state.user.asReadonly();
  public readonly isLoading = this.state.isLoading.asReadonly();

  // Resolves once the whole cascade is over, nested effects included
  public login(credentials: Credentials): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }
}
```

The flow is one-way: **action → optional interceptor → updater → effect →
possibly more actions**. The state is settled before any effect runs, and
`dispatchAsync` awaits the entire chain.

## The guide

The full guide is on the site, with a sidebar. Four entry points, depending on
what you came for:

- **[Introduction](https://pierre-mariemarchio.github.io/ngx-statewise/guide/introduction)**:
  the flow, and a mapping table if you are coming from NgRx.
- **[Getting started](https://pierre-mariemarchio.github.io/ngx-statewise/guide/getting-started)**:
  installation, every `provideStatewise` option, and a first feature.
- **[API reference](https://pierre-mariemarchio.github.io/ngx-statewise/guide/api)**:
  every export, with the signature the compiler sees.
- **[Why ngx-statewise](https://pierre-mariemarchio.github.io/ngx-statewise/guide/why)**:
  what it costs you in lines, measured, and five cases where something else
  serves you better.

There is also a [showcase](https://pierre-mariemarchio.github.io/ngx-statewise/guide/showcase):
a working application in the repository where every mechanism is used against a
real feature.

## Migrating from 0.6.x

The execution core was rewritten. The concepts are unchanged; the names and the
wiring are not. Four behaviours changed beyond the renames:

- **Dispatching an action owned by another manager throws** in development, and
  reports to Angular's `ErrorHandler` in production, instead of silently doing
  nothing.
- **An effect runs only for the manager owning its action's updater.**
  Registration stays application-wide; visibility does not.
- **`waitForEffect` and `waitForAllEffects` are scoped to the manager** that
  owns them, and `waitForEffect` no longer takes a raw action-type string.
- **The action history left the dispatch handle.** `statewise.recordedActions()`
  is gone; inject `ActionHistory` and call `snapshot()`, which answers
  `readonly HistoryEntry[]`. Each entry carries the action, the cascade path
  that led to it, and when it was recorded.

→ [Migrating from 0.6.x](https://pierre-mariemarchio.github.io/ngx-statewise/guide/migration)
has the full rename table and before/after examples.

## What it weighs

What importing it adds to an application, measured through Angular's own
production pipeline as the delta against the same application built without it:

| What you import         | Adds, gzipped |
| ----------------------- | ------------- |
| the action helpers only | 0.2 kB        |
| every public export     | 4.2 kB        |

```bash
npm run measure:size
```

Three production builds of one throwaway application, so the figures are this
library's cost rather than Angular's. Both carry a ceiling in that script. A
measurement without one is taken once and never again.

## Zoneless, and SSR

Both are supported, and both answers are measured rather than assumed.

**Zoneless is the only mode in which the published package is exercised.** The
compatibility fixture bootstraps with `provideZonelessChangeDetection()`, and it
builds and passes its specs on all three supported majors.

The library has no coupling to Zone.js. Its single mention anywhere is a comment
explaining why a promise is duck-typed rather than checked with `instanceof`, so
that Zone.js's `ZoneAwarePromise` still works. A test holds that compatibility
rather than intent: `effect-outcome.spec.ts` > _awaits a promise that is not an
instance of the global Promise_ builds a promise its own global constructor
disowns.

**SSR is safe, with one caveat worth stating.** The engine's seven classes are
provided without `providedIn`, so there is one set per environment injector,
which on a server means one per request. No browser API is touched anywhere: no
`window`, no
`document`, no `localStorage`, no `navigator`, no `location`. The only global is
`AbortController`.

The caveat: the one piece of module-level mutable state in the whole library is
the `Set` of action types that updaters have declared, used to detect a dispatch
that reached the wrong manager. **That `Set` is shared by the process**, so two
distinct applications served by one server share the list of declared types.
The consequence is bounded. Two applications sharing an action type name can
produce a false "misrouted" positive, and that is the whole of it. It is never
a data leak: the `Set` holds names, never payloads and never state.

## What 1.0 promises

A version number stops being internal information at 1.0. So, plainly:

**Semantic versioning, on the exported surface.** A major for a removal or a
change in shape, a minor for an addition, a patch for a fix. What follows is
what "the exported surface" means.

**`ɵ`-prefixed names are outside the contract.** They exist for the
`ngx-statewise/testing` entry point and can change in any release, patches
included. If your code names one, it is depending on an internal.

**Exported types are committed exactly as much as the functions.** A type is
exported when a consumer has to write it to annotate a declaration they cannot
leave inferred, and it is nineteen names. The rule and the list are on the
[API page](https://pierre-mariemarchio.github.io/ngx-statewise/guide/api).
Everything else is inferred and is not yours to name.

**A deprecated symbol lives for two minor releases at least, and never less
than three months.** It keeps working, it warns, and the release notes say what
replaces it. "Until the next major" is not a commitment, because nothing says
when that is.

**The Angular peer range covers three majors.** The oldest is dropped when a new
one enters, in a **minor** release of this library, not a major: a peer range is
a statement about what is verified, and the verification is a weekly job plus a
gate on every publish, which is three real installs against three real majors.
Dropping
a major you no longer use costs you nothing, and holding the range hostage to
this library's own major would mean either verifying nothing or never moving.

## Contributing

Contributions are welcome. Issues and pull requests go through
[the repository](https://github.com/Pierre-MarieMarchio/ngx-statewise).

## License

GPL v3
