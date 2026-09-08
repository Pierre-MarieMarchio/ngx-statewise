# Updaters

Updaters describe how a state reacts to actions. They deal only with state data: anything else — API calls, navigation, logging — belongs in Effects.

An updater is declared with `defineUpdater`, outside of any class. It takes the injectable token holding the state, and a callback registering one handler per action.

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

The state is never resolved at declaration time: `defineUpdater` only records the token. The instance is read from the injector when the updater is attached to a manager, which is what keeps two managers of the same feature isolated from each other.

## Typing

Handlers are fully inferred from the action creator, no annotation needed:

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

This is the usual case. The manager declares the updaters it owns via `injectStatewise`, and gets back the handle used to dispatch.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly statewise = injectStatewise(authUpdater);
}
```

The updaters passed this way are only visible to the dispatches issued through this handle. Two managers may declare the same action types on two different states without ever colliding.

### Globally

An updater declared in `provideStatewise` applies to every dispatch, whichever manager issues it, when the dispatch scope does not itself handle the action type.

```typescript
provideStatewise({
  updaters: [authUpdater],
});
```

A scoped updater always wins over a global one for the same action type.

## Dispatching through the right manager

An updater is only applied by the dispatches of the scope it is attached to. Sending an action to the wrong manager would therefore skip its state update, and that used to happen silently. It no longer does.

`defineUpdater` records the action types it claims as soon as its module is loaded. Dispatching one of those types through a scope that does not handle it throws in development:

```
[ngx-statewise] No updater in scope for "AUTH_LOADED". This action type is
handled by an updater attached to another injectStatewise() scope, so this
dispatch would silently skip its state update. Dispatch it through the manager
owning that updater, or declare that updater globally with
provideStatewise({ updaters: [...] }).
```

A misrouted dispatch does nothing at all: no state update, and none of the effects registered for that action type either. Those effects belong to whoever owns the updater, and running them here would cascade their actions into a scope that owns nothing of them.

In practice this means an effect must not return another feature's action. Inject that feature's manager and call it instead:

```typescript
public readonly loginSuccessEffect = createEffect(loginActions.success, () => {
  // ✅ each manager dispatches within its own scope
  this.projectManager.getAll();
  this.taskManager.getAll();

  // ❌ would throw: PROJECT_REQUEST belongs to the project manager
  // return getAllProjectsActions.request();
});
```

The check costs a set lookup and only runs when no updater matched. An action claimed by no updater at all stays perfectly valid — that is an effect-only action.

### Development throws, production reports

The detection always runs; only the reaction depends on the environment. Throwing on a user's machine would take down a running application over a state update that is merely missing, so production hands the same error to Angular's `ErrorHandler` and carries on: the dispatch resolves, the effects of the action still run, and whatever you plugged into `ErrorHandler` — a logger, Sentry — receives the report.

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
| `'ignore'` | Says nothing, as before the check existed.                    |

### What the check cannot see

An action type becomes known when the module declaring its updater is loaded. In a lazily loaded feature, that happens with the chunk, so a dispatch aimed at an updater whose chunk has not been loaded yet is not reported.

This is a missed detection, never a false alarm: the check never blames a dispatch that would have worked. And when the chunk is absent, neither the updater nor the effects of that feature exist, so the action does nothing at all — which is the bug you were trying to catch in the first place.

If a lazily loaded feature must react to actions dispatched before it is reached, declare its updater globally instead of attaching it to a manager:

```typescript
provideStatewise({ updaters: [authUpdater] });
```

## Key Notes

- One action type can only be handled by a single updater within the same scope. A duplicate is reported at startup, not silently ignored.
- Handlers mutate the state in place, typically through signals. They return nothing.
- An action handled by no updater is perfectly valid: it merely triggers its effects.
