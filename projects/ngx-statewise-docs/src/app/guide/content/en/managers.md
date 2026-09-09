# Managers

The only part of a feature your components should know about, and the unit of
scope for everything the library does.

A manager exposes the state as read-only signals and offers named methods
instead of dispatches, so a component calls `login(credentials)` rather than
assembling an action. It applies the updaters it declared, and observes only
the effects it started.

```typescript title="auth.manager.ts"
import { injectStatewise } from 'ngx-statewise';

@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);
}
```

Call `injectStatewise` in an injection context, like `inject`. It resolves each
updater's state through the injector of the caller, once and for all.

## Exposing state

Read-only signals out, so components bind to values instead of holding state
logic:

```typescript title="auth.manager.ts"
public readonly user = this.authStates.user.asReadonly();
public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
public readonly isLoading = this.authStates.isLoading.asReadonly();
```

The writable signal never leaves the state class. A component that can call
`set` on it is a second writer, and the guarantee that one place changed a
value is gone.

```typescript avoid title="auth.manager.ts"
public readonly user = this.authStates.user;
```

```typescript prefer title="auth.manager.ts"
public readonly user = this.authStates.user.asReadonly();
```

## Dispatching

The handle returned by `injectStatewise` is the whole dispatch API.

| Member                  | Returns         | What it does                                                         |
| ----------------------- | --------------- | -------------------------------------------------------------------- |
| `dispatch(action)`      | `void`          | Starts the action without waiting for it.                            |
| `dispatchAsync(action)` | `Promise<void>` | Resolves once the whole cascade started by the action is over.       |
| `waitForEffect(action)` | `Promise<void>` | Waits for the effects **this manager** started for that action type. |
| `waitForAllEffects()`   | `Promise<void>` | Waits for every effect **this manager** started.                     |

`waitForEffect` takes an action creator or an action, never a raw string, so a
typo in a type is a compile error:

```typescript
await this.statewise.waitForEffect(loginActions.request);
```

Observation is scoped like dispatch: two managers awaiting the same action type
never wait for each other. The action history is application-wide, so it is
injected rather than read from the handle — `inject(ActionHistory).snapshot()`.

### Which dispatch to use

`dispatch` applies the updater immediately, then starts the effects without
waiting. Use it when nothing depends on the outcome:

```typescript
this.statewise.dispatch(logoutAction());
```

`dispatchAsync` resolves once every effect triggered by the action, and every
action those effects returned, has completed — recursively. Use it when the
next thing has to wait:

```typescript
await this.statewise.dispatchAsync(loginActions.request(credentials));
```

### Errors

The two report failures differently, on purpose.

| Failure           | `dispatch`                            | `dispatchAsync`     |
| ----------------- | ------------------------------------- | ------------------- |
| An updater throws | Throws synchronously at the call site | Rejects the promise |
| An effect fails   | Reported to Angular's `ErrorHandler`  | Rejects the promise |

An updater failure is a programming error, so it surfaces where it happened
instead of being buried in a promise nobody awaits. An effect failure is an
execution error: with `dispatch` nobody is there to receive it, so it goes to
the `ErrorHandler`; with `dispatchAsync` the caller gets it.

When several effects run for one action, the library waits for all of them
before reporting the first failure.

## A manager, in full

```typescript title="auth.manager.ts"
@Injectable({ providedIn: 'root' })
export class AuthManager {
  private readonly authStates = inject(AuthStates);
  private readonly statewise = injectStatewise(authUpdater);

  public readonly user = this.authStates.user.asReadonly();
  public readonly isLoggedIn = this.authStates.isLoggedIn.asReadonly();
  public readonly isLoading = this.authStates.isLoading.asReadonly();

  /** Awaits the whole login cascade, so the caller can navigate after it. */
  public login(credentials: LoginSubmit): Promise<void> {
    return this.statewise.dispatchAsync(loginActions.request(credentials));
  }

  /** Fire and forget: nothing waits on logging out. */
  public logout(): void {
    this.statewise.dispatch(logoutAction());
  }
}
```

A component injects that and never sees an action:

```typescript title="login-page.component.ts"
protected async submit(): Promise<void> {
  await this.auth.login(this.form.getRawValue());
  await this.router.navigate(['/dashboard']);
}
```

## Key notes

- One manager per feature. It owns the updaters, and therefore the effects.
- Expose `asReadonly()` signals and named methods. Never the writable signal,
  never the raw handle.
- `dispatchAsync` when something waits on the outcome, `dispatch` otherwise.

Next: [Testing](/guide/testing).
