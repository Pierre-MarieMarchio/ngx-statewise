import { Action } from '../action/action-type';
import { UpdatorGlobalRegistry } from './updator-interfaces';

/**
 * Updates the given state based on the action and the corresponding `updator`.
 *
 * This function looks up the `Updator` function associated with the action type
 * from the provided `updators` registry and applies it to update the state.
 * If no handler is found for the action type, a warning is logged.
 *
 * @template S - The type of the state to be updated.
 * @param state - The current state to be updated.
 * @param action - The action that triggered the state update.
 * @param updators - A registry of action types to their respective `Updator` functions.
 */
export function update<S>(
  state: S,
  action: Action,
  updators: UpdatorGlobalRegistry<S>
): void {
  const handler = updators[action.type];
  
  if (handler) {
    handler(state, action.payload);
  } else {
    console.warn(`No handler for action type: ${action.type}`);
  }
}
