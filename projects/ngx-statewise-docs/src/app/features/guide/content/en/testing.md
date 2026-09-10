---
slug: testing
title:
  en: Testing
  fr: Tests
summary:
  en: The ngx-statewise/testing entry point, and a worked suite for an effect.
  fr: Le point d’entrée ngx-statewise/testing, et une suite complète pour un effect.
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

> [!IMPORTANT]
> List the effect class in `effects`. `createEffect` registers itself in the
> injection context of the class declaring it, so a class nobody instantiates
> registers nothing. The test then passes for the wrong reason, because the
> action does nothing at all.

## Letting a fire-and-forget dispatch settle

`dispatch` returns nothing, so a test asserting on its side effects has to wait
for them:

```typescript title="task.manager.spec.ts"
const tasks = manager();

tasks.refresh(); // calls statewise.dispatch(...)
await drainEffects();

expect(tasks.items()).toHaveLength(3);
```

> [!TIP]
> `drainEffects` settles on completion, not on success: it never rejects, even
> when an effect failed. A failure belongs to whoever awaited the dispatch, not
> to an unrelated observer. Assert on the state, or await `dispatchAsync` when
> you want the failure.

## Asserting the order

The library's one guarantee is that the state is written before the effect
runs. That is worth a test of its own. Write it by reading the state between
the dispatch and the settle, rather than by waiting:

```typescript title="task.effect.spec.ts"
it('leaves the state written before the effect runs', async () => {
  const tasks = manager();

  tasks.toggleDone('a'); // synchronous dispatch

  // The updater has been through; the effect has not finished.
  expect(tasks.pending().has('a')).toBe(true);

  await drainEffects();

  expect(tasks.pending().has('a')).toBe(false);
});
```

```typescript avoid title="task.effect.spec.ts"
tasks.toggleDone('a');
await new Promise((resolve) => setTimeout(resolve, 50));
expect(tasks.pending().has('a')).toBe(false);
```

A timeout asserts that the machine was fast enough, which is a different claim
and a flaky one. `drainEffects` resolves when the work is actually over.

## A worked suite for an effect

An effect can get three things wrong: the action it returns, the cascade it
starts, and what it does when the call fails. The rest of this page is the
suite you copy from.

### Replacing what the effect talks to

Provide the effect class, attach the updater, and substitute whatever the
effect calls. Nothing else is special about a suite that exercises effects.

```typescript title="task.effect.spec.ts"
class FakeTaskApi {
  public setDone = vi.fn().mockResolvedValue(undefined);
  public list = vi.fn().mockResolvedValue([task('a'), task('b')]);
}

function suite(api = new FakeTaskApi()): {
  tasks: TaskManager;
  api: FakeTaskApi;
} {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [
      provideStatewiseTesting({
        effects: [TaskEffect],
        updaters: [taskUpdater],
      }),
      { provide: TaskApi, useValue: api },
    ],
  });

  return { tasks: TestBed.inject(TaskManager), api };
}
```

### Testing what it returns

Dispatch, let it settle, and assert on the state the manager exposes. The
returned action is an implementation detail; the state is the contract.

<!-- prettier-ignore -->
```typescript title="task.effect.spec.ts"
it('marks the task done once the server agrees', async () => {
  const { tasks, api } = suite();

  await tasks.toggleDoneAndSettle('a');

  expect(api.setDone).toHaveBeenCalledWith('a', true);
  expect(tasks.items()).toContainEqual(
    expect.objectContaining({ id: 'a', done: true }),
  );
});
```

When the actions themselves are what you are testing, a cascade or an ordering,
read them from the history, which `provideStatewiseTesting` enables for you:

```typescript title="task.effect.spec.ts"
it('confirms rather than reverting', async () => {
  const { tasks } = suite();

  await tasks.toggleDoneAndSettle('a');

  const dispatched = TestBed.inject(ActionHistory)
    .snapshot()
    .map((entry) => entry.action.type);

  expect(dispatched).toEqual(['TASK_TOGGLE_DONE', 'TASK_TOGGLE_CONFIRMED']);
});
```

### Testing the failure path

Make the fake fail, and assert the state came back:

<!-- prettier-ignore -->
```typescript title="task.effect.spec.ts"
it('puts the task back when the server refuses', async () => {
  const api = new FakeTaskApi();
  api.setDone.mockRejectedValue(new Error('nope'));

  const { tasks } = suite(api);

  await tasks.toggleDoneAndSettle('a');

  expect(tasks.items()).toContainEqual(
    expect.objectContaining({ id: 'a', done: false }),
  );
  expect(tasks.lastError()).toContain('nope');
});
```

> [!TIP]
> If the effect lets the error escape instead of returning a revert action,
> `dispatchAsync` rejects and `drainEffects` does not. Choose deliberately
> which one the test awaits: `dispatchAsync` when the failure is the subject,
> `drainEffects` when you only need the work to be over.

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

A suite exercising an effect in isolation may not want to attach the updater at
all. The misrouted-dispatch check forbids exactly that, so turn it off:

<!-- prettier-ignore -->
```typescript title="auth.effect.spec.ts"
TestBed.configureTestingModule({
  providers: [
    provideStatewiseTesting({ strict: false, effects: [AuthEffect] }),
  ],
});
```

Reach for it when the effect is the subject. Prefer attaching the real updater
otherwise, since a test that dispatches into a scope owning nothing proves less
than it looks.

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
  defineUpdater(SomeStates, (on) => {
    on(counterActions.increment, (state) => {
      state.value.update((value) => value + 1);
    });
  });
});
```

Prefer `strict: false` when you only want the check off. It is scoped to one
`TestBed`, while declarations are module-level.

## Key notes

- `provideStatewiseTesting` instead of `provideStatewise`, and list the effect
  and interceptor classes the test needs. A class nobody instantiates registers
  nothing.
- `await drainEffects()` after a `dispatch`, `await` the promise after a
  `dispatchAsync`. Never a `setTimeout`.
- Assert on the state the manager exposes. Read the history only when the
  actions are what you are testing.

The showcase has four suites written this way, under `src/integration/`. They
test the library's behaviour rather than a component, and each is short enough
to read as documentation. See
[the integration suites](/guide/showcase#the-integration-suites).

Next: [Migrating from 0.6.x](/guide/migration), or the
[API reference](/guide/api).
