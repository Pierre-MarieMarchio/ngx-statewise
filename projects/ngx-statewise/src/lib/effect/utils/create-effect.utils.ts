import { inject } from '@angular/core';
import { Action } from '../../action/interfaces/action-type';
import { EffectRegistrationService } from '../services/effect-registration.service';
import { SWEffects } from '../interfaces/SWEffects.types';
import { withInjectionContext } from '../../../internals/injection-utils';

/**
 * Registers an effect that listens to a specific action and executes a handler.
 *
 * @param action - The action creator function.
 * @param handler - A function called when the action is dispatched.
 * - Receives the payload if the action defines one.
 * - Can return an action, array of actions, observable, or promise.
 */
export function createEffect<T extends (payload: any) => Action>(
  action: T,
  handler: (payload: Parameters<T>[0]) => SWEffects
): void;
/**
 * Registers an effect for an action without payload.
 *
 * @param action - Action creator with no payload.
 * @param handler - Function executed when the action is dispatched.
 */
export function createEffect(
  action: () => Action,
  handler: () => SWEffects
): void;
/**
 * Internal implementation of createEffect, handling both payload and no-payload cases.
 */
export function createEffect(
  action: (...args: any[]) => Action,
  handler: (payload?: any) => SWEffects
): void {
  withInjectionContext(() => {
    const effectRegistrationService = inject(EffectRegistrationService);
    effectRegistrationService.registerEffect(action, handler);
  });
}
