import type { Action } from '../action';
import type { EffectConcurrency } from './effect-concurrency';
import type { EffectContext } from './effect-context';
import type { EffectOutcome } from './effect-outcome';

/**
 * An effect as the registry stores it: the handler already bound to its payload
 * read, and the policy governing the runs it starts.
 */
export interface RegisteredEffect {
  /** Starts one run of the handler for a dispatched action. */
  readonly run: (action: Action, context: EffectContext) => EffectOutcome;
  /** How a dispatch behaves while a run of this effect is in flight. */
  readonly concurrency: EffectConcurrency;
  /**
   * Splits the runs of this effect into independent concurrency groups, so
   * that two dispatches concerning two different entities never supersede one
   * another. Constant unless the effect declares a key.
   */
  readonly keyOf: (action: Action) => string;
  /** Action types abandoning the runs of this effect, possibly none. */
  readonly cancelledBy: readonly string[];
}

/**
 * Whether the engine has any reason to keep track of this effect's runs.
 *
 * An effect that neither competes with itself nor answers a cancellation has
 * nothing to gain from the bookkeeping, and skips it entirely.
 */
export function hasRunPolicy(effect: RegisteredEffect): boolean {
  return effect.concurrency !== 'parallel' || effect.cancelledBy.length > 0;
}
