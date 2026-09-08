# Effects

An effect is the asynchronous half of a feature: API calls, navigation,
storage, logging — everything that is not a state change. You declare one with
`createEffect`, bound to a single action.

Effects always run **after** the updater, so they never read stale state. The
sequence **action → updater → effect** is not a convention here, it is enforced.

An effect may return another action, and that action goes through the same
cycle: its updater, then its own effects. This is how a flow like "log in, load
the workspace, then navigate" is expressed — as a chain, not as a callback tree.
Never return the action that triggered the effect: that is an infinite cascade,
and nothing will stop it for you.

A handler may return an action, a promise, an observable, or nothing.
Observables are read once — ngx-statewise takes the first emission and stops
listening — so a long-lived stream belongs in an application-level
subscription, not in an effect.

## Defining an effect

The `createEffect` utility allows you to create an effect linked to a particular action. By default, it expects a Promise, but you can also return Observables within the effect.

Here's an example of an effect that uses a Promise:

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

You can return an Observable for a one-shot asynchronous operation. Only its first emission is processed. An Observable that completes without emitting, such as `EMPTY`, is treated like an effect returning `void`.

Here’s an example of an effect using an Observable:

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

In the example above, the effect listens for the GET_USER_REQUEST action and uses an Observable to handle the asynchronous operation of fetching user data.

## Registering effects

Effect classes must be declared in `provideStatewise` so Angular instantiates them at startup. `createEffect` registers itself in the injection context of the class that declares it, which is why the class must be instantiated for its effects to exist. Without this declaration, nothing happens when the action is dispatched.

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

`createEffect` must be called in an injection context — as a field initializer or in the constructor of an injectable class. Calling it elsewhere throws immediately rather than registering an effect that would never run.

### Scope

An effect runs for the dispatches of the manager owning its action's updater, and only those. Registration is application-wide, visibility is not: the owner of the updater owns the effects too.

```typescript
// AUTH_LOADED is handled by authUpdater, attached to AuthManager.
createEffect(authActions.loaded, () => { ... });

authManager.dispatch(authActions.loaded());   // ✅ the effect runs
taskManager.dispatch(authActions.loaded());   // ❌ misrouted: nothing runs
```

An action type no updater claims has no owner, so its effects run for every manager — that is an effect-only action, and it stays valid everywhere. An updater declared globally through `provideStatewise({ updaters: [...] })` is owned by every scope, so its effects run everywhere too.

### Lifecycle

A registration lives as long as the injector that created it. An effect class scoped to a component or to a lazy route is unregistered when that injector is destroyed, instead of piling up one more copy of its effects on every instantiation.

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

Ignoring the returned handle is perfectly fine: destruction of the owning injector already unregisters the effect.

## Key notes

- Return a promise, an observable, an action, or nothing at all. An observable
  is read once: its first emission becomes the action, and completing without
  emitting produces none.
- Never return the action that triggered the effect. That is an infinite
  cascade, and nothing stops it for you.
- Effects do not touch state. That is the updater's job, and it has already run.
- Declare every effect class in `provideStatewise({ effects: [...] })`, or it is
  never instantiated and its effects never exist.
- An effect belongs to the scope owning its action's updater, and is
  unregistered with the injector that created it.
