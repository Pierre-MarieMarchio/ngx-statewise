import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';

import type { ActionPayloadOf, AnyActionCreator } from '../action';
import { InterceptorRegistry } from './interceptor-registry';
import type {
  InterceptorVerdict,
  RegisteredInterceptor,
} from './registered-interceptor';

/**
 * Handler asked before the updater of its action is applied. It receives the
 * action payload when there is one, and answers whether the action may go on.
 *
 * Only `false` refuses. Returning nothing — which is what a handler with no
 * return statement does — lets the action through, so an interceptor that
 * only wants to look at what passes reads the same as one that decides.
 *
 * It is synchronous, deliberately, and takes no context. An `async` handler
 * would be a compile error for the same reason an `async` updater is: the
 * state must be settled before effects run, and a decision awaited somewhere
 * else cannot be part of a synchronous dispatch.
 */
export type InterceptorHandler<Creator extends AnyActionCreator> = [
  ActionPayloadOf<Creator>,
] extends [never]
  ? (noPayload: undefined) => InterceptorVerdict
  : (payload: ActionPayloadOf<Creator>) => InterceptorVerdict;

/** Handle on a registered interceptor, mirroring `EffectRef`. */
export interface InterceptorRef {
  /** Unregisters the interceptor early, before its injector is destroyed. */
  destroy(): void;
}

/**
 * Registers an interceptor for an action, in the injection context of the
 * class declaring it. It is asked on every dispatch of that action, before
 * the updater is applied, and refusing stops the action there: no state
 * update, no effect, no history entry.
 *
 * The registration lasts as long as the injector that created it, exactly
 * like `createEffect`: an interceptor declared in a component dies with it.
 *
 * @param action - The action creator this interceptor guards.
 * @param handler - Asked on each dispatch of that action. Return `false` to
 *   refuse it; return nothing to let it through.
 * @returns A handle to unregister the interceptor early. Ignoring it is fine.
 */
export function createInterceptor<Creator extends AnyActionCreator>(
  action: Creator,
  handler: InterceptorHandler<Creator>,
): InterceptorRef {
  assertInInjectionContext(createInterceptor);

  const registry = inject(InterceptorRegistry);
  const destroyRef = inject(DestroyRef);
  const ask = handler as (payload: unknown) => InterceptorVerdict;
  const interceptor: RegisteredInterceptor = {
    ask: (dispatched) => ask(dispatched.payload),
  };

  const destroy = (): void => {
    registry.unregister(action.type, interceptor);
  };

  registry.register(action.type, interceptor);
  destroyRef.onDestroy(destroy);

  return { destroy };
}
