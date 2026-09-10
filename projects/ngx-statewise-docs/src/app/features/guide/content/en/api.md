---
slug: api
title:
  en: API reference
  fr: Référence d’API
  es: Referencia de API
  de: API-Referenz
  pt-BR: Referência da API
summary:
  en: Every export, with the signature the compiler sees.
  fr: Chaque export, avec la signature que voit le compilateur.
  es: Cada export, con la firma que ve el compilador.
  de: Jeder Export, mit der Signatur, die der Compiler sieht.
  pt-BR: Cada export, com a assinatura que o compilador vê.
---

# API reference

Every export of the package, with the signature the compiler sees. The pages
under Key concepts explain when to reach for each one; this page is for looking
up a name.

There are two entry points. `ngx-statewise` holds everything an application
uses, and `ngx-statewise/testing` holds the three helpers a `TestBed` needs.

## Actions

### defineActionsGroup

<!-- prettier-ignore -->
```typescript
function defineActionsGroup<Source, Events>(config: {
  source: Source;
  events: Events;
}): ActionCreatorsGroup<Source, Events>;
```

Declares a set of related actions under one source. Each event name becomes an
action type: with a source of `LOGIN`, the event `request` produces
`LOGIN_REQUEST`. Every value in `events` is `payload<T>()` or `emptyPayload`.

See [Actions](/guide/actions#action-groups).

### defineSingleAction

<!-- prettier-ignore -->
```typescript
function defineSingleAction<Source, Definition>(
  source: Source,
  payloadDefinition: Definition,
): CreatorFromDefinition<SingleActionType<Source>, Definition>;
```

Declares an action that belongs to no group. The type is the source suffixed
with `_ACTION`, so `LOGOUT` produces `LOGOUT_ACTION`.

See [Actions](/guide/actions#single-actions).

### payload

```typescript
function payload<T>(): ValuePayloadFn<T>;
```

Declares that an action carries a `T`. It is a type-level marker: it is called
with no argument at declaration time, and the payload is passed when the action
creator is called.

### emptyPayload

```typescript
const emptyPayload: EmptyPayloadFn;
```

Declares that an action carries nothing. Its creator takes no argument, and its
updater handler and effect handler take no payload parameter.

### ofType

```typescript
function ofType<Type>(action: { type: Type }): Type;
function ofType<Creator>(action: Creator): ReturnType<Creator>['type'];
```

Reads the type name of an action creator or of an action, as a literal type
rather than a widened `string`.

```typescript
ofType(loginActions.request); // 'LOGIN_REQUEST'
ofType({ type: 'MY_ACTION' }); // 'MY_ACTION'
```

## Updaters

### defineUpdater

<!-- prettier-ignore -->
```typescript
function defineUpdater<State>(
  stateToken: ProviderToken<State>,
  configure: (on: On<State>) => void,
): Updater<State>;
```

Declares how a state reacts to actions. The token is resolved from the injector
when the updater is attached to a dispatch scope, not at declaration time, so
two managers of the same feature keep separate states.

The `on` callback registers one handler per action. A handler is synchronous
and returns nothing; an `async` handler is a compile error, because the state
has to be settled before effects run.

See [Updaters](/guide/updaters).

### requestStatus

```typescript
function requestStatus<State, Actions>(
  on: On<State>,
  actions: Actions,
  status: {
    loading: (state: State) => WritableSignal<boolean>;
    error: (state: State) => WritableSignal<boolean>;
    onRequest?: (state: State, payload: …) => undefined;
    onSuccess?: (state: State, payload: …) => undefined;
    onFailure?: (state: State, payload: …) => undefined;
  },
): void;
```

Called inside `defineUpdater`, with its `on`. Writes the three handlers of a
`request` / `success` / `failure` group onto two boolean signals: `request`
raises `loading` and **clears `error`**, `success` drops `loading`, `failure`
drops `loading` and raises `error`.

The three handlers are optional, take the payload of their own action, and run
after the flags are settled. See
[Request status](/guide/updaters#request-status) for what it does not cover.

## Effects

### createEffect

<!-- prettier-ignore -->
```typescript
function createEffect<Creator>(
  action: Creator,
  handler: EffectHandler<Creator>,
  options?: EffectOptions<Creator>,
): EffectRef;
```

Registers an effect for one action, in the injection context of the class
declaring it. The registration lasts as long as that injector, so an effect
class scoped to a component or a route is unregistered on destruction instead
of piling up a duplicate on every instantiation.

The handler receives the action payload when there is one, then the context of
its own run. What it returns is executed in the same dispatch, and awaited by
`dispatchAsync`:

| Returned                       | Effect                                     |
| ------------------------------ | ------------------------------------------ |
| nothing                        | The dispatch ends here.                    |
| an action, or an array of them | They are dispatched in turn.               |
| a `Promise` of either          | Awaited, then dispatched.                  |
| an `Observable` of either      | Its **first** emission only, then dropped. |

> [!WARNING]
> Never return the action that triggered the effect. Each run dispatches it
> again, and the loop ends only when
> [`maxCascadeDepth`](/guide/api#providestatewise) stops it.

`options` governs the runs of the effect. Left out, every run goes on side by
side, which is what the engine has always done.

| Option        | Type                                | Default             |
| ------------- | ----------------------------------- | ------------------- |
| `concurrency` | `'parallel' \| 'latest' \| 'first'` | `'parallel'`        |
| `key`         | `(payload) => string`               | every run one group |
| `cancelOn`    | a creator, or an array of them      | none                |
| `mustAnswer`  | `boolean`                           | `false`             |

`key` reads the payload, so it is offered only for an action that carries one.

See [Governing the runs](/guide/effects#governing-the-runs) for what each of
them costs, and [Effects](/guide/effects) for the rest.

### EffectContext

```typescript
interface EffectContext {
  readonly abortSignal: AbortSignal;
}
```

The handler's last parameter. `abortSignal` is aborted when the run is
superseded under `'latest'` or abandoned through `cancelOn`, and hand it to
whatever accepts one so the work stops rather than merely being ignored. An
effect declaring neither is never abandoned, and its signal never fires.

### EffectRef

```typescript
interface EffectRef {
  destroy(): void;
}
```

Unregisters the effect before its injector is destroyed. Ignoring the returned
handle is fine — the injector cleans up on its own.

## Interceptors

### createInterceptor

<!-- prettier-ignore -->
```typescript
function createInterceptor<Creator>(
  action: Creator,
  handler: InterceptorHandler<Creator>,
): InterceptorRef;
```

Registers an interceptor for one action, in the injection context of the class
declaring it. It is asked on every dispatch of that action, before the updater
is applied, and the registration lasts as long as that injector, on the same
rules as `createEffect`.

The handler receives the action payload when there is one, and is synchronous:
an `async` handler is a compile error, because the state has to be settled
before effects run. Only `false` refuses, and returning nothing lets the action
through.

Refusing stops the action there: no state update, no effect, no history entry.
`dispatchAsync` resolves rather than rejecting, because a refusal is an
expected outcome and not a failure, and nothing reaches Angular's
`ErrorHandler` either.

See [Interceptors](/guide/interceptors).

### InterceptorRef

```typescript
interface InterceptorRef {
  destroy(): void;
}
```

Unregisters the interceptor before its injector is destroyed. Ignoring the
returned handle is fine — the injector cleans up on its own.

## Dispatching

### injectStatewise

```typescript
function injectStatewise(...updaters: Updater<unknown>[]): Statewise;
```

Attaches updaters to the current injection context and returns the handle a
manager dispatches through. Call it in a field initialiser or a constructor,
like any other `inject`.

See [Managers](/guide/managers).

### Statewise

The handle `injectStatewise` returns. Everything on it is scoped to that
handle: what it dispatches, and the effects it waits for.

| Member                  | Returns         | What it does                                                                                                                                  |
| ----------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch(action)`      | `void`          | Runs the updater, then starts the effects without waiting for them.                                                                           |
| `dispatchAsync(action)` | `Promise<void>` | The same, and resolves once the whole cascade has settled — manager boundaries included, for a dispatch a synchronous effect handler emitted. |
| `waitForEffect(action)` | `Promise<void>` | Resolves when the effect for that action type has settled.                                                                                    |
| `waitForAllEffects()`   | `Promise<void>` | Resolves when every effect this handle started has settled.                                                                                   |

`waitForEffect` takes anything carrying a `type`, so an action creator and an
action both work.

The action history is deliberately not here: it is application-wide, and a
scoped handle is the wrong place to read it from.

### ActionHistory

```typescript
class ActionHistory {
  record(action: Action, cascade: readonly string[]): void;
  snapshot(): readonly HistoryEntry[];
}

interface HistoryEntry {
  readonly action: Action;
  readonly cascade: readonly string[];
  readonly recordedAt: number;
}
```

The last dispatched actions, oldest first. Injectable, application-wide, and
empty unless `provideStatewise` was given a `history` option.

An entry is an envelope, not an enriched `Action`: reading the history and
dispatching are two different things, and an `Action` that carried a cascade
would make every action look like it does.

`cascade` is the chain of action types that led to the entry, this action last
— the same path the cascade-bound error prints. A single dispatch reads as one
entry; a cascade of three reads as three whose paths extend each other, which
is what relates them. `recordedAt` is `Date.now()` at the moment of recording,
and is what tells two concurrent dispatches of one action type apart.

`redact` still receives the action alone. What an application strips is a
payload, never a path.

> [!NOTE]
> Both are frozen, the path included: an entry already handed out cannot be
> rewritten through the array `snapshot` returns. The payload keeps its
> identity — see the note on `redact` below.

## Setting up

### provideStatewise

```typescript
function provideStatewise(config?: StatewiseConfig): EnvironmentProviders;
```

Wires the execution engine, the effect classes and the global updaters. Every
option is optional.

| Option              | Type                              | Default       |
| ------------------- | --------------------------------- | ------------- |
| `effects`           | `readonly Type<unknown>[]`        | none          |
| `interceptors`      | `readonly Type<unknown>[]`        | none          |
| `updaters`          | `readonly Updater<unknown>[]`     | none          |
| `history`           | `{ limit, redact? }`              | disabled      |
| `misroutedDispatch` | `'throw' \| 'report' \| 'ignore'` | by build mode |
| `maxCascadeDepth`   | `number`                          | `50`          |

`updaters` are reachable from whichever manager dispatches, including
`injectStatewise()` with no updater at all. A scoped updater always wins over a
global one, so a type a manager already owns never reaches them.

`misroutedDispatch` defaults to `'throw'` in development and `'report'` in
production, where it goes to Angular's `ErrorHandler`.

`maxCascadeDepth` bounds how many actions one cascade may chain. Beyond it the
cascade is stopped and the whole path is raised, which is what keeps two effects
returning each other's action from exhausting the heap.

See [Getting started](/guide/getting-started#setting-up-your-application).

## Testing

Imported from `ngx-statewise/testing`.

### provideStatewiseTesting

<!-- prettier-ignore -->
```typescript
function provideStatewiseTesting(
  config?: StatewiseTestingConfig,
): EnvironmentProviders;
```

The same options as `provideStatewise`, plus `strict`, and with the action
history on by default so a test can assert what was dispatched without
configuring anything.

`strict` defaults to `true` and keeps the misrouted-dispatch check on. Turn it
off for a suite that deliberately dispatches an action whose updater it has not
attached.

### drainEffects

```typescript
function drainEffects(): Promise<void>;
```

Waits for every effect still running in the current `TestBed`, whichever
manager started it. This is how a fire-and-forget `dispatch` is allowed to
settle before an assertion.

### captureStatewiseDeclarations

```typescript
function captureStatewiseDeclarations(): () => void;
```

Records the updater declarations known right now and returns the function that
restores them. Only useful for a suite calling `defineUpdater` inside its
tests, so a type declared by one test is not reported as misrouted in the next.

> [!TIP]
> To simply turn the check off, prefer `provideStatewiseTesting({ strict: false })`.

See [Testing](/guide/testing).

## Exported types

**The rule that selects them: a type is exported when a consumer has to write
it to annotate a declaration they cannot leave inferred.** Everything else is
inferred, and exporting it would only invite people to write out what the
compiler already knows — and would freeze it into the contract.

That is nineteen names. Fifteen more used to be here and were removed in 1.0;
they are still declared, and still serve these signatures, they are simply not
yours to name. If you had one written out, delete the annotation: the value it
described is inferred.

| Type                        | What it is                                      |
| --------------------------- | ----------------------------------------------- |
| `Action`                    | A type, and an optional payload.                |
| `AnyActionCreator`          | Any creator, for writing a generic of your own. |
| `ActionPayloadOf`           | The payload type carried by a creator.          |
| `ActionIdentity`            | Anything carrying a `type`.                     |
| `Updater`                   | What `defineUpdater` returns.                   |
| `EffectHandler`             | The function `createEffect` takes.              |
| `EffectOutcome`             | What an effect handler may return.              |
| `EffectOptions`             | The third argument of `createEffect`.           |
| `EffectConcurrency`         | `'parallel' \| 'latest' \| 'first'`.            |
| `EffectContext`             | The second argument of an effect handler.       |
| `EffectRef`                 | The handle `createEffect` returns.              |
| `InterceptorHandler`        | The function `createInterceptor` takes.         |
| `InterceptorRef`            | The handle `createInterceptor` returns.         |
| `Statewise`                 | The dispatch handle.                            |
| `HistoryEntry`              | One entry of the action history.                |
| `ActionRedaction`           | The `history.redact` hook.                      |
| `StatewiseConfig`           | The `provideStatewise` options.                 |
| `StatewiseHistoryOptions`   | The `history` option.                           |
| `MisroutedDispatchReaction` | `'throw' \| 'report' \| 'ignore'`.              |

`StatewiseTestingConfig` comes from `ngx-statewise/testing`, and extends
`StatewiseConfig` with `strict`.

> [!NOTE]
> One place the inference needs a hand, and it needs no library type. An
> updater handler passed inline is contextually typed, so it compiles as
> written. Pulled out into a constant it loses that context, and an arrow with
> no `return` infers `void` where the collector wants `undefined` — so annotate
> the return, `(state: State, value: number): undefined => { ... }`.
> `undefined` is a language keyword, which is why `StateUpdate` did not have to
> stay exported for this.

Names prefixed with `ɵ` are not part of the public contract. They exist for
`ngx-statewise/testing` and can change in any release.
