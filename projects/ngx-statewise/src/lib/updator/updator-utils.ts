import { Action } from '../action';
import { UpdatorRegistry } from './updator-interfaces';

export function update<S>(
  state: S,
  action: Action,
  updators: UpdatorRegistry<S>
): void {
  const handler = updators[action.type];
  if (handler) {
    handler(state, action.payload);
  } else {
    console.warn(`No handler for action type: ${action.type}`);
  }
}
