# Introduction

ngx-statewise is a state management library for Angular built on signals. State
lives in plain injectable classes, actions carry intent, updaters apply it, and
effects handle everything that is not a state change.

It aims at the middle ground: more structure than a handful of services passed
around by hand, far less ceremony than NgRx or NGXS.

## The flow

Every change follows the same path, and it only goes one way.

1. **An action carries the intent**, and its payload. Nothing happens until one
   is dispatched.
2. **A manager dispatches it.** The manager is the object your components talk
   to, and it dispatches within its own scope.
3. **An updater writes the state**, synchronously. It is the only place state
   changes, and it finishes before anything else runs.
4. **Effects run**, on state that is already up to date: API calls, navigation,
   logging.
5. **Effects may return further actions**, which start the same cycle again.

That last step is the point. A login action updates the state, its effect calls
the API, and the action it returns updates the state again — one chain, awaited
end to end by a single `dispatchAsync`.

Two consequences are worth stating outright, because they are what you get in
exchange for the structure:

- An effect never sees stale state. The updater has already run.
- An action that no updater handles is perfectly valid. It exists to trigger
  effects, and nothing warns you about it.

## How it differs from NgRx and NGXS

Both are excellent, and both are built on a centralised store with reducers and
selectors. ngx-statewise is not.

|                   | NgRx / NGXS                               | ngx-statewise                                          |
| ----------------- | ----------------------------------------- | ------------------------------------------------------ |
| Where state lives | One store, keyed by feature               | An injectable class per feature, holding signals       |
| Reading state     | Selectors                                 | The signals themselves, exposed read-only by a manager |
| Reactivity        | Observables, with subscriptions to manage | Signals, which components track on their own           |
| Wiring an action  | Action, reducer case, selector, effect    | Action, updater handler, effect                        |
| Dispatch target   | The global store                          | The manager owning the state                           |

The practical difference is that an action is wired directly to the updater and
the effects that care about it, instead of travelling through a store that
everything subscribes to. There is less indirection to follow when you are
reading unfamiliar code, and less to write when you are adding a feature.

The trade is that there is no single object holding the whole application state.
If you rely on that — one place to serialise, to time-travel, to inspect — this
is not the library for you.

## What to expect

- **Dispatch is scoped.** A manager only applies the updaters it declared.
  Sending an action to the wrong manager is a mistake the library reports rather
  than swallows — see
  [dispatching through the right manager](/guide/updaters#dispatching-through-the-right-manager).
- **An action always comes first.** Effects cannot be triggered on their own,
  which is a real adjustment if you are used to reacting to a stream directly.
- **Derived state is `computed`.** There is no selector layer to compose, which
  is simpler until you want something a selector library would have given you.
