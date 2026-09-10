---
slug: testing
title:
  en: Testing
  fr: Tests
summary:
  en: The ngx-statewise/testing entry point in a TestBed.
  fr: Le point d’entrée ngx-statewise/testing dans un TestBed.
---

# Testing

The `ngx-statewise/testing` entry point wires the library into a `TestBed`, and
gives a test the two things it usually needs.

<!-- prettier-ignore -->
```typescript
import {
  captureStatewiseDeclarations,
  drainEffects,
  provideStatewiseTesting,
} from 'ngx-statewise/testing';
```

| Export                             | What it is for                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `provideStatewiseTesting(config?)` | The same options as `provideStatewise`, plus `strict`. History on by default, so a test can assert what was sent. |
| `drainEffects()`                   | Resolves once every effect in flight in the current `TestBed` is over, whichever manager started it.              |
| `captureStatewiseDeclarations()`   | Records the updater declarations known right now, and returns the function restoring them.                        |

> [!NOTE]
> `provideStatewiseTesting` enables the history with `{ limit: 100 }`. A
> `history` of your own **replaces** that object rather than merging into it,
> so pass a `limit` whenever you pass a `history` at all.
>
> Passing `misroutedDispatch` to it has no effect: `strict` decides, and it is
> applied after. Use `strict: false` to silence the check.

## A first test

Provide the effects the feature needs, dispatch through the manager, and assert
on the state it exposes:

```typescript title="task.manager.spec.ts"
function manager(): TaskManager {
  TestBed.configureTestingModule({
    providers: [
      provideStatewiseTesting({
        effects: [TaskEffect],
        updaters: [taskUpdater],
      }),
    ],
  });

  return TestBed.inject(TaskManager);
}

it('loads the tasks', async () => {
  const tasks = manager();

  await tasks.refreshAndSettle();

  expect(tasks.items()).toHaveLength(3);
});
```

## Letting a fire-and-forget dispatch settle

`dispatch` returns nothing, so a test asserting on its side effects has to wait
for them:

```typescript title="task.manager.spec.ts"
manager.refresh(); // calls statewise.dispatch(...)
await drainEffects();

expect(manager.items()).toHaveLength(3);
```

> [!TIP]
> `drainEffects` settles on completion, not on success: it never rejects, even
> when an effect failed. A failure belongs to whoever awaited the dispatch, not
> to an unrelated observer. Assert on the state, or await `dispatchAsync` when
> you want the failure.

## Asserting the order, not the result

The library's one guarantee is that the state is written before the effect
runs. That is worth a test of its own, and it is written by reading the state
from inside the effect rather than by watching the clock:

```typescript title="auth.effect.spec.ts"
it('runs on state the updater has already written', async () => {
  const auth = manager();

  auth.login(credentials); // synchronous dispatch

  // The updater has been through before this line.
  expect(auth.isLoading()).toBe(true);

  await drainEffects();

  expect(auth.isLoading()).toBe(false);
  expect(auth.user()).not.toBeNull();
});
```

## Exercising an interceptor

`StatewiseTestingConfig` extends `StatewiseConfig`, so `interceptors` is
already here. An interceptor class is listed the way an effect class is, and
for the same reason: nothing else instantiates it, so its declarations never
register.

<!-- prettier-ignore -->
```typescript title="tally.guard.spec.ts"
let statewise: Statewise;

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideStatewiseTesting({ interceptors: [TallyGuard] })],
  });

  statewise = TestBed.runInInjectionContext(() =>
    injectStatewise(tallyUpdater),
  );
});

it('refuses the step that would carry the tally past the ceiling', async () => {
  await statewise.dispatchAsync(tallyActions.incremented(TALLY_CEILING));

  await statewise.dispatchAsync(tallyActions.incremented(1));

  expect(TestBed.inject(TallyState).total).toBe(TALLY_CEILING);
});
```

A refusal resolves the dispatch, so there is nothing to catch and nothing to
drain: assert on the state that did not move. The history is on by default
here, so a suite can also assert that the refused action recorded no entry. See
[Interceptors](/guide/interceptors).

## Dispatching without attaching an updater

A test that only exercises effects can dispatch an action whose updater it
never attached. The misrouted-dispatch check forbids exactly that, so turn it
off for the suite:

<!-- prettier-ignore -->
```typescript title="auth.effect.spec.ts"
TestBed.configureTestingModule({
  providers: [
    provideStatewiseTesting({ strict: false, effects: [AuthEffect] }),
  ],
});
```

## Declaring updaters inside tests

`defineUpdater` records its action types when the module is loaded, so a suite
calling it inside its own tests leaks those declarations into the ones after
it. Capture and restore around them:

```typescript title="updater.spec.ts"
let restoreDeclarations: () => void;

beforeEach(() => (restoreDeclarations = captureStatewiseDeclarations()));
afterEach(() => restoreDeclarations());
```

```typescript avoid title="updater.spec.ts"
// Declarations from this suite stay visible to every suite that follows.
beforeEach(() => {
  defineUpdater(SomeStates, (on) => { ... });
});
```

Prefer `strict: false` when you only want the check off. It is scoped to one
`TestBed`, while declarations are module-level.

## Key notes

- `provideStatewiseTesting` instead of `provideStatewise`, and list the effect
  and interceptor classes the test needs — a class nobody instantiates
  registers nothing.
- `await drainEffects()` after a `dispatch`, `await` the promise after a
  `dispatchAsync`.
- Assert on the state the manager exposes, not on the actions, unless the
  actions are what you are testing.

The showcase has four suites written this way, under `src/integration/`. They
test the library's behaviour rather than a component, and each is short enough
to read as documentation. See
[the integration suites](/guide/showcase#the-integration-suites).

Next: [Migrating from 0.6.x](/guide/migration), or the
[API reference](/guide/api).
