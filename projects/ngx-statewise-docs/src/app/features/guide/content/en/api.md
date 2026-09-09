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

## Effects

### createEffect

<!-- prettier-ignore -->
```typescript
function createEffect<Creator>(
  action: Creator,
  handler: EffectHandler<Creator>,
): EffectRef;
```

Registers an effect for one action, in the injection context of the class
declaring it. The registration lasts as long as that injector, so an effect
class scoped to a component or a route is unregistered on destruction instead
of piling up a duplicate on every instantiation.

The handler receives the action payload when there is one. What it returns is
executed in the same dispatch, and awaited by `dispatchAsync`:

| Returned                       | Effect                                     |
| ------------------------------ | ------------------------------------------ |
| nothing                        | The dispatch ends here.                    |
| an action, or an array of them | They are dispatched in turn.               |
| a `Promise` of either          | Awaited, then dispatched.                  |
| an `Observable` of either      | Its **first** emission only, then dropped. |

> [!WARNING]
> Never return the action that triggered the effect. It produces an infinite
> cascade, and nothing stops it for you.

See [Effects](/guide/effects).

### EffectRef

```typescript
interface EffectRef {
  destroy(): void;
}
```

Unregisters the effect before its injector is destroyed. Ignoring the returned
handle is fine — the injector cleans up on its own.

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

Almost everything here is inferred for you. These are the names to reach for
when a signature has to be written out.

| Type                                   | What it is                                         |
| -------------------------------------- | -------------------------------------------------- |
| `Action`                               | A type, and an optional payload.                   |
| `EmptyAction` / `ActionWithPayload`    | The two shapes an action takes.                    |
| `ActionCreator` / `AnyActionCreator`   | What a declaration produces.                       |
| `EmptyActionCreator`                   | A creator called with no argument.                 |
| `PayloadActionCreator`                 | A creator called with a payload.                   |
| `ActionCreatorsGroup`                  | What `defineActionsGroup` returns.                 |
| `CreatorFromDefinition`                | Picks the creator shape from a payload definition. |
| `ActionPayloadOf`                      | The payload type carried by a creator.             |
| `GroupActionType` / `SingleActionType` | The generated type-name strings.                   |
| `PayloadDefinition`                    | `payload<T>()` or `emptyPayload`.                  |
| `EmptyPayloadFn` / `ValuePayloadFn`    | What those two are.                                |
| `Updater`                              | What `defineUpdater` returns.                      |
| `On` / `StateUpdate`                   | The registration callback, and one handler.        |
| `EffectHandler`                        | The function `createEffect` takes.                 |
| `EffectOutcome` / `ResolvedActions`    | What an effect handler may return.                 |
| `EffectRef`                            | The handle `createEffect` returns.                 |
| `Statewise`                            | The dispatch handle.                               |
| `ActionIdentity`                       | Anything carrying a `type`.                        |
| `StatewiseConfig`                      | The `provideStatewise` options.                    |
| `StatewiseHistoryOptions`              | The `history` option.                              |
| `MisroutedDispatchReaction`            | `'throw' \| 'report' \| 'ignore'`.                 |
| `StatewiseTestingConfig`               | The `provideStatewiseTesting` options.             |

Names prefixed with `ɵ` are not part of the public contract. They exist for
`ngx-statewise/testing` and can change in any release.
