# Migrating from 0.6.x

The execution core was rewritten. The public API is smaller and the concepts
have not changed, but the names and the wiring did.

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
- **An effect runs only for the manager owning its action's updater.** Registration is still application-wide; visibility is not. A misrouted dispatch runs nothing at all — neither the updater nor the effects. Actions no updater claims keep running their effects everywhere. See [Scope](/guide/effects#scope).
- **`waitForEffect` and `waitForAllEffects` are scoped to the manager** that owns them, and `waitForEffect` no longer accepts a raw action-type string.
- **The action history left the dispatch handle.** `recordedActions()` is gone from `Statewise`; inject `ActionHistory` and call `snapshot()`. The history was always application-wide, so a handle that scopes everything else was the wrong place to read it from — and reading it forced an `injectStatewise()` with no updater at all, purely to get at a global. `snapshot()` returns the same plain array as before.

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

And a manager takes its handle instead of calling the global functions:

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

Two managers can now dispatch the same action type concurrently without sharing state or observation, `dispatchAsync` really awaits the whole cascade including nested effects, an unexpected failure is no longer swallowed, a misrouted dispatch is reported instead of silently skipped, effects run only for the manager owning their action, and effects die with the injector that registered them.
