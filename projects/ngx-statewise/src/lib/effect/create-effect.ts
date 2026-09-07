import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';

import type { ActionPayloadOf, AnyActionCreator } from '../action';
import type { EffectOutcome } from './effect-outcome';
import { EffectRegistry } from './effect-registry';

/**
 * Handler run when its action is dispatched. It receives the action payload
 * when there is one, and may return further actions, directly or through a
 * Promise or a one-shot Observable.
 */
export type EffectHandler<Creator extends AnyActionCreator> = [
  ActionPayloadOf<Creator>,
] extends [never]
  ? () => EffectOutcome
  : (payload: ActionPayloadOf<Creator>) => EffectOutcome;

/** Handle on a registered effect, mirroring Angular's own `EffectRef`. */
export interface EffectRef {
  /** Unregisters the effect early, before its injector is destroyed. */
  destroy(): void;
}

/**
 * Registers an effect for an action, in the injection context of the class
 * declaring it. Actions returned by the handler are executed in the same
 * dispatch, and are awaited by `dispatchAsync`.
 *
 * The registration lasts as long as the injector that created it: an effect
 * class scoped to a component or a route is unregistered on destruction,
 * instead of piling up a duplicate on every instantiation.
 *
 * @param action - The action creator this effect reacts to.
 * @param handler - The function run on each dispatch of that action.
 * @returns A handle to unregister the effect early. Ignoring it is fine.
 */
export function createEffect<Creator extends AnyActionCreator>(
  action: Creator,
  handler: EffectHandler<Creator>,
): EffectRef {
  assertInInjectionContext(createEffect);

  const registry = inject(EffectRegistry);
  const destroyRef = inject(DestroyRef);
  const run = handler as (payload?: unknown) => EffectOutcome;
  const effect = (dispatched: { payload?: unknown }): EffectOutcome =>
    run(dispatched.payload);

  const destroy = (): void => {
    registry.unregister(action.type, effect);
  };

  registry.register(action.type, effect);
  destroyRef.onDestroy(destroy);

  return { destroy };
}
