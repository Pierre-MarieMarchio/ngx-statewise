---
slug: testing-an-effect
title:
  en: Testing an effect
  fr: Tester un effect
summary:
  en: A worked suite: what it returns, the cascade, and the failure.
  fr: Une suite complète : ce qu’il renvoie, la cascade, et l’échec.
---

# Testing an effect

A worked suite for the three things an effect can get wrong: the action it
returns, the cascade it starts, and what it does when the call fails.

[Testing](/guide/testing) covers the entry point and its three exports. This
page is the one you copy from.

## The setup

Provide the effect class, attach the updater, and replace whatever the effect
talks to. Nothing else is special about a suite that exercises effects.

```typescript title="task.effect.spec.ts"
class FakeTaskApi {
  public setDone = vi.fn().mockResolvedValue(undefined);
  public list = vi.fn().mockResolvedValue([task('a'), task('b')]);
}

function manager(api = new FakeTaskApi()): {
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

> [!IMPORTANT]
> List the effect class in `effects`. `createEffect` registers itself in the
> injection context of the class declaring it, so a class nobody instantiates
> registers nothing — and the test then passes for the wrong reason, because
> the action does nothing at all.

## Testing what it returns

Dispatch, let it settle, and assert on the state the manager exposes. The
returned action is an implementation detail; the state is the contract.

<!-- prettier-ignore -->
```typescript title="task.effect.spec.ts"
it('marks the task done once the server agrees', async () => {
  const { tasks, api } = manager();

  await tasks.toggleDoneAndSettle('a');

  expect(api.setDone).toHaveBeenCalledWith('a', true);
  expect(tasks.items()).toContainEqual(
    expect.objectContaining({ id: 'a', done: true }),
  );
});
```

When the actions themselves are what you are testing — a cascade, an ordering —
read them from the history, which `provideStatewiseTesting` enables for you:

```typescript title="task.effect.spec.ts"
it('confirms rather than reverting', async () => {
  const { tasks } = manager();

  await tasks.toggleDoneAndSettle('a');

  const dispatched = TestBed.inject(ActionHistory)
    .snapshot()
    .map((entry) => entry.action.type);

  expect(dispatched).toEqual(['TASK_TOGGLE_DONE', 'TASK_TOGGLE_CONFIRMED']);
});
```

## Testing the ordering

The library's guarantee is that the state is written before the effect starts.
Assert it by looking at the state between the dispatch and the settle, not by
waiting:

```typescript title="task.effect.spec.ts"
it('leaves the state written before the effect runs', async () => {
  const { tasks } = manager();

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

## Testing the failure path

Make the fake fail, and assert the state came back:

<!-- prettier-ignore -->
```typescript title="task.effect.spec.ts"
it('puts the task back when the server refuses', async () => {
  const api = new FakeTaskApi();
  api.setDone.mockRejectedValue(new Error('nope'));

  const { tasks } = manager(api);

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

## Testing an effect with no updater

A suite exercising an effect in isolation may not want to attach the updater at
all. The misrouted-dispatch check forbids exactly that, so turn it off:

```typescript title="task.effect.spec.ts"
provideStatewiseTesting({ strict: false, effects: [TaskEffect] });
```

Reach for it when the effect is the subject. Prefer attaching the real updater
otherwise — a test that dispatches into a scope owning nothing proves less than
it looks.

## Key notes

- List the effect class, or nothing runs and the test passes for nothing.
- Assert on state; read the history only when the actions are the subject.
- `drainEffects` for "the work is over", the awaited `dispatchAsync` for "and
  it failed".
- Never a `setTimeout`.

See also: [Testing](/guide/testing) and [Effects](/guide/effects), or the
[API reference](/guide/api) for the testing entry point's exact signatures.
