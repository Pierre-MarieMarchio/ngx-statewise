import { inject } from '@angular/core';
import { withInjectionContext } from '../../../internals/injection-utils';
import { PendingEffectRegistry } from '../../registries/pending-effect.registery';

/**
 * Waits for all currently pending effects to resolve.
 *
 * This function ensures that all side effects triggered by actions are completed
 * before continuing with the execution flow.
 *
 * @returns A promise that resolves when all pending effects are completed.
 */
export function waitForAllEffects(): Promise<void> {
  return withInjectionContext(() => {
    const pendingEffect = inject(PendingEffectRegistry);
    return pendingEffect.waitForAll();
  });
}

/**
 * Waits for pending effects associated with a specific action type to resolve.
 *
 * Useful for scenarios where you need to wait for effects triggered by a particular
 * action before proceeding.
 *
 * @param actionType - The action type whose effects should be waited for.
 * @returns A promise that resolves when all pending effects for the specified action type are completed.
 */
export function waitForEffect(actionType: string): Promise<void> {
  return withInjectionContext(() => {
    const pendingEffect = inject(PendingEffectRegistry);
    return pendingEffect.waitFor(actionType);
  });
}
