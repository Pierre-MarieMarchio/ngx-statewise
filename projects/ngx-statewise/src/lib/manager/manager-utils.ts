import { Action } from '../action/action-type';
import { IUpdator } from '../updator/updator-interfaces';
import { DispatchHandler } from './handlers/manager-dispatch.handler';
import { DispatchAsyncHandler } from './handlers/manager-dispatchAsync.handler';

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
 */
export function dispatch<T extends Action>(action: T, context?: object): void;
export function dispatch<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): void;
export function dispatch<T extends Action, S>(
  action: T,
  contextOrUpdator?: object | IUpdator<S>
): void {
  const dispatchHandler = new DispatchHandler();
  dispatchHandler.handle(action, contextOrUpdator);
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
 * @returns A Promise that resolves when all effects for this action are completed.
 */
export async function dispatchAsync<T extends Action>(
  action: T,
  context?: object
): Promise<void>;
export async function dispatchAsync<T extends Action, S>(
  action: T,
  updator: IUpdator<S>
): Promise<void>;
export function dispatchAsync<T extends Action, S>(
  action: T,
  contextOrUpdator?: object | IUpdator<S>
): Promise<void> {
  const dispatchAsyncService = new DispatchAsyncHandler();
  return dispatchAsyncService.handle(action, contextOrUpdator);
}
