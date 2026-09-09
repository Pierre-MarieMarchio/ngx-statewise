# Migrating from 0.6.x

The execution core was rewritten. The concepts did not change; the names, the
wiring and four behaviours did.

Action creators are untouched. `defineActionsGroup`, `defineSingleAction`,
`payload`, `emptyPayload` and `ofType` work as before, and the generated action
strings are identical — so the parts of your application that only build and
match actions need no edit at all.

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
| `statewise.recordedActions()`                 | `inject(ActionHistory).snapshot()`                                                              |
| type `StatewiseRef`                           | type `Statewise`                                                                                |
| type `UpdaterDefinition<State>`               | type `Updater<State>`                                                                           |
| type `SWEffects`                              | type `EffectOutcome`                                                                            |

`createEffect` keeps its signature, and now returns an `EffectRef` you can
ignore.

## The two rewrites you will do most

An updater class becomes a declaration, and loses its `ofType` keys:

```typescript title="0.6.x"
@Injectable({ providedIn: 'root' })
export class AuthUpdator implements IUpdator<AuthStates> {
  public readonly state = inject(AuthStates);

  public readonly updators: UpdatorRegistry<AuthStates> = {
    [ofType(loginActions.request)]: (state) => {
      state.isLoading.set(true);
    },
  };
}
```

```typescript title="Now"
export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
  });
});
```

A manager takes a handle instead of calling global functions:

```typescript title="0.6.x"
export class AuthManager {
  private readonly authUpdator = inject(AuthUpdator);

  constructor() {
    registerLocalUpdator(this, this.authUpdator);
  }

  public login(credentials: LoginSubmit): Promise<void> {
    return dispatchAsync(loginActions.request(credentials), this);
  }
}
```

```typescript title="Now"
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);

  public login(credentials: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }
}
```

## What behaves differently

Four changes go beyond the renames. These are the ones that can break working
code rather than merely fail to compile.

**A dispatch aimed at another manager now throws in development**, instead of
doing nothing, and reports to the `ErrorHandler` in production. The most common
cause is an effect returning another feature's action:

```typescript avoid title="auth.effect.ts"
createEffect(loginActions.success, () => getAllProjectsActions.request());
```

```typescript prefer title="auth.effect.ts"
createEffect(loginActions.success, () => {
  this.projectManager.getAll();
});
```

See
[dispatching through the right manager](/guide/updaters#dispatching-through-the-right-manager).

**An effect runs only for the manager owning its action's updater.**
Registration is still application-wide; visibility now follows the updater. A
misrouted dispatch runs nothing at all — neither the updater nor the effects.
Actions no updater claims keep running their effects everywhere. See
[scope](/guide/effects#scope).

**`waitForEffect` and `waitForAllEffects` are scoped to their manager**, and
`waitForEffect` no longer accepts a raw action-type string. Pass the creator,
and a typo becomes a compile error.

**The action history left the dispatch handle.** `recordedActions()` is gone
from `Statewise`; inject `ActionHistory` and call `snapshot()`, which returns
the same plain array. The history was always application-wide while the handle
scopes everything else, and reading it used to force an `injectStatewise()`
call with no updater at all.

## What it buys you

- Two managers dispatch the same action type concurrently without sharing state
  or observation.
- `dispatchAsync` awaits the whole cascade, nested effects included.
- An unexpected failure is no longer swallowed.
- A misrouted dispatch is reported instead of silently skipped.
- An effect is unregistered with the injector that registered it, so a
  component-scoped effect class no longer piles up a copy per instance.

Next: the [recipes](/guide/cancelling-requests) for the flows this rewrite
makes easier, or the [API reference](/guide/api) for the shape of everything
named above.
