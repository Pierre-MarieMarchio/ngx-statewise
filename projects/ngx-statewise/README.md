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

The flow is one-way: **action → updater → effect → possibly more actions**. The
state is settled before any effect runs, and `dispatchAsync` awaits the entire
chain.

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

## Contributing

Contributions are welcome. Issues and pull requests go through
[the repository](https://github.com/Pierre-MarieMarchio/ngx-statewise).

## License

GPL v3
