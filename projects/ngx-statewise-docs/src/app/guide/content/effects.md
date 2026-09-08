# Effects

Effects are responsible for handling asynchronous operations such as API calls, navigation, or side effects that are not directly related to state updates. They are created using the `createEffect` utility function and are tied to specific actions.

A key architectural principle in ngx-statewise, _for now_, is that effects always run after state has been updated by an updater. This guarantees that effects operate on the most up-to-date application state. The sequence **Action → Updater → Effect** is enforced by design to ensure predictability and consistency across your application.

Effects can return other actions to trigger Updaters or even other effects, creating a chain of operations. This design promotes cascading effects, where an initial action triggers a state update, which then leads to one or more effects, each of which can dispatch further actions. Rather than encouraging isolated, standalone actions, ngx-statewise encourages sequences of operations, making complex workflows easier to orchestrate.

When creating effects, you must ensure that you don't return the input action directly as it can result in infinite loops. Instead, you should return new actions to trigger the corresponding state updates or other side effects.

Effects may return synchronous values, Promises, or Observables. Observable effects are intentionally one-shot: ngx-statewise consumes their first emission, then stops listening. Use an application-level subscription for long-lived streams.

## Defining Effects with `createEffect`

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

## Effects with Observables

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

## Registering Effects

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

## Key Notes

- Promises: Effects can return Promises for single asynchronous operations.

- Observables: Observable effects are one-shot. Only the first emission is processed; completion without an emission produces no action.

- Avoid Infinite Loops: Be careful not to return the input action from the effect (e.g., avoid returning the same action that triggered the effect). This can lead to infinite loops of action dispatching.

- Side Effects: Effects are designed for side effects like API calls, routing, or other asynchronous operations. They should not directly modify the state. That’s the role of Updaters.

- Scope: An effect only runs for the manager owning the updater of its action. Dispatching that action through another manager runs neither the updater nor the effect.

- Effect Registration: don't forget to declare your effect classes in `provideStatewise({ effects: [...] })` so they are instantiated and ready to handle actions.

- Lifecycle: an effect is unregistered with the injector that created it, so component-scoped or route-scoped effect classes never accumulate duplicates.
