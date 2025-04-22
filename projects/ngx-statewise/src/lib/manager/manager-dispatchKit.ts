import { Action } from "../action/action-type";
import { EffectHandler } from "../effect/effect-handler";
import { IUpdator } from "../updator/updator-interfaces";
import { UpdatorRegistry } from "../updator/updator-registery";
import { StateStore } from "./manager-store";

/**
 * Dispatches an action and associates it with an updator for state management.
 *
 * This function triggers the action and ensures that the specified updator is registered,
 * allowing the state to be updated based on the action.
 *
 * @param action - The action to be dispatched.
 * @param updator - The state updator function that modifies the state based on the action.
 */
export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void {
  UpdatorRegistry.getInstance().registerFullUpdator(updator);
  StateStore.getInstance().dispatch(action, updator);
}

/**
 * Dispatches an action asynchronously and waits for the associated effects to resolve.
 *
 * This function dispatches the action, registers the updator, and ensures that all related
 * effects are completed before the promise resolves.
 *
 * @param action - The action to be dispatched.
 * @param updator - The state updator function that modifies the state based on the action.
 * @returns A promise that resolves when all effects associated with the action are completed.
 */
export function dispatchAsync<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): Promise<void> {
  dispatch(action, updator);
  return EffectHandler.getInstance().waitForEffects(action.type);
}