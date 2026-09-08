import { firstValueFrom, isObservable, type Observable } from 'rxjs';

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
 * Normalizes any outcome into the actions the engine must execute next.
 * Promises are awaited, Observables are read once, and the absence of a result
 * yields an empty list.
 */
export async function resolveEffectOutcome(
  outcome: EffectOutcome,
): Promise<readonly Action[]> {
  const awaited: unknown = isThenable(outcome) ? await outcome : outcome;
  const emitted: unknown = isObservable(awaited)
    ? await firstValueFrom(awaited, { defaultValue: undefined })
    : awaited;

  return toActions(emitted);
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

function toActions(value: unknown): readonly Action[] {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value)
    ? (value as readonly Action[])
    : [value as Action];
}
