---
slug: getting-started
title:
  en: Getting started
  fr: Démarrage
  es: Empezar
  de: Loslegen
  pt-BR: Começar
summary:
  en: Install the package and wire provideStatewise.
  fr: Installer le paquet et brancher provideStatewise.
  es: Instalar el paquete y conectar provideStatewise.
  de: Das Paket installieren und provideStatewise verdrahten.
  pt-BR: Instalar o pacote e ligar provideStatewise.
---

# Getting started

Install the package, add one provider, and dispatch your first action.

## Installation

```bash
npm install ngx-statewise
```

Angular 20, 21 or 22. Its peers are `@angular/core` and `rxjs`, both of which
your application already has, and its only dependency is `tslib`.

## Setting up your application

`provideStatewise()` is the entry point. It wires the execution engine,
instantiates your effect classes so they register, and takes the updaters you
want reachable from anywhere.

```typescript title="app.config.ts"
import { provideStatewise } from 'ngx-statewise';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStatewise({
      effects: [AuthEffect, UserEffect],
    }),
    // other providers
  ],
};
```

Every option is optional. Calling `provideStatewise()` with nothing is valid
and is the right starting point.

> [!IMPORTANT]
> Call it **once**, at the application root. It provides its own effect
> registry, so a second call in a child injector — the providers of a lazy
> route, typically — builds a second engine that no dispatch of the
> application reaches. The effects declared with it never run, while their
> updaters still apply, which makes the action look like it worked.
>
> The library refuses that rather than letting it happen quietly: a second call
> throws in development and reports to Angular's `ErrorHandler` in production,
> the same rule as a misrouted dispatch. An effect class scoped to a lazy route
> or to a component needs no second call — `createEffect()` registers into the
> root registry from wherever it is injected.

| Option              | Type                              | Default       |
| ------------------- | --------------------------------- | ------------- |
| `effects`           | `readonly Type<unknown>[]`        | none          |
| `interceptors`      | `readonly Type<unknown>[]`        | none          |
| `updaters`          | `readonly Updater<unknown>[]`     | none          |
| `history`           | `{ limit, redact? }`              | disabled      |
| `misroutedDispatch` | `'throw' \| 'report' \| 'ignore'` | by build mode |
| `maxCascadeDepth`   | `number`                          | `50`          |

`effects` are instantiated at startup. An effect class that is never listed
here and never injected anywhere registers nothing, and its handler will not
run — that is the most common reason a first effect appears dead.

`updaters` are reachable from whichever manager dispatches, including
`injectStatewise()` with no updater at all. A scoped updater always wins over a
global one, so a type a manager already owns never reaches these. See
[attaching updaters](/guide/updaters#attaching-updaters).

`interceptors` does for interceptor classes what `effects` does for effect
classes: instantiate them at startup, so their declarations register. The two
are mechanically identical, and separate only because a class holding nothing
but interceptors used to have to travel under `effects`, which named it wrong at
every call site. `effects` still accepts one, so nothing has to move. See
[Interceptors](/guide/interceptors).

`history` records the last `limit` actions, for reading back through
`ActionHistory`. It is off unless you ask for it, and `redact` rewrites an
action before it is recorded — which is how a password stays out of the log.

Each entry carries the action, the cascade path that led to it, and when it was
recorded, so a chain of actions reads as a sequence rather than as N unrelated
rows. See [`HistoryEntry`](/guide/api#actionhistory).

`maxCascadeDepth` bounds how many actions one cascade may chain, the dispatched
action included. Beyond it the cascade is stopped and the whole path is raised,
which is what keeps two effects returning each other's action from exhausting
the heap.

> [!IMPORTANT]
> `history.limit` must be a positive integer. `provideStatewise` checks it
> where you call it, before anything is injected, so `{ limit: 0 }` or a
> fractional value fails at startup rather than silently recording nothing.

`misroutedDispatch` decides what happens when an action reaches a manager that
does not own its updater. It throws in development and reports to Angular's
`ErrorHandler` in production. Set it explicitly only if you have a reason to
disagree — see
[development throws, production reports](/guide/updaters#development-throws-production-reports).

## Your first feature

Four small files, and nothing wires them together but the action.

The state is a plain injectable holding signals:

```typescript title="counter.states.ts"
@Injectable({ providedIn: 'root' })
export class CounterStates {
  public count = signal(0);
}
```

The actions say what can happen:

```typescript title="counter.actions.ts"
export const counterActions = defineActionsGroup({
  source: 'COUNTER',
  events: {
    increment: emptyPayload,
    add: payload<number>(),
  },
});
```

The updater says what each one does to the state, and nothing else:

```typescript title="counter.updater.ts"
export const counterUpdater = defineUpdater(CounterStates, (on) => {
  on(counterActions.increment, (state) => {
    state.count.update((count) => count + 1);
  });

  on(counterActions.add, (state, amount) => {
    state.count.update((count) => count + amount);
  });
});
```

The manager is what your components hold:

```typescript title="counter.manager.ts"
@Injectable({ providedIn: 'root' })
export class CounterManager {
  private readonly states = inject(CounterStates);
  private readonly statewise = injectStatewise(counterUpdater);

  public readonly count = this.states.count.asReadonly();

  public increment(): void {
    this.statewise.dispatch(counterActions.increment());
  }
}
```

A component injects the manager, reads `count()` in its template and calls
`increment()`. There is no subscription and nothing to tear down.

## Where to go next

- [States](/guide/states) for what a state class may hold.
- [Actions](/guide/actions) for groups, single actions and the types they
  generate.
- [Effects](/guide/effects) as soon as your feature needs to call an API.
