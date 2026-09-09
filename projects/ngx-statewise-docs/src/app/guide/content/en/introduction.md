# Introduction

A state management library for Angular where every change follows the same
path, and the state is written before any side effect runs.

State lives in plain injectable classes holding signals. An action says what
happened, an updater writes the state, and effects do everything that is not a
state change. There is no store, no reducer and no selector layer.

It sits between passing a handful of services around by hand and adopting a
full state framework. If the first has stopped scaling and the second is more
apparatus than you want, this is the gap it is built for.

## The flow

Five steps, always in this order.

1. **An action carries the intent**, and its payload. Nothing happens until one
   is dispatched.
2. **A manager dispatches it.** The manager is the object your components hold,
   and it dispatches within its own scope.
3. **An updater writes the state**, synchronously. It is the only place state
   changes, and it finishes before anything else runs.
4. **Effects run**, on state that is already up to date: API calls, navigation,
   logging.
5. **Effects may return further actions**, which start the same cycle again.

An effect that returns an action starts a cascade. A login action updates the
state, its effect calls the API, and the action it returns updates the state
again. One `dispatchAsync` awaits the whole chain.

> [!IMPORTANT]
> Two consequences follow from that order, and they are the reason the order
> exists. An effect never sees stale state, because the updater has already
> run. And an action that no updater handles is still valid — it exists to
> trigger effects, and nothing warns you about it.

## What it looks like

Three declarations for one feature. The action says what can happen:

```typescript title="auth.actions.ts"
export const loginActions = defineActionsGroup({
  source: 'LOGIN',
  events: {
    request: payload<Credentials>(),
    success: payload<Session>(),
    failure: emptyPayload,
  },
});
```

The updater says what it does to the state, and nothing else:

```typescript title="auth.updater.ts"
export const authUpdater = defineUpdater(AuthStates, (on) => {
  on(loginActions.request, (state) => {
    state.isLoading.set(true);
  });

  on(loginActions.success, (state, session) => {
    state.user.set(session.user);
    state.isLoading.set(false);
  });
});
```

The effect does the asynchronous half, and hands back the action that follows:

```typescript title="auth.effect.ts"
public readonly loginEffect = createEffect(
  loginActions.request,
  async (credentials) => {
    const session = await this.auth.login(credentials);
    return loginActions.success(session);
  },
);
```

Nothing wires those three together. They find each other through the action.

## Where the boundaries are

The library is opinionated about one thing: an updater is synchronous and does
nothing but write state. Everything else belongs in an effect.

```typescript avoid title="auth.updater.ts"
on(loginActions.success, async (state, session) => {
  state.user.set(session.user);
  await this.profile.load(session.user.id);
});
```

That handler is a compile error, and it would be a bug if it were not: the
state would not be settled when the next effect read it.

```typescript prefer title="auth.updater.ts"
on(loginActions.success, (state, session) => {
  state.user.set(session.user);
});
```

The profile load is an effect on the same action. It runs after the write, on
state that already has the user in it.

## How it compares to a store

A store keyed by feature, with reducers and selectors, is a different shape.
Here an action is wired directly to its updater and to the effects that care
about it, instead of travelling through something everything subscribes to.

|                   | A central store                           | ngx-statewise                                    |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| Where state lives | One tree, keyed by feature                | An injectable class per feature, holding signals |
| Reading state     | Selectors                                 | The signals, exposed read-only by a manager      |
| Reactivity        | Observables, with subscriptions to manage | Signals, which components track on their own     |
| Wiring an action  | Action, reducer case, selector, effect    | Action, updater handler, effect                  |
| Dispatch target   | The global store                          | The manager owning the state                     |

You follow less indirection reading unfamiliar code, and write less adding a
feature. In exchange, no single object holds the whole application state. If
you need one place to serialise it, replay it or inspect it, this is not the
library for you — and [Why ngx-statewise](/guide/why) says where else that
line falls.

## What to expect

- **Dispatch is scoped.** A manager applies only the updaters it declared, and
  the library reports an action sent to the wrong one instead of swallowing it.
  See
  [dispatching through the right manager](/guide/updaters#dispatching-through-the-right-manager).
- **An action always comes first.** You cannot trigger an effect on its own.
  Expect an adjustment if you are used to reacting to a stream directly.
- **Derived state is `computed`.** There is no selector layer to compose.

Next: [Why ngx-statewise](/guide/why) for what the design buys you, or
[Getting started](/guide/getting-started) to install it.
