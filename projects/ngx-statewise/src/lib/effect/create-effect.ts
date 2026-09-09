import { assertInInjectionContext, DestroyRef, inject } from '@angular/core';

import type { ActionPayloadOf, AnyActionCreator } from '../action';
import {
  DEFAULT_EFFECT_CONCURRENCY,
  type EffectConcurrency,
} from './effect-concurrency';
import type { EffectContext } from './effect-context';
import type { EffectOutcome } from './effect-outcome';
import { EffectRegistry } from './effect-registry';
import type { RegisteredEffect } from './registered-effect';

/**
 * Handler run when its action is dispatched. It receives the action payload
 * when there is one, then the context of its own run, and may return further
 * actions, directly or through a Promise or a one-shot Observable.
 *
 * The context comes last, after the payload. An action carrying no payload
 * still has that first parameter — `undefined` — so such a handler reads
 * `(_, { abortSignal })`. One call shape for every effect means the engine
 * never guesses where the context goes, and a handler written before the
 * context existed keeps compiling untouched.
 */
export type EffectHandler<Creator extends AnyActionCreator> = [
  ActionPayloadOf<Creator>,
] extends [never]
  ? (noPayload: undefined, context: EffectContext) => EffectOutcome
  : (
      payload: ActionPayloadOf<Creator>,
      context: EffectContext,
    ) => EffectOutcome;

/** What governs the runs of an effect, whatever its action carries. */
interface EffectRunPolicy {
  /**
   * How a dispatch behaves while a run of this effect is in flight.
   *
   * @default 'parallel'
   */
  readonly concurrency?: EffectConcurrency;
  /**
   * The actions abandoning the runs of this effect: their `abortSignal` fires,
   * a subscribed source is unsubscribed, and whatever they were about to
   * answer never reaches an updater.
   *
   * Cancellation is scoped like dispatch — a manager abandons the runs it
   * started, never those of another one — and it abandons every key at once.
   */
  readonly cancelOn?: AnyActionCreator | readonly AnyActionCreator[];
  /**
   * Declares that this effect always answers with an action, so a run
   * producing none is a failure rather than a result.
   *
   * A one-shot source completing without emitting yields no action, and that
   * reaches the engine as a deliberate absence of one. Nothing then answers
   * the request, so whatever its updater set on the way in — an `isLoading`,
   * typically — is never cleared, and nothing says so. Declare this on any
   * effect whose pipeline is supposed to always produce something; leave it
   * off for an effect that only performs a side effect.
   *
   * @default false
   */
  readonly mustAnswer?: boolean;
}

/**
 * The options of an effect. The concurrency key exists only for an action
 * carrying a payload, since there is nothing else to derive a key from.
 */
export type EffectOptions<Creator extends AnyActionCreator> = [
  ActionPayloadOf<Creator>,
] extends [never]
  ? EffectRunPolicy
  : EffectRunPolicy & {
      /**
       * Splits the runs of this effect into independent concurrency groups,
       * one per returned key, so two dispatches concerning two different
       * entities never supersede one another.
       *
       * Constant by default: every run of the effect competes with every
       * other one.
       */
      readonly key?: (payload: ActionPayloadOf<Creator>) => string;
    };

/** Handle on a registered effect, mirroring Angular's own `EffectRef`. */
export interface EffectRef {
  /** Unregisters the effect early, before its injector is destroyed. */
  destroy(): void;
}

/** The group every run shares when no key splits them. */
const SINGLE_GROUP = '';

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
 * @param options - The concurrency policy governing its runs. Omitted, every
 *   run goes on side by side, as it always has.
 * @returns A handle to unregister the effect early. Ignoring it is fine.
 */
export function createEffect<Creator extends AnyActionCreator>(
  action: Creator,
  handler: EffectHandler<Creator>,
  options?: EffectOptions<Creator>,
): EffectRef {
  assertInInjectionContext(createEffect);

  const registry = inject(EffectRegistry);
  const destroyRef = inject(DestroyRef);
  const effect = toRegisteredEffect(handler, options);

  const destroy = (): void => {
    registry.unregister(action.type, effect);
  };

  registry.register(action.type, effect);
  destroyRef.onDestroy(destroy);

  return { destroy };
}

/** The policy as the registry reads it, once the generics are erased. */
interface ErasedOptions extends EffectRunPolicy {
  readonly key?: (payload: unknown) => string;
}

function toRegisteredEffect<Creator extends AnyActionCreator>(
  handler: EffectHandler<Creator>,
  options: EffectOptions<Creator> | undefined,
): RegisteredEffect {
  const policy = options as ErasedOptions | undefined;
  const run = handler as (
    payload: unknown,
    context: EffectContext,
  ) => EffectOutcome;
  const key = policy?.key;

  return {
    run: (dispatched, context) => run(dispatched.payload, context),
    concurrency: policy?.concurrency ?? DEFAULT_EFFECT_CONCURRENCY,
    keyOf:
      key === undefined
        ? () => SINGLE_GROUP
        : (dispatched) => key(dispatched.payload),
    cancelledBy: cancellingActionTypes(policy?.cancelOn),
    mustAnswer: policy?.mustAnswer ?? false,
  };
}

function cancellingActionTypes(
  cancelOn: EffectRunPolicy['cancelOn'],
): readonly string[] {
  if (cancelOn === undefined) {
    return [];
  }

  const creators = Array.isArray(cancelOn) ? cancelOn : [cancelOn];

  return (creators as readonly AnyActionCreator[]).map(
    (creator) => creator.type,
  );
}
