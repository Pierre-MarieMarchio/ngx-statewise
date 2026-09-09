---
slug: migration
title:
  en: Migrating from 0.6.x
  fr: Migrer depuis 0.6.x
  es: Migrar desde 0.6.x
  de: Migration von 0.6.x
  pt-BR: Migrar do 0.6.x
summary:
  en: What the rewrite renamed, and the four behaviours it changed.
  fr: Ce que la réécriture a renommé, et les quatre comportements changés.
  es: Qué renombró la reescritura y los cuatro comportamientos que cambió.
  de: Was die Neufassung umbenannt hat, und die vier geänderten Verhalten.
  pt-BR: O que a reescrita renomeou, e os quatro comportamentos que mudou.
---

# Migrating from 0.6.x

The execution core was rewritten. The concepts have not changed, but the public
API is smaller, and the names and the wiring are different.

## What was renamed

| 0.6.x                                         | Now                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `IUpdator` / `UpdatorRegistry` class          | `defineUpdater(StateToken, (on) => ...)`                                                        |
| `provideUpdators([...])`                      | `provideStatewise({ updaters: [...] })`                                                         |
| `provideEffects([...])`                       | `provideStatewise({ effects: [...] })`                                                          |
| `registerLocalUpdator(this, updator)`         | `injectStatewise(updater)`                                                                      |
| `dispatch(action, scope)`                     | `statewise.dispatch(action)`                                                                    |
| `dispatchAsync(action, scope)`                | `statewise.dispatchAsync(action)`                                                               |
| `waitForEffect(type)` / `waitForAllEffects()` | `statewise.waitForEffect(creator)` / `statewise.waitForAllEffects()`, now scoped to the manager |
| `defineSingleAction(...).action`              | `defineSingleAction(...)` returns the creator itself                                            |
| type `StatewiseRef`                           | type `Statewise`                                                                                |
| type `UpdaterDefinition<State>`               | type `Updater<State>`                                                                           |
| type `SWEffects`                              | type `EffectOutcome`                                                                            |
| `statewise.recordedActions()`                 | `inject(ActionHistory).snapshot()`                                                              |

Action creators (`defineActionsGroup`, `defineSingleAction`, `payload`, `emptyPayload`, `ofType`) are unchanged, and the generated action strings are identical. `createEffect` keeps its signature and now returns an `EffectRef`, which you can ignore.

## What behaves differently

Four behaviours changed beyond the renames:

- **Dispatching an action owned by another manager now throws in dev mode** instead of doing nothing, and reports to the `ErrorHandler` in production. If an effect used to return another feature's action, call that feature's manager instead. See [Dispatching through the right manager](/guide/updaters#dispatching-through-the-right-manager).
- **An effect runs only for the manager owning its action's updater.** Registration is still application-wide, and visibility now follows the updater. A misrouted dispatch runs nothing at all, neither the updater nor the effects. Actions no updater claims keep running their effects everywhere. See [Scope](/guide/effects#scope).
- **`waitForEffect` and `waitForAllEffects` are scoped to the manager** that owns them, and `waitForEffect` no longer accepts a raw action-type string.
- **The action history left the dispatch handle.** `recordedActions()` is gone from `Statewise`: inject `ActionHistory` and call `snapshot()`, which returns the same plain array as before. The history was always application-wide, while the handle scopes everything else, and reading it forced an `injectStatewise()` call with no updater at all.

## Before and after

An updater class becomes a declaration:

```typescript
// Before
@Injectable({ providedIn: 'root' })
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    [ofType(loginActions.request)]: (state) => {
      state.isLoading.set(true);
    },
  };
}

// After
export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
  });
});
```

A manager takes its handle instead of calling the global functions:

```typescript
// Before
export class AuthManager {
  private readonly authUpdator = inject(AuthUpdator);

  constructor() {
    registerLocalUpdator(this, this.authUpdator);
  }

  public login(credentials: LoginSubmit): Promise<void> {
    return dispatchAsync(loginActions.request(credentials), this);
  }
}

// After
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);

  public login(credentials: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }
}
```

## What this buys you

After the rewrite:

- Two managers dispatch the same action type concurrently without sharing state
  or observation.
- `dispatchAsync` awaits the whole cascade, nested effects included.
- An unexpected failure is no longer swallowed.
- A misrouted dispatch is reported instead of silently skipped.
- An effect runs only for the manager owning its action.
- An effect is unregistered with the injector that registered it.
