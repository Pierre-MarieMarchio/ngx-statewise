import { ActionDispatcher } from '../action/action-dispatcher';
import { Action } from '../action/action-type';
import { EffectManager } from '../effect/effect-manager';
import { IUpdator } from '../updator/updator-interfaces';
import { UpdatorRegistry } from '../updator/updator-registery';
import { StateStore } from './manager-store';


type DispatchOptions = {
  overwrite?: boolean;
};

/**
 * Dispatches an action with optional updator registration.
 *
 * This function provides a flexible way to dispatch actions:
 * - If only an action is provided, it will be dispatched through the ActionDispatcher
 * - If an updator is also provided, it will be registered (if needed) and used to update state
 *
 * @template T - The action type.
 * @template S - The state type (inferred from updator if provided).
 * @param action - The action to dispatch.
 * @param updator - Optional updator to handle state updates for this action.
 * @param options - Configuration options:
 *   - `overwrite`: If true, allows overwriting an existing updator registration. Default is false.
 */
export function dispatch<T extends Action>(action: T): void;
export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>,
  options?: DispatchOptions
): void;
export function dispatch<T extends Action, S>(
  action: T,
  updator?: IUpdator<S>,
  options: DispatchOptions = {}
): void {
  if (updator) {
    UpdatorRegistry.getInstance().registerUpdator(
      action.type,
      updator,
      options
    );
    StateStore.getInstance().dispatch(action, updator);
  } else {
    const registry = UpdatorRegistry.getInstance();
    const registeredUpdator = registry.getUpdator(action.type);

    if (registeredUpdator) {
      StateStore.getInstance().dispatch(action, registeredUpdator);
    } else {
      ActionDispatcher.getInstance().emit(action);
    }
  }
}

/**
 * Asynchronously dispatches an action and waits for effects to complete.
 *
 * Similar to `dispatch`, but returns a Promise that resolves when all associated
 * effects are completed. Supports both global and local updators.
 *
 * @template T - The action type.
 * @template S - The state type (inferred from updator if provided).
 * @param action - The action to dispatch.
 * @param updator - Optional updator to handle state updates for this action.
 * @param options - Configuration options:
 *   - `overwrite`: If true, allows overwriting an existing updator registration. Default is false.
 * @returns A Promise that resolves when all effects for this action are completed.
 */
export function dispatchAsync<T extends Action>(action: T): Promise<void>;
export function dispatchAsync<T extends Action, S>(
  action: T,
  updator: IUpdator<S>,
  options?: DispatchOptions
): Promise<void>;
export function dispatchAsync<T extends Action, S>(
  action: T,
  updator?: IUpdator<S>,
  options: DispatchOptions = {}
): Promise<void> {
  if (updator) {
    UpdatorRegistry.getInstance().registerFullUpdator(updator);
    return StateStore.getInstance().dispatshAsync(action, updator);
  } else {
    const registry = UpdatorRegistry.getInstance();
    const registeredUpdator = registry.getUpdator(action.type);
    if (registeredUpdator) {
      return StateStore.getInstance().dispatshAsync(action, registeredUpdator);
    } else {
      ActionDispatcher.getInstance().emit(action);
      return EffectManager.getInstance().waitFor(action.type);
    }
  }
}