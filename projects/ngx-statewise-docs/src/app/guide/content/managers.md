# Managers

In ngx-statewise, a manager is the bridge between your UI and your state logic. It exposes state as reactive signals and offers a declarative API to trigger actions. This keeps components simple, state interactions predictable, and everything testable.

A manager gets its dispatch handle from `injectStatewise`, passing the updaters it owns.

```typescript
import { injectStatewise } from 'ngx-statewise';

@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);
}
```

`injectStatewise` must be called in an injection context, like `inject`. It resolves each updater's state through the injector of the caller, once and for all.

## State Exposure

Managers expose state reactively to the components depending on it, so those components bind to signals rather than handling state logic themselves.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);

  // State exposure: read-only signals
  public readonly user = this.authStates.user.asReadonly();
  public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
  public readonly isLoading = this.authStates.isLoading.asReadonly();
}
```

## Dispatching Actions

The handle returned by `injectStatewise` exposes the whole dispatch API:

| Member                  | Returns         | Description                                                          |
| ----------------------- | --------------- | -------------------------------------------------------------------- |
| `dispatch(action)`      | `void`          | Starts the action without waiting for it.                            |
| `dispatchAsync(action)` | `Promise<void>` | Resolves once the whole cascade started by the action is over.       |
| `waitForEffect(action)` | `Promise<void>` | Waits for the effects **this manager** started for that action type. |
| `waitForAllEffects()`   | `Promise<void>` | Waits for every effect **this manager** started.                     |

`waitForEffect` takes an action creator or an action, never a raw string, so a typo in an action type is a compile error:

```typescript
await this.statewise.waitForEffect(loginActions.request);
```

Observation is scoped like dispatch: two managers awaiting the same action type never wait for each other. The action history is not on the handle at all: it is application-wide, so it is injected instead — `inject(ActionHistory).snapshot()`.

### Synchronous Dispatch

```typescript
this.statewise.dispatch(logoutAction());
```

`dispatch` applies the updater immediately, then starts the effects without waiting for them. Use it when you don't need to know when the side effects are done.

### Asynchronous Dispatch

```typescript
await this.statewise.dispatchAsync(loginActions.request(credentials));
```

`dispatchAsync` returns a `Promise<void>` that resolves once every effect triggered by the action, and every action those effects returned, have completed recursively. This is what you want for flows like authentication, where navigation must wait for the outcome.

### Error handling

The two dispatches differ in how they report failures, and the difference is deliberate:

| Failure           | `dispatch`                            | `dispatchAsync`     |
| ----------------- | ------------------------------------- | ------------------- |
| An updater throws | Throws synchronously at the call site | Rejects the promise |
| An effect fails   | Reported to Angular's `ErrorHandler`  | Rejects the promise |

An updater failure is a programming error: it surfaces where it happened rather than being buried in a promise nobody awaits. An effect failure is an execution error: with `dispatch` nobody is there to receive it, so it goes to the `ErrorHandler`; with `dispatchAsync` the caller gets it.

When several effects run for the same action, ngx-statewise waits for all of them before reporting the first failure. A failing effect never leaves its siblings running unobserved.

## Example: `AuthManager`

```typescript
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);

  // State exposure: read-only signals
  public readonly user = this.authStates.user.asReadonly();
  public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
  public readonly isLoading = this.authStates.isLoading.asReadonly();

  // Awaits the whole login cascade
  public login(credentials: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }

  // Fire and forget
  public logout(): void {
    this.statewise.dispatch(logoutAction());
  }
}
```

## Key Notes

- Managers are the coordination layer between your components and your logic. They expose state as signals and dispatch actions, giving a consistent, typed and testable API.

- Updaters describe how state reacts. They are attached to a manager through `injectStatewise`, or made global through `provideStatewise`. A manager only ever sees the updaters it declared, plus the global ones.

- Effects handle asynchronous or side-effecting operations. They are registered globally, from the effect classes listed in `provideStatewise`.

- Each part — Managers, Updaters, Effects — has one focused responsibility, which keeps the state flow predictable and easy to reason about as the application grows.
