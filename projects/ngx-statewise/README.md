# ngx-statewise

A lightweight and intuitive state management library for Angular. Simpler than
NgRx, more structured than DIY.

**📖 [Read the documentation](https://pierre-mariemarchio.github.io/ngx-statewise/)**
— the guide lives on the site, which is its single source of truth. This page
is the overview: install it, see the shape of it, and follow the links.

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
// State — signals, so components re-render on their own
@Injectable({ providedIn: 'root' })
export class AuthState {
  public user = signal<User | null>(null);
  public isLoading = signal(false);
}

// Actions — the types LOGIN_REQUEST, LOGIN_SUCCESS and LOGIN_FAILURE
export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<Credentials>(),
    success: payload<User>(),
    failure: emptyPayload,
  },
});

// Updater — synchronous, and the only place state changes
export const authUpdater = defineUpdater(AuthState, (on) => {
  on(loginActions.request, (state) => state.isLoading.set(true));
  on(loginActions.success, (state, user) => {
    state.user.set(user);
    state.isLoading.set(false);
  });
});

// Effect — the asynchronous work, returning the next action
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

// Manager — exposes the state and dispatches, in its own scope
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

| Page                                                                                         | What it covers                                  |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| [Introduction](https://pierre-mariemarchio.github.io/ngx-statewise/guide/introduction)       | The flow, and how it differs from NgRx and NGXS |
| [Why ngx-statewise](https://pierre-mariemarchio.github.io/ngx-statewise/guide/why)           | What the design buys you, and when it fits      |
| [Getting started](https://pierre-mariemarchio.github.io/ngx-statewise/guide/getting-started) | Installation and `provideStatewise`             |
| [States](https://pierre-mariemarchio.github.io/ngx-statewise/guide/states)                   | Signals, or plain properties                    |
| [Actions](https://pierre-mariemarchio.github.io/ngx-statewise/guide/actions)                 | Action groups, single actions, generated types  |
| [Updaters](https://pierre-mariemarchio.github.io/ngx-statewise/guide/updaters)               | State updates, scope, and misrouted dispatches  |
| [Effects](https://pierre-mariemarchio.github.io/ngx-statewise/guide/effects)                 | Promises, observables, scope and lifecycle      |
| [Interceptors](https://pierre-mariemarchio.github.io/ngx-statewise/guide/interceptors)       | Refusing an action before its updater applies   |
| [Managers](https://pierre-mariemarchio.github.io/ngx-statewise/guide/managers)               | `dispatch`, `dispatchAsync`, and error handling |
| [Testing](https://pierre-mariemarchio.github.io/ngx-statewise/guide/testing)                 | The `ngx-statewise/testing` entry point         |

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
  `readonly HistoryEntry[]` — the action, the cascade path that led to it, and
  when it was recorded.

→ [Migrating from 0.6.x](https://pierre-mariemarchio.github.io/ngx-statewise/guide/migration)
has the full rename table and before/after examples.

## What it weighs

Through Angular's own production pipeline, as the delta against the same
application built without the library:

| What you import         | Adds, gzipped |
| ----------------------- | ------------- |
| the action helpers only | 0.2 kB        |
| every public export     | 4.2 kB        |

```bash
npm run measure:size
```

Three production builds of one throwaway application — nothing imported, the
helpers only, everything — so what is reported is the library's cost and not
Angular's. Both figures carry a ceiling in that script, because a measurement
without one is taken once and never again.

The 4.8 kB the documentation site publishes is a different question answered
honestly: that is the whole barrel bundled on its own, which is what "how big
is this package" means. The table above is what importing it costs you.

## Zoneless, and SSR

Both are supported, and both answers are measured rather than assumed.

**Zoneless is the only mode in which the published package is exercised.** The
compatibility fixture bootstraps with `provideZonelessChangeDetection()`, and it
builds and passes its specs on all three supported majors.

The library has no coupling to Zone.js. Its single mention anywhere is a comment
explaining why a promise is duck-typed rather than checked with `instanceof`, so
that Zone.js's `ZoneAwarePromise` still works — and that compatibility is held by
a test rather than by intent: `effect-outcome.spec.ts` > _awaits a promise that
is not an instance of the global Promise_, which builds a promise its own global
constructor disowns.

**SSR is safe, with one caveat worth stating.** The engine's seven classes are
provided without `providedIn`, so there is one set per environment injector —
one per request on a server. No browser API is touched anywhere: no `window`, no
`document`, no `localStorage`, no `navigator`, no `location`. The only global is
`AbortController`.

The caveat: the one piece of module-level mutable state in the whole library is
the `Set` of action types that updaters have declared, used to detect a dispatch
that reached the wrong manager. **That `Set` is shared by the process**, so two
distinct applications served by one server share the list of declared types. The
consequence is bounded — a false "misrouted" positive if the two share an action
type name — and it is never a data leak: it holds names, never payloads and
never state.

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
leave inferred, and it is nineteen names — the rule and the list are on the
[API page](https://pierre-mariemarchio.github.io/ngx-statewise/guide/api).
Everything else is inferred and is not yours to name.

**A deprecated symbol lives for two minor releases at least, and never less
than three months.** It keeps working, it warns, and the release notes say what
replaces it. "Until the next major" is not a commitment, because nothing says
when that is.

**The Angular peer range covers three majors.** The oldest is dropped when a new
one enters, in a **minor** release of this library, not a major: a peer range is
a statement about what is verified, and the verification is a weekly job plus a
gate on every publish — three real installs against three real majors. Dropping
a major you no longer use costs you nothing, and holding the range hostage to
this library's own major would mean either verifying nothing or never moving.

## Contributing

Contributions are welcome. Issues and pull requests go through
[the repository](https://github.com/Pierre-MarieMarchio/ngx-statewise).

## License

GPL v3
