# Introduction

ngx-statewise is a state management library for Angular built on signals. State
lives in plain injectable classes. Actions carry intent, updaters apply it, and
effects handle everything that is not a state change.

It sits between a handful of services passed around by hand and the ceremony of
NgRx or NGXS.

## The flow

Every change follows the same path, in one direction.

1. **An action carries the intent**, and its payload. Nothing happens until one
   is dispatched.
2. **A manager dispatches it.** The manager is the object your components talk
   to, and it dispatches within its own scope.
3. **An updater writes the state**, synchronously. It is the only place state
   changes, and it finishes before anything else runs.
4. **Effects run**, on state that is already up to date: API calls, navigation,
   logging.
5. **Effects may return further actions**, which start the same cycle again.

An effect that returns an action starts a cascade. A login action updates the
state, its effect calls the API, and the action it returns updates the state
again. One `dispatchAsync` awaits the whole chain.

Two consequences follow from that order:

- An effect never sees stale state. The updater has already run.
- An action that no updater handles is valid. It exists to trigger effects, and
  nothing warns you about it.

## How it differs from NgRx and NGXS

NgRx and NGXS are built on a centralised store with reducers and selectors.
ngx-statewise is not.

|                   | NgRx / NGXS                               | ngx-statewise                                          |
| ----------------- | ----------------------------------------- | ------------------------------------------------------ |
| Where state lives | One store, keyed by feature               | An injectable class per feature, holding signals       |
| Reading state     | Selectors                                 | The signals themselves, exposed read-only by a manager |
| Reactivity        | Observables, with subscriptions to manage | Signals, which components track on their own           |
| Wiring an action  | Action, reducer case, selector, effect    | Action, updater handler, effect                        |
| Dispatch target   | The global store                          | The manager owning the state                           |

An action is wired directly to its updater and to the effects that care about
it, instead of travelling through a store everything subscribes to. You follow
less indirection when reading unfamiliar code, and write less when adding a
feature.

In exchange, no single object holds the whole application state. If you need one
place to serialise it, to replay it or to inspect it, this is not the library
for you.

## What to expect

- **Dispatch is scoped.** A manager applies only the updaters it declared. The
  library reports an action sent to the wrong manager instead of swallowing it.
  See
  [dispatching through the right manager](/guide/updaters#dispatching-through-the-right-manager).
- **An action always comes first.** You cannot trigger an effect on its own.
  Expect an adjustment if you are used to reacting to a stream directly.
- **Derived state is `computed`.** There is no selector layer to compose.
