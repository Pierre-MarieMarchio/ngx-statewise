import { defaultIfEmpty, isObservable, take } from 'rxjs';
import type { Observable } from 'rxjs';

import type { Action } from '../action';

/**
 * The actions an effect hands back, once every wrapper is peeled off.
 *
 * `void` rather than `undefined`, deliberately: an `async` handler returning
 * nothing produces `Promise<void>`, and `Promise<void>` is not assignable to
 * `Promise<undefined>`. Narrowing this would reject every effect that only
 * performs a side effect.
 */
// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
export type ResolvedActions = void | Action | readonly Action[];

/**
 * Every shape an effect handler is allowed to return.
 *
 * Observables are consumed as one-shot sources: only the first emission counts,
 * and a source completing without emitting is a valid result without actions.
 */
export type EffectOutcome =
  | ResolvedActions
  | Observable<Action | readonly Action[]>
  | Promise<ResolvedActions | Observable<Action | readonly Action[]>>;

/**
 * Marks a run whose answer is dropped, so that an abandon is never mistaken
 * for a deliberate absence of action.
 */
const ABANDONED = Symbol('abandoned');

/**
 * Normalizes any outcome into the actions the engine must execute next.
 * Promises are awaited, Observables are read once, and the absence of a result
 * yields an empty list.
 *
 * An abandoned run also yields an empty list: whatever it was about to answer
 * is stale by definition, and dispatching it would let it overwrite the state
 * the run that replaced it is building.
 */
export async function resolveEffectOutcome(
  outcome: EffectOutcome,
  abortSignal: AbortSignal,
): Promise<readonly Action[]> {
  const awaited: unknown = isThenable(outcome)
    ? await abandonOnAbort(outcome, abortSignal)
    : outcome;

  if (awaited === ABANDONED) {
    return [];
  }

  const emitted: unknown = isObservable(awaited)
    ? await readOnce(awaited, abortSignal)
    : awaited;

  return emitted === ABANDONED ? [] : toActions(emitted);
}

/**
 * Duck-typed rather than `instanceof Promise`, deliberately: `zone.js` replaces
 * the global `Promise` with its own, while a native `async` handler returns a
 * promise built by the intrinsic constructor. Identity would reject that
 * promise, and the actions it carries would be taken for an action themselves
 * and silently dropped.
 */
function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof (value as PromiseLike<unknown> | undefined)?.then === 'function'
  );
}

/**
 * Races a promised outcome against the abandon of its run.
 *
 * A promise cannot be cancelled, so the work itself goes on: what an abandon
 * drops is its answer. Handing the `abortSignal` to the handler is what lets
 * an application stop the work too.
 */
function abandonOnAbort(
  awaited: PromiseLike<unknown>,
  abortSignal: AbortSignal,
): Promise<unknown> {
  if (abortSignal.aborted) {
    return Promise.resolve(ABANDONED);
  }

  return new Promise<unknown>((resolve, reject) => {
    const detach = onAbort(abortSignal, () => {
      resolve(ABANDONED);
    });

    // Every outcome is observed here, the abandoned one included, so a
    // rejection arriving after the abandon never surfaces as an unhandled one.
    void Promise.resolve(awaited).then(
      (value) => {
        detach();
        resolve(value);
      },
      (error: unknown) => {
        detach();
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rethrowing the caught value untouched
        reject(error);
      },
    );
  });
}

/**
 * Reads a one-shot source, unsubscribing as soon as its run is abandoned.
 *
 * This unsubscription is the only cancellation the library can genuinely
 * perform: an `HttpClient` request aborts with its subscription, where an
 * awaited promise can only be ignored.
 */
function readOnce(
  source: Observable<unknown>,
  abortSignal: AbortSignal,
): Promise<unknown> {
  if (abortSignal.aborted) {
    return Promise.resolve(ABANDONED);
  }

  return new Promise<unknown>((resolve, reject) => {
    // Reassigned below, once there is a subscription to abandon.
    let detach = (): void => undefined;

    // `take(1)` ends the subscription on the first emission, and
    // `defaultIfEmpty` turns a source completing empty into a result without
    // action, rather than into a promise that never settles.
    const subscription = source
      .pipe(take(1), defaultIfEmpty(undefined))
      .subscribe({
        next: (value: unknown) => {
          detach();
          resolve(value);
        },
        error: (error: unknown) => {
          detach();
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- rethrowing the caught value untouched
          reject(error);
        },
      });

    // A synchronous source has already answered and closed: there is nothing
    // left to abandon, and nothing to listen for.
    if (subscription.closed) {
      return;
    }

    detach = onAbort(abortSignal, () => {
      subscription.unsubscribe();
      resolve(ABANDONED);
    });
  });
}

/** Attaches an abort listener and answers the function detaching it. */
function onAbort(abortSignal: AbortSignal, react: () => void): () => void {
  abortSignal.addEventListener('abort', react, { once: true });

  return () => {
    abortSignal.removeEventListener('abort', react);
  };
}

function toActions(value: unknown): readonly Action[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value)
    ? (value as readonly Action[])
    : [value as Action];
}
