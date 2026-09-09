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

An updater describes how a state reacts to actions. It only writes state data: API calls, navigation and everything else belong in effects.

You declare an updater with `defineUpdater`, outside any class. It takes the injectable token holding the state, and a callback registering one handler per action.

```typescript
import { defineUpdater } from 'ngx-statewise';

export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
    state.asError.set(false);
  });

  on(loginActions.success, (state, payload) => {
    state.user.set(payload.user);
    state.isLoggedIn.set(true);
    state.isLoading.set(false);
  });

  on(logoutAction, (state) => {
    state.user.set(null);
    state.isLoggedIn.set(false);
  });
});
```

`defineUpdater` records the token and resolves nothing at declaration time. The instance is read from the injector when the updater is attached to a manager, which keeps two managers of the same feature isolated from each other.

## Typing

Handlers are inferred from the action creator, with no annotation to write:

- `state` is typed by the token passed to `defineUpdater`.
- `payload` is typed by the action creator. An action without payload produces a handler with no second parameter.
- A handler must be synchronous. An `async` handler is a compile error, since state must be up to date before effects run.

```typescript
defineUpdater(AuthStates, (on) => {
  // ✅ payload is inferred as LoginResponse
  on(loginActions.success, (state, payload) => { ... });

  // ❌ compile error: this action carries no payload
  on(logoutAction, (state, payload) => { ... });

  // ❌ compile error: an updater handler must stay synchronous
  on(loginActions.request, async (state) => { ... });
});
```

## Attaching updaters

### To a manager

This is the usual case. The manager declares the updaters it owns with `injectStatewise`, and gets back the handle it dispatches through.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);
}
```

The updaters passed this way are only visible to the dispatches issued through this handle. Two managers may declare the same action types on two different states without colliding.

### Globally

An updater declared in `provideStatewise` applies to every dispatch, whichever manager issues it, when the dispatch scope does not itself handle the action type.

```typescript
provideStatewise({
  updaters: [authUpdater],
});
```

A scoped updater always wins over a global one for the same action type.

## Dispatching through the right manager

A dispatch applies only the updaters attached to its own scope. An action sent to the wrong manager therefore skips its state update. That used to happen silently, and the library now detects it.

`defineUpdater` records the action types it claims as soon as its module is loaded. Dispatching one of those types through a scope that does not handle it throws in development:

```
[ngx-statewise] No updater in scope for "AUTH_LOADED". This action type is
handled by an updater attached to another injectStatewise() scope, so this
dispatch would silently skip its state update. Dispatch it through the manager
owning that updater, or declare that updater globally with
provideStatewise({ updaters: [...] }).
```

A misrouted dispatch does nothing at all: no state update, and none of the effects registered for that action type either. Those effects belong to the owner of the updater, and running them here would cascade their actions into a scope that owns none of them.

An effect must therefore not return another feature's action. Inject that feature's manager and call it instead:

```typescript
public readonly loginSuccessEffect = createEffect(loginActions.success, () => {
  // ✅ each manager dispatches within its own scope
  this.projectManager.getAll();
  this.taskManager.getAll();

  // ❌ would throw: PROJECT_REQUEST belongs to the project manager
  // return getAllProjectsActions.request();
});
```

The check costs a set lookup and only runs when no updater matched. An action that no updater claims stays valid: it is an effect-only action.

### Development throws, production reports

The detection always runs. Only the reaction depends on the environment. Throwing on a user's machine would take down a running application over a state update that is merely missing, so production hands the same error to Angular's `ErrorHandler` instead. The dispatch then resolves without doing anything: no state update, and no effects either.

> [!NOTE]
> `'report'` changes who hears about the mistake, not what happens. A misrouted
> dispatch does nothing under all three reactions. Only `'throw'` stops the
> caller.

Override it when you need to:

```typescript
provideStatewise({
  // 'throw' in development, 'report' in production.
  misroutedDispatch: 'report',
});
```

| Reaction   | Effect                                                        |
| ---------- | ------------------------------------------------------------- |
| `'throw'`  | Raises at the dispatch site. The default in development.      |
| `'report'` | Hands the error to `ErrorHandler`. The default in production. |
| `'ignore'` | Says nothing and carries on.                                  |

### What the check cannot see

An action type becomes known when the module declaring its updater is loaded. In a lazily loaded feature, that happens with the chunk, so a dispatch aimed at an updater whose chunk has not been loaded yet is not reported.

The check misses that case rather than raising a false alarm: it never blames a dispatch that would have worked. When the chunk is absent, neither the updater nor the effects of that feature exist, so the action does nothing at all.

If a lazily loaded feature must react to actions dispatched before it is reached, declare its updater globally instead of attaching it to a manager:

```typescript
provideStatewise({ updaters: [authUpdater] });
```

## Key notes

- One action type can only be handled by a single updater within the same scope. A duplicate is reported at startup.
- Handlers mutate the state in place, typically through signals. They return nothing.
- An action that no updater handles is valid: it triggers its effects and nothing else.
