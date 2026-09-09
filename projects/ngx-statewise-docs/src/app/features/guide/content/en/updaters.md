---
slug: updaters
title:
  en: Updaters
  fr: Updaters
  es: Updaters
  de: Updaters
  pt-BR: Updaters
summary:
  en: How a state reacts to an action, and which scope owns it.
  fr: Comment un état réagit à une action, et quelle portée le détient.
  es: Cómo reacciona un state a una action, y qué ámbito lo posee.
  de: Wie ein State auf eine Action reagiert und welcher Bereich ihn besitzt.
  pt-BR: Como um state reage a uma action, e qual escopo o detém.
---

# Updaters

How a state reacts to an action. It is the only place state changes, and it
finishes before anything else runs.

You declare one with `defineUpdater`, outside any class. It takes the
injectable token holding the state, and a callback registering one handler per
action.

```typescript title="auth.updater.ts"
import { defineUpdater } from 'ngx-statewise';

export const authUpdater = defineUpdater(AuthState, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
    state.isError.set(false);
  });

  on(loginActions.success, (state, session) => {
    state.user.set(session.user);
    state.isLoggedIn.set(true);
    state.isLoading.set(false);
  });

  on(logoutAction, (state) => {
    state.user.set(null);
    state.isLoggedIn.set(false);
  });
});
```

`defineUpdater` records the token and resolves nothing at declaration time. The
instance is read from the injector when the updater is attached to a manager,
which is what keeps two managers of the same feature isolated.

## Typing

Handlers are inferred from the action creator. There is nothing to annotate.

- `state` is typed by the token passed to `defineUpdater`.
- `payload` is typed by the action creator. An action carrying nothing produces
  a handler with no second parameter.
- A handler must be synchronous.

```typescript avoid title="auth.updater.ts"
on(loginActions.request, async (state) => {
  state.isLoading.set(true);
  await this.api.login();
});
```

That is a compile error, and it would be a bug if it were not: the state has to
be settled before effects run. Asynchronous work is
[an effect](/guide/effects).

```typescript prefer title="auth.updater.ts"
on(loginActions.request, (state) => {
  state.isLoading.set(true);
});
```

Two other mistakes the compiler catches for you:

```typescript
// The action carries no payload, so there is no second parameter to take.
on(logoutAction, (state, payload) => { ... });

// The action carries a LoginResponse, and `session` is typed as one.
on(loginActions.success, (state, session) => { ... });
```

## Attaching updaters

### To a manager

The usual case. The manager declares the updaters it owns, and gets back the
handle it dispatches through.

```typescript title="auth.manager.ts"
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);
}
```

Updaters attached this way are visible only to dispatches issued through that
handle. Two managers may declare the same action types over two different
states without colliding.

### Globally

An updater declared in `provideStatewise` applies to every dispatch, whichever
manager issues it, when the dispatching scope does not handle the type itself.

```typescript title="app.config.ts"
provideStatewise({
  updaters: [authUpdater],
});
```

A scoped updater always wins over a global one for the same action type.

## Dispatching through the right manager

A dispatch applies only the updaters attached to its own scope, so an action
sent to the wrong manager skips its state update. That used to happen in
silence. The library detects it now.

`defineUpdater` records the action types it claims as soon as its module is
loaded. Dispatching one of those types through a scope that does not handle it
throws in development:

```
[ngx-statewise] No updater in scope for "AUTH_LOADED". This action type is
handled by an updater attached to another injectStatewise() scope, so this
dispatch would silently skip its state update. Dispatch it through the manager
owning that updater, or declare that updater globally with
provideStatewise({ updaters: [...] }).
```

A misrouted dispatch does nothing at all: no state update, and none of the
effects registered for that type either. Those effects belong to the owner of
the updater, and running them here would cascade their actions into a scope
that owns none of them.

The consequence for effects is a rule worth stating on its own. An effect must
not return another feature's action:

```typescript avoid title="auth.effect.ts"
public readonly loginSuccessEffect = createEffect(loginActions.success, () => {
  // PROJECT_REQUEST belongs to the project manager, not this scope.
  return getAllProjectsActions.request();
});
```

```typescript prefer title="auth.effect.ts"
public readonly loginSuccessEffect = createEffect(loginActions.success, () => {
  // Each manager dispatches within its own scope.
  this.projectManager.getAll();
  this.taskManager.getAll();
});
```

That call leaves this scope's tree of promises, so it used to leave the cascade
with it: `await login()` settled while both reloads were still in flight.
It no longer does — a dispatch a **synchronous** handler emits is adopted back
into the cascade of that handler, whichever manager it went through. Past an
`await` it is not, and the manager's promise is what covers it there. The rule
and both forms are in [Managers](/guide/managers).

The check costs a set lookup, and only runs when no updater matched. An action
that no updater claims stays valid: it is an effect-only action.

### Development throws, production reports

The detection always runs. Only the reaction depends on the environment.
Throwing on a user's machine would take down a running application over a state
update that is merely missing, so production hands the same error to Angular's
`ErrorHandler` instead. The dispatch then resolves without doing anything.

| Reaction   | Effect                                                        |
| ---------- | ------------------------------------------------------------- |
| `'throw'`  | Raises at the dispatch site. The default in development.      |
| `'report'` | Hands the error to `ErrorHandler`. The default in production. |
| `'ignore'` | Says nothing and carries on.                                  |

> [!NOTE]
> The reaction changes who hears about the mistake, not what happens. A
> misrouted dispatch does nothing under all three. Only `'throw'` stops the
> caller.

Override it where you have a reason:

```typescript title="app.config.ts"
provideStatewise({
  misroutedDispatch: 'report',
});
```

### What the check cannot see

An action type becomes known when the module declaring its updater is loaded.
In a lazily loaded feature that happens with the chunk, so a dispatch aimed at
an updater whose chunk has not loaded yet is not reported.

The check misses that case rather than raising a false alarm: it never blames a
dispatch that would have worked. When the chunk is absent, neither the updater
nor the effects of that feature exist, so the action does nothing at all.

If a lazily loaded feature has to react to actions dispatched before it is
reached, declare its updater globally instead of attaching it to a manager.

## Key notes

- One action type, one updater, within the same scope. A duplicate always
  throws, never passes silently — at the `defineUpdater` call when one updater
  handles the same type twice, at `injectStatewise()` when two updaters of one
  scope claim it, and at startup for the updaters given to `provideStatewise`.
- Handlers write the state in place, usually through signals, and return
  nothing.
- An action no updater handles is valid: it triggers its effects and nothing
  else.

Next: [Effects](/guide/effects).
