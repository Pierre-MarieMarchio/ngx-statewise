---
slug: cancelling-requests
title:
  en: Cancelling a request
  fr: Annuler une requête
summary:
  en: Letting the last request win when two are in flight.
  fr: Laisser gagner la dernière requête quand deux sont en vol.
---

# Cancelling a request

What to do when a second request starts before the first has come back: a
search box, a fast-clicking user, a route change.

An effect is a one-shot piece of work rather than a stream you can switch, so
there is no `switchMap` to reach for here. What the library gives you is a
concurrency policy declared on the effect, and, for the answers a policy cannot
see, an ordering guarantee strong enough to build the rest by hand. Either way
the goal is the same: **the last request wins, and a late answer is ignored**.

## The problem

Type `ang`, then `angular`, and two searches are in flight. If the first answer
comes back last, the results on screen are for `ang` while the box says
`angular`.

## Let the newest run win

`concurrency: 'latest'` covers the case above on its own. The run in flight is
abandoned, its answer is dropped before it reaches an updater, and its
`abortSignal` fires so the request itself can stop:

<!-- prettier-ignore -->
```typescript fragment title="search.effect.ts"
public readonly queryEffect = createEffect(
  searchActions.query,
  async (query, { abortSignal }) => {
    const results = await this.api.search(query, abortSignal);

    return searchActions.answered(results);
  },
  { concurrency: 'latest' },
);
```

Two searches are then never both live, and the late answer of the first is
never written. [Governing the runs](/guide/effects#governing-the-runs) has the
two options that go with it: `key`, which keeps two searches that should not
compete in separate groups, and `cancelOn`, which abandons the run in flight
when another action says the results are no longer wanted.

## When the policy cannot see the answer

A policy weighs the runs of one effect, in one dispatch scope, under one key.
An answer arriving through a different action, or through a different manager,
is outside what it can drop. Stamping each request covers that, and it is worth
reading either way, because it is the ordering guarantee at work.

## Stamp each request, and let the updater refuse stale answers

The updater runs before the effect and is the only writer, so it can hand out a
number and later check it.

```typescript title="search.states.ts"
@Injectable({ providedIn: 'root' })
export class SearchStates {
  public query = signal('');
  public results = signal<readonly Result[]>([]);
  public isSearching = signal(false);
  /** Incremented by every search. The answer carrying it is the current one. */
  public attempt = signal(0);
}
```

```typescript title="search.actions.ts"
export const searchActions = defineActionsGroup({
  source: 'SEARCH',
  events: {
    query: payload<string>(),
    answered: payload<{ attempt: number; results: readonly Result[] }>(),
  },
});
```

`answered` carries the number as well as the results, which is the one
difference from the plain version above.

```typescript title="search.updater.ts"
export const searchUpdater = defineUpdater(SearchStates, (on) => {
  on(searchActions.query, (state, query) => {
    state.query.set(query);
    state.isSearching.set(true);
    state.attempt.update((attempt) => attempt + 1);
  });

  on(searchActions.answered, (state, { attempt, results }) => {
    // A later search has started since this one left. Drop the answer.
    if (attempt !== state.attempt()) {
      return;
    }

    state.results.set(results);
    state.isSearching.set(false);
  });
});
```

<!-- prettier-ignore -->
```typescript title="search.effect.ts"
@Injectable({ providedIn: 'root' })
export class SearchEffect {
  private readonly states = inject(SearchStates);
  private readonly api = inject(SearchApi);

  public readonly queryEffect = createEffect(
    searchActions.query,
    async (query) => {
      // The updater has already run, so this is this request's own number.
      const attempt = this.states.attempt();
      const results = await this.api.search(query);

      return searchActions.answered({ attempt, results });
    },
  );
}
```

That last comment is the whole recipe. Reading `attempt` at the top of the
effect is safe precisely because the updater finished first, which is the
guarantee the rest of the library is built on.

## Actually stopping the request

Stamping ignores a late answer; it does not stop the work. For a request that
is expensive to leave running, the handler is given an `abortSignal` that fires
under `'latest'` or a `cancelOn`:

<!-- prettier-ignore -->
```typescript title="search.effect.ts"
public readonly queryEffect = createEffect(
  searchActions.query,
  async (query, { abortSignal }) => {
    const attempt = this.states.attempt();
    const results = await this.api.search(query, abortSignal);

    return searchActions.answered({ attempt, results });
  },
  { concurrency: 'latest' },
);
```

An `AbortController` held in a field of the class does the same thing by hand,
and costs what the signal does not: one controller per class aborts across
every key and across every manager, which is the distinction `key` and the
scoping of a policy exist to keep.

Keep the attempt check when the answer can reach the updater by a route the
policy does not weigh. Where `'latest'` is the only way in, the engine has
already dropped it.

## What not to do

```typescript avoid title="search.effect.ts"
createEffect(searchActions.query, (query) => this.api.search$(query).pipe(switchMap((results) => of(searchActions.answered({ attempt: 0, results })))));
```

`switchMap` cancels between emissions of one observable. Here every dispatch
produces a _new_ observable, and the library reads one emission from each, so
there is nothing for it to switch away from. Two dispatches are two independent
effects.

```typescript avoid compile-error title="search.updater.ts"
on(searchActions.answered, async (state, { results }) => {
  if (await this.stillCurrent()) {
    state.results.set(results);
  }
});
```

An updater cannot be asynchronous, and this is why: the decision to keep or
drop an answer has to be made in the same tick as the write, or a third request
can slip between the check and the assignment.

## Key notes

- Reach for `concurrency: 'latest'` first. It drops the superseded answer for
  you, and the `abortSignal` it fires is what stops the request.
- The attempt number is for an answer the policy cannot weigh. It lives in
  state, so the updater can compare it, and nothing outside the flow holds it.
- The effect reads it after the updater has run. That ordering is the reason
  this works.

See also: [Effects](/guide/effects) for what a handler may return.
