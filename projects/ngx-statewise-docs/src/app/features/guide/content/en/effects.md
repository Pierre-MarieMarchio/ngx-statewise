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

An effect is the asynchronous half of a feature: API calls, navigation, storage,
logging, everything that is not a state change. You declare one with
`createEffect`, bound to a single action.

Effects always run **after** the updater, so they never read stale state. The
library enforces the sequence **action → updater → effect**.

An effect may return another action, and that action goes through the same
cycle: its updater, then its own effects. A flow like "log in, load the
workspace, then navigate" is a chain of those actions rather than a tree of
callbacks.

A handler may return an action, a promise, an observable, or nothing.
ngx-statewise reads an observable once: it takes the first emission and stops
listening. Put a long-lived stream in an application-level subscription instead.

> [!WARNING]
> Never return the action that triggered the effect. It produces an infinite
> cascade, and nothing stops it for you.

## Defining an effect

`createEffect` links an effect to one action. It expects a promise by default, and it also accepts an observable.

The following effect returns a promise:

```typescript
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private readonly authRepository = inject(AuthRepositoryService);
  private readonly authTokenService = inject(AuthTokenService);
  private readonly router = inject(Router);

  /**
   * This effect listens to the LOGIN_REQUEST action and performs an asynchronous login operation.
   * It returns a Promise with either a success or failure action.
   */
  public readonly loginEffect = createEffect(
    loginActions.request, // Triggered by the LOGIN_REQUEST action
    async (payload) => {
      try {
        const res = await this.authRepository.login(payload);
        this.authTokenService.setAccessToken(res.body?.accessToken!);
        return loginActions.success(res.body!); // Success action
      } catch (error) {
        return loginActions.failure(); // Failure action on error
      }
    },
  );

  /**
   * This effect listens to the LOGOUT action and performs a simple navigation without returning any new actions.
   * It is an example of an effect returning an empty observable.
   */
  public readonly logoutEffect = createEffect(logoutAction, () => {
    this.router.navigate(['/']);
    return EMPTY; // No additional action needed after logout
  });
}
```

## Returning an observable

Return an observable for a one-shot asynchronous operation. ngx-statewise processes its first emission only. An observable that completes without emitting, such as `EMPTY`, counts as an effect returning `void`.

The following effect fetches a user and maps the response to an action:

```typescript
@Injectable({
  providedIn: 'root',
})
export class UserEffects {
  private readonly userService = inject(UserService);

  /**
   * This effect listens to the GET_USER action and returns an Observable that emits either a success or failure action.
   */
  public readonly getUserEffect = createEffect(
    userActions.getUserRequest, // Triggered by the GET_USER_REQUEST action
    (payload) => {
      return this.userService.fetchUser(payload.userId).pipe(
        map((user) => userActions.getUserSuccess(user)), // Success action
        catchError(() => of(userActions.getUserFailure())), // Failure action on error
      );
    },
  );
}
```

## Registering effects

Declare every effect class in `provideStatewise`, so Angular instantiates it at startup. `createEffect` registers itself in the injection context of the class declaring it, so that class has to be instantiated for its effects to exist. Without the declaration, dispatching the action does nothing.

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideStatewise({
      effects: [AuthEffects, UserEffects],
    }),
    // other providers
  ],
};
```

Call `createEffect` in an injection context: as a field initializer, or in the constructor of an injectable class. Calling it elsewhere throws immediately rather than registering an effect that would never run.

### Scope

An effect runs for the dispatches of the manager owning its action's updater, and only those. Registration is application-wide, and visibility follows the updater: whoever owns it owns the effects too.

```typescript
// AUTH_LOADED is handled by authUpdater, attached to AuthManager.
createEffect(authActions.loaded, () => { ... });

authManager.dispatch(authActions.loaded());   // ✅ the effect runs
taskManager.dispatch(authActions.loaded());   // ❌ misrouted: nothing runs
```

An action type that no updater claims has no owner, so its effects run for every manager. That is an effect-only action, and it stays valid everywhere. An updater declared globally through `provideStatewise({ updaters: [...] })` belongs to every scope, so its effects run everywhere too.

### Lifecycle

A registration lives as long as the injector that created it. An effect class scoped to a component or to a lazy route is unregistered when that injector is destroyed, so instantiating it again never piles up a second copy of its effects.

`createEffect` returns an `EffectRef` for the rarer case where you need to stop an effect earlier:

```typescript
@Injectable()
export class AuthEffects {
  private readonly loginEffect = createEffect(loginActions.request, ...);

  public stopListening(): void {
    this.loginEffect.destroy();
  }
}
```

You can ignore the returned handle. Destroying the owning injector already unregisters the effect.

## Key notes

- Return a promise, an observable, an action, or nothing at all. An observable
  is read once: its first emission becomes the action, and completing without
  emitting produces none.
- Never return the action that triggered the effect. It produces an infinite
  cascade, and nothing stops it for you.
- Effects do not touch state. That is the updater's job, and it has already run.
- Declare every effect class in `provideStatewise({ effects: [...] })`, or it is
  never instantiated and its effects never exist.
- An effect belongs to the scope owning its action's updater, and is
  unregistered with the injector that created it.
