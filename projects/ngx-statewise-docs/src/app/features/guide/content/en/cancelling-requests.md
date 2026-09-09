---
slug: cancelling-requests
title:
  en: Cancelling a request
  fr: Annuler une requête
  es: Cancelar una petición
  de: Eine Anfrage abbrechen
  pt-BR: Cancelar uma requisição
summary:
  en: Letting the last request win when two are in flight.
  fr: Laisser gagner la dernière requête quand deux sont en vol.
  es: Dejar ganar a la última petición cuando hay dos en vuelo.
  de: Die letzte Anfrage gewinnen lassen, wenn zwei unterwegs sind.
  pt-BR: Deixar a última requisição vencer quando há duas em voo.
---

# Cancelling a request

What to do when a second request starts before the first has come back — a
search box, a fast-clicking user, a route change.

The library has no cancellation primitive, and that is deliberate: an effect is
a one-shot piece of work, not a stream you can switch. What it gives you
instead is an ordering guarantee, and that is enough to build the behaviour you
actually want — **the last request wins, and a late answer is ignored**.

## The problem

Type `ang`, then `angular`, and two searches are in flight. If the first answer
comes back last, the results on screen are for `ang` while the box says
`angular`.

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
effect is safe precisely because the updater finished first — the same
guarantee the rest of the library is built on.

## Actually stopping the request

The pattern above ignores a late answer; it does not stop the work. For a
request that is expensive to leave running, abort it as well:

```typescript title="search.effect.ts"
private controller: AbortController | undefined;

public readonly queryEffect = createEffect(
  searchActions.query,
  async (query) => {
    this.controller?.abort();
    this.controller = new AbortController();

    const attempt = this.states.attempt();
    const results = await this.api.search(query, this.controller.signal);

    return searchActions.answered({ attempt, results });
  },
);
```

Keep the attempt check even so. Aborting is a race of its own, and the check is
what makes the state correct rather than merely usually correct.

## What not to do

```typescript avoid title="search.effect.ts"
createEffect(searchActions.query, (query) =>
  this.api.search$(query).pipe(switchMap(...)),
);
```

`switchMap` cancels between emissions of one observable. Here every dispatch
produces a _new_ observable, and the library reads one emission from each, so
there is nothing for it to switch away from. Two dispatches are two independent
effects.

```typescript avoid title="search.updater.ts"
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

- The attempt number lives in state, so the updater can compare it. Nothing
  outside the flow holds it.
- The effect reads it after the updater has run. That ordering is the reason
  this works.
- `AbortController` stops the work; the attempt check keeps the state right.

See also: [Effects](/guide/effects) for what a handler may return.
