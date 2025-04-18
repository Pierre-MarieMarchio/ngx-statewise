import { IUpdator } from './updator-interfaces';


/**
 * Global registry to store updators associated with action types.
 * Maps action types to their corresponding `IUpdator`.
 */
const globalUpdatorRegistry = new Map<string, IUpdator<any>>();

/**
 * Registers a specific `updator` for a given action type.
 *
 * This function links an `IUpdator` to a particular action type, allowing
 * the state to be updated when the action is dispatched.
 *
 * @template S - The type of the state managed by the updator.
 * @param actionType - The type of the action to associate with the updator.
 * @param updator - The `IUpdator` that will update the state for the given action type.
 */
export function registerUpdator<S>(
  actionType: string,
  updator: IUpdator<S>
): void {
  globalUpdatorRegistry.set(actionType, updator);
}

/**
 * Registers an `updator` for all the action types it handles.
 *
 * This function registers the `IUpdator` for each action type contained
 * in its `updators` registry. It is useful when a single `IUpdator` 
 * handles multiple action types.
 *
 * @template S - The type of the state managed by the updator.
 * @param updator - The `IUpdator` to register for multiple action types.
 */
export function registerFullUpdator<S>(updator: IUpdator<S>): void {
  Object.keys(updator.updators).forEach((actionType) => {
    registerUpdator(actionType, updator);
  });
}

/**
 * Retrieves the `updator` associated with a given action type.
 *
 * This function looks up the `IUpdator` that is responsible for managing
 * state updates when an action of the specified type is dispatched.
 *
 * @template S - The type of the state managed by the updator.
 * @param actionType - The type of the action for which the updator is registered.
 * @returns The `IUpdator` associated with the action type, or `undefined` if none is found.
 */
export function getUpdator<S>(actionType: string): IUpdator<S> | undefined {
  return globalUpdatorRegistry.get(actionType);
}