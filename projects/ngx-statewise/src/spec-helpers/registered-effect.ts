import type { RegisteredEffect } from '../lib/effect/registered-effect';

/**
 * An effect shaped the way `createEffect` shapes one, for the specs driving the
 * registry or the engine directly, outside any injection context.
 *
 * The defaults are those of an effect declaring no options: one group, nothing
 * competing with it, nothing cancelling it.
 */
export function registeredEffect(
  run: RegisteredEffect['run'],
  policy: Partial<Omit<RegisteredEffect, 'run'>> = {},
): RegisteredEffect {
  return {
    run,
    concurrency: 'parallel',
    keyOf: () => '',
    cancelledBy: [],
    mustAnswer: false,
    ...policy,
  };
}
