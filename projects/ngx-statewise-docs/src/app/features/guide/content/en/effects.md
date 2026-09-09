---
slug: effects
title:
  en: Effects
  fr: Effects
  es: Effects
  de: Effects
  pt-BR: Effects
summary:
  en: Asynchronous work, its scope and its lifecycle.
  fr: Le travail asynchrone, sa portée et son cycle de vie.
  es: El trabajo asíncrono, su ámbito y su ciclo de vida.
  de: Asynchrone Arbeit, ihr Geltungsbereich und ihr Lebenszyklus.
  pt-BR: O trabalho assíncrono, seu escopo e seu ciclo de vida.
---

# Effects

The asynchronous half of a feature: API calls, navigation, storage, logging —
everything that is not a state change.

Effects always run **after** the updater, so they never read stale state. The
library enforces the sequence action → updater → effect.

An effect may return another action, and that action goes through the same
cycle: its updater, then its own effects. A flow like "log in, load the
workspace, then navigate" is a chain of those actions rather than a tree of
callbacks.

> [!WARNING]
> Never return the action that triggered the effect. It produces an infinite
> cascade, and nothing stops it for you.

## Defining an effect

`createEffect` links an effect to one action. It expects a promise by default,
and also accepts an observable.

```typescript title="auth.effect.ts"
@Injectable({ providedIn: 'root' })
export class AuthEffects {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly router = inject(Router);

  public readonly loginEffect = createEffect(loginActions.request, async (credentials) => {
    try {
      const response = await this.authRepository.login(credentials);
      this.authTokenService.setAccessToken(response.accessToken);
      return loginActions.success(response);
    } catch {
      return loginActions.failure();
    }
  });

  public readonly logoutEffect = createEffect(logoutAction, () => {
    this.router.navigate(['/']);
  });
}
```

The handler receives the action's payload when there is one. What it returns
decides what happens next:

| Returned                       | Effect                                     |
| ------------------------------ | ------------------------------------------ |
| nothing                        | The dispatch ends here.                    |
| an action, or an array of them | They are dispatched in turn.               |
| a `Promise` of either          | Awaited, then dispatched.                  |
| an `Observable` of either      | Its **first** emission only, then dropped. |

## Returning an observable

Return an observable for a one-shot asynchronous operation. The library reads
its first emission and stops listening. An observable that completes without
emitting — `EMPTY`, for instance — counts as returning nothing.

```typescript title="user.effect.ts"
@Injectable({ providedIn: 'root' })
export class UserEffects {
  private readonly userService = inject(UserService);

  public readonly getUserEffect = createEffect(userActions.getUserRequest, ({ userId }) =>
    this.userService.fetchUser(userId).pipe(
      map((user) => userActions.getUserSuccess(user)),
      catchError(() => of(userActions.getUserFailure())),
    ),
  );
}
```

Because only the first emission is read, a long-lived stream does not belong
here:

<!-- prettier-ignore -->
```typescript avoid title="notifications.effect.ts"
createEffect(socketActions.connect, () =>
  this.socket.messages$.pipe(
    map((message) => socketActions.received(message)),
  ),
);
```

Only the first message would ever reach the state. Put a long-lived stream in
an application-level subscription that dispatches, and keep the effect for the
one-shot work.

## Registering effects

Declare every effect class in `provideStatewise`, so Angular instantiates it at
startup. `createEffect` registers itself in the injection context of the class
declaring it, so that class has to exist for its effects to exist.

```typescript title="app.config.ts"
provideStatewise({
  effects: [AuthEffects, UserEffects],
});
```

Without the declaration, dispatching the action does nothing at all — and
nothing warns you. It is the first thing to check when an effect looks dead.

Call `createEffect` in an injection context: a field initialiser, or the
constructor of an injectable class. Calling it anywhere else throws
immediately, rather than registering an effect that would never run.

### Scope

An effect runs for the dispatches of the manager owning its action's updater,
and only those. Registration is application-wide; visibility follows the
updater.

```typescript
// AUTH_LOADED is handled by authUpdater, attached to AuthManager.
createEffect(authActions.loaded, () => { ... });

authManager.dispatch(authActions.loaded()); // the effect runs
taskManager.dispatch(authActions.loaded()); // misrouted: nothing runs
```

An action type that no updater claims has no owner, so its effects run for
every manager — that is an effect-only action, valid everywhere. An updater
declared globally belongs to every scope, so its effects run everywhere too.

### Lifecycle

A registration lives as long as the injector that created it. An effect class
scoped to a component or to a lazy route is unregistered when that injector is
destroyed, so instantiating it again never piles up a second copy.

Such a class needs nothing but itself: `createEffect` injects the registry from
wherever it is called, and finds the root one. Do **not** add a second
`provideStatewise()` to that route — it would provide a registry of its own,
which no dispatch reaches. The library now refuses it
([Getting started](/guide/getting-started)).

`createEffect` returns an `EffectRef` for the rarer case where you need to stop
earlier:

```typescript
@Injectable()
export class AuthEffects {
  private readonly loginEffect = createEffect(loginActions.request, ...);

  public stopListening(): void {
    this.loginEffect.destroy();
  }
}
```

Ignoring the handle is fine. Destroying the owning injector already unregisters
the effect.

## Key notes

- Return a promise, an observable, an action, or nothing. An observable is read
  once.
- Never return the action that triggered the effect.
- Effects do not touch state. That is the updater's job, and it has already run.
- Declare every effect class in `provideStatewise({ effects: [...] })`, or it is
  never instantiated and its effects never exist.
- An effect belongs to the scope owning its action's updater, and is
  unregistered with the injector that created it.

Next: [Managers](/guide/managers).
