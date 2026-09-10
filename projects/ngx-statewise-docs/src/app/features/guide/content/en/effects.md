---
slug: effects
title:
  en: Effects
  fr: Effects
summary:
  en: Asynchronous work, its scope and its lifecycle.
  fr: Le travail asynchrone, sa portée et son cycle de vie.
---

# Effects

The asynchronous half of a feature. API calls, navigation, storage, logging:
everything a state change is not.

Effects always run **after** the updater, so they never read stale state. The
library enforces the sequence action → updater → effect. An
[interceptor](/guide/interceptors) is the one step that runs earlier, when one
guards the action.

An effect may return another action, and that action goes through the same
cycle: its updater, then its own effects. A flow like "log in, load the
workspace, then navigate" is a chain of those actions rather than a tree of
callbacks.

> [!WARNING]
> Never return the action that triggered the effect. Each run dispatches it
> again. The cascade bound stops the loop at 50 actions and raises the path it
> took, so what you get is an error naming the cycle rather than a dead tab.
> The bound is a backstop. The cycle is still the bug.

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
emitting, `EMPTY` for instance, counts as returning nothing.

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

Without the declaration, dispatching the action does nothing at all, and
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
every manager. That is an effect-only action, and it is valid everywhere. An
updater declared globally belongs to every scope, so its effects run everywhere
too.

### Lifecycle

A registration lives as long as the injector that created it. An effect class
scoped to a component or to a lazy route is unregistered when that injector is
destroyed, so instantiating it again never piles up a second copy.

Such a class needs nothing but itself: `createEffect` injects the registry from
wherever it is called, and finds the root one. Do **not** add a second
`provideStatewise()` to that route. It would provide a registry of its own,
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

## Governing the runs

`createEffect` takes a third argument, and it decides what happens when a
dispatch arrives while a run of the same effect is still in flight. Left out,
every run goes on side by side.

<!-- prettier-ignore -->
```typescript title="task.effect.ts"
public readonly getAllTaskRequestEffect = createEffect(
  getAllTaskActions.request,
  async () => { ... },
  { concurrency: 'latest', cancelOn: taskReset, mustAnswer: true },
);
```

Only the runs of one effect, in one dispatch scope, under one concurrency key
compete with each other. Two managers dispatching the same action never
supersede one another.

### concurrency

| Value        | While a run of this effect is in flight                                    |
| ------------ | -------------------------------------------------------------------------- |
| `'parallel'` | Every run goes on side by side. The default.                               |
| `'latest'`   | The newest wins. The one in flight is abandoned and its answer is dropped. |
| `'first'`    | The oldest wins. The new dispatch runs no handler at all.                  |

Under `'latest'`, the abandoned run's `abortSignal` fires, a subscribed source
is unsubscribed, and its answer never reaches an updater. Its own dispatch
resolves instead of failing, and a failure it raises after being abandoned is
swallowed, because nobody is waiting for the answer of a run that was
replaced.

Under `'first'`, the dispatch that ran no handler still applies its updater.
The policy governs effects, not state.

### key

`'latest'` and `'first'` weigh every run of the effect against every other
one. `key` splits them into independent groups, one per string it returns, so
two dispatches concerning two different entities never compete:

```typescript title="task.effect.ts"
{
  concurrency: 'latest',
  key: (task) => task.id,
  cancelOn: taskReset,
  mustAnswer: true,
}
```

Dragging a second card no longer abandons the write of the first, while
dragging the same card twice still abandons its own earlier write. `key` reads
the payload, so it exists only for an action that carries one.

### cancelOn

The actions that abandon the runs of this effect, as one creator or an array of
them. An abandoned run ends exactly as a superseded one: its `abortSignal`
fires, its source is unsubscribed, and its answer is dropped.

Cancellation is scoped like dispatch, so a manager abandons the runs it started
and never those of another one, and it abandons every `key` at once. A new run
may start straight afterwards.

### mustAnswer

Declares that this effect always answers with an action, so a run producing
none is a failure rather than a result:

```
[ngx-statewise] The effect for "TASK_REQUEST" declares mustAnswer and produced
no action. A one-shot source completing without emitting is the usual cause:
nothing answers the request, so whatever its updater set on the way in is never
cleared. End the pipeline with a fallback action, or drop mustAnswer if this
effect may legitimately answer nothing.
```

The engine cannot tell an effect deliberately finishing without an action from
a source that quietly ran dry, since both reach it as an empty result. This is
how an effect says which one it is, and it is worth declaring on any request
whose updater raised an `isLoading` on the way in. Leave it off for an effect
that only performs a side effect.

### The run context

The handler's last parameter is the context of its own run:

<!-- prettier-ignore -->
```typescript title="write.effect.ts"
createEffect(
  writeActions.request,
  async ({ value }, { abortSignal }) => { ... },
  { concurrency: 'latest' },
);
```

`abortSignal` is aborted when the run is superseded or cancelled. Hand it to
whatever accepts one, `fetch` or an abort-aware client, so the work actually
stops rather than merely being ignored: dropping an answer costs nothing, while
letting the request finish costs a request.

An effect that declares neither a concurrency policy nor a `cancelOn` is never
abandoned, and its signal never fires. An action carrying no payload still has
that first parameter, so such a handler reads `(_, { abortSignal })`.

## Key notes

- Return a promise, an observable, an action, or nothing. An observable is read
  once.
- Never return the action that triggered the effect.
- Effects do not touch state. That is the updater's job, and it has already run.
- Declare every effect class in `provideStatewise({ effects: [...] })`, or it is
  never instantiated and its effects never exist.
- An effect belongs to the scope owning its action's updater, and is
  unregistered with the injector that created it.
- Two racing dispatches run side by side unless the effect says otherwise.
  `concurrency: 'latest'` is what makes the newest answer win.

[Cancelling a request](/guide/cancelling-requests) puts `concurrency`, `key`,
`cancelOn` and `abortSignal` to work on one search box, which is the fastest
way to see why each exists.

The showcase declares five effects in one file and uses every option between
them. See [the task board](/guide/showcase#task-board).

Next: [Interceptors](/guide/interceptors).
